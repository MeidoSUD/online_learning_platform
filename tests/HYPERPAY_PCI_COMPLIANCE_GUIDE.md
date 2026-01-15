# HyperPay Copy & Pay - PCI-DSS Compliance Guide

## Overview

This document explains the refactored HyperPay integration that is **fully PCI-DSS compliant** without requiring PCI certification.

### Why This Matters

- **Before**: Backend received card details (PCI-DSS liability) ❌
- **After**: HyperPay widget handles cards (HyperPay's PCI liability) ✅
- **Result**: No backend PCI compliance needed

---

## Architecture: What Changed

### ❌ Removed Features (Server-Side Card Processing)

```php
// OLD WAY - NEVER DO THIS
$payload = [
    'card.number' => $request->input('card.number'),     // ❌ Card number
    'card.cvv' => $request->input('card.cvv'),           // ❌ CVV
    'card.expiryMonth' => $request->input('..'),         // ❌ Expiry
    'card.expiryYear' => $request->input('..'),          // ❌ Cardholder
    'card.holder' => $request->input('..'),              // ❌ Never touch card data
];

// This endpoint is GONE
$response = $this->hyperpay->directPayment($payload);
```

### ✅ New Features (Hosted Payment Widget)

```php
// NEW WAY - Card details handled by HyperPay widget
$payload = [
    'amount' => 100.00,                    // ✅ Only amounts
    'currency' => 'SAR',                   // ✅ Business data
    'merchantTransactionId' => 'txn_123',  // ✅ Order references
    // Card details entered ONLY in the HyperPay widget
];

$response = $this->hyperpay->createCheckout($payload);
```

---

## Payment Flow: Copy & Pay Widget

```
┌─────────────────────────────────────────────────────────────────┐
│ Flutter App                                                     │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
         POST /api/payments/checkout
         Request: {amount, currency, merchant_id}
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ Laravel Backend                                                 │
│ - createCheckout() method                                        │
│ - Creates session (NO card data)                                 │
│ - Returns: {checkout_id, redirect_url}                           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ HyperPay Copy & Pay Widget                                       │
│ ✅ PCI-DSS Certified by HyperPay                                 │
│                                                                  │
│ Customer enters card details HERE:                              │
│ - Card number                                                   │
│ - CVV                                                           │
│ - Expiry date                                                   │
│ - Cardholder name                                               │
│                                                                 │
│ Widget processes payment:                                       │
│ - 3D Secure authentication (if required)                        │
│ - Card validation                                               │
│ - Payment authorization                                        │
│                                                                 │
│ Returns: registrationId (token) if customer saved card         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
         POST /api/payments/status
         Request: {checkout_id, save_card}
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ Laravel Backend                                                 │
│ - paymentStatus() method                                         │
│ - Polls HyperPay for result                                      │
│ - If successful + save_card: saves registrationId              │
│ - Returns: {payment_id, status, amount}                         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
         Flutter App receives payment confirmation
         ✅ Payment complete
```

---

## Database Schema

### saved_cards Table

```sql
CREATE TABLE saved_cards (
    id BIGINT PRIMARY KEY,
    user_id BIGINT NOT NULL,              -- Foreign key to users
    registration_id VARCHAR(255) UNIQUE,  -- HyperPay token (only sensitive field)
    
    -- Display information only (never sensitive)
    card_brand VARCHAR(50),               -- VISA, MASTERCARD, MADA
    last4 VARCHAR(4),                     -- Last 4 digits for display
    expiry_month VARCHAR(2),              -- "03"
    expiry_year VARCHAR(4),               -- "2025"
    
    -- Metadata
    nickname VARCHAR(255) NULLABLE,       -- User-friendly name
    is_default BOOLEAN DEFAULT FALSE,     -- Default payment method
    
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    deleted_at TIMESTAMP NULLABLE         -- Soft deletes
);

-- Indexes
CREATE INDEX idx_user_id ON saved_cards(user_id);
CREATE INDEX idx_is_default ON saved_cards(is_default);
```

### Payment Record (Enhanced)

```sql
-- Existing payments table gets:
ALTER TABLE payments ADD COLUMN payment_method VARCHAR(50); -- 'HYPERPAY_COPYPAY'
-- payment_method no longer contains card brand - it's 'HYPERPAY_COPYPAY'
```

---

## API Endpoints

### 1. Create Checkout Session

**Endpoint**: `POST /api/payments/checkout`

**Authentication**: Required (Bearer token)

**Request**:
```json
{
  "amount": 100.00,
  "currency": "SAR",
  "payment_brand": "VISA",                    // Optional: VISA, MASTER, MADA
  "saved_card_id": 5,                         // Optional: use saved card
  "merchant_transaction_id": "order_12345"    // Optional: your order ID
}
```

**Response** (Success - 200):
```json
{
  "success": true,
  "code": "SUCCESS",
  "message": "Checkout session created successfully",
  "data": {
    "checkout_id": "8a8294174e6c1d4d014e6d1d7d1d0001",
    "payment_id": 42,
    "redirect_url": "https://eu-test.oppwa.com/v1/checkouts/8a8294174e6c1d4d014e6d1d7d1d0001/payment.html",
    "amount": 100.00,
    "currency": "SAR"
  }
}
```

**In Flutter**:
```dart
// Step 1: Create checkout
final dio = Dio();
final response = await dio.post(
  'https://portal.ewan-geniuses.com/api/payments/checkout',
  data: {
    'amount': 100.0,
    'currency': 'SAR',
    'merchant_transaction_id': 'order_${DateTime.now().millisecondsSinceEpoch}',
  },
  options: Options(
    headers: {'Authorization': 'Bearer $accessToken'},
  ),
);

final checkoutId = response.data['data']['checkout_id'];
final redirectUrl = response.data['data']['redirect_url'];

// Step 2: Load HyperPay widget
// Use webview or native plugin to load redirectUrl
// Customer enters card details in the widget
```

---

### 2. Check Payment Status

**Endpoint**: `POST /api/payments/status`

**Authentication**: Not required (can be called from frontend after redirect)

**Request**:
```json
{
  "checkout_id": "8a8294174e6c1d4d014e6d1d7d1d0001",
  "save_card": true,
  "card_brand": "VISA"
}
```

**Response** (Success - 200):
```json
{
  "success": true,
  "code": "SUCCESS",
  "message": "Payment successful",
  "data": {
    "payment_id": 42,
    "status": "paid",
    "amount": 100.00,
    "currency": "SAR",
    "transaction_id": "8a8294174e6c1d4d014e6d1d7d1d0001"
  }
}
```

**Response** (Failure - 409):
```json
{
  "success": false,
  "code": "CONFLICT",
  "message": "Payment failed: Invalid card data",
  "data": {
    "payment_id": 42,
    "error_code": "100.100.101"
  }
}
```

**In Flutter**:
```dart
// Step 3: After widget completes, check status
final statusResponse = await dio.post(
  'https://portal.ewan-geniuses.com/api/payments/status',
  data: {
    'checkout_id': checkoutId,
    'save_card': true,      // If customer wants to save card
    'card_brand': 'VISA',
  },
);

if (statusResponse.data['success']) {
  print('✅ Payment successful!');
  // Proceed with order
} else {
  print('❌ Payment failed: ${statusResponse.data['message']}');
}
```

---

### 3. List Saved Cards

**Endpoint**: `GET /api/payments/saved-cards`

**Authentication**: Required

**Response** (200):
```json
{
  "success": true,
  "code": "SUCCESS",
  "message": "Saved cards retrieved successfully",
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
      },
      {
        "id": 6,
        "card_display": "Mastercard ending in 5555",
        "card_brand": "MASTERCARD",
        "last4": "5555",
        "expiry": "12/2025",
        "is_expired": false,
        "is_default": false,
        "nickname": "Work Card",
        "created_at": "2024-01-08T14:20:00Z"
      }
    ],
    "count": 2
  }
}
```

**In Flutter**:
```dart
// Get all saved cards
final response = await dio.get(
  'https://portal.ewan-geniuses.com/api/payments/saved-cards',
  options: Options(
    headers: {'Authorization': 'Bearer $accessToken'},
  ),
);

final savedCards = response.data['data']['saved_cards'] as List;

// Display in dropdown
for (var card in savedCards) {
  print('${card['card_display']} - Expires ${card['expiry']}');
}
```

---

### 4. Set Default Card

**Endpoint**: `POST /api/payments/saved-cards/{id}/default`

**Authentication**: Required

**Response** (200):
```json
{
  "success": true,
  "code": "SUCCESS",
  "message": "Default payment method updated",
  "data": {
    "id": 5,
    "is_default": true
  }
}
```

---

### 5. Delete Saved Card

**Endpoint**: `DELETE /api/payments/saved-cards/{id}`

**Authentication**: Required

**Response** (200):
```json
{
  "success": true,
  "code": "SUCCESS",
  "message": "Saved card \"Visa ending in 4242\" has been removed",
  "data": {}
}
```

**In Flutter**:
```dart
// Delete a saved card
await dio.delete(
  'https://portal.ewan-geniuses.com/api/payments/saved-cards/5',
  options: Options(
    headers: {'Authorization': 'Bearer $accessToken'},
  ),
);
```

---

## Complete Flutter Implementation

### Step 1: Install Dependencies

```yaml
dependencies:
  dio: ^5.3.0
  webview_flutter: ^4.2.0
  flutter_secure_storage: ^9.0.0
```

### Step 2: Create Payment Service

```dart
import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class HyperPayService {
  final Dio dio;
  final secureStorage = const FlutterSecureStorage();
  final String baseUrl = 'https://portal.ewan-geniuses.com/api';

  HyperPayService({required this.dio});

  /// Create a checkout session for Copy & Pay widget
  Future<String> createCheckout({
    required double amount,
    required String currency,
    int? savedCardId,
    String? merchantTransactionId,
  }) async {
    try {
      final token = await secureStorage.read(key: 'access_token');
      
      final response = await dio.post(
        '$baseUrl/payments/checkout',
        data: {
          'amount': amount,
          'currency': currency,
          if (savedCardId != null) 'saved_card_id': savedCardId,
          if (merchantTransactionId != null) 'merchant_transaction_id': merchantTransactionId,
        },
        options: Options(
          headers: {'Authorization': 'Bearer $token'},
        ),
      );

      if (response.statusCode == 200) {
        return response.data['data']['checkout_id'];
      }
      throw Exception('Failed to create checkout: ${response.statusMessage}');
    } on DioException catch (e) {
      throw Exception('Network error: ${e.message}');
    }
  }

  /// Check payment status after widget completes
  Future<Map<String, dynamic>> checkPaymentStatus({
    required String checkoutId,
    bool saveCard = false,
    String? cardBrand,
  }) async {
    try {
      final response = await dio.post(
        '$baseUrl/payments/status',
        data: {
          'checkout_id': checkoutId,
          'save_card': saveCard,
          if (cardBrand != null) 'card_brand': cardBrand,
        },
      );

      return {
        'success': response.data['success'],
        'message': response.data['message'],
        'data': response.data['data'],
      };
    } on DioException catch (e) {
      throw Exception('Payment status check failed: ${e.message}');
    }
  }

  /// Get user's saved cards
  Future<List<Map<String, dynamic>>> getSavedCards() async {
    try {
      final token = await secureStorage.read(key: 'access_token');
      
      final response = await dio.get(
        '$baseUrl/payments/saved-cards',
        options: Options(
          headers: {'Authorization': 'Bearer $token'},
        ),
      );

      final savedCards = response.data['data']['saved_cards'] as List;
      return List<Map<String, dynamic>>.from(
        savedCards.map((card) => Map<String, dynamic>.from(card as Map)),
      );
    } on DioException catch (e) {
      throw Exception('Failed to get saved cards: ${e.message}');
    }
  }

  /// Delete a saved card
  Future<void> deleteSavedCard(int cardId) async {
    try {
      final token = await secureStorage.read(key: 'access_token');
      
      await dio.delete(
        '$baseUrl/payments/saved-cards/$cardId',
        options: Options(
          headers: {'Authorization': 'Bearer $token'},
        ),
      );
    } on DioException catch (e) {
      throw Exception('Failed to delete card: ${e.message}');
    }
  }
}
```

### Step 3: Create Payment Widget

```dart
import 'package:flutter/material.dart';
import 'package:webview_flutter/webview_flutter.dart';

class PaymentPage extends StatefulWidget {
  final double amount;
  final String currency;
  final Function(Map<String, dynamic>) onPaymentComplete;

  const PaymentPage({
    required this.amount,
    required this.currency,
    required this.onPaymentComplete,
  });

  @override
  State<PaymentPage> createState() => _PaymentPageState();
}

class _PaymentPageState extends State<PaymentPage> {
  late WebViewController _webViewController;
  late HyperPayService _paymentService;
  String? _checkoutId;
  bool _isLoading = true;
  bool _saveCard = false;

  @override
  void initState() {
    super.initState();
    _paymentService = HyperPayService(dio: Dio());
    _initializePayment();
  }

  Future<void> _initializePayment() async {
    try {
      // Step 1: Create checkout session
      final checkoutId = await _paymentService.createCheckout(
        amount: widget.amount,
        currency: widget.currency,
        merchantTransactionId: 'order_${DateTime.now().millisecondsSinceEpoch}',
      );

      setState(() {
        _checkoutId = checkoutId;
      });

      // Load the HyperPay widget
      _loadHyperPayWidget(checkoutId);
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error: $e')),
      );
      Navigator.pop(context);
    }
  }

  void _loadHyperPayWidget(String checkoutId) {
    const String htmlContent = '''
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: Arial, sans-serif; margin: 0; }
        .container { padding: 20px; text-align: center; }
        .save-card-container { margin: 20px 0; }
        .button { padding: 10px 20px; margin: 10px; border: none; border-radius: 5px; cursor: pointer; }
        .pay-button { background: #007AFF; color: white; }
        .cancel-button { background: #ccc; }
      </style>
    </head>
    <body>
      <div class="container">
        <h2>Complete Payment</h2>
        
        <div id="payment"></div>
        
        <div class="save-card-container">
          <label>
            <input type="checkbox" id="saveCardCheckbox">
            Save this card for future payments
          </label>
        </div>
        
        <button class="button pay-button" onclick="submitForm()">
          Pay SAR $AMOUNT
        </button>
        <button class="button cancel-button" onclick="cancelPayment()">
          Cancel
        </button>
      </div>

      <script>
        function submitForm() {
          const saveCard = document.getElementById('saveCardCheckbox').checked;
          window.PaymentStatus = {
            checkoutId: '$CHECKOUT_ID',
            saveCard: saveCard,
          };
          window.location.href = 'flutterapp://payment-complete';
        }

        function cancelPayment() {
          window.location.href = 'flutterapp://payment-cancelled';
        }
      </script>

      <!-- HyperPay Copy & Pay Widget -->
      <script id="hyperPayScript" src="https://eu-test.oppwa.com/v1/js/checkout.js"></script>
      <script>
        const checkout = new Checkout({
          shopperResultUrl: window.location.href,
        });
        
        checkout.render('#payment');
      </script>
    </body>
    </html>
    ''';

    final htmlWithData = htmlContent
        .replaceAll('\$CHECKOUT_ID', checkoutId)
        .replaceAll('\$AMOUNT', widget.amount.toStringAsFixed(2));

    _webViewController = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setNavigationDelegate(
        NavigationDelegate(
          onPageStarted: (String url) {
            setState(() => _isLoading = true);
          },
          onPageFinished: (String url) {
            setState(() => _isLoading = false);
          },
          onNavigationRequest: (NavigationRequest request) {
            if (request.url.startsWith('flutterapp://payment-complete')) {
              _completePayment();
              return NavigationActionPolicy.prevent;
            }
            if (request.url.startsWith('flutterapp://payment-cancelled')) {
              Navigator.pop(context);
              return NavigationActionPolicy.prevent;
            }
            return NavigationActionPolicy.allow;
          },
        ),
      )
      ..loadHtmlString(htmlWithData);

    setState(() {});
  }

  Future<void> _completePayment() async {
    try {
      // Step 2: Check payment status
      final result = await _paymentService.checkPaymentStatus(
        checkoutId: _checkoutId!,
        saveCard: _saveCard,
        cardBrand: 'VISA',
      );

      if (result['success']) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('✅ Payment successful!')),
        );
        widget.onPaymentComplete(result['data']);
        Navigator.pop(context);
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('❌ ${result['message']}')),
        );
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error: $e')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Payment')),
      body: Stack(
        children: [
          if (_webViewController != null) WebViewWidget(controller: _webViewController),
          if (_isLoading)
            const Center(
              child: CircularProgressIndicator(),
            ),
        ],
      ),
    );
  }
}
```

### Step 4: Use Payment Widget

```dart
// In your booking/course purchase screen
ElevatedButton(
  onPressed: () {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => PaymentPage(
          amount: 500.0,
          currency: 'SAR',
          onPaymentComplete: (paymentData) {
            print('Payment confirmed: $paymentData');
            // Proceed with order
          },
        ),
      ),
    );
  },
  child: const Text('Proceed to Payment'),
)
```

---

## Security Checklist

### ✅ Backend Security

- [ ] `HyperpayService.php` uses only `createCheckout()` and `getPaymentStatus()`
- [ ] `PaymentController.php` never validates or stores card fields
- [ ] No card numbers in logs
- [ ] No card numbers in database
- [ ] `SavedCard` model only stores `registration_id` (token)
- [ ] All payment endpoints use proper authentication
- [ ] HTTPS enforced for all payment endpoints
- [ ] Firebase initialization configured correctly

### ✅ Frontend Security (Flutter)

- [ ] Never parse card details manually
- [ ] Always use HyperPay widget for card entry
- [ ] Store only `access_token` in secure storage
- [ ] Never log card details
- [ ] Use HTTPS for all API calls
- [ ] Validate SSL certificates

### ✅ Database Security

- [ ] `registration_id` field encrypted (Laravel's default encryption)
- [ ] No card numbers stored anywhere
- [ ] No CVV stored anywhere
- [ ] Soft deletes enabled for audit trail
- [ ] Access restricted to authenticated users

---

## Testing

### Local Testing with HyperPay Test Account

```
Test Card Numbers:
- VISA: 4111111111111111
- Mastercard: 5555555555554444
- MADA: 5061461412684449

Expiry: Any future month/year
CVV: Any 3 digits

Test Results:
- Amount: 0.01 → Success
- Amount: 100.00 → Decline
```

### API Testing with cURL

```bash
# 1. Create Checkout
curl -X POST https://portal.ewan-geniuses.com/api/payments/checkout \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 100.00,
    "currency": "SAR",
    "payment_brand": "VISA"
  }'

# 2. Check Payment Status
curl -X POST https://portal.ewan-geniuses.com/api/payments/status \
  -H "Content-Type: application/json" \
  -d '{
    "checkout_id": "8a8294174e6c1d4d...",
    "save_card": true
  }'

# 3. List Saved Cards
curl -X GET https://portal.ewan-geniuses.com/api/payments/saved-cards \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Migration Guide: From Old to New

### If You Have Existing Payments Using directPayment()

1. **Disable the old endpoint**:
   ```php
   // In routes/api.php
   // Route::post('payments/direct', [PaymentController::class, 'directPayment']); // Remove
   ```

2. **Redirect users to new endpoint**:
   ```php
   // Add migration guide in your app
   // "We've upgraded our payment system for better security"
   ```

3. **Existing saved cards**:
   - Old card data in `user_payment_methods` can be kept for reference
   - New cards go into `saved_cards` table
   - Gradually migrate users to new system

---

## Support & Troubleshooting

### Common Issues

**Issue**: "checkout_id not found"
- **Cause**: HyperPay API call failed
- **Fix**: Check `HYPERPAY_ACCESS_TOKEN` and `HYPERPAY_ENTITY_ID` in `.env`

**Issue**: "Registration ID not returned"
- **Cause**: Customer didn't select "Save card" in widget
- **Fix**: This is normal - saved card only created if customer opts-in

**Issue**: "Payment marked paid but no registrationId"
- **Cause**: Customer didn't save card
- **Fix**: Next payment, offer to save for future

---

## Next Steps

1. **Run migration**: `php artisan migrate`
2. **Test locally**: Use test card numbers above
3. **Update Flutter app**: Implement new payment flow
4. **Disable old endpoint**: Remove `directPayment()` usage
5. **Monitor logs**: Check for any errors

---

## References

- [HyperPay Copy & Pay Docs](https://hyper-pay.docs.apiary.io/)
- [PCI-DSS Compliance](https://www.pcisecuritystandards.org/)
- [Laravel Security](https://laravel.com/docs/security)
