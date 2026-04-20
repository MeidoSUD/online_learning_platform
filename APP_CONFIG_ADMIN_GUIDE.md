# App Config Admin Dashboard - Quick Reference

## API Endpoints Summary

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/app-config` | Check for updates (Mobile) | ❌ |
| GET | `/api/app-settings` | Get current settings (Mobile) | ❌ |
| GET | `/api/admin/app-config/settings` | View settings (Admin) | ✅ |
| PUT | `/api/admin/app-config/version` | Update version (Admin) | ✅ |
| PUT | `/api/admin/app-config/maintenance` | Toggle maintenance (Admin) | ✅ |

---

## Quick Examples

### 1. Check Current Settings
```bash
curl -X GET "http://localhost/api/admin/app-config/settings" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 2. Update iOS Version to 1.2.0 (Optional Update)
```bash
curl -X PUT "http://localhost/api/admin/app-config/version" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "platform": "ios",
    "version": "1.2.0",
    "force_update": false
  }'
```

### 3. Force Android Users to Update to 2.0.0 (Critical Update)
```bash
curl -X PUT "http://localhost/api/admin/app-config/version" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "platform": "android",
    "version": "2.0.0",
    "force_update": true
  }'
```

### 4. Enable Maintenance Mode
```bash
curl -X PUT "http://localhost/api/admin/app-config/maintenance" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"enabled": true}'
```

### 5. Disable Maintenance Mode
```bash
curl -X PUT "http://localhost/api/admin/app-config/maintenance" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"enabled": false}'
```

### 6. Mobile App Checks for Updates
```bash
# Android device with version 1.0.0
curl "http://localhost/api/app-config?platform=android&version=1.0.0"

# iOS device with version 1.1.0
curl "http://localhost/api/app-config?platform=ios&version=1.1.0"
```

---

## Dashboard UI Components to Build

### 1. Version Manager Panel
```
┌─────────────────────────────────────┐
│       APP VERSION MANAGER            │
├─────────────────────────────────────┤
│                                      │
│  iOS Version:                        │
│  [Current: 1.0.0] [1.2.0] [UPDATE]  │
│  ☐ Force Update                      │
│                                      │
│  Android Version:                    │
│  [Current: 1.0.0] [1.2.0] [UPDATE]  │
│  ☐ Force Update                      │
│                                      │
└─────────────────────────────────────┘
```

### 2. Maintenance Mode Toggle
```
┌─────────────────────────────────────┐
│     MAINTENANCE MODE                 │
├─────────────────────────────────────┤
│                                      │
│  Status: [OFF] ⚙️ [Toggle]           │
│                                      │
│  ⚠️  When ON, users see:             │
│  "App is under maintenance. Try later"│
│                                      │
│  [Enable] [Disable]                  │
│                                      │
└─────────────────────────────────────┘
```

### 3. Current Status Display
```
┌─────────────────────────────────────┐
│        CURRENT STATUS                │
├─────────────────────────────────────┤
│                                      │
│  Maintenance Mode: OFF  ✓             │
│  iOS Version: 1.0.0                  │
│  iOS Force Update: OFF  ✓            │
│  Android Version: 1.0.0              │
│  Android Force Update: OFF  ✓        │
│                                      │
│  Last Updated: 2 hours ago           │
│  Updated by: admin@app.com           │
│                                      │
└─────────────────────────────────────┘
```

---

## Implementation Steps

### For Admin Dashboard Developer:

1. **Create Settings Fetch Function**
   - Call `/api/admin/app-config/settings` on page load
   - Display current configuration

2. **Create Update Version Form**
   - Input platform selector (iOS/Android)
   - Input version field (validate X.Y.Z format)
   - Checkbox for force update
   - Submit button calls `/api/admin/app-config/version`

3. **Create Maintenance Toggle**
   - Simple ON/OFF switch
   - Confirmation dialog before enabling
   - Display status and last changed info

4. **Create Activity Log**
   - Use Laravel audit logs from `storage/logs/laravel.log`
   - Show recent changes with timestamps
   - Show which admin made the change

5. **Add Success Notifications**
   - Show toast/alert on successful update
   - Show error messages on failure

---

## Code Example - Admin Dashboard Integration (Vue.js)

```vue
<template>
  <div class="app-config-dashboard">
    <!-- Status Display -->
    <div class="status-card">
      <h3>Current Configuration</h3>
      <div v-if="settings">
        <p>iOS Version: {{ settings.app_version_ios }}</p>
        <p>Android Version: {{ settings.app_version_android }}</p>
        <p>Maintenance Mode: {{ settings.maintenance_enabled ? 'ON' : 'OFF' }}</p>
      </div>
    </div>

    <!-- Version Update Form -->
    <div class="version-form">
      <h3>Update App Version</h3>
      <form @submit.prevent="updateVersion">
        <select v-model="formData.platform" required>
          <option value="">Select Platform</option>
          <option value="ios">iOS</option>
          <option value="android">Android</option>
        </select>
        
        <input 
          v-model="formData.version" 
          type="text" 
          placeholder="1.0.0" 
          required
        />
        
        <label>
          <input v-model="formData.force_update" type="checkbox" />
          Force Update
        </label>
        
        <button type="submit">Update Version</button>
      </form>
    </div>

    <!-- Maintenance Mode Toggle -->
    <div class="maintenance-card">
      <h3>Maintenance Mode</h3>
      <button @click="toggleMaintenance">
        {{ settings?.maintenance_enabled ? 'Disable' : 'Enable' }} Maintenance
      </button>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      settings: null,
      formData: {
        platform: '',
        version: '',
        force_update: false
      }
    }
  },
  
  mounted() {
    this.fetchSettings();
  },

  methods: {
    async fetchSettings() {
      try {
        const response = await fetch('/api/admin/app-config/settings', {
          headers: {
            'Authorization': `Bearer ${this.$store.state.authToken}`
          }
        });
        const data = await response.json();
        if (data.success) {
          this.settings = data.data;
        }
      } catch (error) {
        console.error('Error fetching settings:', error);
      }
    },

    async updateVersion() {
      try {
        const response = await fetch('/api/admin/app-config/version', {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${this.$store.state.authToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(this.formData)
        });
        const data = await response.json();
        
        if (data.success) {
          alert('Version updated successfully!');
          this.fetchSettings();
          this.resetForm();
        } else {
          alert('Error: ' + data.message);
        }
      } catch (error) {
        console.error('Error updating version:', error);
      }
    },

    async toggleMaintenance() {
      const enabled = !this.settings.maintenance_enabled;
      
      if (!confirm(`Are you sure you want to ${enabled ? 'enable' : 'disable'} maintenance mode?`)) {
        return;
      }

      try {
        const response = await fetch('/api/admin/app-config/maintenance', {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${this.$store.state.authToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ enabled })
        });
        const data = await response.json();
        
        if (data.success) {
          alert('Maintenance mode updated!');
          this.fetchSettings();
        } else {
          alert('Error: ' + data.message);
        }
      } catch (error) {
        console.error('Error toggling maintenance:', error);
      }
    },

    resetForm() {
      this.formData = {
        platform: '',
        version: '',
        force_update: false
      };
    }
  }
}
</script>
```

---

## Workflow Example

### Release a New Version with Force Update

1. **Admin opens Dashboard**
   - Current iOS: 1.0.0, Android: 1.0.0

2. **Admin Tests New App**
   - Release build version 1.1.0 on App Store/Google Play

3. **Admin Updates Configuration**
   - Platform: Android
   - Version: 1.1.0
   - Force Update: ✓ (checked)
   - Click "Update Version"

4. **Android Users See Update Request**
   - Next time they open app, `/api/app-config` returns:
   - status: "FORCE_UPDATE_REQUIRED"
   - Can retry every 30 seconds

5. **Admin Later Updates iOS**
   - Platform: iOS
   - Version: 1.1.0
   - Force Update: (checked or unchecked)
   - Click "Update Version"

6. **Review History**
   - Dashboard shows all changes
   - When was version updated, who updated it

---

## Testing

### Test with cURL or Postman

1. **Get current settings**
   - Check what's in database currently

2. **Update version**
   - Change Android to 1.5.0 with force_update=true
   - Verify settings updated

3. **Mobile app check**
   - Call `/api/app-config?platform=android&version=1.0.0`
   - Should return FORCE_UPDATE_REQUIRED

4. **Enable maintenance**
   - Call maintenance endpoint with enabled=true
   - All mobile requests should return MAINTENANCE_MODE status

5. **Disable maintenance**
   - Call maintenance endpoint with enabled=false
   - Normal operation resumes

---

## Troubleshooting

### Version not updating
- Check authentication token is valid
- Verify admin role is assigned to user
- Check app/Models/Setting.php uses correct column names

### Maintenance mode not showing on mobile
- Verify platform parameter is lowercase: "ios" or "android"
- Check mobile app logic calls getConfig on startup

### Mobile app not checking for updates
- Ensure mobile app calls `/api/app-config` with platform and version
- Verify version format is X.Y.Z (e.g., 1.0.0)

---

## Support

For full documentation, see: `APP_CONFIG_GUIDE.md`
