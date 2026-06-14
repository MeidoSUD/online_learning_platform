const { RtcTokenBuilder, RtcRole, ChatTokenBuilder } = require('agora-token');

// ==========================================
// 1. ADD YOUR CREDENTIALS HERE
// ==========================================
const appId = '3a77d1a600964e9bb4aae8b0dd59f157';             // Replace with your App ID
const appCertificate = '9a4c340069a64d09903cfe8e263a8366'; // Replace with your App Certificate

// ==========================================
// 2. MOCK DATABASE DATA
// ==========================================
const channelName = 'session_43';
const videoUid = 0; // Using 0 for random UID or pass integer like 12345
const chatUserId = 'student_20'; 
const chatRoomId = '2245910301'; // ID generated from REST API

const role = RtcRole.PUBLISHER;
const expirationTimeInSeconds = 3600;
const currentTimestamp = Math.floor(Date.now() / 1000);
const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

// ==========================================
// 3. GENERATE TOKENS
// ==========================================

// A. Generate Video (RTC) Token
let rtcVideoToken;
try {
    rtcVideoToken = RtcTokenBuilder.buildTokenWithUid(
        appId, 
        appCertificate, 
        channelName, 
        videoUid, 
        role, 
        privilegeExpiredTs
    );
} catch (e) {
    rtcVideoToken = "Please_put_valid_app_id_and_certificate";
}

// B. Generate Chat (User) Token
let chatUserToken;
try {
    chatUserToken = ChatTokenBuilder.buildUserToken(
        appId, 
        appCertificate, 
        chatUserId, 
        expirationTimeInSeconds
    );
} catch (e) {
    chatUserToken = "Please_put_valid_app_id_and_certificate";
}

// ==========================================
// 4. PRINT JSON RESPONSE
// ==========================================
const response = {
  success: true,
  message: "You can now join the session",
  data: {
    agora: {
      channel: channelName,
      token: rtcVideoToken,
      uid: videoUid.toString(),
      role: "participant",
      expires_in: expirationTimeInSeconds,
      
      chat_room_id: chatRoomId,
      chat_uid: chatUserId,
      chat_token: chatUserToken,
      chat_expires_in: expirationTimeInSeconds
    }
  }
};

console.log(JSON.stringify(response, null, 2));