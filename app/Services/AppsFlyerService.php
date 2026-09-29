<?php

namespace App\Services;

use Carbon\Carbon;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Throwable;

class AppsFlyerService
{
    protected ?string $devKey;
    protected ?string $androidAppId;
    protected ?string $iosAppId;
    protected string $baseUrl;

    public function __construct(
        ?string $devKey = null,
        ?string $androidAppId = null,
        ?string $iosAppId = null,
        string $baseUrl = 'https://api2.appsflyer.com/inappevent/'
    ) {
        $this->devKey = $devKey ?? config('services.appsflyer.dev_key', env('APPSFLYER_DEV_KEY'));
        $this->androidAppId = $androidAppId ?? config('services.appsflyer.android_app_id', env('APPSFLYER_ANDROID_APP_ID', 'com.ewan_mobile_app'));
        $this->iosAppId = $iosAppId ?? config('services.appsflyer.ios_app_id', env('APPSFLYER_IOS_APP_ID', 'id6754520719'));
        $this->baseUrl = $baseUrl;
    }

    /**
     * Resolve the App ID based on platform ('android' or 'ios')
     */
    public function resolveAppId(?string $platform): string
    {
        $normalizedPlatform = strtolower(trim((string) $platform));

        if (in_array($normalizedPlatform, ['ios', 'iphone', 'ipad', 'apple'])) {
            return (string) $this->iosAppId;
        }

        // If an explicit bundle ID / app store ID was passed directly
        if (str_starts_with($normalizedPlatform, 'com.') || str_starts_with($normalizedPlatform, 'id')) {
            return $platform;
        }

        // Default to Android app ID
        return (string) ($this->androidAppId ?: 'com.ewan_mobile_app');
    }

    /**
     * Send an In-App Event to AppsFlyer Server-to-Server (S2S) Endpoint.
     *
     * @param string $appsflyerId Device AppsFlyer ID (UID)
     * @param string $eventName Name of the event (e.g. af_complete_registration, af_purchase)
     * @param array|string $eventValue Associated event parameters
     * @param string|int|null $customerUserId User ID in the backend database
     * @param string|null $platform Device platform ('android' or 'ios')
     * @param string|null $eventTime Formatted event time (YYYY-MM-DD HH:mm:ss.SSS). Defaults to current UTC time.
     * @return array
     */
    public function sendEvent(
        string $appsflyerId,
        string $eventName,
        array|string $eventValue = [],
        string|int|null $customerUserId = null,
        ?string $platform = null,
        ?string $eventTime = null
    ): array {
        if (empty($this->devKey)) {
            Log::warning('AppsFlyer S2S: Dev Key is missing. Skipping event dispatch.', [
                'eventName' => $eventName,
                'appsflyerId' => $appsflyerId,
            ]);
            return [
                'success' => false,
                'status' => 0,
                'error' => 'AppsFlyer Dev Key is not configured',
            ];
        }

        if (empty($appsflyerId)) {
            Log::warning('AppsFlyer S2S: appsflyer_id is empty. Skipping event dispatch.', [
                'eventName' => $eventName,
            ]);
            return [
                'success' => false,
                'status' => 0,
                'error' => 'appsflyer_id is required',
            ];
        }

        $appId = $this->resolveAppId($platform);
        $url = rtrim($this->baseUrl, '/') . '/' . $appId;

        // Ensure eventValue is JSON-stringified as required by AppsFlyer S2S API
        $formattedEventValue = is_array($eventValue)
            ? json_encode($eventValue, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES)
            : (string) $eventValue;

        // Ensure eventTime matches YYYY-MM-DD HH:mm:ss.SSS format
        $formattedEventTime = $eventTime ?: Carbon::now('UTC')->format('Y-m-d H:i:s.v');

        $payload = [
            'appsflyer_id' => $appsflyerId,
            'eventName' => $eventName,
            'eventValue' => $formattedEventValue,
            'eventTime' => $formattedEventTime,
        ];

        if ($customerUserId !== null && $customerUserId !== '') {
            $payload['customer_user_id'] = (string) $customerUserId;
        }

        try {
            $response = Http::withHeaders([
                'authentication' => $this->devKey,
                'Content-Type' => 'application/json',
                'Accept' => 'application/json',
            ])->timeout(10)->post($url, $payload);

            $isSuccess = $response->successful();

            if ($isSuccess) {
                Log::info("AppsFlyer S2S event sent successfully: {$eventName}", [
                    'app_id' => $appId,
                    'platform' => $platform,
                    'appsflyer_id' => $appsflyerId,
                    'customer_user_id' => $customerUserId,
                    'response_status' => $response->status(),
                    'response_body' => $response->body(),
                ]);
            } else {
                Log::warning("AppsFlyer S2S event request returned error: {$eventName}", [
                    'app_id' => $appId,
                    'platform' => $platform,
                    'appsflyer_id' => $appsflyerId,
                    'response_status' => $response->status(),
                    'response_body' => $response->body(),
                    'payload' => $payload,
                ]);
            }

            return [
                'success' => $isSuccess,
                'status' => $response->status(),
                'body' => $response->body(),
                'app_id' => $appId,
                'payload' => $payload,
            ];
        } catch (Throwable $e) {
            Log::error("AppsFlyer S2S event exception: {$e->getMessage()}", [
                'eventName' => $eventName,
                'app_id' => $appId,
                'appsflyer_id' => $appsflyerId,
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'status' => 500,
                'error' => $e->getMessage(),
                'app_id' => $appId,
                'payload' => $payload,
            ];
        }
    }

    /**
     * Convenience method for tracking user registration
     */
    public function sendRegistrationEvent(
        string $appsflyerId,
        string|int|null $customerUserId,
        ?string $platform = null,
        array $extraData = []
    ): array {
        $eventValue = array_merge([
            'af_registration_method' => $extraData['method'] ?? 'app',
            'user_type' => $extraData['user_type'] ?? 'student',
        ], $extraData);

        return $this->sendEvent(
            appsflyerId: $appsflyerId,
            eventName: 'af_complete_registration',
            eventValue: $eventValue,
            customerUserId: $customerUserId,
            platform: $platform
        );
    }

    /**
     * Convenience method for tracking purchases / bookings
     */
    public function sendPurchaseEvent(
        string $appsflyerId,
        string|int|null $customerUserId,
        float $revenue,
        string $currency = 'SAR',
        ?string $platform = null,
        array $extraData = []
    ): array {
        $eventValue = array_merge([
            'af_revenue' => $revenue,
            'af_currency' => $currency,
        ], $extraData);

        return $this->sendEvent(
            appsflyerId: $appsflyerId,
            eventName: 'af_purchase',
            eventValue: $eventValue,
            customerUserId: $customerUserId,
            platform: $platform
        );
    }

    /**
     * Convenience method for tracking user login
     */
    public function sendLoginEvent(
        string $appsflyerId,
        string|int|null $customerUserId,
        ?string $platform = null,
        array $extraData = []
    ): array {
        return $this->sendEvent(
            appsflyerId: $appsflyerId,
            eventName: 'af_login',
            eventValue: $extraData,
            customerUserId: $customerUserId,
            platform: $platform
        );
    }
}
