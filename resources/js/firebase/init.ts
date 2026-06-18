
import { initializeApp } from 'firebase/app';
import { getMessaging, isSupported } from 'firebase/messaging';

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: import.meta.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: import.meta.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.REACT_APP_FIREBASE_APP_ID,
};

// Initialize App (Required for any Firebase service)
const isConfigValid = Object.values(firebaseConfig).every(value => !!value);

let app: any = null;
if (isConfigValid) {
  try {
    app = initializeApp(firebaseConfig);
  } catch (e) {
    console.warn("[Firebase] Initialization failed:", e);
  }
} else {
  console.warn("[Firebase] Missing configuration. Firebase features disabled.");
}

let messaging: any = null;

// Async function to safely get messaging instance
export const getMessagingSafe = async () => {
  if (!app) return null;
  if (messaging) return messaging; // Return existing instance

  try {
    const supported = await isSupported();
    if (supported) {
      messaging = getMessaging(app);
      return messaging;
    } else {
      console.warn("[Firebase] Messaging not supported in this environment (needs HTTPS or valid browser).");
      return null;
    }
  } catch (err) {
    console.warn("[Firebase] Failed to check messaging support:", err);
    return null;
  }
};

// Export VAPID key for easy access in hooks
export const VAPID_KEY = import.meta.env.REACT_APP_FIREBASE_VAPID_KEY;

export { app };
