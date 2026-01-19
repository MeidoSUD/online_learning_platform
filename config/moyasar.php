<?php
return [
    // Moyasar API Configuration
    
    // API Key (Secret Key) - used for server-side API calls
    'api_key' => env('MOYASAR_API_KEY', env('MOYASAR_TEST_SK', null)),
    
    // Public Key - used for client-side payment form
    'public_key' => env('MOYASAR_PUBLIC_KEY', env('MOYASAR_TEST_PK', null)),
    
    // Environment status
    'status' => env('MOYASAR_STATUS', 'test'),
    
    // Callback configuration
    'callback_timeout' => env('MOYASAR_CALLBACK_TIMEOUT', 30), // seconds
];