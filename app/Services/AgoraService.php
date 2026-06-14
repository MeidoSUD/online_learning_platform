<?php

namespace App\Services;

use App\Agora\RtcTokenBuilder;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class AgoraService
{
    /**
     * Generate a RTC token for a given channel and user account.
     */
    public function generateRtcToken($channelName, $userAccount, $role = RtcTokenBuilder::RoleSubscriber, $expireSeconds = null): ?string
    {
        $appId          = config('services.agora.app_id');
        $appCertificate = config('services.agora.app_certificate');

        if (! $appId || ! $appCertificate) {
            return null;
        }

        $expireSeconds     = $expireSeconds ?? (int) config('services.agora.token_ttl', 3600);
        $privilegeExpireTs = time() + $expireSeconds;

        return RtcTokenBuilder::buildTokenWithUserAccount(
            $appId,
            $appCertificate,
            $channelName,
            (string) $userAccount,
            $role,
            $privilegeExpireTs
        );
    }

    /**
     * Generate an Agora Chat APP-level token (for REST API calls only).
     * DO NOT send this to mobile clients.
     */
    public function generateAppToken(int $expireSeconds = 86400): ?string
    {
        $appId          = config('services.agora.app_id');
        $appCertificate = config('services.agora.app_certificate');

        if (! $appId || ! $appCertificate) {
            Log::error('AgoraService::generateAppToken — app_id or app_certificate missing');
            return null;
        }

        try {
            $token       = new \App\Agora\AccessToken2($appId, $appCertificate, $expireSeconds);
            $serviceChat = new \App\Agora\ServiceChat('');
            $serviceChat->addPrivilege(\App\Agora\ServiceChat::PRIVILEGE_APP, time() + $expireSeconds);
            $token->addService($serviceChat);

            $built = $token->build();
            return $built ?: null;
        } catch (\Throwable $e) {
            Log::error('AgoraService::generateAppToken exception', ['error' => $e->getMessage()]);
            return null;
        }
    }

    /**
     * ─────────────────────────────────────────────────────────────
     * Generate a Chat USER token (AccessToken2 + PRIVILEGE_USER).
     * THIS is what you send to the mobile client so it can log in
     * to the Agora Chat SDK.  It is NOT the same as an RTM token.
     * ─────────────────────────────────────────────────────────────
     */
    public function generateChatUserToken(string $username, int $expireSeconds = 3600): ?string
    {
        $appId          = config('services.agora.app_id');
        $appCertificate = config('services.agora.app_certificate');

        if (! $appId || ! $appCertificate) {
            Log::error('AgoraService::generateChatUserToken — app_id or app_certificate missing');
            return null;
        }

        try {
            // AccessToken2 with ServiceChat PRIVILEGE_USER — required for Chat SDK login
            $token       = new \App\Agora\AccessToken2($appId, $appCertificate, $expireSeconds);
            $serviceChat = new \App\Agora\ServiceChat($username);           // <-- username is mandatory here
            $serviceChat->addPrivilege(\App\Agora\ServiceChat::PRIVILEGE_USER, time() + $expireSeconds);
            $token->addService($serviceChat);

            $built = $token->build();
            Log::debug('AgoraService::generateChatUserToken generated', [
                'username' => $username,
                'prefix'   => substr($built, 0, 20) . '…',
            ]);
            return $built ?: null;
        } catch (\Throwable $e) {
            Log::error('AgoraService::generateChatUserToken exception', ['error' => $e->getMessage()]);
            return null;
        }
    }

    /**
     * Generate a single RTC token suitable for mobile/web clients.
     * Returns [ channel, token, uid, expires_in ].
     */
    public function generateTokenForAccount($sessionIdOrChannel, string $account, $role = RtcTokenBuilder::RoleSubscriber, $expireSeconds = null): ?array
    {
        $appId          = config('services.agora.app_id');
        $appCertificate = config('services.agora.app_certificate');

        if (! $appId || ! $appCertificate) {
            return null;
        }

        $channel       = is_int($sessionIdOrChannel) ? 'session_' . $sessionIdOrChannel : (string) $sessionIdOrChannel;
        $expireSeconds = $expireSeconds ?? (int) config('services.agora.token_ttl', 3600);
        $token         = $this->generateRtcToken($channel, $account, $role, $expireSeconds);

        if (! $token) {
            return null;
        }

        return [
            'channel'    => $channel,
            'token'      => $token,
            'uid'        => $account,
            'expires_in' => $expireSeconds,
        ];
    }

    /**
     * Full-flow chat credentials for a session participant:
     *   1. Register user on Agora Chat (idempotent REST call)
     *   2. Generate a Chat USER token (AccessToken2 + PRIVILEGE_USER)
     *   3. Return everything the mobile app needs
     */
    public function generateChatCredentials(int $sessionId, int $userId, string $userType, ?int $expireSeconds = null): ?array
    {
        $username      = $userType . '_' . $userId;
        $channel       = 'session_' . $sessionId;
        $expireSeconds = $expireSeconds ?? (int) config('services.agora.token_ttl', 3600);

        // 1. Register user on Agora Chat (idempotent)
        $agoraUid = $this->registerChatUser($username);

        // 2. Generate a Chat USER token (not RTM, not App token)
        $chatToken = $this->generateChatUserToken($username, $expireSeconds);

        if (! $chatToken) {
            Log::error('AgoraService::generateChatCredentials — failed to generate chat user token', [
                'username'   => $username,
                'session_id' => $sessionId,
            ]);
            return null;
        }

        return [
            'agora_uid'  => $agoraUid ?? $username,
            'token'      => $chatToken,
            'uid'        => $username,
            'channel'    => $channel,
            'expires_in' => $expireSeconds,
            'app_id'     => config('services.agora.app_id'),
        ];
    }

    // ──────────────────────────────────────────────────────────────
    //  Agora Chat REST API helpers
    // ──────────────────────────────────────────────────────────────

    private function chatBaseUrl(): string
    {
        $configBase = config('services.agora.chat_base_url', 'https://api.agora.io/dev/v1/project');
        $baseUrl    = rtrim($configBase, '/');

        if (! preg_match('#/\d+/\d+$#', $baseUrl)) {
            $baseUrl .= '/' . config('services.agora.app_id');
        }

        return $baseUrl;
    }

    private function appToken(): ?string
    {
        $token = config('services.agora.chat_app_token') ?: $this->generateAppToken();

        if (! $token) {
            Log::warning('AgoraService — could not obtain an app token for REST call');
        }

        return $token;
    }

    /**
     * Register (or look up) a user on Agora Chat via REST.
     * Returns the Agora Chat UUID, or the username as a fallback.
     */
    public function registerChatUser(string $username): ?string
    {
        if (! config('services.agora.app_id') || ! config('services.agora.app_certificate')) {
            Log::error('AgoraService::registerChatUser — app_id or app_certificate missing');
            return null;
        }

        $baseUrl  = $this->chatBaseUrl();
        $appToken = $this->appToken();

        try {
            $url      = $baseUrl . '/users';
            $payload  = ['username' => $username];
            Log::debug('Agora Chat REST request', ['method' => 'POST', 'url' => $url, 'payload' => $payload]);

            $response = Http::withToken($appToken, 'Bearer')
                ->timeout(10)
                ->acceptJson()
                ->post($url, $payload);

            Log::debug('Agora Chat REST response', ['status' => $response->status(), 'body' => $response->body()]);

            if ($response->successful()) {
                $body = $response->json();
                $uuid = $body['data']['uuid']
                    ?? $body['uuid']
                    ?? ($body['entities'][0]['uuid'] ?? null);

                if (empty($uuid)) {
                    Log::warning('Agora Chat registration returned no uuid; using username', ['username' => $username]);
                    $uuid = $username;
                }

                Log::info('Agora Chat user registered', ['username' => $username, 'uuid' => $uuid]);
                return $uuid;
            }

            // 409 or duplicate error = user already exists → look up
            $isDuplicate = $response->status() === 409
                || ($response->status() === 400 && str_contains($response->body(), 'duplicate_unique_property_exists'));

            if ($isDuplicate) {
                return $this->lookupChatUser($username);
            }

            Log::warning('Agora Chat registration unexpected response', [
                'username' => $username,
                'status'   => $response->status(),
                'body'     => $response->body(),
            ]);
            return null;

        } catch (\Throwable $e) {
            Log::error('Agora Chat REST API exception', ['username' => $username, 'error' => $e->getMessage()]);
            return null;
        }
    }

    /**
     * Look up an existing Agora Chat user by username.
     */
    private function lookupChatUser(string $username): string
    {
        $baseUrl  = $this->chatBaseUrl();
        $appToken = $this->appToken();

        try {
            $getUrl   = $baseUrl . '/users/' . urlencode($username);   // direct lookup by username
            $response = Http::withToken($appToken, 'Bearer')
                ->timeout(10)
                ->acceptJson()
                ->get($getUrl);

            Log::debug('Agora Chat lookup response', ['status' => $response->status(), 'body' => $response->body()]);

            if ($response->successful()) {
                $body = $response->json();
                // Direct user-by-username endpoint returns entities[0] or data
                $user = $body['entities'][0] ?? $body['data'] ?? [];
                $uuid = $user['uuid'] ?? $username;
                Log::info('Agora Chat user already exists', ['username' => $username, 'uuid' => $uuid]);
                return $uuid;
            }
        } catch (\Throwable $e) {
            Log::warning('Agora Chat lookupChatUser failed', ['username' => $username, 'error' => $e->getMessage()]);
        }

        return $username;   // safe fallback
    }

    /**
     * Create a chat room on Agora Chat.
     * Returns the room ID string, or null on failure.
     * On 409 (already exists) returns null — caller should check session->chat_room_id first.
     */
    public function createChatRoom(string $roomName, ?string $ownerUsername = null, int $maxUsers = 200): ?string
    {
        if (! config('services.agora.app_id') || ! config('services.agora.app_certificate')) {
            Log::error('AgoraService::createChatRoom — app_id or app_certificate missing');
            return null;
        }

        $baseUrl  = $this->chatBaseUrl();
        $appToken = $this->appToken();

        try {
            if ($ownerUsername) {
                $this->registerChatUser($ownerUsername);
            }

            $payload = [
                'name'        => $roomName,
                'description' => 'Chat room for ' . $roomName,
                'maxusers'    => $maxUsers,
            ];
            if ($ownerUsername) {
                $payload['owner'] = $ownerUsername;
            }

            $url      = $baseUrl . '/chatrooms';
            $response = Http::withToken($appToken, 'Bearer')
                ->timeout(10)
                ->acceptJson()
                ->post($url, $payload);

            Log::debug('Agora createChatRoom response', ['status' => $response->status(), 'body' => $response->body()]);

            if ($response->successful()) {
                $id = $response->json('data.id') ?? $response->json('id');
                Log::info('Agora Chat room created', ['room' => $roomName, 'id' => $id]);
                return $id ? (string) $id : null;
            }

            if ($response->status() === 409) {
                Log::info('Agora Chat room already exists (409)', ['room' => $roomName]);
                return null;
            }

            Log::warning('Agora createChatRoom unexpected response', [
                'status' => $response->status(),
                'body'   => $response->body(),
            ]);
            return null;

        } catch (\Throwable $e) {
            Log::error('Agora createChatRoom exception', ['error' => $e->getMessage()]);
            return null;
        }
    }

    // ─── kept for any legacy callers that use generateRtmTokenForAccount ───
    /** @deprecated  Use generateChatUserToken() instead. */
    public function generateRtmTokenForAccount(string $account, $expireSeconds = null): ?array
    {
        $token = $this->generateChatUserToken($account, $expireSeconds ?? (int) config('services.agora.token_ttl', 3600));

        if (! $token) {
            return null;
        }

        return [
            'token'      => $token,
            'uid'        => $account,
            'expires_in' => $expireSeconds ?? (int) config('services.agora.token_ttl', 3600),
        ];
    }

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
 * Get the existing chat room ID from the session, or create it and persist it.
 * This is the single safe entry point — always call this instead of createChatRoom() directly.
 */
public function getOrCreateChatRoomForSession(\App\Models\Sessions $session): ?string
{
    // Already persisted — return immediately, no API call needed
    if (! empty($session->chat_room_id)) {
        return $session->chat_room_id;
    }

    $roomName      = 'session_' . $session->id;
    $ownerUsername = 'teacher_' . $session->teacher_id;

    $roomId = $this->createChatRoom($roomName, $ownerUsername);

    // createChatRoom returns null on 409 (already exists on Agora but not saved locally).
    // Look it up by name so we get the real ID.
    if (! $roomId) {
        $roomId = $this->fetchChatRoomIdByName($roomName);
    }

    if ($roomId) {
        try {
            // Persist so the next caller (teacher or student) gets the same ID
            \App\Models\Sessions::where('id', $session->id)
                ->whereNull('chat_room_id')        // avoid overwrite race
                ->update(['chat_room_id' => $roomId]);

            $session->chat_room_id = $roomId;      // update in-memory too
        } catch (\Throwable $e) {
            Log::warning('Failed to persist chat_room_id', [
                'session_id' => $session->id,
                'error'      => $e->getMessage(),
            ]);
        }
    }

    return $roomId;
}

/**
 * Look up an existing Agora Chat room by name and return its ID.
 */
public function fetchChatRoomIdByName(string $roomName): ?string
{
    $baseUrl  = $this->chatBaseUrl();
    $appToken = $this->appToken();

    try {
        // Agora supports listing rooms; filter by name
        $response = Http::withToken($appToken, 'Bearer')
            ->timeout(10)
            ->acceptJson()
            ->get($baseUrl . '/chatrooms', ['name' => $roomName]);

        Log::debug('Agora fetchChatRoomIdByName', [
            'name'   => $roomName,
            'status' => $response->status(),
            'body'   => $response->body(),
        ]);

        if ($response->successful()) {
            $data = $response->json();
            // Response: { "data": [ { "id": "...", "name": "..." }, ... ] }
            $rooms = $data['data'] ?? [];
            foreach ($rooms as $room) {
                if (($room['name'] ?? '') === $roomName) {
                    return (string) $room['id'];
                }
            }
            // Fallback: return first result if only one room returned
            if (count($rooms) === 1 && isset($rooms[0]['id'])) {
                return (string) $rooms[0]['id'];
            }
        }
    } catch (\Throwable $e) {
        Log::error('Agora fetchChatRoomIdByName exception', ['error' => $e->getMessage()]);
    }

    return null;
}

}