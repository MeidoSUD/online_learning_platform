<?php

namespace Tests\Unit;

use App\Services\AppsFlyerService;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class AppsFlyerServiceTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        config([
            'services.appsflyer.dev_key' => 'test_dev_key_123',
            'services.appsflyer.android_app_id' => 'com.ewan_mobile_app',
            'services.appsflyer.ios_app_id' => 'id6754520719',
        ]);
    }

    /**
     * Test resolving app ID according to platform
     */
    public function test_resolves_app_id_for_platforms()
    {
        $service = new AppsFlyerService();

        $this->assertEquals('com.ewan_mobile_app', $service->resolveAppId('android'));
        $this->assertEquals('com.ewan_mobile_app', $service->resolveAppId('ANDROID'));
        $this->assertEquals('id6754520719', $service->resolveAppId('ios'));
        $this->assertEquals('id6754520719', $service->resolveAppId('iOS'));
        $this->assertEquals('id6754520719', $service->resolveAppId('apple'));
        $this->assertEquals('com.ewan_mobile_app', $service->resolveAppId(null));
    }

    /**
     * Test sendEvent sends correct payload, headers, and URL for Android
     */
    public function test_send_event_android_success()
    {
        Http::fake([
            'https://api2.appsflyer.com/inappevent/com.ewan_mobile_app' => Http::response('OK', 200),
        ]);

        $service = new AppsFlyerService();
        $result = $service->sendEvent(
            appsflyerId: '1776310605848-6203800892691468154',
            eventName: 'af_purchase',
            eventValue: [
                'af_revenue' => 150.0,
                'af_currency' => 'SAR',
            ],
            customerUserId: 42,
            platform: 'android',
            eventTime: '2026-09-30 00:00:00.000',
            advertisingId: '38400000-8cf0-11bd-b23e-10b96e40000d',
            ip: '105.235.122.10'
        );

        $this->assertTrue($result['success']);
        $this->assertEquals(200, $result['status']);
        $this->assertEquals('com.ewan_mobile_app', $result['app_id']);

        Http::assertSent(function (Request $request) {
            $hasAuthHeader = $request->hasHeader('authentication') && $request->header('authentication')[0] === 'test_dev_key_123';
            $isCorrectUrl = $request->url() === 'https://api2.appsflyer.com/inappevent/com.ewan_mobile_app';
            
            $hasAppsflyerId = $request['appsflyer_id'] === '1776310605848-6203800892691468154';
            $hasAdvertisingId = $request['advertising_id'] === '38400000-8cf0-11bd-b23e-10b96e40000d';
            $hasIp = $request['ip'] === '105.235.122.10';
            $hasCustomerUserId = $request['customer_user_id'] === '42';
            $hasEventName = $request['eventName'] === 'af_purchase';
            $hasEventTime = $request['eventTime'] === '2026-09-30 00:00:00.000';

            $eventValue = is_string($request['eventValue']) ? json_decode($request['eventValue'], true) : $request['eventValue'];
            $hasCorrectEventValue = isset($eventValue['af_revenue']) && $eventValue['af_revenue'] == 150.0 && $eventValue['af_currency'] === 'SAR';

            return $hasAuthHeader && $isCorrectUrl && $hasAppsflyerId && $hasAdvertisingId && $hasIp && $hasCustomerUserId && $hasEventName && $hasEventTime && $hasCorrectEventValue;
        });
    }

    /**
     * Test sendEvent sends correct payload, headers, and URL for iOS
     */
    public function test_send_event_ios_success()
    {
        Http::fake([
            'https://api2.appsflyer.com/inappevent/id6754520719' => Http::response('OK', 200),
        ]);

        $service = new AppsFlyerService();
        $result = $service->sendEvent(
            appsflyerId: '1776310605848-9999999999999999999',
            eventName: 'af_complete_registration',
            eventValue: [
                'af_registration_method' => 'mobile',
                'user_type' => 'teacher',
            ],
            customerUserId: '105',
            platform: 'ios'
        );

        $this->assertTrue($result['success']);
        $this->assertEquals(200, $result['status']);
        $this->assertEquals('id6754520719', $result['app_id']);

        Http::assertSent(function (Request $request) {
            $isCorrectUrl = $request->url() === 'https://api2.appsflyer.com/inappevent/id6754520719';
            $data = $request->data();
            return $isCorrectUrl && $data['appsflyer_id'] === '1776310605848-9999999999999999999';
        });
    }

    /**
     * Test helper methods for registration and purchase
     */
    public function test_convenience_helpers()
    {
        Http::fake([
            'https://api2.appsflyer.com/inappevent/*' => Http::response('OK', 200),
        ]);

        $service = new AppsFlyerService();

        // Registration helper
        $regResult = $service->sendRegistrationEvent('af_id_1', 1, 'android', ['user_type' => 'student']);
        $this->assertTrue($regResult['success']);
        $this->assertEquals('af_complete_registration', $regResult['payload']['eventName']);

        // Purchase helper
        $purchaseResult = $service->sendPurchaseEvent('af_id_2', 2, 250.50, 'SAR', 'ios');
        $this->assertTrue($purchaseResult['success']);
        $this->assertEquals('af_purchase', $purchaseResult['payload']['eventName']);
        $decoded = json_decode($purchaseResult['payload']['eventValue'], true);
        $this->assertEquals(250.50, $decoded['af_revenue']);
        $this->assertEquals('SAR', $decoded['af_currency']);

        // Login helper
        $loginResult = $service->sendLoginEvent('af_id_3', 3, 'android');
        $this->assertTrue($loginResult['success']);
        $this->assertEquals('af_login', $loginResult['payload']['eventName']);
    }

    /**
     * Test validation when dev key is missing or appsflyer_id is empty
     */
    public function test_validation_and_error_handling()
    {
        Http::fake();

        // Missing dev key
        $serviceWithoutKey = new AppsFlyerService(devKey: '');
        $res1 = $serviceWithoutKey->sendEvent('af_id_1', 'af_test');
        $this->assertFalse($res1['success']);
        $this->assertStringContainsString('Dev Key is not configured', $res1['error']);

        // Empty appsflyer_id
        $service = new AppsFlyerService();
        $res2 = $service->sendEvent('', 'af_test');
        $this->assertFalse($res2['success']);
        $this->assertStringContainsString('appsflyer_id is required', $res2['error']);

        Http::assertNothingSent();
    }
}
