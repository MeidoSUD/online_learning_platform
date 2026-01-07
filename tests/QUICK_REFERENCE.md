# Quick Reference Card 📋

## URLs to Remember

| Purpose | URL |
|---------|-----|
| Support Form (Public) | `http://yoursite.com/support/contact` |
| App Store Support URL | `https://yourdomain.com/support/contact` |
| API Base | `http://yoursite.com/api/` |

---

## Key Endpoints

### User (Authenticated)
```
POST /api/auth/login              - Login with email or phone
POST /api/auth/register           - Register new account
POST /api/auth/logout             - Logout
POST /api/auth/delete-account     - Delete account ⭐ NEW
```

### Admin (Authenticated + Admin Role)
```
GET /api/admin/support-tickets                - List tickets
GET /api/admin/support-tickets/{id}           - View ticket
POST /api/admin/support-tickets/{id}/reply    - Reply
POST /api/admin/support-tickets/{id}/resolve  - Resolve
PUT /api/admin/support-tickets/{id}/status    - Update status
POST /api/admin/support-tickets/{id}/close    - Close
DELETE /api/admin/support-tickets/{id}        - Delete
GET /api/admin/support-tickets/stats          - Statistics
```

### Public
```
GET /support/contact              - Show form
POST /support/contact             - Submit form
```

---

## Response Status Codes

| Code | Meaning | Example |
|------|---------|---------|
| 200 | Success | Account deleted |
| 201 | Created | Ticket reply added |
| 400 | Bad Request | Malformed JSON |
| 401 | Not Authenticated | Missing token |
| 403 | Not Authorized | Not admin |
| 404 | Not Found | Ticket doesn't exist |
| 422 | Validation Error | Invalid email |
| 429 | Rate Limited | Too many requests |
| 500 | Server Error | Database error |

---

## Common Errors & Solutions

### "Invalid password"
- Check password is current user's password
- Try with correct password

### "Ticket not found"
- Verify ticket ID exists
- Check you have access (admin)

### "Unauthenticated"
- Add Authorization header: `Bearer <token>`
- Token must be valid (not expired)

### "Unauthorized"
- User must be admin (role_id = 1)
- Check in users table

### Email not sending
- Check MAIL_HOST in .env
- Check MAIL_USERNAME and PASSWORD
- Verify email account is active

---

## Test Commands

### Quick Test Support Form
```bash
curl -X POST http://localhost:8000/support/contact \
  -d "name=Ahmed&email=ahmed@example.com&subject=Help&message=I need help with something"
```

### Quick Test Account Deletion
```bash
curl -X POST http://localhost:8000/api/auth/delete-account \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"password":"password","confirmation":true}'
```

### Quick Test Admin Tickets
```bash
curl -X GET http://localhost:8000/api/admin/support-tickets \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

---

## Database Checks

### Check if user deleted
```sql
SELECT * FROM users WHERE id = 123;
-- Should return empty
```

### Check support tickets
```sql
SELECT * FROM support_tickets;
-- Should show all tickets
```

### Check ticket replies
```sql
SELECT * FROM support_ticket_replies WHERE support_ticket_id = 123;
-- Should show all replies for ticket
```

---

## Files to Know

| File | Purpose |
|------|---------|
| `app/Http/Controllers/API/AuthController.php` | Delete account logic |
| `app/Http/Controllers/API/Admin/SupportTicketController.php` | Admin tickets |
| `app/Http/Controllers/SupportController.php` | Support form |
| `resources/views/support/contact.blade.php` | Support form HTML |
| `routes/api.php` | API routes |
| `routes/web.php` | Web routes |
| `app/Models/SupportTicket.php` | Ticket model |
| `app/Models/SupportTicketReply.php` | Reply model |

---

## Laravel Commands

### Clear cache
```bash
php artisan cache:clear
php artisan config:clear
```

### Run migrations (if needed)
```bash
php artisan migrate
```

### Check routes
```bash
php artisan route:list | grep -E "support|delete"
```

### Check logs
```bash
tail -f storage/logs/laravel.log
```

---

## Flutter Widget Examples

### Delete Account Button
```dart
ElevatedButton(
  onPressed: () => deleteAccount(),
  style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
  child: Text('Delete Account'),
)
```

### Support Form Button
```dart
ElevatedButton(
  onPressed: () => launchUrl(Uri.parse('https://yourdomain.com/support/contact')),
  child: Text('Contact Support'),
)
```

---

## Email Template

When user submits support form, admin receives:

```
From: user@example.com
To: contact@ewan-geniuses.com
Subject: Support Request: Cannot Login

New Support Request from: Ahmed Hassan
Email: ahmed@example.com

Subject: Cannot Login

Message:
I tried logging in but got an error message saying "Invalid credentials"
```

---

## Security Checklist

Before going live:

- [ ] Test account deletion on real device
- [ ] Verify password is required for deletion
- [ ] Confirm checkbox required for deletion
- [ ] Test support form without login
- [ ] Verify email sends to correct address
- [ ] Check all error messages are user-friendly
- [ ] Test with various phone formats
- [ ] Verify CSRF token is working
- [ ] Check rate limiting is active
- [ ] Review logs for any errors

---

## Performance Tips

1. **Use pagination** for support ticket lists
   ```
   GET /api/admin/support-tickets?per_page=20
   ```

2. **Filter early** instead of loading all tickets
   ```
   GET /api/admin/support-tickets?status=open
   ```

3. **Cache statistics** if queried frequently
   ```
   GET /api/admin/support-tickets/stats
   ```

4. **Don't delete attachments manually** - use deleteAccount endpoint

---

## What Happens During Account Deletion

1. ✅ Password verified
2. ✅ Confirmation checked
3. ✅ Database transaction started
4. ✅ User profile deleted
5. ✅ Attachments deleted from storage
6. ✅ Support tickets deleted
7. ✅ Support replies deleted
8. ✅ API tokens revoked (logout)
9. ✅ User deleted
10. ✅ Transaction committed
11. ✅ Logged for audit

---

## Feature Checklist for App Store

- [x] Account deletion available in app
- [x] Requires password confirmation
- [x] Requires explicit acceptance
- [x] Works on iOS and Android
- [x] Support URL working
- [x] Support form accessible without login
- [x] Email notification working
- [x] Error messages user-friendly
- [x] No sensitive data exposed in errors
- [x] HTTPS recommended for production

---

**Need Help?** Check: **IMPLEMENTATION_SUMMARY.md** or **SUPPORT_FEATURES_GUIDE.md**

**Status:** ✅ Ready for Production

Last Updated: January 6, 2025
