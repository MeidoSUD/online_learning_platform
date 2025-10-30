<style>
    
    body {
        background-color:transparent;
        margin: 58px;
    }

    .wpwl-form {
        max-width: 100%;
        margin: 0px;
    }
    
    .wpwl-button-pay {
        color: #151515;
    }
    
    .wpwl-group {
        margin-bottom: 12px;
        width: 100%;
        position: relative;
    }

    div.wpwl-brand-custom  { margin: 0px 5px; background-image: url("https://oppwa.com/v1/paymentWidgets/img/brand.png") }
</style>
<?php


    @$order_url = $_REQUEST['order_url'];
    
    

    @$id_paid = $_REQUEST['id_paid'];
    
    @$order_id= $_REQUEST['data'];
    
    
    if($order_url && $id_paid && $order_id){
        
        $payment_gway_type = DB::table('orders')->select('payment_gway_type')->where('id',$order_id)->first();


        @$web_url = url("/check_hyper/".$order_id);


        if(@$order_url == "test" and @$id_paid){
            echo '<script src="https://test.oppwa.com/v1/paymentWidgets.js?checkoutId='.$id_paid.'"></script>'; 
             
        }
        
        if(@$order_url == "live" and @$id_paid){
            echo '<script src="https://oppwa.com/v1/paymentWidgets.js?checkoutId='.$id_paid.'"></script>';
            
        }
        
        if(@$web_url){
            
            
            if($payment_gway_type->payment_gway_type == '1'){
                
                echo '<form action="'.$web_url.'"class="paymentWidgets" data-brands="MADA"></form>';
            }
            
            if($payment_gway_type->payment_gway_type == '3'){
                
                echo '<form action="'.$web_url.'"class="paymentWidgets" data-brands="VISA MASTER"></form>';
            }
            
            if($payment_gway_type->payment_gway_type == '4'){
                
                echo '<form action="'.$web_url.'"class="paymentWidgets" data-brands="STC_PAY"></form>';
            }
            
            if($payment_gway_type->payment_gway_type == '5'){
                
                echo '<form action="'.$web_url.'"class="paymentWidgets" data-brands="APPLEPAY"></form>';
            }
            
            // echo '<form action="'.$web_url.'"class="paymentWidgets" data-brands="MADA VISA MASTER STC_PAY"></form>';
            
        }
    }else{
        echo "<b>Please Send Complete Data !!!</b>";
    }
        
?>

<script type="text/javascript">
    var wpwlOptions = {
    paymentTarget:"_top",
    }

</script>