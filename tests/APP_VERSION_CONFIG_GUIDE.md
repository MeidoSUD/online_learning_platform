# App Version & Configuration Management Guide

**Date**: February 4, 2026  
**Status**: ✅ Complete - All endpoints implemented and tested

---

## Overview

The App Version system allows administrators to manage app updates and force users to update when critical issues are found. Mobile apps call a public `/api/config` endpoint to check if they need to update.

### Key Features

- ✅ **Public Config Endpoint**: No authentication required - apps call this first
- ✅ **Force Updates**: Admin can mark a version as "force_update=true" to require all users to update
- ✅ **Platform-Specific**: Different versions for iOS and Android
- ✅ **Release Notes**: Include information about what's new
- ✅ **Download URLs**: Link to app store or direct download
- ✅ **Admin Management**: Full CRUD for managing app versions

---

## Database Schema

### app_versions table

```sql
CREATE TABLE app_versions (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    platform VARCHAR(20) NOT NULL,        -- 'ios' or 'android'
    version VARCHAR(20) NOT NULL,         -- Semantic versioning: "1.0.0"
    force_update BOOLEAN DEFAULT false,   -- true = user must update immediately
    download_url VARCHAR(500) NULL,       -- URL to app store or direct download
    release_notes TEXT NULL,              -- What's new in this version
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    
    UNIQUE KEY unique_platform_version (platform, version)
);
```

---

## API Endpoints

### 1. Get App Configuration (PUBLIC - No Auth Required)

**Endpoint**: `GET /api/config`

**Purpose**: Mobile app calls this to check if it needs to update

**Query Parameters**:
| Parameter | Type | Required | Default | Example |
|-----------|------|----------|---------|---------|
| `platform` | string | No | android | `ios` or `android` |

**Examples**:

#### Request
```bash
# Check for iOS update
curl -X GET "https://api.ewan.com/api/config?platform=ios"

# Check for Android update (default if not specified)
curl -X GET "https://api.ewan.com/api/config"
```

#### Response - Force Update Required (HTTP 200)

```json
{
  "success": true,
  "data": {
    "platform": "ios",
    "version": "2.1.0",
    "force_update": true,
    "force_update_message": "This version is required. Please update immediately.",
    "message": "A critical update is required. Your app will not work without updating.",
    "action": "FORCE_UPDATE",
    "retry_in_seconds": 30,
    "download_url": "https://apps.apple.com/app/ewan/id1234567890",
    "release_notes": "Critical security fix for payment processing"
  },
  "code": "FORCE_UPDATE_REQUIRED"
}
```

#### Response - Optional Update Available (HTTP 200)

```json
{
  "success": true,
  "data": {
    "platform": "android",
    "version": "2.0.5",
    "force_update": false,
    "force_update_message": "An optional update is available.",
    "message": "A new version is available. Please update when convenient.",
    "action": "UPDATE_AVAILABLE",
    "download_url": "https://play.google.com/store/apps/details?id=com.ewan.app",
    "release_notes": "- Performance improvements\n- UI fixes\n- Better error messages"
  },
  "code": "UPDATE_AVAILABLE"
}
```

#### Response - No Update Needed (HTTP 200)

```json
{
  "success": true,
  "data": {
    "platform": "android",
    "version": "1.0.0",
    "force_update": false,
    "message": "No update required",
    "download_url": null
  },
  "code": "NO_UPDATE_AVAILABLE"
}
```

#### Error Response - Invalid Platform (HTTP 400)

```json
{
  "success": false,
  "message": "Invalid platform",
  "error": "Platform must be \"ios\" or \"android\"",
  "code": "INVALID_PLATFORM"
}
```

---

### 2. Create New App Version (ADMIN ONLY)

**Endpoint**: `POST /api/admin/app-versions`

**Authentication**: Required - must be admin user

**Purpose**: Admin publishes a new app version

**Request Body**:
```json
{
  "platform": "ios",
  "version": "2.1.0",
  "force_update": true,
  "download_url": "https://apps.apple.com/app/ewan/id1234567890",
  "release_notes": "Critical security fix for payment processing"
}
```

**Validation Rules**:
| Field | Rules | Example |
|-------|-------|---------|
| platform | required, in:ios,android | "ios" |
| version | required, regex:\^\d+\.\d+\.\d+$ | "2.1.0" |
| force_update | required, boolean | true or false |
| download_url | nullable, url | "https://..." |
| release_notes | nullable, string, max:2000 | "What's new..." |

**Success Response (HTTP 201)**:

```json
{
  "success": true,
  "message": "App version created successfully",
  "data": {
    "id": 42,
    "platform": "ios",
    "version": "2.1.0",
    "force_update": true,
    "created_at": "2026-02-04T10:30:00Z"
  }
}
```

**Error Response - Version Already Exists (HTTP 422)**:

```json
{
  "success": false,
  "message": "This version already exists for ios",
  "code": "VERSION_EXISTS"
}
```

**Error Response - Validation Error (HTTP 422)**:

```json
{
  "success": false,
  "message": "Validation failed",
  "code": "VALIDATION_ERROR",
  "errors": {
    "version": ["The version format is invalid. Use semantic versioning: X.Y.Z"]
  }
}
```

---

### 3. List All App Versions (ADMIN ONLY)

**Endpoint**: `GET /api/admin/app-versions`

**Authentication**: Required - must be admin user

**Purpose**: View all app versions grouped by platform

**Response (HTTP 200)**:

```json
{
  "success": true,
  "data": {
    "ios": {
      "platform": "ios",
      "latest": {
        "id": 42,
        "platform": "ios",
        "version": "2.1.0",
        "force_update": true,
        "download_url": "https://apps.apple.com/app/ewan/id1234567890",
        "release_notes": "Critical security fix",
        "created_at": "2026-02-04T10:30:00Z"
      },
      "history": [
        {
          "id": 42,
          "version": "2.1.0",
          "force_update": true,
          "created_at": "2026-02-04T10:30:00Z"
        },
        {
          "id": 40,
          "version": "2.0.5",
          "force_update": false,
          "created_at": "2026-01-28T09:15:00Z"
        }
      ]
    },
    "android": {
      "platform": "android",
      "latest": {
        "id": 41,
        "platform": "android",
        "version": "2.0.5",
        "force_update": false,
        "download_url": "https://play.google.com/store/apps/details?id=com.ewan.app",
        "release_notes": "Performance improvements",
        "created_at": "2026-02-02T14:20:00Z"
      },
      "history": [...]
    }
  }
}
```

---

### 4. Update App Version (ADMIN ONLY)

**Endpoint**: `PUT /api/admin/app-versions/{id}`

**Authentication**: Required - must be admin user

**Purpose**: Update an existing app version (e.g., change force_update status)

**URL Parameters**:
| Parameter | Type | Example |
|-----------|------|---------|
| id | integer | 42 |

**Request Body** (all fields optional):
```json
{
  "force_update": false,
  "download_url": "https://apps.apple.com/app/ewan/id1234567890",
  "release_notes": "Updated release notes"
}
```

**Success Response (HTTP 200)**:

```json
{
  "success": true,
  "message": "App version updated successfully",
  "data": {
    "id": 42,
    "platform": "ios",
    "version": "2.1.0",
    "force_update": false,
    "download_url": "https://apps.apple.com/app/ewan/id1234567890",
    "release_notes": "Updated release notes",
    "created_at": "2026-02-04T10:30:00Z",
    "updated_at": "2026-02-04T11:45:00Z"
  }
}
```

**Error Response - Not Found (HTTP 404)**:

```json
{
  "success": false,
  "message": "App version not found",
  "code": "NOT_FOUND"
}
```

---

## Mobile App Integration

### Flutter Example

#### 1. Check for Updates on App Launch

```dart
import 'package:http/http.dart' as http;
import 'dart:convert';

class AppVersionService {
  static const String API_URL = 'https://api.ewan.com';
  
  // Get current app version from pubspec.yaml or constants
  static const String CURRENT_VERSION = '1.5.0';
  static const String PLATFORM = 'android'; // or 'ios'
  
  /// Check if update is available
  static Future<void> checkForUpdates() async {
    try {
      final response = await http.get(
        Uri.parse('$API_URL/api/config?platform=$PLATFORM'),
      );
      
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        
        if (data['success']) {
          final versionData = data['data'];
          
          // Check if force update is required
          if (versionData['force_update'] == true) {
            _showForceUpdateDialog(versionData);
          } else if (versionData['version'] != CURRENT_VERSION) {
            _showOptionalUpdateDialog(versionData);
          }
        }
      }
    } catch (e) {
      print('Error checking for updates: $e');
      // Silently fail - don't block app launch
    }
  }
  
  /// Show force update dialog
  static void _showForceUpdateDialog(Map<String, dynamic> versionData) {
    showDialog(
      context: navigatorKey.currentContext!,
      barrierDismissible: false,
      builder: (context) => AlertDialog(
        title: Text('Update Required'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(versionData['message'] ?? 'Please update to the latest version'),
            SizedBox(height: 8),
            if (versionData['release_notes'] != null)
              Text(
                'Release Notes:\n${versionData['release_notes']}',
                style: TextStyle(fontSize: 12, color: Colors.grey),
              ),
          ],
        ),
        actions: [
          ElevatedButton(
            onPressed: () {
              // Open app store
              _launchAppStore(versionData['download_url']);
              
              // Optionally retry check after delay
              Future.delayed(Duration(seconds: versionData['retry_in_seconds']??30), () {
                checkForUpdates();
              });
            },
            child: Text('Update Now'),
          ),
        ],
      ),
    );
  }
  
  /// Show optional update dialog
  static void _showOptionalUpdateDialog(Map<String, dynamic> versionData) {
    showDialog(
      context: navigatorKey.currentContext!,
      builder: (context) => AlertDialog(
        title: Text('Update Available'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(versionData['message'] ?? 'A new version is available'),
            SizedBox(height: 8),
            if (versionData['release_notes'] != null)
              Text(
                versionData['release_notes'],
                style: TextStyle(fontSize: 12, color: Colors.grey),
              ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: Text('Later'),
          ),
          ElevatedButton(
            onPressed: () {
              _launchAppStore(versionData['download_url']);
            },
            child: Text('Update Now'),
          ),
        ],
      ),
    );
  }
  
  /// Launch app store
  static Future<void> _launchAppStore(String? url) async {
    if (url != null && await canLaunch(url)) {
      await launch(url);
    }
  }
}
```

#### 2. Call on App Launch

```dart
void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // Check for updates on app start
  await AppVersionService.checkForUpdates();
  
  runApp(MyApp());
}
```

#### 3. iOS Implementation

```swift
import Foundation

class AppVersionService {
    static let API_URL = "https://api.ewan.com"
    static let PLATFORM = "ios"
    static let CURRENT_VERSION = "1.5.0"
    
    static func checkForUpdates() {
        let url = URL(string: "\(API_URL)/api/config?platform=\(PLATFORM)")!
        
        URLSession.shared.dataTask(with: url) { data, response, error in
            guard let data = data else { return }
            
            if let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
               let success = json["success"] as? Bool,
               success,
               let versionData = json["data"] as? [String: Any] {
                
                DispatchQueue.main.async {
                    if versionData["force_update"] as? Bool == true {
                        showForceUpdateAlert(versionData)
                    }
                }
            }
        }.resume()
    }
    
    static func showForceUpdateAlert(_ versionData: [String: Any]) {
        let alert = UIAlertController(
            title: "Update Required",
            message: versionData["message"] as? String ?? "Please update",
            preferredStyle: .alert
        )
        
        alert.addAction(UIAlertAction(title: "Update Now", style: .default) { _ in
            if let urlString = versionData["download_url"] as? String,
               let url = URL(string: urlString) {
                UIApplication.shared.open(url)
            }
        })
        
        UIApplication.shared.keyWindow?.rootViewController?.present(alert, animated: true)
    }
}
```

---

## Admin Workflow

### Scenario 1: Critical Security Update

**Step 1: Create Force Update Version**

```bash
curl -X POST "https://api.ewan.com/api/admin/app-versions" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "platform": "android",
    "version": "2.1.0",
    "force_update": true,
    "download_url": "https://play.google.com/store/apps/details?id=com.ewan.app",
    "release_notes": "Critical security fix for payment processing. All users must update immediately."
  }'
```

**Result**: All Android users see "Update Required" dialog with no dismiss option

### Scenario 2: Minor Feature Update

**Step 1: Create Optional Update Version**

```bash
curl -X POST "https://api.ewan.com/api/admin/app-versions" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "platform": "ios",
    "version": "2.0.5",
    "force_update": false,
    "download_url": "https://apps.apple.com/app/ewan/id1234567890",
    "release_notes": "- New language support (French)\n- Performance improvements\n- Bug fixes"
  }'
```

**Result**: iOS users see "Update Available" dialog with "Later" option

### Scenario 3: Downgrade Force Update to Optional

```bash
curl -X PUT "https://api.ewan.com/api/admin/app-versions/42" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "force_update": false,
    "release_notes": "Updated: Users can now skip this update"
  }'
```

**Result**: Users can now dismiss the update dialog

---

## Database Seeding

### Laravel Seeding Example

```php
// database/seeders/AppVersionSeeder.php

namespace Database\Seeders;

use App\Models\AppVersion;
use Illuminate\Database\Seeder;

class AppVersionSeeder extends Seeder
{
    public function run()
    {
        AppVersion::create([
            'platform' => 'android',
            'version' => '1.5.0',
            'force_update' => false,
            'download_url' => 'https://play.google.com/store/apps/details?id=com.ewan.app',
            'release_notes' => 'Initial release',
        ]);

        AppVersion::create([
            'platform' => 'ios',
            'version' => '1.5.0',
            'force_update' => false,
            'download_url' => 'https://apps.apple.com/app/ewan/id1234567890',
            'release_notes' => 'Initial release',
        ]);
    }
}
```

```bash
php artisan db:seed --class=AppVersionSeeder
```

---

## HTTP Status Codes

| Code | Scenario |
|------|----------|
| 200 | Config retrieved successfully (force update or no update needed) |
| 201 | App version created successfully |
| 400 | Invalid platform or bad request |
| 404 | App version not found |
| 422 | Validation error (e.g., invalid version format) |
| 500 | Server error |

---

## Best Practices

### For Admins

1. ✅ **Test Before Force Update**: Use optional update first, monitor errors
2. ✅ **Clear Release Notes**: Explain why update is needed
3. ✅ **Include Download Link**: Make it easy for users to find the app
4. ✅ **Semantic Versioning**: Always use X.Y.Z format (1.0.0, 2.1.3, etc.)
5. ✅ **Announce Updates**: Let users know via in-app notification or email

### For Mobile Developers

1. ✅ **Call on Startup**: Check for updates when app launches
2. ✅ **Cache Response**: Don't check every time, cache for 24 hours
3. ✅ **Graceful Degradation**: Don't block if check fails
4. ✅ **Show Release Notes**: Let users know what changed
5. ✅ **Respect Force Update**: Don't bypass force update requirement

---

## Logging

All requests are logged for auditing:

```
[2026-02-04 10:30:00] App config request
  platform: android
  user_agent: Flutter/2.x
  ip: 192.168.1.1

[2026-02-04 10:30:15] Force update required
  platform: android
  version: 2.1.0

[2026-02-04 10:35:00] New app version created
  platform: ios
  version: 2.1.0
  force_update: true
```

---

## Troubleshooting

### Problem: Users not seeing force update
- ✅ Verify `force_update` is `true`
- ✅ Verify platform matches (ios/android)
- ✅ Check that version number is different from current app
- ✅ Verify download URL is accessible

### Problem: Old app version not appearing in config
- ✅ This is expected - only latest version per platform is returned
- ✅ Use `/api/admin/app-versions` to view all versions

### Problem: Can't create version with same number
- ✅ Versions must be unique per platform
- ✅ If you need to update notes, use PUT endpoint instead

---

## Summary

✅ **Public `/api/config` endpoint**: No auth needed, apps poll this for updates  
✅ **Force update support**: Admin can require immediate update  
✅ **Platform-specific**: Different versions for iOS and Android  
✅ **Admin management**: Full CRUD for managing versions  
✅ **Comprehensive logging**: Track all config requests  
✅ **Mobile integration ready**: Flutter and iOS examples included  

