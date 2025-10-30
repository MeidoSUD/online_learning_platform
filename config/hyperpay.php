<?php
return [
    // Base URL should NOT include the /v1 path; keep host only
    'base_url' => env('HYPERPAY_BASE_URL', 'https://eu-test.oppwa.com'),

    // default entity id (optional) — fallback if brand-specific IDs not used
    'entity_id' => env('HYPERPAY_ENTITY_ID', null),

    // brand specific entity ids
    'visa_entity_id' => env('HYPERPAY_ENTITY_ID_VISA', null),
    'master_entity_id' => env('HYPERPAY_ENTITY_ID_MASTERCARD', null),
    'mada_entity_id' => env('HYPERPAY_ENTITY_ID_MADA', null),

    // access token (the .env already has HYPERPAY_ACCESS_TOKEN)
    'access_token' => env('HYPERPAY_ACCESS_TOKEN', null),

    // built Authorization header — used by service
    'authorization' => env('HYPERPAY_AUTHORIZATION', null) ?: ('Bearer ' . env('HYPERPAY_ACCESS_TOKEN', '')),

    'currency' => env('HYPERPAY_CURRENCY', 'SAR'),
    'timeout' => env('HYPERPAY_TIMEOUT', 30),
];