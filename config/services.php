<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'mailgun' => [
        'domain' => env('MAILGUN_DOMAIN'),
        'secret' => env('MAILGUN_SECRET'),
        'endpoint' => env('MAILGUN_ENDPOINT', 'api.mailgun.net'),
    ],

    'postmark' => [
        'token' => env('POSTMARK_TOKEN'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],
    'sms' => [
        'provider' => 'dreamsSms',
        'user' => env('SMS_USER'),
        'secret_key' => env('SMS_SECRET_KEY'),
        'sender' => env('SMS_SENDER'),
    ],
    'fcm' => [
        'server_key' => env('FCM_SERVER_KEY'),
    ],

    'twilio' => [
        'account_sid' => env('TWILIO_ACCOUNT_SID'),
        'auth_token' => env('TWILIO_AUTH_TOKEN'),
        'from_number' => env('TWILIO_FROM_NUMBER'),
    ],

    'unifonic' => [ // Popular in Saudi Arabia
        'app_sid' => env('UNIFONIC_APP_SID'),
        'sender_id' => env('UNIFONIC_SENDER_ID'),
    ],
    'hyperpay' => [
        'base_url' => env('HYPERPAY_BASE_URL'),
        'token' => env('HYPERPAY_ACCESS_TOKEN'),
        'entity_id_visa' => env('HYPERPAY_ENTITY_ID_VISA'),
        'entity_id_mada' => env('HYPERPAY_ENTITY_ID_MADA'),
        'currency' => env('HYPERPAY_CURRENCY', 'SAR'),
    ],

];
