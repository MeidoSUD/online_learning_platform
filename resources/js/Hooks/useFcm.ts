
import { useState, useEffect } from 'react';
import { getToken, onMessage, MessagePayload } from 'firebase/messaging';
import { getMessagingSafe, VAPID_KEY } from '../firebase/init';

export const useFcm = () => {
  const [fcmToken, setFcmToken] = useState<string | null>(null);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [messagingInstance, setMessagingInstance] = useState<any>(null);

  // Initialize messaging instance on mount
  useEffect(() => {
    let mounted = true;
    const init = async () => {
      if (typeof window !== 'undefined' && 'Notification' in window) {
        setPermission(Notification.permission);
        const msg = await getMessagingSafe(); // This now silently returns null if not supported
        if (mounted && msg) {
          setMessagingInstance(msg);
        }
      }
    };
    init();
    return () => { mounted = false; };
  }, []);

  // Hook to retrieve token (requests permission if needed)
  const getFcmToken = async (): Promise<string | null> => {
    if (!messagingInstance) {
      // Try one more time, mostly useful if hook called immediately after mount
      const msg = await getMessagingSafe();
      if (!msg) {
        console.warn("[useFcm] Messaging not supported (or not initialized). Cannot get token.");
        return null;
      }
      setMessagingInstance(msg);
    }

    console.log("[useFcm] Requesting notification permission...");
    try {
      const perm = await Notification.requestPermission();
      setPermission(perm);

      if (perm === 'granted') {
        console.log("[useFcm] Permission granted. Fetching token...");
        
        let registration;
        try {
            if ('serviceWorker' in navigator) {
                registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
            }
        } catch (e) {
            console.error("[useFcm] SW Register failed:", e);
        }

        try {
            // messagingInstance is now guaranteed to be a valid object here (or getMessagingSafe failed)
            const currentToken = await getToken(messagingInstance || (await getMessagingSafe()), { 
              vapidKey: VAPID_KEY,
              serviceWorkerRegistration: registration 
            });

            if (currentToken) {
              console.log("FCM DEVICE TOKEN:", currentToken); // Per user request
              setFcmToken(currentToken);
              return currentToken;
            } else {
              console.warn("[useFcm] No registration token available.");
              return null;
            }
        } catch (tokenError) {
            console.error("[useFcm] getToken failed:", tokenError);
            return null;
        }
      } else {
        console.warn("[useFcm] Permission denied.");
        return null;
      }
    } catch (error) {
      console.error("[useFcm] Error retrieving token:", error);
      return null;
    }
  };

  // Listen for foreground messages
  useEffect(() => {
    if (!messagingInstance) return;

    try {
        const unsubscribe = onMessage(messagingInstance, (payload: MessagePayload) => {
          console.log('[useFcm] Foreground Message received:', payload);
          if (payload.notification) {
              const { title, body, icon } = payload.notification;
              if (Notification.permission === 'granted') {
                 new Notification(title || 'New Message', {
                     body: body,
                     icon: icon || '/logo192.png'
                 });
              }
          }
        });
        return () => unsubscribe();
    } catch (e) {
        console.warn("[useFcm] onMessage failed:", e);
    }
  }, [messagingInstance]);

  return { fcmToken, getFcmToken, permission };
};
