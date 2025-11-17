importScripts('https://www.gstatic.com/firebasejs/11.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/11.0.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyB-vwKT_nnbFT1UQykpw7e6VqLSeUVBkTc",
  authDomain: "ewan-geniuses.firebaseapp.com",
  projectId: "ewan-geniuses",
  storageBucket: "ewan-geniuses.firebasestorage.app",
  messagingSenderId: "73208499391",
  appId: "1:73208499391:web:b17fffb8c982ab34644a0a",
  measurementId: "G-EP2J15LZZQ"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function (payload) {
  console.log('📩 Received background message: ', payload);
  
  const notificationTitle = payload.notification?.title || 'New Notification';
  const notificationOptions = {
    body: payload.notification?.body || 'You have a new message',
    icon: payload.notification?.icon || '/logo.png',
    badge: '/logo.png',
    data: payload.data
  };
  
  self.registration.showNotification(notificationTitle, notificationOptions);
});