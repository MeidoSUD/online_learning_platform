# Flutter App - HyperPay Payment Integration Updates

## 📋 Overview

The backend has been refactored to be **PCI-DSS compliant** using HyperPay's Copy & Pay widget. Your Flutter app needs updates to work with the new payment API.

**Key Change**: Backend NO LONGER receives card data. Card details are entered in HyperPay's hosted widget instead.

---

## ✅ Required Changes to Your Flutter Code

### 1. **Update Payment Request Model**

**OLD** (❌ No longer used):
```dart
class PaymentRequest {
  final String cardNumber;
  final String expiryDate;
  final String cvv;
  final String cardHolderName;
  // ... more fields
}
```

**NEW** (✅ Updated):
```dart
class PaymentRequest {
  final double amount;
  final String currency; // Usually 'SAR' for Saudi Arabia
  final String? paymentBrand; // OPTIONAL: 'VISA', 'MASTERCARD', 'MADA' (defaults to VISA if not provided)
  final String? merchantTransactionId; // OPTIONAL: Your transaction ID
  final int? savedCardId; // OPTIONAL: For using saved cards
  
  PaymentRequest({
    required this.amount,
    required this.currency,
    this.paymentBrand,
    this.merchantTransactionId,
    this.savedCardId,
  });

  Map<String, dynamic> toJson() => {
    'amount': amount,
    'currency': currency,
    if (paymentBrand != null) 'payment_brand': paymentBrand,
    if (merchantTransactionId != null) 'merchant_transaction_id': merchantTransactionId,
    if (savedCardId != null) 'saved_card_id': savedCardId,
  };
}
```

---

### 2. **Update Payment Service**

**OLD** (❌ No longer used):
```dart
Future<PaymentResponse> processPayment(PaymentRequest request) {
  // This method no longer exists
  // Don't send card data to backend!
}
```

**NEW** (✅ Updated):
```dart
class PaymentService {
  final Dio dio;
  final String apiBaseUrl;

  PaymentService({required this.dio, required this.apiBaseUrl});

  /// Step 1: Create a HyperPay checkout session
  /// Returns checkout_id and redirect_url
  Future<CheckoutResponse> createCheckout(PaymentRequest request) async {
    try {
      final response = await dio.post(
        '$apiBaseUrl/payments/checkout',
        data: request.toJson(),
        options: Options(
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': 'Bearer ${getAccessToken()}', // Your Sanctum token
          },
        ),
      );

      if (response.statusCode == 200) {
        final data = response.data['data'];
        return CheckoutResponse(
          checkoutId: data['checkout_id'],
          paymentId: data['payment_id'],
          redirectUrl: data['redirect_url'],
          amount: data['amount'],
          currency: data['currency'],
        );
      }
      throw Exception('Failed to create checkout');
    } catch (e) {
      throw PaymentException('Checkout creation failed: $e');
    }
  }

  /// Step 2: Open HyperPay widget and let customer pay
  /// (See WebView section below)
  Future<bool> openPaymentWidget(String redirectUrl) async {
    // Launch in WebView
    // Customer enters card details in the widget (NOT sent to your app)
    // Widget handles payment processing
    return await launchPaymentWidget(redirectUrl);
  }

  /// Step 3: Check payment status and save card if needed
  Future<PaymentStatusResponse> checkPaymentStatus({
    required String checkoutId,
    required bool saveCard,
    String? cardBrand,
  }) async {
    try {
      final response = await dio.post(
        '$apiBaseUrl/payments/status',
        data: {
          'checkout_id': checkoutId,
          'save_card': saveCard,
          if (cardBrand != null) 'card_brand': cardBrand,
        },
        options: Options(
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
        ),
      );

      if (response.statusCode == 200) {
        final data = response.data['data'];
        return PaymentStatusResponse(
          paymentId: data['payment_id'],
          status: data['status'], // 'paid' or 'failed'
          amount: data['amount'],
          currency: data['currency'],
          transactionId: data['transaction_id'],
        );
      }
      throw Exception('Failed to check payment status');
    } catch (e) {
      throw PaymentException('Status check failed: $e');
    }
  }

  /// Get user's saved payment methods
  Future<List<SavedCard>> getSavedCards() async {
    try {
      final response = await dio.get(
        '$apiBaseUrl/payments/saved-cards',
        options: Options(
          headers: {
            'Authorization': 'Bearer ${getAccessToken()}',
          },
        ),
      );

      if (response.statusCode == 200) {
        final cards = (response.data['data']['saved_cards'] as List)
            .map((c) => SavedCard.fromJson(c))
            .toList();
        return cards;
      }
      throw Exception('Failed to fetch saved cards');
    } catch (e) {
      throw PaymentException('Fetch saved cards failed: $e');
    }
  }

  /// Set a saved card as default
  Future<void> setDefaultCard(int cardId) async {
    try {
      await dio.post(
        '$apiBaseUrl/payments/saved-cards/$cardId/default',
        options: Options(
          headers: {
            'Authorization': 'Bearer ${getAccessToken()}',
          },
        ),
      );
    } catch (e) {
      throw PaymentException('Set default card failed: $e');
    }
  }

  /// Delete a saved card
  Future<void> deleteSavedCard(int cardId) async {
    try {
      await dio.delete(
        '$apiBaseUrl/payments/saved-cards/$cardId',
        options: Options(
          headers: {
            'Authorization': 'Bearer ${getAccessToken()}',
          },
        ),
      );
    } catch (e) {
      throw PaymentException('Delete card failed: $e');
    }
  }

  /// Helper method to get your stored Sanctum token
  String getAccessToken() {
    // Get from SharedPreferences or your state management
    return prefs.getString('access_token') ?? '';
  }
}
```

---

### 3. **Create Response Models**

```dart
class CheckoutResponse {
  final String checkoutId;
  final int paymentId;
  final String redirectUrl;
  final double amount;
  final String currency;

  CheckoutResponse({
    required this.checkoutId,
    required this.paymentId,
    required this.redirectUrl,
    required this.amount,
    required this.currency,
  });
}

class PaymentStatusResponse {
  final int paymentId;
  final String status; // 'paid' or 'failed'
  final double amount;
  final String currency;
  final String transactionId;

  PaymentStatusResponse({
    required this.paymentId,
    required this.status,
    required this.amount,
    required this.currency,
    required this.transactionId,
  });

  bool get isPaid => status == 'paid';
}

class SavedCard {
  final int id;
  final String cardDisplay;
  final String cardBrand;
  final String last4;
  final String expiry;
  final bool isExpired;
  final bool isDefault;
  final String nickname;

  SavedCard({
    required this.id,
    required this.cardDisplay,
    required this.cardBrand,
    required this.last4,
    required this.expiry,
    required this.isExpired,
    required this.isDefault,
    required this.nickname,
  });

  factory SavedCard.fromJson(Map<String, dynamic> json) => SavedCard(
    id: json['id'],
    cardDisplay: json['card_display'],
    cardBrand: json['card_brand'],
    last4: json['last4'],
    expiry: json['expiry'],
    isExpired: json['is_expired'],
    isDefault: json['is_default'],
    nickname: json['nickname'],
  );
}

class PaymentException implements Exception {
  final String message;
  PaymentException(this.message);

  @override
  String toString() => message;
}
```

---

### 4. **WebView Integration for HyperPay Widget**

You need a WebView to open the HyperPay payment widget. The customer enters their card details **in this secure widget**, NOT in your app.

**Add dependency to `pubspec.yaml`**:
```yaml
dependencies:
  webview_flutter: ^4.0.0
```

**Implementation**:
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

  @override
  void initState() {
    super.initState();
    developer.log('Opening payment widget with URL: ${widget.redirectUrl}');
    developer.log('Checkout ID: ${widget.checkoutId}');
    _initializeWebView();
  }

  void _initializeWebView() {
    _webViewController = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setNavigationDelegate(
        NavigationDelegate(
          onPageStarted: (String url) {
            developer.log('Page started: $url');
            setState(() => isLoading = true);
            
            // Check if payment is complete (HyperPay redirects back)
            if (url.contains('success') || url.contains('payment-success')) {
              developer.log('Payment successful detected');
              Navigator.pop(context);
              widget.onPaymentComplete('success');
            }
            
            if (url.contains('failed') || url.contains('payment-failed')) {
              developer.log('Payment failed detected');
              Navigator.pop(context);
              widget.onPaymentFailed('payment_failed');
            }
          },
          onPageFinished: (String url) {
            developer.log('Page finished loading: $url');
            setState(() => isLoading = false);
          },
          onWebResourceError: (WebResourceError error) {
            developer.log(
              'WebView Error: ${error.description}',
              error: error,
              stackTrace: StackTrace.current,
            );
            
            setState(() {
              errorMessage = error.description;
              isLoading = false;
            });

            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text('Payment page error: ${error.description}'),
                backgroundColor: Colors.red,
              ),
            );
          },
          onNavigationRequest: (NavigationRequest request) {
            developer.log('Navigation request: ${request.url}');
            return NavigationDecision.navigate;
          },
        ),
      )
      ..loadRequest(Uri.parse(widget.redirectUrl));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Complete Payment'),
        leading: IconButton(
          icon: const Icon(Icons.close),
          onPressed: () {
            developer.log('User cancelled payment');
            Navigator.pop(context);
            widget.onPaymentFailed('user_cancelled');
          },
        ),
      ),
      body: Stack(
        children: [
          if (errorMessage != null)
            Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.error, size: 48, color: Colors.red),
                  const SizedBox(height: 16),
                  Padding(
                    padding: const EdgeInsets.all(16),
                    child: Text(
                      'Payment Page Error:\n\n$errorMessage',
                      textAlign: TextAlign.center,
                      style: const TextStyle(fontSize: 16),
                    ),
                  ),
                  const SizedBox(height: 16),
                  ElevatedButton(
                    onPressed: () {
                      Navigator.pop(context);
                      widget.onPaymentFailed('error');
                    },
                    child: const Text('Close'),
                  ),
                ],
              ),
            )
          else
            WebViewWidget(controller: _webViewController),
          if (isLoading && errorMessage == null)
            const Center(
              child: CircularProgressIndicator(),
            ),
        ],
      ),
    );
  }
}
```

---

### 5. **Complete Payment Flow in Your Screen**

```dart
class PaymentScreen extends StatefulWidget {
  final double amount;
  final String bookingId;

  const PaymentScreen({
    required this.amount,
    required this.bookingId,
  });

  @override
  State<PaymentScreen> createState() => _PaymentScreenState();
}

class _PaymentScreenState extends State<PaymentScreen> {
  final paymentService = PaymentService(
    dio: Dio(),
    apiBaseUrl: 'http://localhost:8000/api', // Update with your backend URL
  );

  int? selectedCardId;
  List<SavedCard> savedCards = [];
  bool isLoading = false;

  @override
  void initState() {
    super.initState();
    _loadSavedCards();
  }

  void _loadSavedCards() async {
    try {
      final cards = await paymentService.getSavedCards();
      setState(() => savedCards = cards);
    } catch (e) {
      _showError('Failed to load saved cards: $e');
    }
  }

  void _proceedToPayment() async {
    setState(() => isLoading = true);

    try {
      // Step 1: Create checkout session
      final checkoutRequest = PaymentRequest(
        amount: widget.amount,
        currency: 'SAR',
        paymentBrand: 'VISA', // OPTIONAL: User can select
        savedCardId: selectedCardId, // If using saved card
      );

      final checkout = await paymentService.createCheckout(checkoutRequest);

      // IMPORTANT: Validate the redirect URL before opening
      if (checkout.redirectUrl.isEmpty || !checkout.redirectUrl.startsWith('https://')) {
        _showError('Invalid payment URL received from server');
        return;
      }

      print('DEBUG: Checkout ID = ${checkout.checkoutId}');
      print('DEBUG: Redirect URL = ${checkout.redirectUrl}');

      // Step 2: Open HyperPay widget
      if (!mounted) return;
      final result = await Navigator.push(
        context,
        MaterialPageRoute(
          builder: (context) => PaymentWebView(
            redirectUrl: checkout.redirectUrl,
            checkoutId: checkout.checkoutId,
            onPaymentComplete: (status) async {
              // Step 3: Check payment status
              try {
                final paymentStatus = await paymentService.checkPaymentStatus(
                  checkoutId: checkout.checkoutId,
                  saveCard: true, // Ask user if they want to save
                  cardBrand: 'VISA',
                );

                if (paymentStatus.isPaid) {
                  _showSuccess('Payment successful!');
                  // Update booking as paid
                } else {
                  _showError('Payment failed. Please try again.');
                }
              } catch (e) {
                _showError('Error checking payment: $e');
              }
            },
            onPaymentFailed: (error) {
              _showError('Payment failed: $error');
            },
          ),
        ),
      );
    } catch (e) {
      _showError('Payment error: $e');
    } finally {
      setState(() => isLoading = false);
    }
  }

  void _showError(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(message), backgroundColor: Colors.red),
    );
  }

  void _showSuccess(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(message), backgroundColor: Colors.green),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Payment')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            // Display amount
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  children: [
                    const Text('Amount Due'),
                    Text(
                      '${widget.amount} SAR',
                      style: Theme.of(context).textTheme.headlineSmall,
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 24),

            // Saved cards section
            if (savedCards.isNotEmpty) ...[
              const Text('Use Saved Card'),
              ...savedCards.map((card) => RadioListTile(
                title: Text(card.cardDisplay),
                subtitle: Text('Expires: ${card.expiry}'),
                value: card.id,
                groupValue: selectedCardId,
                onChanged: (value) {
                  setState(() => selectedCardId = value);
                },
                enabled: !card.isExpired,
              )),
              const Divider(),
            ],

            // Or use new card
            RadioListTile(
              title: const Text('Use New Card'),
              value: null,
              groupValue: selectedCardId,
              onChanged: (value) {
                setState(() => selectedCardId = null);
              },
            ),

            const SizedBox(height: 24),

            // Pay button
            ElevatedButton(
              onPressed: isLoading ? null : _proceedToPayment,
              style: ElevatedButton.styleFrom(
                minimumSize: const Size.fromHeight(50),
              ),
              child: isLoading
                  ? const SizedBox(
                      height: 20,
                      width: 20,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : const Text('Proceed to Payment'),
            ),
          ],
        ),
      ),
    );
  }
}
```

---

## 🔒 Important Security Notes

### ✅ **DO:**
- Allow users to select payment brand (VISA, MASTERCARD, MADA)
- Store and display saved cards (card_display, expiry, etc.)
- Show user-friendly error messages
- Use HTTPS for all API calls
- Store Sanctum token securely in encrypted SharedPreferences

### ❌ **DON'T:**
- Never ask user for card number in your app
- Never store card CVV anywhere
- Never store full card details locally
- Never send card details to your backend
- Never hardcode API URLs
- Never expose your Sanctum token in logs

---

## 📊 Payment Flow Diagram

```
Flutter App
    ↓
[User selects payment]
    ↓
POST /payments/checkout
    ↓ (returns checkout_id + redirect_url)
    ↓
[Open WebView with redirect_url]
    ↓
HyperPay Copy & Pay Widget (Secure, PCI-certified)
    ↓
[Customer enters card details in widget]
    ↓
HyperPay processes payment
    ↓
[WebView redirects back to app]
    ↓
POST /payments/status
    ↓ (returns payment status + registrationId if card saved)
    ↓
[Payment complete or failed]
```

---

## 🧪 Testing

### Test Cards for HyperPay UAT:
```
Card Number: 4111 1111 1111 1111
Expiry: 12/25
CVV: 123
Status: Success

Card Number: 5555 5555 5555 5555
Expiry: 12/25
CVV: 123
Status: Success
```

### Test Payment:
1. Open your booking page
2. Click "Pay Now"
3. Select card type (VISA, etc.)
4. Click "Proceed to Payment"
5. Enter test card details in HyperPay widget
6. Confirm payment
7. Check backend logs: `tail -f storage/logs/laravel.log`

---

## 🐛 Troubleshooting

### "Checkout creation failed"
- Check your access_token is valid
- Verify backend is running
- Check network connection
- Look at backend logs for details

### "WebView not opening"
- Make sure webview_flutter is installed
- Check if URL is valid (should start with https://eu-test.oppwa.com)
- Verify device has internet connection

### "Payment status shows 'failed'"
- Check HyperPay test card number
- Verify amount is correct
- Check currency is 'SAR'
- Try a different card

### "Saved card is expired"
- Delete expired card from UI
- App will show `is_expired: true` for expired cards
- User must use a new card

---

## 📝 API Response Examples

### Checkout Success
```json
{
  "success": true,
  "code": "SUCCESS",
  "message": "Checkout session created successfully",
  "status": 200,
  "data": {
    "checkout_id": "E3B7928B21BCAB95835989181D86AEF5.uat01-vm-tx04",
    "payment_id": 58,
    "redirect_url": "https://eu-test.oppwa.com/v1/checkouts/E3B7928B21BCAB95835989181D86AEF5.uat01-vm-tx04/payment.html",
    "amount": 100.00,
    "currency": "SAR"
  }
}
```

### Payment Status - Success
```json
{
  "success": true,
  "code": "SUCCESS",
  "message": "Payment successful",
  "status": 200,
  "data": {
    "payment_id": 58,
    "status": "paid",
    "amount": 100.00,
    "currency": "SAR",
    "transaction_id": "E3B7928B21BCAB95835989181D86AEF5.uat01-vm-tx04"
  }
}
```

### Saved Cards List
```json
{
  "success": true,
  "code": "SUCCESS",
  "message": "Saved cards retrieved successfully",
  "status": 200,
  "data": {
    "saved_cards": [
      {
        "id": 5,
        "card_display": "Visa ending in 4242",
        "card_brand": "VISA",
        "last4": "4242",
        "expiry": "03/2025",
        "is_expired": false,
        "is_default": true,
        "nickname": "My Visa",
        "created_at": "2024-01-10T10:30:00Z"
      }
    ],
    "count": 1
  }
}
```

---

## ✨ Summary of Changes

| Component | Old | New |
|-----------|-----|-----|
| Card Input | In Flutter app | In HyperPay widget |
| Payment Processing | Backend | HyperPay (secure) |
| Card Storage | Full card details | Only registrationId (token) |
| PCI Compliance | Required for backend | Not required (HyperPay handles it) |
| Request Model | Includes card fields | Only amount, currency, brand |
| Security | ⚠️ High risk | ✅ PCI-DSS compliant |

---

**Ready to update your Flutter app?** Follow the sections above and your app will be fully compatible with the new PCI-compliant payment system! 🚀
