<?php

namespace App\Console\Commands;

use App\Services\AppsFlyerService;
use Illuminate\Console\Command;

class AppsFlyerSendTestEvent extends Command
{
    protected $signature = 'appsflyer:send-test-event
                            {--appsflyer-id=1776310605848-6203800892691468154 : The AppsFlyer device UID}
                            {--advertising-id=38400000-8cf0-11bd-b23e-10b96e40000d : Device GAID / IDFA advertising ID}
                            {--ip=105.235.122.10 : Client IP address}
                            {--platform=android : Platform (android or ios)}
                            {--event=af_complete_registration : Event name (e.g. af_complete_registration, af_purchase)}
                            {--user-id=1 : Customer user ID in database}
                            {--revenue=0 : Revenue amount (for purchase events)}
                            {--currency=SAR : Currency code}';

    protected $description = 'Send a test S2S event to AppsFlyer and verify the response';

    public function handle(AppsFlyerService $appsFlyerService)
    {
        $appsflyerId = (string) $this->option('appsflyer-id');
        $advertisingId = (string) $this->option('advertising-id');
        $ip = (string) $this->option('ip');
        $platform = (string) $this->option('platform');
        $eventName = (string) $this->option('event');
        $userId = $this->option('user-id');
        $revenue = (float) $this->option('revenue');
        $currency = (string) $this->option('currency');

        $this->info("Preparing AppsFlyer S2S Event...");
        $this->table(
            ['Parameter', 'Value'],
            [
                ['Platform', $platform],
                ['Resolved App ID', $appsFlyerService->resolveAppId($platform)],
                ['Event Name', $eventName],
                ['AppsFlyer ID', $appsflyerId],
                ['Advertising ID (GAID/IDFA)', $advertisingId ?: '(none)'],
                ['Client IP', $ip ?: '(none)'],
                ['Customer User ID', $userId],
                ['Revenue / Currency', "{$revenue} {$currency}"],
            ]
        );

        $eventValue = [
            'af_revenue' => $revenue,
            'af_currency' => $currency,
        ];

        if ($eventName === 'af_complete_registration') {
            $eventValue['af_registration_method'] = 'test_cli';
            $eventValue['user_type'] = 'student';
        }

        $this->line("Dispatching event to AppsFlyer S2S Endpoint...");

        $response = $appsFlyerService->sendEvent(
            appsflyerId: $appsflyerId,
            eventName: $eventName,
            eventValue: $eventValue,
            customerUserId: $userId,
            platform: $platform,
            advertisingId: $advertisingId,
            ip: $ip
        );

        $this->newLine();
        $this->info("--- AppsFlyer Dispatch Result ---");
        $this->line("Success: " . ($response['success'] ? '<info>YES (HTTP 200)</info>' : '<error>NO</error>'));
        $this->line("HTTP Status: " . ($response['status'] ?? 'N/A'));
        $this->line("Response Body: " . ($response['body'] ?? ($response['error'] ?? 'N/A')));

        if (!empty($response['payload'])) {
            $this->newLine();
            $this->info("--- Outgoing Payload Sent ---");
            $this->line(json_encode($response['payload'], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE));
        }

        return $response['success'] ? 0 : 1;
    }
}
