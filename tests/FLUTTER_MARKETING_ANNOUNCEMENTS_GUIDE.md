# Flutter Guide: Marketing Popups & Event Announcements
# دليل تكامل الإعلانات والفعاليات المنبثقة في تطبيق فلاتر (Flutter)

This guide provides everything needed to display targeted marketing popups (for **Students**, **Teachers**, or **Both**) in your Flutter app, including event registration, link opening with action buttons, close actions, and click tracking.

---

## 1. Architecture & Flow Overview

```
┌─────────────────────────────────┐       ┌──────────────────────────────────────┐
│        Admin Dashboard          │       │             Flutter App              │
│  (Create event, link, button)   │       │ (Student / Teacher App Launch)       │
└────────────────┬────────────────┘       └──────────────────┬───────────────────┘
                 │                                           │
                 │ POST /api/admin/marketing-announcements   │ GET /api/marketing-announcements/active
                 ▼                                           │ ?platform=app&role=student
┌─────────────────────────────────┐                          ▼
│          Laravel API            │ ◄────────────────────────┘
│    (Target Role & Platform)     │
└────────────────┬────────────────┘
                 │ Returns active announcement (Title, Text, Button, Link, Image)
                 ▼
┌─────────────────────────────────┐
│     Flutter Popup Dialog        │
│  - Event Image (Optional)       │
│  - Event Title & Text           │
│  - Action Button (Opens URL)    │───► URL Launcher (Registration / Event Link)
│  - Close Button (Dismiss)       │───► Dismiss & remember "Don't show again today"
└─────────────────────────────────┘
```

---

## 2. API Endpoints Reference

### A) Fetch Active Announcements for App
- **Endpoint**: `GET /api/marketing-announcements/active`
- **Query Parameters**:
  - `platform`: `app` (always pass `app` from Flutter)
  - `role`: `student` | `teacher` | `both` (optional if token is provided; the backend automatically identifies the role of authenticated users)
- **Headers**:
  ```http
  Accept: application/json
  Authorization: Bearer <SANCTUM_TOKEN> (Optional - guest users can also receive guest announcements)
  ```

#### Example Response (HTTP 200):
```json
{
  "success": true,
  "message": "Active marketing announcements retrieved successfully",
  "data": {
    "platform": "app",
    "role": "student",
    "count": 1,
    "primary": {
      "id": 5,
      "title": "ورشة عمل تفاعلية للطلاب",
      "description": "انضم إلينا في ورشة عمل حصرية لتطوير مهارات التحدث والتأسيس الأكاديمي مع نخبة من أفضل المعلمين. المقاعد محدودة!",
      "link_url": "https://ewan-geniuses.com/events/workshop-2026",
      "button_text": "سجل الآن",
      "close_button_text": "إغلاق",
      "image_url": "https://your-domain.com/storage/marketing_announcements/banner.jpg",
      "target_role": "student",
      "platform": "both",
      "starts_at": "2026-10-17T00:00:00Z",
      "expires_at": "2026-10-31T23:59:59Z",
      "display_order": 1
    },
    "announcements": [
      {
        "id": 5,
        "title": "ورشة عمل تفاعلية للطلاب",
        "description": "انضم إلينا في ورشة عمل حصرية لتطوير مهارات التحدث والتأسيس الأكاديمي مع نخبة من أفضل المعلمين. المقاعد محدودة!",
        "link_url": "https://ewan-geniuses.com/events/workshop-2026",
        "button_text": "سجل الآن",
        "close_button_text": "إغلاق",
        "image_url": "https://your-domain.com/storage/marketing_announcements/banner.jpg",
        "target_role": "student",
        "platform": "both",
        "display_order": 1
      }
    ]
  }
}
```

---

### B) Track Action Button Click
- **Endpoint**: `POST /api/marketing-announcements/{id}/click`
- Call this endpoint when the student/teacher clicks the Action Button ("سجل الآن" / "Register Now") before opening the browser.

### C) Track View / Impression (Optional)
- **Endpoint**: `POST /api/marketing-announcements/{id}/view`
- Call this endpoint when the dialog is shown to the user.

---

## 3. Flutter Implementation Files

### Step 1: Add Dependencies
In your Flutter project's `pubspec.yaml`:
```yaml
dependencies:
  flutter:
    sdk: flutter
  http: ^1.2.0            # Or dio: ^5.4.0
  url_launcher: ^6.3.0    # To open the link in browser / app
  shared_preferences: ^2.2.0 # To avoid showing the same popup repeatedly on every restart
  cached_network_image: ^3.3.1 # (Optional for smooth image loading)
```

Run:
```bash
flutter pub get
```

---

### Step 2: Create Data Model
Create `lib/models/marketing_announcement_model.dart`:

```dart
class MarketingAnnouncementModel {
  final int id;
  final String title;
  final String description;
  final String linkUrl;
  final String buttonText;
  final String closeButtonText;
  final String? imageUrl;
  final String targetRole;
  final String platform;
  final String? startsAt;
  final String? expiresAt;
  final int displayOrder;

  MarketingAnnouncementModel({
    required this.id,
    required this.title,
    required this.description,
    required this.linkUrl,
    required this.buttonText,
    required this.closeButtonText,
    this.imageUrl,
    required this.targetRole,
    required this.platform,
    this.startsAt,
    this.expiresAt,
    this.displayOrder = 0,
  });

  factory MarketingAnnouncementModel.fromJson(Map<String, dynamic> json) {
    return MarketingAnnouncementModel(
      id: json['id'] is int ? json['id'] : int.tryParse(json['id'].toString()) ?? 0,
      title: json['title'] ?? '',
      description: json['description'] ?? '',
      linkUrl: json['link_url'] ?? '',
      buttonText: json['button_text']?.toString().isNotEmpty == true
          ? json['button_text']
          : 'سجل الآن',
      closeButtonText: json['close_button_text']?.toString().isNotEmpty == true
          ? json['close_button_text']
          : 'إغلاق',
      imageUrl: json['image_url'],
      targetRole: json['target_role'] ?? 'both',
      platform: json['platform'] ?? 'both',
      startsAt: json['starts_at'],
      expiresAt: json['expires_at'],
      displayOrder: json['display_order'] is int
          ? json['display_order']
          : int.tryParse(json['display_order']?.toString() ?? '0') ?? 0,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'description': description,
      'link_url': linkUrl,
      'button_text': buttonText,
      'close_button_text': closeButtonText,
      'image_url': imageUrl,
      'target_role': targetRole,
      'platform': platform,
      'starts_at': startsAt,
      'expires_at': expiresAt,
      'display_order': displayOrder,
    };
  }
}
```

---

### Step 3: Create API Service
Create `lib/services/marketing_announcement_service.dart`:

```dart
import 'dart:convert';
import 'package:http/http.dart' as http;
import '../models/marketing_announcement_model.dart';

class MarketingAnnouncementService {
  // Replace with your base URL (e.g., https://your-backend.com/api)
  final String baseUrl;
  final String? authToken;

  MarketingAnnouncementService({
    required this.baseUrl,
    this.authToken,
  });

  Map<String, String> get _headers => {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        if (authToken != null && authToken!.isNotEmpty)
          'Authorization': 'Bearer $authToken',
      };

  /// Fetch active announcement for current user role and mobile platform
  Future<MarketingAnnouncementModel?> getPrimaryAnnouncement({
    String role = 'student', // 'student' or 'teacher'
  }) async {
    try {
      final uri = Uri.parse('$baseUrl/marketing-announcements/active').replace(
        queryParameters: {
          'platform': 'app',
          'role': role,
        },
      );

      final response = await http.get(uri, headers: _headers);

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        if (data['success'] == true && data['data'] != null) {
          final primary = data['data']['primary'];
          if (primary != null) {
            return MarketingAnnouncementModel.fromJson(primary);
          }
        }
      }
      return null;
    } catch (e) {
      print('Error fetching marketing announcement: $e');
      return null;
    }
  }

  /// Track when the user clicks the action link button
  Future<void> trackClick(int id) async {
    try {
      final url = Uri.parse('$baseUrl/marketing-announcements/$id/click');
      await http.post(url, headers: _headers);
    } catch (_) {}
  }

  /// Track when the popup is shown to the user
  Future<void> trackView(int id) async {
    try {
      final url = Uri.parse('$baseUrl/marketing-announcements/$id/view');
      await http.post(url, headers: _headers);
    } catch (_) {}
  }
}
```

---

### Step 4: Create Flutter Dialog Widget
Create `lib/widgets/marketing_popup_dialog.dart`:

```dart
import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/marketing_announcement_model.dart';
import '../services/marketing_announcement_service.dart';

class MarketingPopupDialog extends StatelessWidget {
  final MarketingAnnouncementModel announcement;
  final MarketingAnnouncementService service;

  const MarketingPopupDialog({
    Key? key,
    required this.announcement,
    required this.service,
  }) : super(key: key);

  static Future<void> showIfAvailable({
    required BuildContext context,
    required MarketingAnnouncementService service,
    required String role, // 'student' or 'teacher'
    bool showOncePerDay = true,
  }) async {
    // 1. Fetch active announcement
    final announcement = await service.getPrimaryAnnouncement(role: role);
    if (announcement == null) return;

    // 2. Check if user already dismissed it today
    if (showOncePerDay) {
      final prefs = await SharedPreferences.getInstance();
      final key = 'marketing_dismissed_${announcement.id}_${DateTime.now().toIso8601String().substring(0, 10)}';
      if (prefs.getBool(key) == true) {
        return; // Already seen and dismissed today
      }
    }

    if (!context.mounted) return;

    // 3. Track view impression
    service.trackView(announcement.id);

    // 4. Show Dialog
    showDialog(
      context: context,
      barrierDismissible: true,
      builder: (_) => MarketingPopupDialog(
        announcement: announcement,
        service: service,
      ),
    );
  }

  Future<void> _handleActionClick(BuildContext context) async {
    // 1. Track click counter on server
    service.trackClick(announcement.id);

    // 2. Close Dialog
    Navigator.of(context).pop();

    // 3. Launch the Event Link URL
    final uri = Uri.parse(announcement.linkUrl);
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('تعذر فتح الرابط المطلوب')),
      );
    }
  }

  Future<void> _handleDismiss(BuildContext context) async {
    // Remember dismissal for today
    final prefs = await SharedPreferences.getInstance();
    final key = 'marketing_dismissed_${announcement.id}_${DateTime.now().toIso8601String().substring(0, 10)}';
    await prefs.setBool(key, true);

    if (context.mounted) {
      Navigator.of(context).pop();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Dialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      elevation: 8,
      clipBehavior: Clip.antiAlias,
      insetPadding: const EdgeInsets.symmetric(horizontal: 24, vertical: 24),
      child: ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: 400),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Optional Banner Image
            if (announcement.imageUrl != null && announcement.imageUrl!.isNotEmpty)
              Stack(
                children: [
                  Image.network(
                    announcement.imageUrl!,
                    height: 180,
                    width: double.infinity,
                    fit: BoxFit.cover,
                    errorBuilder: (_, __, ___) => const SizedBox.shrink(),
                  ),
                  Positioned(
                    top: 8,
                    right: 8,
                    child: CircleAvatar(
                      backgroundColor: Colors.black.withOpacity(0.4),
                      radius: 16,
                      child: IconButton(
                        icon: const Icon(Icons.close, color: Colors.white, size: 18),
                        padding: EdgeInsets.zero,
                        onPressed: () => _handleDismiss(context),
                      ),
                    ),
                  ),
                ],
              )
            else
              // Gradient Header if no image
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                decoration: const BoxDecoration(
                  gradient: LinearGradient(
                    colors: [Color(0xFF2563EB), Color(0xFF1D4ED8)],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Icon(Icons.campaign_rounded, color: Colors.white, size: 28),
                    IconButton(
                      icon: const Icon(Icons.close, color: Colors.white, size: 22),
                      onPressed: () => _handleDismiss(context),
                    ),
                  ],
                ),
              ),

            // Content Area
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 18, 20, 20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  // Title
                  Text(
                    announcement.title,
                    textAlign: TextAlign.center,
                    style: const TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: Color(0xFF0F172A),
                      height: 1.3,
                    ),
                  ),
                  const SizedBox(height: 12),

                  // Description Text
                  Text(
                    announcement.description,
                    textAlign: TextAlign.center,
                    style: const TextStyle(
                      fontSize: 14,
                      color: Color(0xFF475569),
                      height: 1.5,
                    ),
                  ),
                  const SizedBox(height: 24),

                  // Action Button (Opens the event/link URL)
                  ElevatedButton(
                    onPressed: () => _handleActionClick(context),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF2563EB),
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                      elevation: 0,
                    ),
                    child: Text(
                      announcement.buttonText,
                      style: const TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                  const SizedBox(height: 8),

                  // Dismiss Button
                  TextButton(
                    onPressed: () => _handleDismiss(context),
                    style: TextButton.styleFrom(
                      foregroundColor: const Color(0xFF64748B),
                      padding: const EdgeInsets.symmetric(vertical: 8),
                    ),
                    child: Text(
                      announcement.closeButtonText,
                      style: const TextStyle(fontSize: 13),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
```

---

### Step 5: How to Call in Your Screen (Example: `HomeScreen`)

In your Student Home Screen or Teacher Home Screen:

```dart
import 'package:flutter/material.dart';
import 'services/marketing_announcement_service.dart';
import 'widgets/marketing_popup_dialog.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({Key? key}) : super(key: key);

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  @override
  void initState() {
    super.initState();

    // Check and display active marketing popup after screen renders
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _checkMarketingPopup();
    });
  }

  void _checkMarketingPopup() {
    final service = MarketingAnnouncementService(
      baseUrl: 'https://your-domain.com/api',
      authToken: 'USER_AUTH_TOKEN_HERE', // From SharedPreferences / AuthProvider
    );

    // Specify user role: 'student' or 'teacher'
    MarketingPopupDialog.showIfAvailable(
      context: context,
      service: service,
      role: 'student', // or 'teacher'
      showOncePerDay: true, // Will not show again today once dismissed
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('الصفحة الرئيسية')),
      body: const Center(child: Text('مرحباً بك في منصة إيوان التعليمية')),
    );
  }
}
```

---

## 4. Admin Dashboard Usage

1. Open **Admin Dashboard**.
2. From the sidebar under **النظام والإعدادات (System & Settings)**, click **الإعلانات والفعاليات المنبثقة (Marketing Popups & Events)**.
3. Click **إضافة إعلان جديد (Add New Announcement)**.
4. Fill in:
   - **العنوان (Title)**: e.g., `ورشة عمل تفاعلية للطلاب`
   - **الوصف (Description)**: Event text and details
   - **الرابط (Link URL)**: Registration link (e.g., `https://ewan-geniuses.com/register-event`)
   - **نص زر الرابط (Button Text)**: `سجل الآن` or `احجز مقعدك`
   - **نص زر الإغلاق (Close Text)**: `إغلاق` or `تخطي`
   - **الجمهور المستهدف (Audience)**: `الطلاب فقط (Students)` / `المعلمون فقط (Teachers)` / `الجميع (Both)`
   - **المنصة (Platform)**: `تطبيق الموبايل (Flutter)` or `الموبايل والويب معاً`
   - **الصورة (Image)**: Optional poster / banner
5. Click **حفظ الإعلان (Save Announcement)**.
6. The announcement is immediately live for all targeted mobile app users!
