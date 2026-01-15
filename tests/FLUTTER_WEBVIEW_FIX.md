# Flutter WebView Fix - Payment Widget Issues

## Problem
When opening the HyperPay payment widget URL, you get:
- `404 Not Found` error
- `400 Bad Request` error
- URL appears truncated in logs

## Root Cause
The redirect URL is being constructed correctly on the backend, but Flutter's WebView or JSON parsing might have issues with special characters in the checkout ID.

---

## ✅ Quick Fix for Payment Widget

### Step 1: Update Your Payment Service Response Handling

**Add this to parse the redirect_url correctly:**

```dart
// Make sure you're extracting the full redirect_url from response
Future<CheckoutResponse> createCheckout(PaymentRequest request) async {
  try {
    final response = await dio.post(
      '$apiBaseUrl/payments/checkout',
      data: request.toJson(),
      options: Options(
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': 'Bearer ${getAccessToken()}',
        },
      ),
    );

    if (response.statusCode == 200) {
      final data = response.data['data'];
      
      // IMPORTANT: Print for debugging
      print('✅ Raw checkout_id: ${data['checkout_id']}');
      print('✅ Raw redirect_url: ${data['redirect_url']}');
      
      // Ensure URL is complete and valid
      String redirectUrl = data['redirect_url'] ?? '';
      if (redirectUrl.isEmpty) {
        throw Exception('redirect_url is empty from server');
      }
      if (!redirectUrl.startsWith('https://')) {
        throw Exception('redirect_url is invalid: $redirectUrl');
      }
      
      return CheckoutResponse(
        checkoutId: data['checkout_id'],
        paymentId: data['payment_id'],
        redirectUrl: redirectUrl, // Use the full URL from backend
        amount: data['amount'],
        currency: data['currency'],
      );
    }
    throw Exception('Failed to create checkout: ${response.statusCode}');
  } catch (e) {
    throw PaymentException('Checkout creation failed: $e');
  }
}
```

---

### Step 2: Update PaymentWebView with Better Logging

**Replace your PaymentWebView class with this version:**

```dart
import 'package:webview_flutter/webview_flutter.dart';
import 'package:flutter/material.dart';
import 'dart:developer' as developer;

class PaymentWebView extends StatefulWidget {
  final String redirectUrl;
  final String checkoutId;
  final Function(String) onPaymentComplete;
  final Function(String) onPaymentFailed;

  const PaymentWebView({
    required this.redirectUrl,
    required this.checkoutId,
    required this.onPaymentComplete,
    required this.onPaymentFailed,
  });

  @override
  State<PaymentWebView> createState() => _PaymentWebViewState();
}

class _PaymentWebViewState extends State<PaymentWebView> {
  late WebViewController _webViewController;
  bool isLoading = true;
  String? errorMessage;
  int loadAttempts = 0;

  @override
  void initState() {
    super.initState();
    
    // Log the URL being opened
    developer.log('🔵 Opening HyperPay Widget');
    developer.log('📍 URL: ${widget.redirectUrl}');
    developer.log('🆔 Checkout ID: ${widget.checkoutId}');
    
    _initializeWebView();
  }

  void _initializeWebView() {
    try {
      _webViewController = WebViewController()
        ..setJavaScriptMode(JavaScriptMode.unrestricted)
        ..setNavigationDelegate(
          NavigationDelegate(
            onPageStarted: (String url) {
              developer.log('▶️  Page loading: $url');
              setState(() {
                isLoading = true;
                errorMessage = null;
              });
              
              // Check for payment completion
              if (url.contains('success') || url.contains('payment-success')) {
                developer.log('✅ Payment success detected');
                Navigator.pop(context);
                widget.onPaymentComplete('success');
              }
              
              if (url.contains('failed') || url.contains('payment-failed')) {
                developer.log('❌ Payment failed detected');
                Navigator.pop(context);
                widget.onPaymentFailed('payment_failed');
              }
            },
            onPageFinished: (String url) {
              developer.log('✔️  Page loaded: $url');
              setState(() => isLoading = false);
            },
            onWebResourceError: (WebResourceError error) {
              developer.log(
                '⚠️  WebView Error: ${error.description}',
                error: error,
              );
              
              setState(() {
                errorMessage = error.description;
                isLoading = false;
              });
            },
            onNavigationRequest: (NavigationRequest request) {
              developer.log('🔗 Navigating to: ${request.url}');
              return NavigationDecision.navigate;
            },
          ),
        );
      
      // Load the URL
      _webViewController.loadRequest(Uri.parse(widget.redirectUrl));
      
    } catch (e) {
      developer.log('❌ WebView initialization error: $e');
      setState(() {
        errorMessage = 'Failed to initialize payment widget: $e';
        isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Complete Payment'),
        leading: IconButton(
          icon: const Icon(Icons.close),
          onPressed: () {
            developer.log('❌ User cancelled payment');
            Navigator.pop(context);
            widget.onPaymentFailed('user_cancelled');
          },
        ),
      ),
      body: Stack(
        children: [
          // Error state
          if (errorMessage != null)
            Center(
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Icon(Icons.error_outline, size: 64, color: Colors.red),
                    const SizedBox(height: 24),
                    const Text(
                      'Payment Widget Error',
                      style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                    ),
                    const SizedBox(height: 12),
                    Text(
                      errorMessage!,
                      textAlign: TextAlign.center,
                      style: const TextStyle(fontSize: 14, color: Colors.grey),
                    ),
                    const SizedBox(height: 24),
                    Text(
                      'Checkout ID: ${widget.checkoutId}',
                      textAlign: TextAlign.center,
                      style: const TextStyle(fontSize: 12, fontFamily: 'monospace'),
                    ),
                    const SizedBox(height: 24),
                    ElevatedButton(
                      onPressed: () {
                        Navigator.pop(context);
                        widget.onPaymentFailed('error');
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.red,
                        padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 12),
                      ),
                      child: const Text('Close Payment'),
                    ),
                  ],
                ),
              ),
            )
          // Loading state
          else if (isLoading)
            const Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  CircularProgressIndicator(),
                  SizedBox(height: 16),
                  Text('Loading payment widget...'),
                ],
              ),
            )
          // WebView
          else
            WebViewWidget(controller: _webViewController),
        ],
      ),
    );
  }
}
```

---

### Step 3: Update Payment Screen with Validation

**Replace your payment flow with this:**

```dart
void _proceedToPayment() async {
  setState(() => isLoading = true);

  try {
    // Create checkout request
    final checkoutRequest = PaymentRequest(
      amount: widget.amount,
      currency: 'SAR',
      paymentBrand: 'VISA', // Or let user select
      savedCardId: selectedCardId,
    );

    print('📤 Sending checkout request: ${checkoutRequest.toJson()}');

    // Get checkout from backend
    final checkout = await paymentService.createCheckout(checkoutRequest);

    // Validate URL before opening
    if (checkout.redirectUrl.isEmpty) {
      throw Exception('Server returned empty redirect URL');
    }

    if (!checkout.redirectUrl.startsWith('https://')) {
      throw Exception('Invalid redirect URL: ${checkout.redirectUrl}');
    }

    if (!checkout.redirectUrl.contains('oppwa.com')) {
      throw Exception('URL is not from HyperPay: ${checkout.redirectUrl}');
    }

    print('✅ Valid checkout received');
    print('   ID: ${checkout.checkoutId}');
    print('   URL: ${checkout.redirectUrl}');

    if (!mounted) return;

    // Open payment widget
    await Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => PaymentWebView(
          redirectUrl: checkout.redirectUrl,
          checkoutId: checkout.checkoutId,
          onPaymentComplete: (status) async {
            await _handlePaymentComplete(checkout.checkoutId);
          },
          onPaymentFailed: (error) {
            _showError('Payment failed or cancelled: $error');
          },
        ),
      ),
    );

  } catch (e) {
    print('❌ Error: $e');
    _showError('Payment error: $e');
  } finally {
    setState(() => isLoading = false);
  }
}

Future<void> _handlePaymentComplete(String checkoutId) async {
  try {
    final paymentStatus = await paymentService.checkPaymentStatus(
      checkoutId: checkoutId,
      saveCard: true,
      cardBrand: 'VISA',
    );

    if (paymentStatus.isPaid) {
      _showSuccess('✅ Payment successful!');
      // Update booking status
    } else {
      _showError('❌ Payment failed. Please try again.');
    }
  } catch (e) {
    _showError('❌ Error checking payment: $e');
  }
}

void _showError(String message) {
  ScaffoldMessenger.of(context).showSnackBar(
    SnackBar(
      content: Text(message),
      backgroundColor: Colors.red,
      duration: const Duration(seconds: 4),
    ),
  );
}

void _showSuccess(String message) {
  ScaffoldMessenger.of(context).showSnackBar(
    SnackBar(
      content: Text(message),
      backgroundColor: Colors.green,
      duration: const Duration(seconds: 3),
    ),
  );
}
```

---

## 🔍 Debugging Steps

If you still get the 404/400 error:

### 1. Check Backend Logs
```bash
# SSH to your server and check:
tail -f storage/logs/laravel.log | grep -i hyperpay
```

Look for:
- ✅ "HyperPay Copy & Pay Checkout Created" - Backend created checkout successfully
- ❌ "HyperPay checkout creation failed" - Backend got error from HyperPay

### 2. Verify Checkout ID Format
The checkout ID should look like:
```
029FB08233743409981F7CA70294F89D.uat01-vm-tx03
```

If you see something different, the backend isn't receiving the correct response from HyperPay.

### 3. Check Your Backend Configuration
```bash
# SSH to server:
php artisan tinker

# Check HyperPay config:
>>> config('hyperpay.base_url')
>>> config('hyperpay.visa_entity_id')
>>> config('hyperpay.master_entity_id')
>>> config('hyperpay.mada_entity_id')
```

All should be set and not null.

### 4. Test Checkout Creation with Postman
```
POST http://your-backend/api/payments/checkout
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
  "amount": 12.0,
  "currency": "SAR"
}
```

Response should be:
```json
{
  "success": true,
  "data": {
    "checkout_id": "029FB08233743409981F7CA70294F89D.uat01-vm-tx03",
    "redirect_url": "https://eu-test.oppwa.com/v1/checkouts/029FB08233743409981F7CA70294F89D.uat01-vm-tx03/payment.html"
  }
}
```

---

## 🚀 What to Update in Your Flutter App

| Component | Change |
|-----------|--------|
| PaymentService | Add validation and logging to `createCheckout()` |
| PaymentWebView | Replace with new version (better error handling) |
| Payment Screen | Add URL validation before opening WebView |
| Logging | Add `developer.log()` calls for debugging |

---

## ✨ Expected Behavior After Fix

1. ✅ Click "Pay Now"
2. ✅ Backend creates checkout → returns URL
3. ✅ Flutter validates URL is complete and from `oppwa.com`
4. ✅ WebView opens successfully
5. ✅ HyperPay payment form appears
6. ✅ Customer enters card details
7. ✅ Payment processes
8. ✅ Success/failure page appears

---

## 📝 Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| `404 Not Found` | Backend didn't create checkout successfully. Check HyperPay credentials |
| `400 Bad Request` | Checkout ID is invalid. Verify backend logs |
| URL is truncated in logs | Normal - logs truncate long strings. Check actual response in Postman |
| WebView blank/white | Page still loading. Give it 10+ seconds |
| "oppwa.com not found" | Network issue or HyperPay UAT is down |

