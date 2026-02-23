# Server Storage 404 Fix Guide

## Problem
Files upload successfully to the server, but when accessing the URL you get 404 - File Not Found

## Root Causes & Solutions

### Solution 1: Create Storage Symlink (Most Common)

The most common issue is that the symbolic link from `public/storage` to `storage/app/public` doesn't exist on your server.

**SSH into your server and run:**

```bash
cd /path/to/your/laravel/app
php artisan storage:link
```

This will create a symbolic link:
```
public/storage -> storage/app/public
```

**Verify it worked:**
```bash
ls -la public/ | grep storage
# Should show: storage -> /path/to/storage/app/public
```

---

### Solution 2: Check File Permissions

If the symlink exists but still getting 404, check file permissions.

**SSH into your server:**

```bash
# Check storage directory permissions
ls -la storage/app/public/

# Files should be readable by web server user (usually www-data or nobody)
# Make writable by web server:
sudo chown -R www-data:www-data storage/
sudo chown -R www-data:www-data bootstrap/cache

# Set correct permissions
sudo chmod -R 755 storage/
sudo chmod -R 755 bootstrap/cache
```

---

### Solution 3: Check Web Server Configuration

#### For Apache:

Make sure `.htaccess` in `public/` allows access to storage symlink.

Edit `public/.htaccess`:

```apache
<IfModule mod_rewrite.c>
    <IfModule mod_negotiation.c>
        Options -MultiViews -Indexes
    </IfModule>

    RewriteEngine On

    # Handle Authorization Header
    RewriteCond %{HTTP:Authorization} .
    RewriteRule .* - [E=HTTP_AUTHORIZATION:%{HTTP:Authorization}]

    # Redirect to front controller...
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteRule ^(.*)$ index.php/$1 [L]
</IfModule>
```

#### For Nginx:

Make sure your nginx config points to the `public` folder:

```nginx
server {
    listen 80;
    server_name portal.ewan-geniuses.com;

    root /path/to/your/laravel/app/public;
    index index.php index.html index.htm;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php8.1-fpm.sock;
        fastcgi_index index.php;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
    }

    # Allow access to storage files
    location ~* ^/storage/(.*)$ {
        try_files $uri $uri/ =404;
    }
}
```

---

### Solution 4: Verify URL Format in Database

Check what URL is stored in the database:

```sql
SELECT file_path FROM attachments LIMIT 5;
```

**Should return URLs like:**
```
https://portal.ewan-geniuses.com/storage/profile_photos/filename.jpg
https://portal.ewan-geniuses.com/storage/ads/filename.png
```

If not, the `APP_URL` in your `.env` file is wrong. Update it:

```bash
# SSH into server
cd /path/to/your/laravel/app
nano .env

# Change APP_URL to:
APP_URL=https://portal.ewan-geniuses.com

# Save and clear cache
php artisan config:cache
```

---

### Solution 5: Clear Laravel Cache

After any changes, clear the configuration cache:

```bash
cd /path/to/your/laravel/app

# Clear all caches
php artisan cache:clear
php artisan config:cache
php artisan route:cache
php artisan view:cache

# For development (if in local mode)
php artisan cache:clear
```

---

## Complete Server Setup Script

Run this on your server to fix everything at once:

```bash
#!/bin/bash

# Navigate to your Laravel app
cd /path/to/your/laravel/app

# 1. Create storage symlink if not exists
if [ ! -L public/storage ]; then
    php artisan storage:link
    echo "✓ Storage symlink created"
else
    echo "✓ Storage symlink already exists"
fi

# 2. Fix permissions
sudo chown -R www-data:www-data storage/ bootstrap/cache/
sudo chmod -R 755 storage/ bootstrap/cache/
echo "✓ File permissions fixed"

# 3. Clear all caches
php artisan config:cache
php artisan cache:clear
echo "✓ Caches cleared"

# 4. Verify storage directory
ls -la public/storage/
echo "✓ Storage directory ready"

echo ""
echo "✅ Server storage setup complete!"
```

---

## Testing

After applying the fix, test the file access:

**1. Check if symlink works:**
```bash
ls -la /path/to/laravel/app/public/storage/
# Should show profile_photos/, ads/, certificates/, resumes/ directories
```

**2. Check if file exists:**
```bash
ls -la /path/to/laravel/app/storage/app/public/profile_photos/
# Should show uploaded files
```

**3. Test URL in browser:**
```
https://portal.ewan-geniuses.com/storage/profile_photos/filename.jpg
# Should return the image or file
```

**4. Check in database:**
```sql
SELECT * FROM attachments ORDER BY created_at DESC LIMIT 1;
-- Copy the file_path URL and test it in browser
```

---

## Troubleshooting

**Still getting 404?**

```bash
# 1. Check symlink is correct
readlink -f /path/to/laravel/app/public/storage
# Should point to: /path/to/laravel/app/storage/app/public

# 2. Check file permissions
stat /path/to/laravel/app/storage/app/public/profile_photos/
# Should be readable by www-data user

# 3. Check web server error logs
# Apache
tail -f /var/log/apache2/error.log

# Nginx
tail -f /var/log/nginx/error.log

# PHP-FPM
tail -f /var/log/php-fpm.log

# 4. Test manually with curl
curl -I https://portal.ewan-geniuses.com/storage/profile_photos/filename.jpg
```

---

## Quick Checklist

- [ ] SSH into server
- [ ] Run `php artisan storage:link`
- [ ] Check symlink exists: `ls -la public/storage`
- [ ] Fix permissions: `sudo chown -R www-data:www-data storage/`
- [ ] Clear cache: `php artisan config:cache`
- [ ] Test URL in browser
- [ ] Check database for correct file_path URLs

---

## Common Issues

| Issue | Solution |
|-------|----------|
| `ln: failed to create symbolic link` | Run with `sudo`: `sudo php artisan storage:link` |
| `Permission denied` | Fix permissions: `sudo chown -R www-data:www-data storage/` |
| Still 404 after symlink | Restart web server: `sudo systemctl restart nginx` or `sudo systemctl restart apache2` |
| Wrong APP_URL in database | Update `.env` with correct `APP_URL`, then `php artisan config:cache` |
| Files not uploading to server | Check `storage/app/public/` directory exists with correct permissions |

