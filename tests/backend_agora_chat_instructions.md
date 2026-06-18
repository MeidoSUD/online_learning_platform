# Agora Chat Backend Implementation Guide

This document outlines the step-by-step requirements for the backend server to support the **Agora Chat SDK** integration in the mobile app.

Unlike Agora Video (RTC) where channels are created instantly on the client side, **Agora Chat strictly requires the backend server to register users and create chat rooms via the Agora REST API** before the mobile app can connect.

---

## 🔑 Prerequisites

Before making any requests, the backend needs an **App Token** to authenticate with the Agora REST API, and it must also generate a **User Chat Token** (`chat_token`) to send to the mobile app.

1.  **Generate an App Token (For REST API calls):** 
    *   You need your Agora `appId` and `appCertificate`.
    *   Use the [Agora Server SDK](https://docs.agora.io/en/agora-chat/develop/authentication?platform=android#generate-a-user-token) to generate a Chat App Token.
2.  **Generate a User Chat Token (`chat_token`):**
    *   Your backend code itself generates this token locally using the Agora Server SDK (e.g., PHP, Node.js, Python).
    *   You do **not** fetch this from a REST API. You build it using the user's `chat_uid` (e.g., "student_20").
3.  **API Base URL:** 
    *   `https://a61.chat.agora.io/611424244/1624895`
    *   *This URL is specific to your OrgName (611424244) and AppName (1624895).*

---

## 🛠️ Step 1: Register Users in Agora Chat

Before any user can join a chat room, they must exist in the Agora Chat system. 

**When to do this:** When a user (student/teacher) registers an account on your platform, or the first time they book a session.

*   **Endpoint:** `POST https://a61.chat.agora.io/611424244/1624895/users`
*   **Headers:**
    ```http
    Authorization: Bearer <Your_App_Token>
    Content-Type: application/json
    ```
*   **Body Payload:**
    ```json
    {
      "username": "student_20",  // Must be unique, e.g., "student_{id}"
      "password": "some_secure_password", // Save this if you plan to use password login, otherwise token login is better
      "nickname": "John Doe"
    }
    ```

*Reference: [Agora Docs - Register a User](https://docs.agora.io/en/agora-chat/restful-api/user-management/manage-users?platform=android#register-a-user)*

---

## 🏛️ Step 2: Create a Chat Room

When a new session/meeting is created on your platform, the backend must create an official Chat Room on the Agora servers. 

**When to do this:** Whenever a session is scheduled or started.

*   **Endpoint:** `POST https://a61.chat.agora.io/611424244/1624895/chatrooms`
*   **Headers:**
    ```http
    Authorization: Bearer <Your_App_Token>
    Content-Type: application/json
    ```
*   **Body Payload:**
    ```json
    {
      "name": "session_43", 
      "description": "Chat room for session 43",
      "maxusers": 200,
      "owner": "teacher_5" // The Agora chat username of the creator
    }
    ```
*   **Success Response:**
    The Agora server will respond with the newly created **Chat Room ID**. **You must save this ID in your database linked to the session.**
    ```json
    {
      "data": {
        "id": "2245910301" // SAVE THIS CHAT ROOM ID
      }
    }
    ```

*Reference: [Agora Docs - Create a Chat Room](https://docs.agora.io/en/agora-chat/restful-api/chatroom-management/manage-chatrooms?platform=android#create-a-chat-room)*

---

## 📱 Step 3: Update Mobile App API Response

When the mobile app requests the session details (the endpoint that returns the Agora credentials), you must include the `chat_room_id` and the user's `chat_token`.

The mobile app has already been programmed to look for `chat_room_id` in the JSON response under the `agora` object.

**Required JSON Output from your `/meeting-room` API:**
```json
{
  "success": true,
  "message": "You can now join the session",
  "data": {
    "agora": {
      "channel": "session_43",              // For Video
      "token": "0063a77d...",               // For Video
      "uid": "student_20",                  // For Video
      "role": "participant",                
      "expires_in": 3600,                   
      
      "chat_room_id": "2245910301",         // NEW: The ID you saved in Step 2!
      "chat_uid": "student_20",             // NEW: The username from Step 1
      "chat_token": "0063a77d...",          // NEW: Token generated for Agora Chat
      "chat_expires_in": 3600
    }
  }
}
```

### Summary of Mobile App Flow:
1. The app reads `chat_uid` and `chat_token` to securely log the user into the Agora Chat server.
2. The app reads `chat_room_id` and asks the Agora Server: *"Can I join Chat Room #2245910301?"*
3. Because the backend created it properly in Step 2, the server allows the user in, and they can start sending messages and files!
