# Simple Laravel Agora Integration Guide

This guide shows you just the basic PHP/Laravel code needed to:
1. Generate a Video (RTC) Token.
2. Generate a Chat App Token (for admin REST calls).
3. Register a user in Agora Chat via API.
4. Create a Chat Room via API.
5. Generate a Chat User Token.

---

### 1. Generate Video (RTC) Token
```php
use Agora\Tools\AccessToken2;

$appId = "3a77d1a600964e9bb4aae8b0dd59f157";
$appCertificate = "9a4c340069a64d09903cfe8e263a8366";
$channelName = "session_43";
$videoUid = 12345; // Integer User ID
$expireTime = 3600;

$token = new AccessToken2($appId, $appCertificate, $expireTime);
$token->addService(AccessToken2::SERVICE_TYPE_RTC, [
    'channel_name' => $channelName,
    'uid' => $videoUid,
    'privilege' => AccessToken2::PRIVILEGE_RTC_PUBLISHER
]);

$rtcVideoToken = $token->build();
```

---

### 2. Generate Chat App Token (Admin Token)
This token is used in the `Authorization` headers for registering users and creating rooms.
```php
use Agora\Tools\AccessToken2;

$appId = "3a77d1a600964e9bb4aae8b0dd59f157";
$appCertificate = "9a4c340069a64d09903cfe8e263a8366";
$expireTime = 86400; // 24 hours

$token = new AccessToken2($appId, $appCertificate, $expireTime);
$token->addService(AccessToken2::SERVICE_TYPE_CHAT, [
    'privilege' => AccessToken2::PRIVILEGE_CHAT_APP
]);

$chatAppToken = $token->build();
```

---

### 3. Register User in Agora Chat
```php
use Illuminate\Support\Facades\Http;

$chatAppToken = "YOUR_CHAT_APP_TOKEN_FROM_STEP_2";
$chatUsername = "student_20"; // Must be unique string
$nickname = "Hisham";

$response = Http::withToken($chatAppToken)
    ->post("https://a61.chat.agora.io/611424244/1624895/users", [
        'username' => $chatUsername,
        'nickname' => $nickname,
    ]);

if ($response->successful()) {
    // User registered successfully
}
```

---

### 4. Create a Chat Room
```php
use Illuminate\Support\Facades\Http;

$chatAppToken = "YOUR_CHAT_APP_TOKEN_FROM_STEP_2";
$roomName = "session_43";
$ownerUsername = "teacher_5"; // Owner must be registered in Agora Chat

$response = Http::withToken($chatAppToken)
    ->post("https://a61.chat.agora.io/611424244/1624895/chatrooms", [
        'name' => $roomName,
        'description' => "Chat room for session 43",
        'maxusers' => 200,
        'owner' => $ownerUsername,
    ]);

if ($response->successful()) {
    $roomId = $response->json('data.id'); // Save this in your database!
}
```

---

### 5. Generate Chat User Token
This token is sent to the mobile client so they can log in to the Chat SDK.
```php
use Agora\Tools\AccessToken2;

$appId = "3a77d1a600964e9bb4aae8b0dd59f157";
$appCertificate = "9a4c340069a64d09903cfe8e263a8366";
$chatUsername = "student_20";
$expireTime = 3600;

$token = new AccessToken2($appId, $appCertificate, $expireTime);
$token->addService(AccessToken2::SERVICE_TYPE_CHAT, [
    'user_id' => $chatUsername,
    'privilege' => AccessToken2::PRIVILEGE_CHAT_USER
]);

$chatUserToken = $token->build();
```
