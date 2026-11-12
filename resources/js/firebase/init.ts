
// @ts-nocheck
import { initializeApp } from 'firebase/app';
import { getMessaging, isSupported } from 'firebase/messaging';
import { getAuth, GoogleAuthProvider, OAuthProvider, signInWithPopup } from 'firebase/auth';

// Firebase configuration from environment variables with safe project defaults
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || import.meta.env.REACT_APP_FIREBASE_API_KEY || 'AIzaSyB-vwKT_nnbFT1UQykpw7e6VqLSeUVBkTc',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || import.meta.env.REACT_APP_FIREBASE_AUTH_DOMAIN || 'ewan-geniuses.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || import.meta.env.REACT_APP_FIREBASE_PROJECT_ID || 'ewan-geniuses',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || import.meta.env.REACT_APP_FIREBASE_STORAGE_BUCKET || 'ewan-geniuses.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || import.meta.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || '73208499391',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || import.meta.env.REACT_APP_FIREBASE_APP_ID || '1:73208499391:web:b17fffb8c982ab34644a0a',
};

// Initialize App (Required for any Firebase service)
const isConfigValid = Object.values(firebaseConfig).every(value => !!value);

let app = null;
if (isConfigValid) {
  try {
    app = initializeApp(firebaseConfig);
  } catch (e) {
    console.warn("[Firebase] Initialization failed:", e);
  }
} else {
  console.warn("[Firebase] Missing configuration. Firebase features disabled.");
}

let messaging = null;

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

// Safely get Firebase Auth instance
export const getAuthSafe = () => {
  if (!app) return null;
  try {
    return getAuth(app);
  } catch (err) {
    console.warn("[Firebase] Auth initialization error:", err);
    return null;
  }
};

/**
 * Embedded Sign-in with Google Popup
 */
export const signInWithGooglePopup = async () => {
  const auth = getAuthSafe();
  if (!auth) {
    throw new Error("Firebase Auth is not configured. Please check your Firebase settings.");
  }

  const provider = new GoogleAuthProvider();
  provider.addScope('email');
  provider.addScope('profile');
  provider.setCustomParameters({ prompt: 'select_account' });

  const result = await signInWithPopup(auth, provider);
  const idToken = await result.user.getIdToken();

  return {
    provider: 'google',
    id_token: idToken,
    email: result.user.email,
    displayName: result.user.displayName,
    photoURL: result.user.photoURL,
    uid: result.user.uid,
  };
};

/**
 * Embedded Sign-in with Apple Popup
 */
export const signInWithApplePopup = async () => {
  const auth = getAuthSafe();
  if (!auth) {
    throw new Error("Firebase Auth is not configured. Please check your Firebase settings.");
  }

  const provider = new OAuthProvider('apple.com');
  provider.addScope('email');
  provider.addScope('name');

  const result = await signInWithPopup(auth, provider);
  const idToken = await result.user.getIdToken();

  return {
    provider: 'apple',
    id_token: idToken,
    email: result.user.email,
    displayName: result.user.displayName,
    uid: result.user.uid,
  };
};

// Export VAPID key for easy access in hooks
export const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY;

export { app };
