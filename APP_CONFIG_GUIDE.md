# App Configuration & Version Management System

## Overview

This system allows you to manage mobile app versions, force updates, and maintenance mode through a simple API. The mobile app automatically checks for updates and respects your backend configuration.

## Database Settings

The following settings are stored in the `settings` table with group `app`:

- **app_version_ios**: Current required iOS app version (e.g., "1.0.0")
- **app_version_android**: Current required Android app version (e.g., "1.0.0")
- **force_update_ios**: Boolean flag to force iOS users to update
- **force_update_android**: Boolean flag to force Android users to update
- **maintenance_enabled**: Boolean flag to enable/disable maintenance mode

These are automatically seeded via `SettingsSeeder.php`.

## API Endpoints

### Mobile App Endpoints (Public - No Authentication Required)

#### 1. Get App Configuration
**Endpoint:** `GET /api/app-config`

**Purpose:** Mobile app calls this to check for updates and maintenance status

**Query Parameters:**
- `platform` (required): "ios" or "android"
- `version` (optional): Current app version on user's device

**Example Request:**
```bash
curl -X GET "http://your-app.com/api/app-config?platform=android&version=1.0.0"
```

**Response Example (Update Available):**
```json
{
    "success": true,
    "data": {
        "platform": "android",
        "required_version": "1.0.1",
        "current_version": "1.0.0",
        "force_update": true,
        "maintenance_mode": false,
        "update_available": true,
        "update_message": "A critical update is required. Please update immediately.",
        "action": "FORCE_UPDATE",
        "status": "FORCE_UPDATE_REQUIRED",
        "retry_in_seconds": 30
    },
    "code": "FORCE_UPDATE_REQUIRED"
}
```

**Response Example (No Update Needed):**
```json
{
    "success": true,
    "data": {
        "platform": "android",
        "required_version": "1.0.0",
        "current_version": "1.0.0",
        "force_update": false,
        "maintenance_mode": false,
        "update_available": false,
        "action": "NO_ACTION",
        "status": "UP_TO_DATE"
    },
    "code": "UP_TO_DATE"
}
```

**Response Example (Maintenance Mode):**
```json
{
    "success": true,
    "data": {
        "platform": "android",
        "required_version": "1.0.0",
        "current_version": "1.0.0",
        "force_update": false,
        "maintenance_mode": true,
        "maintenance_message": "The app is currently under maintenance. Please try again later.",
        "update_available": false,
        "action": "NO_ACTION",
        "status": "MAINTENANCE_MODE"
    },
    "code": "MAINTENANCE_MODE"
}
```

#### 2. Get App Settings
**Endpoint:** `GET /api/app-settings`

**Purpose:** Get current app configuration settings

**Example Request:**
```bash
curl -X GET "http://your-app.com/api/app-settings"
```

**Response:**
```json
{
    "success": true,
    "data": {
        "app_name": "ewan",
        "maintenance_enabled": false,
        "app_version_ios": "1.0.0",
        "app_version_android": "1.0.0",
        "force_update_ios": false,
        "force_update_android": false
    },
    "code": "APP_SETTINGS_RETRIEVED"
}
```

---

### Admin Dashboard Endpoints (Authentication Required - Admin Role)

All admin endpoints require authentication and admin role. Add these headers:
```
Authorization: Bearer YOUR_AUTH_TOKEN
```

#### 3. Get App Configuration Settings (Admin View)
**Endpoint:** `GET /api/admin/app-config/settings`

**Authentication:** Required (Admin)

**Purpose:** Admin dashboard endpoint to view current app settings

**Example Request:**
```bash
curl -X GET "http://your-app.com/api/admin/app-config/settings" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response:**
```json
{
    "success": true,
    "data": {
        "app_name": "ewan",
        "maintenance_enabled": false,
        "app_version_ios": "1.0.0",
        "app_version_android": "1.0.0",
        "force_update_ios": false,
        "force_update_android": false
    },
    "code": "APP_SETTINGS_RETRIEVED"
}
```

#### 4. Update App Version
**Endpoint:** `PUT /api/admin/app-config/version`

**Authentication:** Required (Admin)

**Purpose:** Update the required app version for a platform and optionally set force update flag

**Request Body:**
```json
{
    "platform": "android",
    "version": "1.0.1",
    "force_update": true
}
```

**Parameters:**
- `platform` (required): "ios" or "android"
- `version` (required): Version string in format X.Y.Z (e.g., "1.0.1")
- `force_update` (optional): Boolean flag (true/false)

**Example Request:**
```bash
curl -X PUT "http://your-app.com/api/admin/app-config/version" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "platform": "android",
    "version": "1.0.1",
    "force_update": true
  }'
```

**Response:**
```json
{
    "success": true,
    "message": "App version for android updated successfully",
    "data": {
        "platform": "android",
        "version": "1.0.1",
        "force_update": true
    },
    "code": "APP_VERSION_UPDATED"
}
```

#### 5. Toggle Maintenance Mode
**Endpoint:** `PUT /api/admin/app-config/maintenance`

**Authentication:** Required (Admin)

**Purpose:** Enable or disable maintenance mode for the entire app

**Request Body:**
```json
{
    "enabled": true
}
```

**Parameters:**
- `enabled` (required): Boolean (true to enable, false to disable)

**Example Request - Enable Maintenance Mode:**
```bash
curl -X PUT "http://your-app.com/api/admin/app-config/maintenance" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"enabled": true}'
```

**Example Request - Disable Maintenance Mode:**
```bash
curl -X PUT "http://your-app.com/api/admin/app-config/maintenance" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"enabled": false}'
```

**Response:**
```json
{
    "success": true,
    "message": "Maintenance mode enabled",
    "data": {
        "maintenance_enabled": true
    },
    "code": "MAINTENANCE_MODE_UPDATED"
}
```

---

## Implementation in Mobile App

### Flutter Example

```dart
import 'package:http/http.dart' as http;

class AppConfigManager {
  static const String apiUrl = 'https://your-app.com/api';
  
  Future<AppConfig> checkAppConfig({
    required String platform,
    required String currentVersion,
  }) async {
    try {
      final response = await http.get(
        Uri.parse('$apiUrl/app-config?platform=$platform&version=$currentVersion'),
      ).timeout(Duration(seconds: 10));

      if (response.statusCode == 200) {
        final json = jsonDecode(response.body);
        
        if (json['data']['maintenance_mode']) {
          // Show maintenance dialog
          showMaintenanceDialog();
        } else if (json['data']['force_update']) {
          // Show force update dialog
          showForceUpdateDialog(json['data']);
        } else if (json['data']['update_available']) {
          // Show optional update dialog
          showOptionalUpdateDialog(json['data']);
        }
        
        return AppConfig.fromJson(json['data']);
      }
    } catch (e) {
      print('Error checking app config: $e');
    }
  }
}
```

### React Native Example

```javascript
const checkAppConfig = async (platform, version) => {
  try {
    const response = await fetch(
      `${API_URL}/app-config?platform=${platform}&version=${version}`
    );
    const data = await response.json();
    
    if (data.success) {
      const config = data.data;
      
      if (config.maintenance_mode) {
        // Show maintenance alert
        Alert.alert(
          'Maintenance',
          config.maintenance_message
        );
      } else if (config.force_update) {
        // Show force update alert with retry
        Alert.alert(
          'Update Required',
          config.update_message,
          [
            {
              text: 'Update Now',
              onPress: () => {
                // Redirect to app store
              }
            }
          ]
        );
      } else if (config.update_available) {
        // Show optional update
        Alert.alert(
          'New Update',
          config.update_message,
          [
            { text: 'Update Later', onPress: () => {} },
            {
              text: 'Update Now',
              onPress: () => {
                // Redirect to app store
              }
            }
          ]
        );
      }
      
      return config;
    }
  } catch (error) {
    console.error('Error checking app config:', error);
  }
};
```

---

## Use Cases

### 1. New Version Release with Force Update

**Scenario:** You released version 1.0.1 with critical security fixes

**Steps:**
1. Call `/api/admin/app-config/version` with:
   - platform: "android"
   - version: "1.0.1"
   - force_update: true

2. All Android users will see a forced update notification
3. The app will retry every 30 seconds if user dismisses the dialog
4. Users cannot continue using the app until they update

### 2. Optional Update

**Scenario:** You released version 1.0.1 with minor improvements (non-critical)

**Steps:**
1. Call `/api/admin/app-config/version` with:
   - platform: "android"
   - version: "1.0.1"
   - force_update: false

2. All Android users will see an optional update notification
3. Users can dismiss and continue using the app
4. Update can be done at their convenience

### 3. Enable Maintenance Mode

**Scenario:** You need to perform database maintenance

**Steps:**
1. Call `/api/admin/app-config/maintenance` with:
   - enabled: true

2. All users will see "App is under maintenance" message
3. They won't be able to use app features
4. When done, call the same endpoint with enabled: false

### 4. Check Current Status

**Steps:**
1. Call `/api/admin/app-config/settings` to view current configuration
2. Review all platform versions and flags
3. Make decisions based on current state

---

## Database Seeder

The `SettingsSeeder` class in `database/seeders/SettingsSeeder.php` initializes all app configuration settings:

**To run the seeder:**
```bash
php artisan db:seed --class=SettingsSeeder
```

**Initial values:**
- app_version_ios: "1.0.0"
- app_version_android: "1.0.0"
- maintenance_enabled: false
- force_update_ios: false
- force_update_android: false

---

## Error Handling

### Common Error Responses

**Invalid Platform:**
```json
{
    "success": false,
    "message": "Invalid platform",
    "error": "Platform must be \"ios\" or \"android\"",
    "code": "INVALID_PLATFORM"
}
```

**Invalid Version Format:**
```json
{
    "success": false,
    "message": "The given data was invalid.",
    "errors": {
        "version": ["The version format is invalid"]
    },
    "code": "VALIDATION_ERROR"
}
```

**Server Error:**
```json
{
    "success": false,
    "message": "Failed to retrieve app configuration",
    "error": "Exception message",
    "code": "CONFIG_ERROR"
}
```

---

## Logging

All app configuration changes and checks are logged to `storage/logs/laravel.log`:

- App config requests from mobile devices
- Version updates by admin
- Maintenance mode toggles
- Errors and exceptions

---

## Files Modified/Created

1. **Created:** `/app/Http/Controllers/API/AppConfigController.php`
   - Main controller handling all app config operations

2. **Updated:** `/routes/api.php`
   - Added public routes: `/api/app-config`, `/api/app-settings`
   - Added admin routes: `/api/admin/app-config/*`
   - Imported AppConfigController

3. **Used:** `/database/seeders/SettingsSeeder.php`
   - Already contains all necessary settings

4. **Used:** `/app/Models/Setting.php`
   - Provides methods to get and set settings

---

## Best Practices

1. **Test Before Forcing Update:**
   - Always test your app update thoroughly before setting force_update: true

2. **Gradual Rollout:**
   - Consider marking optional update first, then force update later

3. **Monitor Logs:**
   - Check logs for any configuration-related errors

4. **Maintenance Mode:**
   - Notify users before enabling maintenance mode
   - Use maintenance window during off-peak hours

5. **Version Format:**
   - Always use semantic versioning: X.Y.Z (e.g., 1.0.1)

6. **Platform-Specific:**
   - iOS and Android versions are managed separately
   - This allows for platform-specific release schedules

---

## API Response Status Codes

| Status | Code | Meaning |
|--------|------|---------|
| 200 | UP_TO_DATE | App version is current, no action needed |
| 200 | UPDATE_AVAILABLE | New optional update is available |
| 200 | FORCE_UPDATE_REQUIRED | Critical update required immediately |
| 200 | MAINTENANCE_MODE | App is in maintenance mode |
| 400 | INVALID_PLATFORM | Platform parameter is invalid |
| 500 | CONFIG_ERROR | Server error retrieving config |

---

## Dashboard Integration

To integrate with your admin dashboard, use the admin endpoints to create UI elements that allow:

1. **Version Manager:**
   - Display current versions for iOS and Android
   - Update version numbers
   - Toggle force update flags

2. **Maintenance Mode Toggle:**
   - Simple on/off switch
   - Confirmation dialog before enabling
   - Display current status

3. **Activity Log:**
   - Show recent version updates
   - Show maintenance mode toggles
   - Show who made the changes and when

---

## Summary

- **Public API:** Mobile apps check `/api/app-config` without authentication
- **Admin API:** Admins manage settings via `/api/admin/app-config/*` endpoints
- **Settings Storage:** All config stored in `settings` table with group='app'
- **Version Control:** Separate management for iOS and Android
- **Force Updates:** Can force all users to update with retry mechanism
- **Maintenance Mode:** Temporarily disable app for all users
