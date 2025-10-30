<?php

// Add this to your hyperpay_payment_way.php or create new helper file

function hyperpay_direct_payment($data){
    
    $setting_environment = config('hyperpay.environment', '0');
    
    // Get URLs and token based on environment
    if($setting_environment == '0'){
        $url = "https://test.oppwa.com/v1/payments";
        $token = config('hyperpay.test_token');
    }else{
        $url = "https://oppwa.com/v1/payments";
        $token = config('hyperpay.live_token');
    }
    
    // Build payment request data
    $paymentData = [
        'entityId' => $data['entity_id'],
        'amount' => $data['amount'],
        'currency' => $data['currency'],
        'paymentBrand' => $data['payment_brand'],
        'paymentType' => 'DB', // Debit
        
        // Card details
        'card.number' => $data['card']['number'],
        'card.holder' => $data['card']['holder'],
        'card.expiryMonth' => $data['card']['expiryMonth'],
        'card.expiryYear' => $data['card']['expiryYear'],
        'card.cvv' => $data['card']['cvv'],
        
        // Customer details
        'customer.email' => $data['customer']['email'],
        'customer.givenName' => $data['customer']['givenName'],
        'customer.surname' => $data['customer']['surname'],
        
        // Billing details
        'billing.street1' => $data['billing']['street1'],
        'billing.city' => $data['billing']['city'],
        'billing.state' => $data['billing']['state'],
        'billing.country' => $data['billing']['country'],
        'billing.postcode' => $data['billing']['postcode'],
        
        // Merchant Transaction ID
        'merchantTransactionId' => uniqid(),
        
        // Shopper result URL for 3D Secure
        'shopperResultUrl' => $data['shopperResultUrl'],
        
        // Create registration for recurring payments (optional)
        'createRegistration' => 'false',
    ];
    
    // Convert to query string format
    $postFields = http_build_query($paymentData);
    
    // Make cURL request
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_HTTPHEADER, array(
        'Authorization: Bearer '.$token,
        'Content-Type: application/x-www-form-urlencoded'
    ));
    curl_setopt($ch, CURLOPT_POST, 1);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $postFields);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    
    $responseData = curl_exec($ch);
    
    if(curl_errno($ch)) {
        $error = curl_error($ch);
        curl_close($ch);
        return [
            'success' => false,
            'error' => '500',
            'description' => $error
        ];
    }
    
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    $responseData = json_decode($responseData, true);
    
    // Add HTTP status code to response
    $responseData['http_code'] = $httpCode;
    
    return $responseData;
}