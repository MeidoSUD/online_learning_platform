<?php

function hyperpay_payment_way($order_id,$amount,$currency,$name,$phone,$setting_environment,$payment_gway_type){
        //test entity
        // $entity = "8ac7a4c870e71b030170e82e0ad806ce";
        
        if($payment_gway_type == '1'){
            //mada
            
            $entity = "mada";
        }elseif($payment_gway_type == '2'){
            //saddad
        }elseif($payment_gway_type == '3'){
            //visa mastercard
            
            $entity = "mastercard";
        }elseif($payment_gway_type == '4'){
            //stcpay
            $entity = "stcpay";
        }elseif($payment_gway_type == '5'){
            //apple pay 
            $entity = "apple";
        }
        
        
        $yoursiteUrl = url('/');
        @$web_url = $yoursiteUrl."/check_hyper";
    		
    	
    	
        // 	$setting_environment = 0;
    	
    	if($setting_environment == '0'){
    		$url = "https://test.oppwa.com/v1/checkouts";
    		$order_url = "test";
    	}else{
    		$url = "https://oppwa.com/v1/checkouts";
    		$order_url = "live";
    	}
    	
    	
    	if(@$entity){
        	$data = "entityId=".$entity.
                        "&amount=".$amount.
                        "&currency=".$currency.
                        "&paymentType=DB".
                        //just required in test
                        // "&testMode=EXTERNAL".
                        "&customer.email=". $phone.
                        "&customer.givenName=". $name.
                        
                        // "&customer.middleName=". $name.
                        // "&customer.surname=". $name.
                        
                        // when we use sdk mobile rather than replace to redirect this check status order pay $web_url
                        // "&notificationUrl=http://www.example.com/notify".
                        
                        // "&notificationUrl=".$web_url.
                        
                        "&merchantTransactionId=". uniqid();
        
            if($payment_gway_type){
            	$ch = curl_init();
            	curl_setopt($ch, CURLOPT_URL, $url);

            	curl_setopt($ch, CURLOPT_HTTPHEADER, array(
                                   'Authorization:Bearer your_access_token_here'));    
                              
            	curl_setopt($ch, CURLOPT_POST, 1);
            	curl_setopt($ch, CURLOPT_POSTFIELDS, $data);
            	curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
                // this should be set to true in production
            	curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            	$responseData = curl_exec($ch);
            	if(curl_errno($ch)) {
            		return curl_error($ch);
            	}
            	curl_close($ch);
                
                $responseData = json_decode($responseData);
                
                @$id_paid = $responseData->id;

                $url = $yoursiteUrl."/paid?order_url=".$order_url."&data=".$order_id."&id_paid=".$id_paid;

                $responseData->url = $url;
                
                return $responseData;
            
            }else{
        	    $responseData['error'] = '700';
        	    $responseData['description'] = 'entity id not found';
        	    
        	    return response()->json(["data"=>$responseData]);    
        	}
    	}else{
    	    $responseData['error'] = '700';
    	    $responseData['description'] = 'entity id not found';
    	    
    	    return response()->json(["data"=>$responseData]);    
    	}
    }
    
    
    function paid(){
        return view('paid');
    }
    
    
    
    function get_payment_status_request($checkoutId,$payment_gway_type){
        
        
        if($payment_gway_type == '1'){
            //mada
            
            $entity = "mada";
        }elseif($payment_gway_type == '2'){
            //saddad
        }elseif($payment_gway_type == '3'){
            //visa mastercard

            $entity = "visa_mastercard";
        }elseif($payment_gway_type == '4'){
            //stcpay

            $entity = "stcpay";
        }elseif($payment_gway_type == '5'){
            //apple pay 
            $entity = "apple_pay";
        }else{
            $responseData['error'] = '700';
    	    $responseData['description'] = 'entity id not found';
    	    
    	    return response()->json(["data"=>$responseData]);     
        }
    
        
        
    	
    	if($payment_gway_type && $entity){
    	    //test
            // $url = "https://test.oppwa.com/v1/checkouts/".$checkoutId."/payment";
            
            // live
            
            $url = "https://oppwa.com/v1/checkouts/".$checkoutId."/payment";
    
        	
        	$url .= "?entityId=".$entity;
    	
        	$ch = curl_init();
        	curl_setopt($ch, CURLOPT_URL, $url);
        	
                                             
                           
        	curl_setopt($ch, CURLOPT_HTTPHEADER, array(
                           'Authorization:Bearer your_access_token_here'));
        	curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'GET');
        	curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
            // this should be set to true in production
        	curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        	$responseData = curl_exec($ch);
        	if(curl_errno($ch)) {
        		return curl_error($ch);
        	}
        	curl_close($ch);
        
            $responseData = json_decode($responseData);
        
            
            return response()->json(["data"=>$responseData]);
    	}else{
    	    $responseData['error'] = '700';
    	    $responseData['description'] = 'entity id not found';
    	    
    	    return response()->json(["data"=>$responseData]);    
    	}
    
    }