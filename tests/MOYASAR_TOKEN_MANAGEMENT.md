# Moyasar Token Management - Save & Manage Cards

## Overview

This document describes the Moyasar token management system for saving customer payment methods securely.

**Key Points:**
- ✅ PCI-DSS Compliant (backend never stores card details)
- ✅ Tokenization via Moyasar
- ✅ Reuse tokens for future payments
- ✅ Manage multiple saved cards
- ✅ Set default payment method

---

## Architecture

### Data Flow

```
User enters card details
    ↓
POST /api/payments/tokens/create
    ↓
PaymentController.createCardToken()
    ↓
MoyasarPay.createToken() (Moyasar API)
    ↓
Moyasar returns token_id
    ↓
Save token locally in saved_cards table
    ↓
User can now use this token for payments
    ↓
Payment with token bypasses card entry
```

### Tables

#### saved_cards

| Column | Type | Purpose |
|--------|------|---------|
| `id` | INT | Local record ID |
| `user_id` | INT | User who owns card |
| `registration_id` | STRING | **Moyasar token ID** (NOT card number!) |
| `card_brand` | STRING | VISA, MASTERCARD, etc. |
| `last4` | STRING | Last 4 digits for display |
| `expiry_month` | INT | For UX display |
| `expiry_year` | INT | For UX display |
| `is_default` | BOOLEAN | Default payment method |
| `nickname` | STRING | User-friendly name |
| `deleted_at` | TIMESTAMP | Soft delete |

---

## API Endpoints

### 1. Create & Save a Card Token

**Endpoint:** `POST /api/payments/tokens/create`

**Authentication:** Required (Bearer token)

**Request:**
```json
{
  "card_holder": "Mohammed Ali",
  "card_number": "4111111111111111",
  "expiry_month": 9,
  "expiry_year": 27,
  "cvc": "911",
  "save_as_default": false,
  "nickname": "My Visa Card"
}
```

**Validation:**
- `card_holder`: Required, max 100 chars
- `card_number`: Required, 13-19 digits
- `expiry_month`: Required, 1-12
- `expiry_year`: Required, min current year
- `cvc`: Required, 3-4 digits
- `save_as_default`: Optional, boolean
- `nickname`: Optional, max 50 chars

**Response (Success):**
```json
{
  "success": true,
  "message": "Card saved successfully",
  "data": {
    "saved_card": {
      "id": 1,
      "card_display": "••••••••••••1111",
      "last4": "1111",
      "brand": "VISA",
      "expiry": "09/27",
      "is_default": false,
      "nickname": "My Visa Card"
    },
    "token_id": "token_x6okRgkZJrhgDHyqJ9zztW2X1k"
  }
}
```

**Response (Error):**
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": {
    "card_number": ["Card number must be 13-19 digits"]
  }
}
```

**Behind the Scenes:**
1. Validates card data
2. Sends to Moyasar to create token
3. Moyasar returns token_id (NOT stored with us)
4. Stores token_id locally as `registration_id`
5. Stores only display info (brand, last4, expiry)
6. Card details NOT stored

---

### 2. List All Saved Card Tokens

**Endpoint:** `GET /api/payments/tokens`

**Authentication:** Required (Bearer token)

**Response:**
```json
{
  "success": true,
  "message": "Card tokens retrieved successfully",
  "data": {
    "tokens": [
      {
        "id": 1,
        "token_id": "token_x6okRgkZJrhgDHyqJ9zztW2X1k",
        "card_display": "••••••••••••1111",
        "brand": "VISA",
        "last4": "1111",
        "expiry": "09/27",
        "is_expired": false,
        "is_default": true,
        "nickname": "My Visa Card",
        "created_at": "2024-01-20T10:30:00Z"
      },
      {
        "id": 2,
        "token_id": "token_abc123def456",
        "card_display": "••••••••••••4242",
        "brand": "MASTERCARD",
        "last4": "4242",
        "expiry": "12/26",
        "is_expired": false,
        "is_default": false,
        "nickname": "Work Card",
        "created_at": "2024-01-18T14:20:00Z"
      }
    ],
    "count": 2
  }
}
```

---

### 3. Set a Token as Default

**Endpoint:** `POST /api/payments/tokens/{savedCard}/set-default`

**Authentication:** Required (Bearer token)

**URL Parameters:**
- `savedCard`: ID of saved card (from response above, e.g., 1 or 2)

**Request:** (Empty body)

**Response:**
```json
{
  "success": true,
  "message": "Default payment method updated",
  "data": {
    "id": 1,
    "is_default": true,
    "card_display": "••••••••••••1111"
  }
}
```

**Note:** Setting a card as default automatically unsets all other default cards

---

### 4. Delete (Revoke) a Card Token

**Endpoint:** `DELETE /api/payments/tokens/{savedCard}`

**Authentication:** Required (Bearer token)

**URL Parameters:**
- `savedCard`: ID of saved card to delete

**Request:** (Empty body)

**Response (Success):**
```json
{
  "success": true,
  "message": "Card '••••••••••••1111' has been removed"
}
```

**Behind the Scenes:**
1. Verifies user owns this card
2. Sends DELETE to Moyasar to revoke token
3. Deletes local saved_card record
4. Card can no longer be used for payments

**Note:** If Moyasar revocation fails, card is still deleted locally (safer approach)

---

### 5. Verify a Card Token

**Endpoint:** `POST /api/payments/tokens/{savedCard}/verify`

**Authentication:** Required (Bearer token)

**URL Parameters:**
- `savedCard`: ID of saved card to verify

**Request:** (Empty body)

**Response (Valid):**
```json
{
  "success": true,
  "message": "Card is valid",
  "data": {
    "is_valid": true,
    "token_id": "token_x6okRgkZJrhgDHyqJ9zztW2X1k",
    "brand": "visa",
    "last_four": "1111",
    "status": "initiated"
  }
}
```

**Response (Invalid):**
```json
{
  "success": false,
  "message": "Card token is no longer valid",
  "data": {
    "is_valid": false,
    "status": "failed"
  }
}
```

---

## Using Saved Tokens for Payments

### Create Payment with Saved Token

**Endpoint:** `POST /api/payments/checkout`

**Request (with saved token):**
```json
{
  "amount": 200.00,
  "currency": "SAR",
  "booking_id": 1,
  "saved_card_id": 1
}
```

**What Happens Behind the Scenes:**
1. Retrieves SavedCard (id=1)
2. Gets token_id from `registration_id` field
3. Sends payment request to Moyasar with token (NOT card details)
4. Moyasar charges using the token
5. No card details sent to backend

---

## Security

### What We Store ✅
- Token ID from Moyasar
- Last 4 digits (for display)
- Card brand (VISA, MC, etc.)
- Expiry date (for display)
- User nickname

### What We DON'T Store ❌
- ❌ Full card number
- ❌ CVV/CVC
- ❌ Cardholder name (initial only)
- ❌ Magnetic stripe data
- ❌ Any sensitive data

### Why This Is Safe
1. **PCI-DSS Compliant** - No sensitive data in our database
2. **Tokenization** - Only token stored, not card
3. **Moyasar Handled** - Card processing offloaded to PCI-certified provider
4. **Revocation** - Token can be revoked anytime, preventing unauthorized use
5. **Soft Delete** - Deleted cards can be recovered, but token is already revoked

---

## Moyasar API Integration

### Token Creation Request (MoyasarPay.createToken)

```
POST /v1/tokens
Authorization: Basic pk_test_xxx
Content-Type: application/x-www-form-urlencoded

name=Mohammed Ali
&number=4111111111111111
&month=09
&year=27
&cvc=911
&callback_url=https://mystore.com/thanks
```

### Token Response

```json
{
  "id": "token_x6okRgkZJrhgDHyqJ9zztW2X1k",
  "status": "initiated",
  "brand": "visa",
  "funding": "credit",
  "country": "US",
  "month": "09",
  "year": "2027",
  "name": "Mohammed Ali",
  "last_four": "1111",
  "metadata": null,
  "created_at": "2023-08-23T12:12:55.857Z",
  "updated_at": "2023-08-23T12:12:55.857Z"
}
```

### Token Fetch Request (MoyasarPay.fetchToken)

```
GET /v1/tokens/token_x6okRgkZJrhgDHyqJ9zztW2X1k
Authorization: Basic sk_test_xxx
```

### Token Delete Request (MoyasarPay.deleteToken)

```
DELETE /v1/tokens/token_x6okRgkZJrhgDHyqJ9zztW2X1k
Authorization: Basic sk_test_xxx
```

---

## Error Handling

### Common Errors

| Scenario | Error | Solution |
|----------|-------|----------|
| Invalid card number | `Card number must be 13-19 digits` | Check card format |
| Expired card | `Card is expired` | Use current year |
| Moyasar API failure | `Token creation failed: 401` | Check API credentials |
| Already saved | Returns existing token (no duplicate) | User can use it |
| User not owner | `Unauthorized to delete this card` | Verify user ID |
| Token revoked | `Card token is no longer valid` | Remove saved card |

### Error Response Example

```json
{
  "success": false,
  "message": "Failed to save card",
  "error": "Token creation failed: Invalid card number"
}
```

---

## Testing

### Manual Testing with curl

#### 1. Create Token

```bash
curl -X POST https://yourapi.com/api/payments/tokens/create \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "card_holder": "Mohammed Ali",
    "card_number": "4111111111111111",
    "expiry_month": 9,
    "expiry_year": 27,
    "cvc": "911",
    "nickname": "Test Card"
  }'
```

#### 2. List Tokens

```bash
curl -X GET https://yourapi.com/api/payments/tokens \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN"
```

#### 3. Delete Token

```bash
curl -X DELETE https://yourapi.com/api/payments/tokens/1 \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN"
```

#### 4. Set as Default

```bash
curl -X POST https://yourapi.com/api/payments/tokens/1/set-default \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN"
```

---

## Implementation Checklist

- [x] Add token methods to MoyasarPay service
  - [x] createToken()
  - [x] fetchToken()
  - [x] deleteToken()

- [x] Add token endpoints to PaymentController
  - [x] createCardToken()
  - [x] listCardTokens()
  - [x] deleteCardToken()
  - [x] setDefaultCardToken()
  - [x] verifyCardToken()

- [x] Add routes to api.php
  - [x] POST /api/payments/tokens/create
  - [x] GET /api/payments/tokens
  - [x] DELETE /api/payments/tokens/{id}
  - [x] POST /api/payments/tokens/{id}/set-default
  - [x] POST /api/payments/tokens/{id}/verify

- [ ] Update Booking → Payment flow to use tokens
  - When creating payment, check for default token
  - Pre-populate payment form if default token exists

- [ ] Test full payment flow with tokens
  - Create token → List tokens → Use in payment → Verify charge

- [ ] Mobile app integration
  - Save card UI
  - List saved cards screen
  - Set default payment method
  - Delete card confirmation

---

## Future Enhancements

1. **Automated Token Refresh**
   - Check token expiry before each payment
   - Auto-refresh if near expiry date

2. **Card Verification**
   - Small charge ($1) to verify card ownership
   - Instant verification for future payments

3. **Token Analytics**
   - Track most used cards
   - Suggest cards based on usage

4. **Subscription Payments**
   - Use tokens for recurring charges
   - Monthly/yearly subscriptions

5. **3D Secure Tokenization**
   - Optional 3DS on token creation
   - Extra security for high-value transactions

---

## Troubleshooting

### Token Not Being Created

**Check:**
1. Card details are valid
2. Moyasar API credentials in `.env`
3. Network connection to Moyasar
4. Card is not already tokenized

**Log:**
```
Log::info('Moyasar: Token creation failed', ['error' => ...])
```

### Token Revocation Failed

**Status:** Normal - card is still deleted locally
**Fix:** Token is already unusable from Moyasar side
**Note:** Check Moyasar dashboard to verify deletion

### Payment with Token Failed

**Check:**
1. Token is still valid (not expired)
2. Token has been verified recently
3. Card still has funds
4. Amount is correct (× 100 halala)

---

## API Response Format

All endpoints follow standard format:

```json
{
  "success": true/false,
  "message": "Human readable message",
  "data": { /* endpoint-specific data */ }
}
```

---

## Rate Limiting

- Create Token: 3 per minute per user
- List Tokens: 10 per minute per user
- Delete Token: 5 per minute per user
- Verify Token: 10 per minute per user

(Implement using Laravel rate limiting if needed)

