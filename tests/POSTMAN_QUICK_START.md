# 🚀 Quick Start - HyperPay Payment API Testing in Postman

## 📥 Import Collection (2 minutes)

### Step 1: Download Collection File
The file `HyperPay_API_Tests.postman_collection.json` is in your project root.

### Step 2: Import into Postman
1. Open **Postman**
2. Click: **File** → **Import**
3. Select the collection file
4. Click: **Import**

✅ Done! You should now see the collection with 6 requests.

---

## ⚙️ Setup Environment (2 minutes)

### Step 1: Set Base URL
1. Click the **Environment** dropdown (top right, near the eye icon)
2. Select the environment from the collection
3. Click on `base_url` variable
4. Change value to your server:
   - **Local**: `http://localhost:8000`
   - **Production**: `https://portal.ewan-geniuses.com`

### Step 2: Get Access Token
1. Click: **Auth** → **Login (Get Token)**
2. Change email/password to your test user
3. Click: **Send**
4. The token is automatically saved ✅

---

## 🧪 Test Sequence (5 minutes)

Follow these steps in order:

### 1️⃣ **Create Checkout (New Card)**
- Click: **Payment Checkout** → **1️⃣ Create Checkout (New Card)**
- Click: **Send**
- ✅ You should see `checkout_id` in response
- The `checkout_id` is automatically saved

### 2️⃣ **Check Payment Status**
- Click: **Payment Status** → **3️⃣ Check Payment Status (Success)**
- Click: **Send**
- ✅ You should see `status: "paid"` (or "failed")

### 3️⃣ **List Saved Cards**
- Click: **Saved Cards** → **4️⃣ List All Saved Cards**
- Click: **Send**
- ✅ You should see array of saved cards (or empty array)

### 4️⃣ **Set Default Card**
- (Only if you have saved cards from step 3)
- Click: **Saved Cards** → **5️⃣ Set Default Card**
- Click: **Send**
- ✅ You should see `is_default: true`

### 5️⃣ **Delete Saved Card**
- (Only if you have saved cards)
- Click: **Saved Cards** → **6️⃣ Delete Saved Card**
- Click: **Send**
- ✅ You should see success message

---

## 📊 Expected Responses

### Success: Create Checkout (200)
```json
{
  "success": true,
  "code": "SUCCESS",
  "message": "Checkout session created successfully",
  "status": 200,
  "data": {
    "checkout_id": "8a8294174e6c1d4d014e6d1d7d1d0001",
    "payment_id": 42,
    "redirect_url": "https://eu-test.oppwa.com/v1/checkouts/8a8294174e6c1d4d...",
    "amount": 100.00,
    "currency": "SAR"
  }
}
```

### Success: Check Payment Status (200)
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

### Success: List Saved Cards (200)
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

### Error: Missing Amount (422)
```json
{
  "success": false,
  "code": "VALIDATION_ERROR",
  "message": "Validation failed",
  "errors": {
    "amount": [
      "The amount field is required."
    ]
  },
  "status": 422
}
```

### Error: Invalid Token (401)
```json
{
  "success": false,
  "code": "AUTHENTICATION_ERROR",
  "message": "Authentication failed",
  "status": 401
}
```

---

## 🔍 How to Read Responses

### Step 1: Click on Response Body
After clicking **Send**, scroll down to see the response.

### Step 2: Check Status Code
- **200** = Success ✅
- **201** = Created ✅
- **400** = Bad request ❌
- **401** = Unauthorized (bad token) ❌
- **422** = Validation error ❌
- **500** = Server error ❌

### Step 3: Read the Data
Under **data** object, you'll find:
- `checkout_id` - Use for payment status check
- `saved_cards` - Array of saved payment methods
- `error_code` - If payment failed

---

## 🐛 If Tests Fail

### Error: "Unauthorized" (401)
**Solution**: 
1. Run "Login (Get Token)" first
2. Check token is in environment: Click eye icon → See `access_token` variable
3. Make sure token is not expired

### Error: "Validation failed" (422)
**Solution**:
1. Check all required fields are present
2. Check field values are correct type (amount = number, currency = string)
3. See error details in response

### Error: "404 Not Found"
**Solution**:
1. Check `base_url` is correct
2. Check server is running
3. Check saved_card_id exists in database

### Error: "500 Server Error"
**Solution**:
1. Check Laravel logs: `tail storage/logs/laravel.log`
2. Check database migration ran: `php artisan migrate`
3. Check `.env` configuration

---

## 📝 Example: Full Payment Flow

### Complete workflow:

```
1. Login (Get Token)
   ↓ (token saved automatically)
   
2. Create Checkout
   ↓ (checkout_id saved automatically)
   
3. Check Payment Status
   ↓ (see if payment succeeded)
   
4. List Saved Cards
   ↓ (see all saved payment methods)
   
5. Set Default Card (optional)
   ↓ (make a card the default)
   
6. Delete Saved Card (optional)
   ↓ (remove a saved card)
```

---

## 🧠 Understanding the Flow

### Without Saved Card:
```
1. User wants to pay
2. POST /payments/checkout
   → Returns checkout_id
3. User sees HyperPay widget
4. User enters card details IN THE WIDGET (not sent to backend)
5. User clicks Pay
6. POST /payments/status
   → Returns payment result
7. OPTIONALLY save card with registration token
```

### With Saved Card:
```
1. User has saved card from previous payment
2. POST /payments/checkout with saved_card_id
   → Returns checkout_id
3. User still sees HyperPay widget (for 3DS verification)
4. User confirms payment
5. POST /payments/status
   → Payment complete
```

---

## 💡 Pro Tips

### ✅ **Auto-population**
- Tests automatically save `checkout_id` and `saved_card_id`
- No need to copy/paste between requests
- Just follow the sequence

### ✅ **Transaction ID**
- Pre-request script generates unique ID
- Useful for tracking orders
- Shows in response

### ✅ **Validation Tests**
- Each request has built-in tests
- Green checkmarks = All tests passed
- Red X = Test failed (see output)

### ✅ **Headers**
- `Authorization: Bearer {{access_token}}` is required for protected endpoints
- Automatically includes your token from environment

---

## 🔗 Related Documentation

- **HYPERPAY_PCI_COMPLIANCE_GUIDE.md** - Full technical guide
- **POSTMAN_TESTING_GUIDE.md** - Detailed testing guide
- **HYPERPAY_REFACTORING_SUMMARY.md** - What changed and why

---

## ✉️ Support

If something doesn't work:

1. **Check logs**:
   ```bash
   tail -f storage/logs/laravel.log
   ```

2. **Verify database**:
   ```bash
   php artisan migrate --step
   ```

3. **Test token**:
   - Get new token from Login endpoint
   - Paste in environment variable

4. **Check database**:
   ```bash
   mysql> SELECT * FROM payments;
   mysql> SELECT * FROM saved_cards;
   ```

---

**Ready to test!** 🚀 Start with "Login (Get Token)" and follow the sequence.
