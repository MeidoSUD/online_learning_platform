# HyperPay Payment API - Postman Testing Guide

## Quick Setup

### 1. Set Postman Environment Variables

Create a new environment in Postman with these variables:

```json
{
  "base_url": "https://portal.ewan-geniuses.com",
  "api_url": "{{base_url}}/api",
  "access_token": "your_access_token_here",
  "user_id": "your_user_id_here",
  "saved_card_id": "card_id_from_previous_response"
}
```

**Or locally**:
```json
{
  "base_url": "http://localhost:8000",
  "api_url": "{{base_url}}/api",
  "access_token": "your_access_token_here"
}
```

---

## ✅ Complete Testing Sequence

### Step 1: Create Checkout Session

**Endpoint**: `POST {{api_url}}/payments/checkout`

**Headers**:
```json
{
  "Content-Type": "application/json",
  "Accept": "application/json",
  "Authorization": "Bearer {{access_token}}"
}
```

**Request Body** (Scenario 1: New Card Payment):
```json
{
  "amount": 100.00,
  "currency": "SAR",
  "payment_brand": "VISA",
  "merchant_transaction_id": "order_12345"
}
```

**Request Body** (Scenario 2: Saved Card Payment):
```json
{
  "amount": 100.00,
  "currency": "SAR",
  "saved_card_id": 5,
  "merchant_transaction_id": "order_12346"
}
```

**Response** (Success - 200):
```json
{
  "success": true,
  "code": "SUCCESS",
  "message": "Checkout session created successfully",
  "status": 200,
  "data": {
    "checkout_id": "E3B7928B21BCAB95835989181D86AEF5.uat01-vm-tx04",
    "payment_id": 42,
    "redirect_url": "https://eu-test.oppwa.com/v1/checkouts/E3B7928B21BCAB95835989181D86AEF5.uat01-vm-tx04/payment.html",
    "amount": 100.00,
    "currency": "SAR"
  }
}
```

**Note**: The `redirect_url` is automatically constructed from the `checkout_id` returned by HyperPay in the format: `{base_url}/v1/checkouts/{checkout_id}/payment.html`

**Response** (Validation Error - 422):
```json
{
  "success": false,
  "code": "VALIDATION_ERROR",
  "message": "Validation failed",
  "errors": {
    "amount": [
      "The amount field is required."
    ],
    "currency": [
      "The currency field is required."
    ]
  },
  "status": 422
}
```

**Response** (Auth Error - 401):
```json
{
  "success": false,
  "code": "AUTHENTICATION_ERROR",
  "message": "Authentication failed",
  "status": 401
}
```

**Postman Pre-request Script** (Auto-generate transaction ID):
```javascript
// Generate unique transaction ID
const timestamp = new Date().getTime();
const randomId = Math.random().toString(36).substring(7);
pm.environment.set("transaction_id", `order_${timestamp}_${randomId}`);

// Save checkout_id from previous response (use in next request)
```

**Postman Tests** (Validate response):
```javascript
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

pm.test("Response has checkout_id", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData.data).to.have.property('checkout_id');
    // Save checkout_id for next request
    pm.environment.set("checkout_id", jsonData.data.checkout_id);
});

pm.test("Response structure is correct", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData).to.have.property('success').that.equals(true);
    pm.expect(jsonData).to.have.property('code').that.equals('SUCCESS');
    pm.expect(jsonData.data).to.have.all.keys(['checkout_id', 'payment_id', 'redirect_url', 'amount', 'currency']);
});
```

---

### Step 2: Load HyperPay Widget

In a real scenario, you would:
1. Open the `redirect_url` in a browser
2. Use HyperPay's Copy & Pay widget to process the payment
3. Customer enters card details (NEVER sent to your backend)
4. Widget processes payment
5. Redirects back to your app

**For Testing**: Skip to Step 3 with a simulated checkout_id

---

### Step 3: Check Payment Status

**Endpoint**: `POST {{api_url}}/payments/status`

**Headers**:
```json
{
  "Content-Type": "application/json",
  "Accept": "application/json"
}
```

**Request Body** (Scenario 1: Without Saving Card):
```json
{
  "checkout_id": "{{checkout_id}}",
  "save_card": false
}
```

**Request Body** (Scenario 2: Save Card for Future Use):
```json
{
  "checkout_id": "{{checkout_id}}",
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
  "status": 200,
  "data": {
    "payment_id": 42,
    "status": "paid",
    "amount": 100.00,
    "currency": "SAR",
    "transaction_id": "8a8294174e6c1d4d014e6d1d7d1d0001"
  }
}
```

**Response** (Payment Failed - 409):
```json
{
  "success": false,
  "code": "CONFLICT",
  "message": "Payment failed: Invalid card data",
  "status": 409,
  "data": {
    "payment_id": 42,
    "error_code": "100.100.101"
  }
}
```

**Response** (Server Error - 500):
```json
{
  "success": false,
  "code": "SERVER_ERROR",
  "message": "An error occurred. Please try again later.",
  "status": 500
}
```

**Postman Tests**:
```javascript
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

pm.test("Payment status is 'paid' or 'failed'", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData.data.status).to.be.oneOf(['paid', 'failed']);
});

pm.test("Response contains payment details", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData.data).to.have.all.keys(['payment_id', 'status', 'amount', 'currency', 'transaction_id']);
});
```

---

### Step 4: List Saved Cards

**Endpoint**: `GET {{api_url}}/payments/saved-cards`

**Headers**:
```json
{
  "Content-Type": "application/json",
  "Accept": "application/json",
  "Authorization": "Bearer {{access_token}}"
}
```

**Request Body**: (None - GET request)

**Response** (Success - 200):
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

**Response** (No Saved Cards - 200):
```json
{
  "success": true,
  "code": "SUCCESS",
  "message": "Saved cards retrieved successfully",
  "status": 200,
  "data": {
    "saved_cards": [],
    "count": 0
  }
}
```

**Response** (Unauthorized - 401):
```json
{
  "success": false,
  "code": "AUTHENTICATION_ERROR",
  "message": "Authentication failed",
  "status": 401
}
```

**Postman Tests**:
```javascript
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

pm.test("Response is array", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData.data.saved_cards).to.be.an('array');
});

pm.test("Each card has required fields", function () {
    var jsonData = pm.response.json();
    jsonData.data.saved_cards.forEach(function(card) {
        pm.expect(card).to.have.all.keys(['id', 'card_display', 'card_brand', 'last4', 'expiry', 'is_expired', 'is_default', 'nickname', 'created_at']);
    });
});

// Save first card ID for next test
if (jsonData.data.saved_cards.length > 0) {
    pm.environment.set("saved_card_id", jsonData.data.saved_cards[0].id);
}
```

---

### Step 5: Set Default Card

**Endpoint**: `POST {{api_url}}/payments/saved-cards/{{saved_card_id}}/default`

**Headers**:
```json
{
  "Content-Type": "application/json",
  "Accept": "application/json",
  "Authorization": "Bearer {{access_token}}"
}
```

**Request Body**: (None)

**Response** (Success - 200):
```json
{
  "success": true,
  "code": "SUCCESS",
  "message": "Default payment method updated",
  "status": 200,
  "data": {
    "id": 5,
    "is_default": true
  }
}
```

**Response** (Unauthorized - 403):
```json
{
  "success": false,
  "code": "AUTHORIZATION_ERROR",
  "message": "Unauthorized to modify this saved card",
  "status": 403
}
```

**Postman Tests**:
```javascript
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

pm.test("Card is now default", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData.data.is_default).to.equal(true);
});
```

---

### Step 6: Delete Saved Card

**Endpoint**: `DELETE {{api_url}}/payments/saved-cards/{{saved_card_id}}`

**Headers**:
```json
{
  "Content-Type": "application/json",
  "Accept": "application/json",
  "Authorization": "Bearer {{access_token}}"
}
```

**Request Body**: (None)

**Response** (Success - 200):
```json
{
  "success": true,
  "code": "SUCCESS",
  "message": "Saved card \"Visa ending in 4242\" has been removed",
  "status": 200,
  "data": {}
}
```

**Response** (Unauthorized - 403):
```json
{
  "success": false,
  "code": "AUTHORIZATION_ERROR",
  "message": "Unauthorized to delete this saved card",
  "status": 403
}
```

**Postman Tests**:
```javascript
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

pm.test("Success message contains card info", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData.message).to.include("removed");
});
```

---

## 📋 Complete Test Collection (JSON for Postman Import)

Save this as `HyperPay_API_Tests.postman_collection.json`:

```json
{
  "info": {
    "name": "HyperPay Payment API",
    "description": "PCI-DSS Compliant Payment Testing",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "1. Create Checkout (New Card)",
      "event": [
        {
          "listen": "prerequest",
          "script": {
            "exec": [
              "const timestamp = new Date().getTime();",
              "const randomId = Math.random().toString(36).substring(7);",
              "pm.environment.set('transaction_id', `order_${timestamp}_${randomId}`);"
            ]
          }
        },
        {
          "listen": "test",
          "script": {
            "exec": [
              "pm.test('Status code is 200', function () {",
              "    pm.response.to.have.status(200);",
              "});",
              "",
              "pm.test('Response has checkout_id', function () {",
              "    var jsonData = pm.response.json();",
              "    pm.expect(jsonData.data).to.have.property('checkout_id');",
              "    pm.environment.set('checkout_id', jsonData.data.checkout_id);",
              "});"
            ]
          }
        }
      ],
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          },
          {
            "key": "Authorization",
            "value": "Bearer {{access_token}}"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"amount\": 100.00,\n  \"currency\": \"SAR\",\n  \"payment_brand\": \"VISA\",\n  \"merchant_transaction_id\": \"{{transaction_id}}\"\n}"
        },
        "url": {
          "raw": "{{api_url}}/payments/checkout",
          "host": ["{{api_url}}"],
          "path": ["payments", "checkout"]
        }
      }
    },
    {
      "name": "2. Create Checkout (Saved Card)",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          },
          {
            "key": "Authorization",
            "value": "Bearer {{access_token}}"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"amount\": 50.00,\n  \"currency\": \"SAR\",\n  \"saved_card_id\": {{saved_card_id}}\n}"
        },
        "url": {
          "raw": "{{api_url}}/payments/checkout",
          "host": ["{{api_url}}"],
          "path": ["payments", "checkout"]
        }
      }
    },
    {
      "name": "3. Check Payment Status",
      "event": [
        {
          "listen": "test",
          "script": {
            "exec": [
              "pm.test('Status code is 200', function () {",
              "    pm.response.to.have.status(200);",
              "});",
              "",
              "pm.test('Payment status is paid or failed', function () {",
              "    var jsonData = pm.response.json();",
              "    pm.expect(jsonData.data.status).to.be.oneOf(['paid', 'failed']);",
              "});"
            ]
          }
        }
      ],
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"checkout_id\": \"{{checkout_id}}\",\n  \"save_card\": true,\n  \"card_brand\": \"VISA\"\n}"
        },
        "url": {
          "raw": "{{api_url}}/payments/status",
          "host": ["{{api_url}}"],
          "path": ["payments", "status"]
        }
      }
    },
    {
      "name": "4. List Saved Cards",
      "event": [
        {
          "listen": "test",
          "script": {
            "exec": [
              "pm.test('Status code is 200', function () {",
              "    pm.response.to.have.status(200);",
              "});",
              "",
              "pm.test('Response is array', function () {",
              "    var jsonData = pm.response.json();",
              "    pm.expect(jsonData.data.saved_cards).to.be.an('array');",
              "});",
              "",
              "if (pm.response.json().data.saved_cards.length > 0) {",
              "    pm.environment.set('saved_card_id', pm.response.json().data.saved_cards[0].id);",
              "}"
            ]
          }
        }
      ],
      "request": {
        "method": "GET",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{access_token}}"
          }
        ],
        "url": {
          "raw": "{{api_url}}/payments/saved-cards",
          "host": ["{{api_url}}"],
          "path": ["payments", "saved-cards"]
        }
      }
    },
    {
      "name": "5. Set Default Card",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{access_token}}"
          }
        ],
        "url": {
          "raw": "{{api_url}}/payments/saved-cards/{{saved_card_id}}/default",
          "host": ["{{api_url}}"],
          "path": ["payments", "saved-cards", "{{saved_card_id}}", "default"]
        }
      }
    },
    {
      "name": "6. Delete Saved Card",
      "request": {
        "method": "DELETE",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{access_token}}"
          }
        ],
        "url": {
          "raw": "{{api_url}}/payments/saved-cards/{{saved_card_id}}",
          "host": ["{{api_url}}"],
          "path": ["payments", "saved-cards", "{{saved_card_id}}"]
        }
      }
    }
  ],
  "variable": [
    {
      "key": "base_url",
      "value": "http://localhost:8000"
    },
    {
      "key": "api_url",
      "value": "{{base_url}}/api"
    },
    {
      "key": "access_token",
      "value": ""
    },
    {
      "key": "checkout_id",
      "value": ""
    },
    {
      "key": "saved_card_id",
      "value": ""
    }
  ]
}
```

---

## 🧪 Error Scenarios to Test

### Test Invalid Token
```json
{
  "Authorization": "Bearer invalid_token_12345"
}
```
**Expected Response**: 401 AUTHENTICATION_ERROR

### Test Missing Amount
```json
{
  "currency": "SAR",
  "payment_brand": "VISA"
}
```
**Expected Response**: 422 VALIDATION_ERROR with field errors

### Test Invalid Currency
```json
{
  "amount": 100,
  "currency": "XYZ",
  "payment_brand": "VISA"
}
```
**Expected Response**: 422 VALIDATION_ERROR

### Test Expired Saved Card
```json
{
  "amount": 100.00,
  "currency": "SAR",
  "saved_card_id": 999  // expired card
}
```
**Expected Response**: 409 CONFLICT - "Saved card has expired"

### Test Non-existent Card
```json
{
  "amount": 100.00,
  "currency": "SAR",
  "saved_card_id": 99999
}
```
**Expected Response**: 404 NOT_FOUND

---

## 🔑 Getting Your Access Token

### Option 1: Login First

```
POST {{api_url}}/auth/login

{
  "email": "student@example.com",
  "password": "password123"
}
```

Response:
```json
{
  "success": true,
  "data": {
    "access_token": "1|abcd1234efgh5678..."
  }
}
```

Copy the `access_token` and set it in your Postman environment.

### Option 2: Use Existing Token
If you have a valid Sanctum token from Flutter app, paste it directly.

---

## ✅ Complete Test Workflow

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. GET /auth/login or use existing token                        │
│    → Save access_token to environment                           │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 2. POST /payments/checkout                                      │
│    Request: {amount, currency, payment_brand}                   │
│    Response: {checkout_id, redirect_url}                        │
│    → Save checkout_id to environment                            │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 3. (In real app: Open widget, customer pays)                    │
│    For testing: Skip to next step                               │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 4. POST /payments/status                                        │
│    Request: {checkout_id, save_card}                            │
│    Response: {payment_id, status, amount}                       │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 5. GET /payments/saved-cards                                    │
│    Response: [saved_cards array]                                │
│    → Save saved_card_id from response                           │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 6. POST /payments/saved-cards/{id}/default (Optional)           │
│    → Set a card as default                                      │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 7. DELETE /payments/saved-cards/{id} (Optional)                 │
│    → Delete a saved card                                        │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📸 Screenshots (Text Guide)

### Postman Setup

1. **Create Environment**
   - Click: Environments → + (Create New)
   - Name: "HyperPay Testing"
   - Add variables above

2. **Import Collection**
   - Click: Collections → Import
   - Paste the JSON from above
   - Select your environment

3. **Run Tests**
   - Open each request
   - Click: Send
   - Check Response tab for data

---

## 💡 Tips

- **Auto-populate fields**: Tests scripts save data for next request
- **Validate responses**: Each request has built-in tests
- **Check timestamps**: `created_at` shows when card was saved
- **Monitor headers**: Response headers show status codes

---

## 🚨 Debugging

If a request fails:

1. **Check token**: Is `access_token` valid and not expired?
2. **Check URL**: Is base_url correct? (localhost:8000 vs production)
3. **Check logs**: `storage/logs/laravel.log` shows backend errors
4. **Check DB**: Verify saved_cards table exists (`php artisan migrate`)
5. **Check network**: Is backend running? (`php artisan serve`)

---

**Ready to test!** 🚀 Follow the workflow above step by step.
