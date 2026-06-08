<?php

namespace App\Services;

use App\Agora\RtcTokenBuilder;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class AgoraService
{
    /**
     * Generate a RTC token for a given channel and user account.
     * @param string $channelName
     * @param string|int $userAccount
     * @param int $role (RtcTokenBuilder::RolePublisher|RoleSubscriber|RoleAttendee)
     * @param int|null $expireSeconds
     * @return string|null
     */
    public function generateRtcToken($channelName, $userAccount, $role = \App\Agora\RtcTokenBuilder::RoleSubscriber, $expireSeconds = null)
    {
        $appId = config('services.agora.app_id');
        $appCertificate = config('services.agora.app_certificate');

        if (! $appId || ! $appCertificate) {
            return null;
        }

        $expireTimeSeconds = $expireSeconds ?? (int) config('services.agora.token_ttl', 3600);
        $privilegeExpireTs = time() + $expireTimeSeconds;

        return \App\Agora\RtcTokenBuilder::buildTokenWithUserAccount(
            $appId,
            $appCertificate,
            $channelName,
            (string) $userAccount,
            $role,
            $privilegeExpireTs
        );
    }

    /**
     * Create a lightweight "Agora meeting" for a session.
     * This does NOT create a scheduled meeting on Agora (RTC is real-time).
     * Instead it prepares a channel name and tokens for teacher and student and
     * returns URLs that point to the local /meet web route with channel+token.
     *
     * @param int $sessionId
     * @param int $teacherId
     * @param int $studentId
     * @return array|null
     */
    public function createMeeting(int $sessionId, int $teacherId, int $studentId): ?array
    {
        $channel = 'session_' . $sessionId;

        // We skip pre-generating tokens here because they expire in 24 hours.
        // Instead, the mobile app should call /sessions/{id}/start or /sessions/{id}/join
        // to get a fresh, valid token exactly when the session begins.
        $meetUrl = rtrim(config('app.url', url('/')), '\/') . '/meet';
        $teacherAccount = 'teacher_' . $teacherId;
        $studentAccount = 'student_' . $studentId;

        $joinUrl = $meetUrl . '?channel=' . urlencode($channel) . '&uid=' . urlencode($studentAccount) . '&type=join';
        $hostUrl = $meetUrl . '?channel=' . urlencode($channel) . '&uid=' . urlencode($teacherAccount) . '&type=host';

        return [
            'id' => $channel,
            'channel' => $channel,
            'join_url' => $joinUrl,
            'host_url' => $hostUrl,
            'accounts' => [
                'teacher' => $teacherAccount,
                'student' => $studentAccount,
            ],
        ];
    }

    /**
     * Generate a single RTC token for a given channel and account with specified role.
     * This does NOT return any join/host URLs and is suitable for mobile/web clients
     * which only need {channel, token, uid, expires_in}.
     *
     * @param int|string $sessionIdOrChannel If integer, will be converted to channel 'session_{id}', otherwise treated as channel string
     * @param string $account user account string (e.g. 'teacher_12' or 'student_34')
     * @param int $role RtcTokenBuilder::RolePublisher|RoleSubscriber
     * @param int|null $expireSeconds
     * @return array|null [ 'channel' => string, 'token' => string, 'uid' => string, 'expires_in' => int ]|null
     */
    public function generateTokenForAccount($sessionIdOrChannel, string $account, $role = \App\Agora\RtcTokenBuilder::RoleSubscriber, $expireSeconds = null): ?array
    {
        $appId = config('services.agora.app_id');
        $appCertificate = config('services.agora.app_certificate');
        if (! $appId || ! $appCertificate) {
            return null;
        }

        $channel = is_int($sessionIdOrChannel) ? ('session_' . $sessionIdOrChannel) : (string) $sessionIdOrChannel;
        $expireSeconds = $expireSeconds ?? (int) config('services.agora.token_ttl', 3600);

        $token = $this->generateRtcToken($channel, $account, $role, $expireSeconds);

        return [
            'channel' => $channel,
            'token' => $token,
            'uid' => $account,
            'expires_in' => $expireSeconds,
        ];
    }

    /**
     * Generate an RTM (chat) token for a given user account.
     * Uses the RtmTokenBuilder present in app/Agora.
     *
     * @param string $account user account string (e.g. 'teacher_12' or 'student_34')
     * @param int|null $expireSeconds
     * @return array|null [ 'token' => string, 'uid' => string, 'expires_in' => int ]|null
     */
    public function generateRtmTokenForAccount(string $account, $expireSeconds = null): ?array
    {
        $appId = config('services.agora.app_id');
        $appCertificate = config('services.agora.app_certificate');
        if (! $appId || ! $appCertificate) {
            return null;
        }

        $expireSeconds = $expireSeconds ?? (int) config('services.agora.token_ttl', 3600);
        $privilegeExpireTs = time() + $expireSeconds;

        try {
            $token = \App\Agora\RtmTokenBuilder::buildToken(
                $appId,
                $appCertificate,
                (string) $account,
                \App\Agora\RtmTokenBuilder::RoleRtmUser,
                $privilegeExpireTs
            );

            return [
                'token' => $token,
                'uid' => $account,
                'expires_in' => $expireSeconds,
            ];
        } catch (\Throwable $e) {
            // Token builder may throw if dependencies are missing — surface as null to caller
            return null;
        }
    }

    // ──────────────────────────────────────────────
    //  Agora Chat (RTM) REST API — User Registration
    // ──────────────────────────────────────────────

    /**
     * Register (or look up) a user on Agora Chat via REST API.
     * Each user (teacher/student) must be registered once on Agora's platform
     * before they can login to Agora Chat with an RTM token.
     *
     * The Agora Chat UUID is returned so your app can store it in the
     * `users.agora_chat_uid` column for future reference.
     *
     * @param string $username e.g. 'teacher_12' or 'student_34'
     * @return string|null The Agora Chat UUID on success, or null on failure
     */
    public function registerChatUser(string $username): ?string
    {
        $appId = config('services.agora.app_id');
        $appCertificate = config('services.agora.app_certificate');

        if (! $appId || ! $appCertificate) {
            Log::error('AgoraService::registerChatUser — app_id or app_certificate missing');
            return null;
        }

        $baseUrl = 'https://api.agora.io/dev/v1/project/' . $appId;

        try {
            // Step 1: Try to create the user
            $response = Http::withBasicAuth($appId, $appCertificate)
                ->timeout(10)
                ->acceptJson()
                ->post($baseUrl . '/users', [
                    'username' => $username,
                ]);

            if ($response->successful()) {
                $body = $response->json();
                $uuid = $body['data']['uuid'] ?? $body['uuid'] ?? null;
                Log::info('Agora Chat user registered', ['username' => $username, 'uuid' => $uuid]);
                return $uuid;
            }

            // 409 = user already exists on Agora → look up their UUID
            if ($response->status() === 409) {
                $getRes = Http::withBasicAuth($appId, $appCertificate)
                    ->timeout(10)
                    ->acceptJson()
                    ->get($baseUrl . '/users', ['username' => $username]);

                if ($getRes->successful()) {
                    $body = $getRes->json();
                    $users = $body['data'] ?? $body ?? [];
                    if (is_array($users) && count($users) > 0) {
                        $existing = $users[0];
                        $uuid = $existing['uuid'] ?? $username;
                        Log::info('Agora Chat user already exists', ['username' => $username, 'uuid' => $uuid]);
                        return $uuid;
                    }
                }
                // If lookup fails, return username as fallback identifier
                return $username;
            }

            Log::warning('Agora Chat registration unexpected response', [
                'username' => $username,
                'status'   => $response->status(),
                'body'     => $response->body(),
            ]);
            return null;

        } catch (\Throwable $e) {
            Log::error('Agora Chat REST API exception', [
                'username' => $username,
                'error'    => $e->getMessage(),
            ]);
            return null;
        }
    }

    /**
     * Full-flow credentials for Agora Chat:
     *   1. Register user on Agora Chat (if not already registered)
     *   2. Generate an RTM token for that user
     *   3. Return everything the mobile app needs: token, uid, channel
     *
     * Call this BEFORE the session starts so the mobile app can obtain
     * chat credentials independently of RTC.
     *
     * @param int    $sessionId
     * @param int    $userId       The user's internal ID
     * @param string $userType     'teacher' or 'student'
     * @param int|null $expireSeconds
     * @return array|null
     */
    public function generateChatCredentials(int $sessionId, int $userId, string $userType, $expireSeconds = null): ?array
    {
        $username = $userType . '_' . $userId;
        $channel  = 'session_' . $sessionId;

        // 1. Register user on Agora Chat (idempotent)
        $agoraUid = $this->registerChatUser($username);

        // 2. Generate RTM token (works even if registration failed — token generation is local)
        $rtmToken = $this->generateRtmTokenForAccount($username, $expireSeconds);

        if (! $rtmToken || empty($rtmToken['token'])) {
            Log::error('AgoraService::generateChatCredentials — failed to generate RTM token', [
                'username' => $username,
                'session_id' => $sessionId,
            ]);
            return null;
        }

        return [
            'agora_uid'   => $agoraUid ?? $username,
            'token'       => $rtmToken['token'],
            'uid'         => $username,
            'channel'     => $channel,
            'expires_in'  => $rtmToken['expires_in'],
            'app_id'      => config('services.agora.app_id'),
        ];
    }
}
