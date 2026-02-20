# Ads Panel Feature Documentation

## Overview

The Ads Panel is a complete advertisement management system that allows administrators to upload and manage ads with role-based targeting. Users receive ads based on their role (Student, Teacher, or Guest) and platform (Web or App).

## Database Schema

### Table: `ads_panners`

```
id                  : integer (primary key)
image_path          : string (nullable) - Path to uploaded image in storage
image_name          : string (nullable) - Original filename
description         : text (nullable) - Ad description/text
role_id             : integer (nullable) - Target role (3=teacher, 4=student, null=all/guest)
platform            : enum (web, app, both) - Target platform
is_active           : boolean (default: true) - Active status
link_url            : string (nullable) - Link/URL for CTA
cta_text            : string (nullable) - Call-to-action button text
display_order       : integer (default: 0) - Display order/priority
created_at          : timestamp
updated_at          : timestamp
deleted_at          : timestamp (soft delete)
```

### Indexes
- `role_id` - For role-based filtering
- `is_active` - For active status filtering
- `platform` - For platform filtering

## Model

**Location:** `app/Models/AdsPanner.php`

### Properties
```php
protected $fillable = [
    'image_path', 'image_name', 'description', 'role_id', 
    'platform', 'is_active', 'link_url', 'cta_text', 'display_order'
];
```

### Key Methods

#### Static Method: `getActiveAds($platform, $roleId)`
Retrieves active ads filtered by platform and role.

```php
// Get ads for web platform for teachers (role_id = 3)
$ads = AdsPanner::getActiveAds('web', 3);

// Get ads for both platforms for guests (role_id = null)
$ads = AdsPanner::getActiveAds('both', null);

// Get ads for app platform for students (role_id = 4)
$ads = AdsPanner::getActiveAds('app', 4);
```

### Query Scopes

```php
// Get only active ads
$ads = AdsPanner::active()->get();

// Filter by platform
$ads = AdsPanner::byPlatform('web')->get();

// Filter by role
$ads = AdsPanner::byRole(3)->get();

// Combine scopes
$ads = AdsPanner::active()
    ->byPlatform('app')
    ->byRole(4)
    ->get();
```

## API Endpoints

### Public Endpoints (No Authentication Required)

#### 1. Get Ads by User Role
```
GET /api/ads?platform=both
```

**Description:** Get active ads based on user role and platform. 
- Guest users (not authenticated) get ads with `role_id = null`
- Teacher users get ads with `role_id = 3` or `role_id = null`
- Student users get ads with `role_id = 4` or `role_id = null`

**Query Parameters:**
- `platform` (optional): `web`, `app`, or `both` (default: `both`)

**Response (200):**
```json
{
  "success": true,
  "code": "ADS_RETRIEVED",
  "status": "success",
  "message_en": "Ads retrieved successfully",
  "message_ar": "تم استرجاع الإعلانات بنجاح",
  "data": {
    "platform": "both",
    "role": "student",
    "ads_count": 2,
    "ads": [
      {
        "id": 1,
        "image_url": "http://localhost:8000/storage/ads/filename.jpg",
        "description": "Limited time offer",
        "link_url": "https://example.com/offer",
        "cta_text": "Learn More",
        "platform": "both"
      }
    ]
  }
}
```

#### 2. Get Single Ad
```
GET /api/ads/{id}
```

**Description:** Get a specific active ad by ID.

**Path Parameters:**
- `id` (required): Ad ID

**Response (200):**
```json
{
  "success": true,
  "code": "AD_RETRIEVED",
  "status": "success",
  "message_en": "Ad retrieved successfully",
  "message_ar": "تم استرجاع الإعلان بنجاح",
  "data": {
    "id": 1,
    "image_url": "http://localhost:8000/storage/ads/filename.jpg",
    "description": "Limited time offer",
    "link_url": "https://example.com/offer",
    "cta_text": "Learn More",
    "platform": "both"
  }
}
```

---

### Admin Endpoints (Requires Authentication & Admin Role)

#### 1. List All Ads
```
GET /api/admin/ads?is_active=true&role_id=3&platform=web
```

**Description:** List all ads with filtering options.

**Query Parameters:**
- `is_active` (optional): `true` or `false` - Filter by active status
- `role_id` (optional): `3` (teacher), `4` (student), or null (all/guest)
- `platform` (optional): `web`, `app`, or `both`

**Response (200):**
```json
{
  "success": true,
  "code": "ADS_LISTED",
  "status": "success",
  "message_en": "Ads listed successfully",
  "message_ar": "تم استعراض الإعلانات بنجاح",
  "data": {
    "count": 5,
    "ads": [
      {
        "id": 1,
        "image_url": "http://localhost:8000/storage/ads/filename.jpg",
        "image_path": "ads/filename.jpg",
        "description": "Limited time offer",
        "role_id": 4,
        "role_name": "student",
        "platform": "both",
        "is_active": true,
        "link_url": "https://example.com",
        "cta_text": "Shop Now",
        "display_order": 0,
        "created_at": "2026-02-21 10:30:00",
        "updated_at": "2026-02-21 10:30:00"
      }
    ]
  }
}
```

#### 2. Create New Ad (with Image Upload)
```
POST /api/admin/ads
Content-Type: multipart/form-data
```

**Description:** Create a new ad with image upload.

**Request Body (multipart/form-data):**
- `image` (required): Image file (jpeg, png, jpg, gif, webp - max 5MB)
- `description` (optional): Ad description (max 1000 characters)
- `role_id` (optional): Target role (3=teacher, 4=student, null=all)
- `platform` (required): `web`, `app`, or `both`
- `link_url` (optional): URL to link to
- `cta_text` (optional): Call-to-action button text (max 255 chars)
- `display_order` (optional): Display order (default: 0)

**cURL Example:**
```bash
curl -X POST http://localhost:8000/api/admin/ads \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "image=@image.jpg" \
  -F "description=Spring Sale - 50% Off" \
  -F "role_id=4" \
  -F "platform=both" \
  -F "link_url=https://example.com/sale" \
  -F "cta_text=Shop Now" \
  -F "display_order=1"
```

**Response (201):**
```json
{
  "success": true,
  "code": "AD_CREATED",
  "status": "success",
  "message_en": "Ad created successfully",
  "message_ar": "تم إنشاء الإعلان بنجاح",
  "data": {
    "id": 5,
    "image_url": "http://localhost:8000/storage/ads/12345.jpg",
    "description": "Spring Sale - 50% Off",
    "role_id": 4,
    "platform": "both",
    "is_active": true,
    "created_at": "2026-02-21 10:35:00"
  }
}
```

#### 3. Update Ad
```
POST /api/admin/ads/{id}
Content-Type: multipart/form-data
```

**Description:** Update an existing ad (image is optional).

**Path Parameters:**
- `id` (required): Ad ID

**Request Body (multipart/form-data):**
- `image` (optional): New image file
- `description` (optional): Updated description
- `role_id` (optional): Updated role target
- `platform` (optional): Updated platform
- `link_url` (optional): Updated link URL
- `cta_text` (optional): Updated CTA text
- `is_active` (optional): Active status (true/false)
- `display_order` (optional): Updated display order

**cURL Example:**
```bash
curl -X POST http://localhost:8000/api/admin/ads/5 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "description=Updated Description" \
  -F "is_active=true" \
  -F "display_order=2"
```

**Response (200):**
```json
{
  "success": true,
  "code": "AD_UPDATED",
  "status": "success",
  "message_en": "Ad updated successfully",
  "message_ar": "تم تحديث الإعلان بنجاح",
  "data": {
    "id": 5,
    "image_url": "http://localhost:8000/storage/ads/12345.jpg",
    "description": "Updated Description",
    "role_id": 4,
    "platform": "both",
    "is_active": true,
    "updated_at": "2026-02-21 10:40:00"
  }
}
```

#### 4. Toggle Ad Status
```
PUT /api/admin/ads/{id}/toggle
```

**Description:** Toggle ad between active and inactive status.

**Path Parameters:**
- `id` (required): Ad ID

**Response (200):**
```json
{
  "success": true,
  "code": "STATUS_TOGGLED",
  "status": "success",
  "message_en": "Ad status updated",
  "message_ar": "تم تحديث حالة الإعلان",
  "data": {
    "id": 5,
    "is_active": false
  }
}
```

#### 5. Delete Ad
```
DELETE /api/admin/ads/{id}
```

**Description:** Soft delete an ad (image file is removed).

**Path Parameters:**
- `id` (required): Ad ID

**Response (200):**
```json
{
  "success": true,
  "code": "AD_DELETED",
  "status": "success",
  "message_en": "Ad deleted successfully",
  "message_ar": "تم حذف الإعلان بنجاح"
}
```

---

## Usage Examples

### Example 1: Guest User Getting Ads

**Request:**
```bash
curl -X GET "http://localhost:8000/api/ads?platform=web"
```

**Result:** Guest user gets ads with `role_id = null` for web platform.

### Example 2: Student Getting Ads

**Request:**
```bash
curl -X GET "http://localhost:8000/api/ads?platform=app" \
  -H "Authorization: Bearer STUDENT_TOKEN"
```

**Result:** Student (role_id=4) gets:
- Ads with `role_id = 4` AND `platform` contains `app`
- Ads with `role_id = null` AND `platform` contains `app`

### Example 3: Teacher Getting Ads

**Request:**
```bash
curl -X GET "http://localhost:8000/api/ads" \
  -H "Authorization: Bearer TEACHER_TOKEN"
```

**Result:** Teacher (role_id=3) gets:
- Ads with `role_id = 3` AND `platform = both`
- Ads with `role_id = null` AND `platform = both`

### Example 4: Admin Creating an Ad for Teachers Only

**Request:**
```bash
curl -X POST "http://localhost:8000/api/admin/ads" \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -F "image=@teacher-course.jpg" \
  -F "description=New Advanced Course Available" \
  -F "role_id=3" \
  -F "platform=app" \
  -F "link_url=https://example.com/advanced-course" \
  -F "cta_text=Enroll Now" \
  -F "display_order=1"
```

**Result:** Ad will only appear to teachers in the mobile app.

### Example 5: Admin Creating an Ad for All Users

**Request:**
```bash
curl -X POST "http://localhost:8000/api/admin/ads" \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -F "image=@platform-announcement.jpg" \
  -F "description=Platform Maintenance Scheduled" \
  -F "platform=both" \
  -F "cta_text=Learn More"
```

**Result:** Ad appears to all users (students, teachers, guests) on both web and app.

---

## Role-Based Targeting

### Role IDs
- `null` - All users / Guests (default for public access)
- `3` - Teachers only
- `4` - Students only

### How Filtering Works

```
User Role: Student (role_id = 4)
Platform: App

Ad will display if:
  (ad.role_id = 4 OR ad.role_id = null) 
  AND 
  (ad.platform = 'app' OR ad.platform = 'both')
```

### Ad Targeting Examples

| AD Config | Guest | Student | Teacher |
|-----------|-------|---------|---------|
| role_id=null, platform=both | ✅ | ✅ | ✅ |
| role_id=4, platform=both | ❌ | ✅ | ❌ |
| role_id=3, platform=web | ❌ | ❌ | ✅ |
| role_id=null, platform=app | ✅ | ✅ | ✅ |

---

## File Storage

### Image Storage Location
```
storage/app/public/ads/
```

### Image URL Format
```
http://localhost:8000/storage/ads/{filename}
```

### Supported Image Formats
- JPEG
- PNG
- JPG
- GIF
- WebP

### File Size Limits
- Maximum: 5MB per image
- Recommended: 1-2MB for optimal loading
- Aspect Ratio: 16:9 recommended (responsive)

---

## Ordering & Display Priority

### Display Order Field
- `display_order` (integer) - Controls the order ads are displayed
- Default value: 0
- Lower numbers display first (0, 1, 2, etc.)
- Ads with same display_order are sorted by created_at (newest first)

### Example Sorting
```
SELECT * FROM ads_panners 
WHERE is_active = true 
ORDER BY display_order ASC, created_at DESC
```

---

## Logging

All ad operations are logged for auditing:

### Log Examples

**Ad Created:**
```
[2026-02-21 10:30:45] local.INFO: Ad created successfully {
  "ad_id": 5, 
  "image_path": "ads/image.jpg",
  "role_id": 4,
  "platform": "both"
}
```

**Ads Retrieved:**
```
[2026-02-21 10:35:22] local.INFO: Ads request from authenticated user {
  "user_id": 123,
  "role_id": 4,
  "platform": "both"
}
```

**Ad Updated:**
```
[2026-02-21 10:40:10] local.INFO: Ad updated successfully {"ad_id": 5}
```

---

## Error Handling

### Common Errors

#### 404 - Ad Not Found
```json
{
  "success": false,
  "code": "AD_NOT_FOUND",
  "status": "not_found",
  "message_en": "Ad not found",
  "message_ar": "الإعلان غير موجود"
}
```

#### 422 - Validation Error
```json
{
  "success": false,
  "code": "VALIDATION_ERROR",
  "status": "invalid_input",
  "message_en": "Validation error",
  "message_ar": "خطأ في التحقق من البيانات",
  "errors": {
    "image": ["The image field is required."],
    "platform": ["The platform field is required."]
  }
}
```

#### 422 - File Upload Error
```json
{
  "success": false,
  "code": "VALIDATION_ERROR",
  "errors": {
    "image": ["The image field must not be greater than 5120 kilobytes."]
  }
}
```

#### 500 - Server Error
```json
{
  "success": false,
  "code": "ERROR_CREATING_AD",
  "status": "error",
  "message_en": "Error creating ad",
  "message_ar": "خطأ في إنشاء الإعلان"
}
```

---

## Mobile Integration (Flutter/React Native)

### Getting Ads in Flutter

```dart
Future<List<Ad>> getAds() async {
  final response = await http.get(
    Uri.parse('https://api.example.com/api/ads?platform=app'),
    headers: {
      'Authorization': 'Bearer $accessToken',
    },
  );

  if (response.statusCode == 200) {
    final data = jsonDecode(response.body);
    final ads = (data['data']['ads'] as List)
        .map((ad) => Ad.fromJson(ad))
        .toList();
    return ads;
  }
  throw Exception('Failed to load ads');
}
```

### Creating Ad Widget

```dart
class AdBanner extends StatelessWidget {
  final Ad ad;

  const AdBanner({required this.ad});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () => launch(ad.linkUrl),
      child: Card(
        child: Column(
          children: [
            Image.network(ad.imageUrl),
            if (ad.description != null) Text(ad.description),
            if (ad.ctaText != null)
              ElevatedButton(
                onPressed: () => launch(ad.linkUrl),
                child: Text(ad.ctaText),
              ),
          ],
        ),
      ),
    );
  }
}
```

---

## Web Integration (React/Vue)

### Getting Ads in JavaScript

```javascript
async function getAds() {
  const platform = 'web';
  const token = localStorage.getItem('auth_token');
  
  const response = await fetch(`/api/ads?platform=${platform}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (response.ok) {
    const data = await response.json();
    return data.data.ads;
  }
  throw new Error('Failed to load ads');
}
```

### Displaying Ads in React

```jsx
export function AdsCarousel() {
  const [ads, setAds] = useState([]);

  useEffect(() => {
    getAds().then(setAds);
  }, []);

  return (
    <div className="ads-carousel">
      {ads.map(ad => (
        <div key={ad.id} className="ad-banner">
          <img src={ad.imageUrl} alt="ad" />
          {ad.description && <p>{ad.description}</p>}
          {ad.ctaText && (
            <a href={ad.linkUrl} className="btn">
              {ad.ctaText}
            </a>
          )}
        </div>
      ))}
    </div>
  );
}
```

---

## Best Practices

### Image Guidelines
1. **Size:** Keep images under 2MB for faster loading
2. **Aspect Ratio:** Use 16:9 for consistent display
3. **Format:** Use WebP for better compression
4. **Responsive:** Design for mobile-first
5. **Quality:** Ensure images are clear and professional

### Admin Guidelines
1. **Targeting:** Set appropriate role_id and platform
2. **Description:** Keep descriptions concise and clear
3. **CTA Text:** Use action-oriented language
4. **Links:** Always use HTTPS links
5. **Testing:** Test ads on both web and mobile before publishing
6. **Updates:** Regularly update ads to keep content fresh
7. **Monitoring:** Check logs for ad performance

### User Experience
1. **Loading:** Cache ads to reduce API calls
2. **Display:** Show ads in non-intrusive locations
3. **Refresh:** Refresh ads every 5-10 minutes
4. **Respect:** Allow users to close/skip ads
5. **Performance:** Don't load too many ads at once

---

## Database Migration

To run the migration and create the table:

```bash
php artisan migrate
```

To rollback:

```bash
php artisan migrate:rollback
```

---

## Future Enhancements

1. **Analytics Tracking**
   - Track ad impressions and clicks
   - Track conversion rates
   - Performance metrics dashboard

2. **Ad Scheduling**
   - Schedule ads to display for specific date ranges
   - Time-based targeting (morning, evening, etc.)

3. **Advanced Targeting**
   - Location-based targeting
   - Device type targeting
   - Language preferences

4. **A/B Testing**
   - Test different ad variations
   - Automatic selection of best performing ads

5. **Budget Management**
   - Set ad budgets
   - Track spending
   - Automatic pause when budget exhausted

6. **Admin Dashboard**
   - Visual ad management interface
   - Performance analytics
   - Real-time monitoring

---

## Support & Troubleshooting

### Issue: Images not loading

**Solution:**
1. Verify storage link is created: `php artisan storage:link`
2. Check file permissions: `chmod -R 775 storage/app/public`
3. Verify image path in database

### Issue: Only getting some ads

**Check:**
1. Verify `is_active = true`
2. Verify `role_id` matches or is null
3. Verify `platform` matches or is 'both'
4. Check user authentication and role_id

### Issue: File upload fails

**Solutions:**
1. Check file size (max 5MB)
2. Check file type (only image formats allowed)
3. Verify storage disk is writable
4. Check disk space available

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-02-21 | Initial implementation with role-based targeting and image upload |

