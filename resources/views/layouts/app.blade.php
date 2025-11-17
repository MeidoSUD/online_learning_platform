<!DOCTYPE html>
<html class="loading" lang="{{ app()->getLocale() }}"
    data-textdirection="{{ app()->getLocale() == 'ar' ? 'rtl' : 'ltr' }}">
<!-- BEGIN: Head-->

<head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=0, minimal-ui">
    <meta name="description"
        content="Vuexy admin is super flexible, powerful, clean &amp; modern responsive bootstrap 4 admin template with unlimited possibilities.">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <meta name="keywords"
        content="admin template, Vuexy admin template, dashboard template, flat admin template, responsive admin template, web app">
    <meta name="author" content="PIXINVENT">
    <title>{{ app()->getLocale() == 'ar' ? 'لوحة التحكم' : 'Dashboard' }} - @yield('title')</title>
    <link rel="apple-touch-icon" href="{{ asset('/app-assets/images/ico/apple-icon-120.png') }}">
    <link rel="shortcut icon" type="image/x-icon" href="{{ asset('logo.png') }}">
    <link href="https://fonts.googleapis.com/css?family=Montserrat:300,400,500,600" rel="stylesheet">

    <!-- BEGIN: Vendor CSS-->
    @if (app()->getLocale() == 'ar')
        <link rel="stylesheet" type="text/css" href="{{ asset('/app-assets/vendors/css/vendors-rtl.min.css') }}">
        <link rel="stylesheet" type="text/css" href="{{ asset('/app-assets/css-rtl/bootstrap.css') }}">
        <link rel="stylesheet" type="text/css" href="{{ asset('/app-assets/css-rtl/bootstrap-extended.css') }}">
        <link rel="stylesheet" type="text/css" href="{{ asset('/app-assets/css-rtl/colors.css') }}">
        <link rel="stylesheet" type="text/css" href="{{ asset('/app-assets/css-rtl/components.css') }}">
        <link rel="stylesheet" type="text/css" href="{{ asset('/app-assets/css-rtl/themes/dark-layout.css') }}">
        <link rel="stylesheet" type="text/css" href="{{ asset('/app-assets/css-rtl/themes/semi-dark-layout.css') }}">
        <link rel="stylesheet" type="text/css"
            href="{{ asset('/app-assets/css-rtl/core/menu/menu-types/vertical-menu.css') }}">
        <link rel="stylesheet" type="text/css" href="{{ asset('/assets/css/style-rtl.css') }}">
        <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@200;300;400;500;700&display=swap"
            rel="stylesheet">
    @else
        <link rel="stylesheet" type="text/css" href="{{ asset('/app-assets/vendors/css/vendors.min.css') }}">
        <link rel="stylesheet" type="text/css" href="{{ asset('/app-assets/css/bootstrap.css') }}">
        <link rel="stylesheet" type="text/css" href="{{ asset('/app-assets/css/bootstrap-extended.css') }}">
        <link rel="stylesheet" type="text/css" href="{{ asset('/app-assets/css/colors.css') }}">
        <link rel="stylesheet" type="text/css" href="{{ asset('/app-assets/css/components.css') }}">
        <link rel="stylesheet" type="text/css" href="{{ asset('/app-assets/css/themes/dark-layout.css') }}">
        <link rel="stylesheet" type="text/css" href="{{ asset('/app-assets/css/themes/semi-dark-layout.css') }}">
        <link rel="stylesheet" type="text/css"
            href="{{ asset('/app-assets/css/core/menu/menu-types/vertical-menu.css') }}">
        <link rel="stylesheet" type="text/css" href="{{ asset('/assets/css/style.css') }}">
        <link href="https://fonts.googleapis.com/css?family=Montserrat:300,400,500,600" rel="stylesheet">
    @endif
    <link rel="stylesheet" href="{{ asset('assets/vendor/fonts/tabler-icons.css') }}" />
    <link rel="stylesheet" href="{{ asset('assets/vendor/css/core.css') }}" />
    <link rel="stylesheet" type="text/css" href="{{ asset('/app-assets/vendors/css/ui/prism.min.css') }}">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    @include('partials.sidebarStyle')

</head>
<!-- END: Head-->

<!-- BEGIN: Body-->
<style>
    a,
    h1,
    h2,
    h3,
    h4,
    h5,
    h6,
    span {
        font-family: '{{ app()->getLocale() == 'ar' ? 'Tajawal' : 'Montserrat' }}', sans-serif
    }
</style>

<body class="vertical-layout vertical-menu-modern 2-columns navbar-sticky footer-static" data-open="click"
    data-menu="vertical-menu-modern" data-col="2-columns"
    style="font-family: '{{ app()->getLocale() == 'ar' ? 'Tajawal' : 'Montserrat' }}', sans-serif;">
    <!-- Navbar -->
    @include('partials.navbar')

    <!-- Sidebar -->
    <div class="main-menu menu-fixed menu-light menu-accordion menu-shadow" data-scroll-to-active="true">
        <div class="navbar-header">
            <ul class="nav navbar-nav flex-row">
                <li class="nav-item mr-auto"><a class="navbar-brand"
                        href="../../../html/rtl/vertical-menu-template/index.html">
                        <h2 class="brand-text mb-0">{{ app()->getLocale() == 'ar' ? 'لوحة التحكم' : 'Dashboard' }}
                        </h2>
                    </a></li>
                <li class="nav-item nav-toggle">
                    <a class="nav-link modern-nav-toggle pr-0" data-toggle="collapse">
                        <i class="feather icon-x d-block d-xl-none font-medium-4 primary toggle-icon"></i><i
                            class="toggle-icon feather icon-disc font-medium-4 d-none d-xl-block primary"
                            data-ticon="icon-disc">
                        </i>
                    </a>
                </li>
            </ul>
        </div>
        <div class="shadow-bottom"></div>
        <div class="main-menu-content">
            @include('partials.sidebar')
        </div>
    </div>

    <!-- Overlay for sidebar (for mobile) -->
    <div class="sidebar-overlay" onclick="closeSidebar()"></div>

    <!-- Main Page Content -->
    <div class="app-content content">
        <div class="content-wrapper">
            @yield('content')
        </div>
    </div>

    @include('partials.footer')
    <!-- small helper to avoid "toggleSubmenu is not defined" stopping other scripts -->
    <script>
        function toggleSubmenu(el) {
            try {
                const submenu = el.nextElementSibling;
                if (!submenu) return;
                submenu.style.display = submenu.style.display === 'block' ? 'none' : 'block';
            } catch (e) {
                console.error(e);
            }
        }
        console.log('layout base scripts loaded');
    </script>

    <!-- include Bootstrap bundle if your modals rely on it (optional, remove if you load elsewhere) -->
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js" integrity=""
        crossorigin="anonymous"></script>



    <script src="https://www.gstatic.com/firebasejs/11.0.0/firebase-app-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/11.0.0/firebase-messaging-compat.js"></script>

<script>
// ============================================================================
// 🔥 FCM COMPREHENSIVE DEBUG SCRIPT
// ============================================================================

console.log('%c═══════════════════════════════════════════════════════════', 'color: #667eea; font-weight: bold;');
console.log('%c🔥 FCM INITIALIZATION DEBUG - START', 'color: #667eea; font-weight: bold; font-size: 16px;');
console.log('%c═══════════════════════════════════════════════════════════', 'color: #667eea; font-weight: bold;');

// Step 1: Check Authentication
console.log('\n%c📌 STEP 1: Authentication Check', 'color: #10b981; font-weight: bold; font-size: 14px;');
const isAuthenticated = {{ auth()->check() ? 'true' : 'false' }};
const userId = {{ auth()->check() ? auth()->id() : 'null' }};
const userRole = '{{ auth()->user()?->role?->name ?? "guest" }}';

console.log('✓ Is Authenticated:', isAuthenticated);
console.log('✓ User ID:', userId);
console.log('✓ User Role:', userRole);

if (!isAuthenticated) {
    console.log('%c❌ STOP: User is not authenticated. FCM will not initialize.', 'color: #ef4444; font-weight: bold;');
    console.log('%c═══════════════════════════════════════════════════════════', 'color: #667eea; font-weight: bold;');
}

// Step 2: Check Browser Compatibility
console.log('\n%c📌 STEP 2: Browser Compatibility Check', 'color: #10b981; font-weight: bold; font-size: 14px;');
console.log('✓ Service Worker Support:', 'serviceWorker' in navigator ? '✅ YES' : '❌ NO');
console.log('✓ Notification API Support:', 'Notification' in window ? '✅ YES' : '❌ NO');
console.log('✓ Push Manager Support:', 'PushManager' in window ? '✅ YES' : '❌ NO');
console.log('✓ Current Protocol:', location.protocol);
console.log('✓ Current Hostname:', location.hostname);
console.log('✓ HTTPS/Localhost:', (location.protocol === 'https:' || location.hostname === 'localhost') ? '✅ YES' : '❌ NO');

// Step 3: Check Notification Permission
console.log('\n%c📌 STEP 3: Notification Permission Status', 'color: #10b981; font-weight: bold; font-size: 14px;');
console.log('✓ Current Permission:', Notification.permission);

if (Notification.permission === 'denied') {
    console.log('%c❌ CRITICAL: Notifications are BLOCKED!', 'color: #ef4444; font-weight: bold;');
    console.log('%c   Fix: Go to browser settings and allow notifications for this site', 'color: #f59e0b;');
} else if (Notification.permission === 'default') {
    console.log('%c⚠️ WARNING: Permission not requested yet', 'color: #f59e0b; font-weight: bold;');
} else {
    console.log('%c✅ GOOD: Notification permission granted', 'color: #10b981; font-weight: bold;');
}

// Step 4: Initialize Firebase (if authenticated and supported)
if ('serviceWorker' in navigator && isAuthenticated) {
    
    console.log('\n%c📌 STEP 4: Service Worker Registration', 'color: #10b981; font-weight: bold; font-size: 14px;');
    console.log('⏳ Attempting to register Service Worker...');
    
    navigator.serviceWorker.register('/firebase-messaging-sw.js')
        .then((registration) => {
            console.log('%c✅ Service Worker Registered Successfully!', 'color: #10b981; font-weight: bold;');
            console.log('   Scope:', registration.scope);
            console.log('   Installing:', registration.installing);
            console.log('   Waiting:', registration.waiting);
            console.log('   Active:', registration.active);
            console.log('   Active State:', registration.active?.state);
            
            // Wait for service worker to be ready
            navigator.serviceWorker.ready.then((reg) => {
                console.log('%c✅ Service Worker is READY', 'color: #10b981; font-weight: bold;');
                
                // Step 5: Initialize Firebase
                console.log('\n%c📌 STEP 5: Firebase Initialization', 'color: #10b981; font-weight: bold; font-size: 14px;');
                
                const firebaseConfig = {
                    apiKey: "AIzaSyB-vwKT_nnbFT1UQykpw7e6VqLSeUVBkTc",
                    authDomain: "ewan-geniuses.firebaseapp.com",
                    projectId: "ewan-geniuses",
                    storageBucket: "ewan-geniuses.firebasestorage.app",
                    messagingSenderId: "73208499391",
                    appId: "1:73208499391:web:b17fffb8c982ab34644a0a",
                    measurementId: "G-EP2J15LZZQ"
                };
                
                console.log('⏳ Initializing Firebase with config...');
                console.log('   Project ID:', firebaseConfig.projectId);
                console.log('   Messaging Sender ID:', firebaseConfig.messagingSenderId);
                console.log('   App ID:', firebaseConfig.appId.substring(0, 20) + '...');
                
                try {
                    firebase.initializeApp(firebaseConfig);
                    console.log('%c✅ Firebase Initialized Successfully!', 'color: #10b981; font-weight: bold;');
                    
                    const messaging = firebase.messaging();
                    console.log('✓ Firebase Messaging object created:', messaging);
                    
                    // Step 6: Request Permission and Get Token
                    console.log('\n%c📌 STEP 6: Permission & Token Request', 'color: #10b981; font-weight: bold; font-size: 14px;');
                    
                    requestNotificationPermission(messaging, registration);
                    
                    // Step 7: Setup Message Listeners
                    console.log('\n%c📌 STEP 7: Setting Up Message Listeners', 'color: #10b981; font-weight: bold; font-size: 14px;');
                    
                    // Foreground message handler
                    messaging.onMessage((payload) => {
                        console.log('%c═══════════════════════════════════════════════════════════', 'color: #3b82f6; font-weight: bold;');
                        console.log('%c📩 FOREGROUND MESSAGE RECEIVED!', 'color: #3b82f6; font-weight: bold; font-size: 16px;');
                        console.log('%c═══════════════════════════════════════════════════════════', 'color: #3b82f6; font-weight: bold;');
                        console.log('\n%cMessage Details:', 'color: #3b82f6; font-weight: bold;');
                        console.log('   Title:', payload.notification?.title || 'NO TITLE');
                        console.log('   Body:', payload.notification?.body || 'NO BODY');
                        console.log('   Icon:', payload.notification?.icon || 'NO ICON');
                        console.log('\n%cPayload Data:', 'color: #3b82f6; font-weight: bold;');
                        console.log(payload.data);
                        console.log('\n%cFull Payload Object:', 'color: #3b82f6; font-weight: bold;');
                        console.log(payload);
                        
                        // Show notification
                        const notificationTitle = payload.notification?.title || 'New Notification';
                        const notificationOptions = {
                            body: payload.notification?.body || '',
                            icon: payload.notification?.icon || '/logo.png',
                            badge: '/logo.png',
                            tag: 'fcm-notification-' + Date.now(),
                            requireInteraction: false,
                            data: payload.data
                        };
                        
                        console.log('\n%c⏳ Attempting to show notification...', 'color: #f59e0b; font-weight: bold;');
                        console.log('   Notification Title:', notificationTitle);
                        console.log('   Notification Options:', notificationOptions);
                        
                        if (Notification.permission === "granted") {
                            try {
                                const notification = new Notification(notificationTitle, notificationOptions);
                                console.log('%c✅ Notification displayed successfully!', 'color: #10b981; font-weight: bold;');
                                
                                notification.onclick = function(event) {
                                    console.log('%c🖱️ Notification clicked!', 'color: #8b5cf6; font-weight: bold;');
                                    console.log('   Event:', event);
                                    event.preventDefault();
                                    window.focus();
                                    notification.close();
                                };
                                
                                notification.onerror = function(error) {
                                    console.log('%c❌ Notification error:', 'color: #ef4444; font-weight: bold;');
                                    console.error(error);
                                };
                                
                            } catch (error) {
                                console.log('%c❌ FAILED to show notification:', 'color: #ef4444; font-weight: bold;');
                                console.error('   Error:', error);
                            }
                        } else {
                            console.log('%c❌ Cannot show notification - Permission not granted', 'color: #ef4444; font-weight: bold;');
                            console.log('   Current Permission:', Notification.permission);
                        }
                        
                        console.log('%c═══════════════════════════════════════════════════════════\n', 'color: #3b82f6; font-weight: bold;');
                    });
                    
                    console.log('✓ onMessage listener attached');
                    
                    // Token refresh handler
                    messaging.onTokenRefresh(() => {
                        console.log('%c🔄 FCM Token Refresh Triggered', 'color: #f59e0b; font-weight: bold;');
                        getAndSaveToken(messaging, registration);
                    });
                    
                    console.log('✓ onTokenRefresh listener attached');
                    console.log('%c✅ All message listeners setup complete!', 'color: #10b981; font-weight: bold;');
                    
                } catch (error) {
                    console.log('%c❌ CRITICAL ERROR: Firebase initialization failed!', 'color: #ef4444; font-weight: bold;');
                    console.error('   Error:', error);
                    console.error('   Error Name:', error.name);
                    console.error('   Error Message:', error.message);
                    console.error('   Error Stack:', error.stack);
                }
            });
            
        })
        .catch(err => {
            console.log('%c❌ CRITICAL ERROR: Service Worker registration failed!', 'color: #ef4444; font-weight: bold;');
            console.error('   Error:', err);
            console.error('   Error Name:', err.name);
            console.error('   Error Message:', err.message);
            
            if (err.message.includes('404')) {
                console.log('%c💡 FIX: Make sure "firebase-messaging-sw.js" exists at your site root', 'color: #f59e0b; font-weight: bold;');
                console.log('   Expected URL: ' + location.origin + '/firebase-messaging-sw.js');
            }
        });
        
} else {
    if (!isAuthenticated) {
        console.log('\n%c⏭️ Skipping FCM initialization - User not authenticated', 'color: #6b7280; font-weight: bold;');
    }
    if (!('serviceWorker' in navigator)) {
        console.log('\n%c❌ STOP: Service Workers not supported in this browser', 'color: #ef4444; font-weight: bold;');
        console.log('%c   Try using Chrome, Firefox, or Edge', 'color: #f59e0b;');
    }
}

// Function: Request Notification Permission
function requestNotificationPermission(messaging, registration) {
    console.log('⏳ Checking notification permission...');
    
    if (Notification.permission === "granted") {
        console.log('%c✅ Permission already granted', 'color: #10b981; font-weight: bold;');
        getAndSaveToken(messaging, registration);
    }
    else if (Notification.permission === "default") {
        console.log('%c⏳ Requesting notification permission from user...', 'color: #f59e0b; font-weight: bold;');
        
        Notification.requestPermission().then((permission) => {
            console.log('   User responded:', permission);
            
            if (permission === "granted") {
                console.log('%c✅ Permission granted by user!', 'color: #10b981; font-weight: bold;');
                getAndSaveToken(messaging, registration);
            } else if (permission === "denied") {
                console.log('%c❌ Permission DENIED by user!', 'color: #ef4444; font-weight: bold;');
                console.log('%c   User must manually enable notifications in browser settings', 'color: #f59e0b;');
            } else {
                console.log('%c⚠️ Permission dismissed (default)', 'color: #f59e0b; font-weight: bold;');
            }
        }).catch(error => {
            console.log('%c❌ Error requesting permission:', 'color: #ef4444; font-weight: bold;');
            console.error(error);
        });
    }
    else {
        console.log('%c❌ Notifications BLOCKED (permission denied)', 'color: #ef4444; font-weight: bold;');
        console.log('%c   To fix:', 'color: #f59e0b; font-weight: bold;');
        console.log('   1. Click the lock icon in address bar');
        console.log('   2. Find "Notifications" and set to "Allow"');
        console.log('   3. Refresh the page');
    }
}

// Function: Get and Save FCM Token
function getAndSaveToken(messaging, registration) {
    console.log('\n%c🔑 Getting FCM Token...', 'color: #8b5cf6; font-weight: bold; font-size: 14px;');
    
    const vapidKey = "BNi2wdiOzDOENHWQbaqF_TdW_mQP-_dy0BiDhgDlysT7pLZLC94vVavrihcFYxtrjB4bziCJgSwVnyF5J3zzHBw";
    
    console.log('   Using VAPID Key:', vapidKey.substring(0, 20) + '...' + vapidKey.substring(vapidKey.length - 10));
    console.log('   VAPID Key Length:', vapidKey.length, 'characters');
    console.log('   Service Worker Registration:', registration);
    
    messaging.getToken({
        vapidKey: vapidKey,
        serviceWorkerRegistration: registration
    })
    .then((token) => {
        if (token) {
            console.log('%c✅ FCM Token Retrieved Successfully!', 'color: #10b981; font-weight: bold;');
            console.log('\n%cToken Details:', 'color: #8b5cf6; font-weight: bold;');
            console.log('   Full Token:', token);
            console.log('   Token Length:', token.length, 'characters');
            console.log('   First 30 chars:', token.substring(0, 30) + '...');
            console.log('   Last 30 chars:', '...' + token.substring(token.length - 30));
            
            // Save token to server
            saveTokenToServer(token);
        } else {
            console.log('%c⚠️ No FCM token available', 'color: #f59e0b; font-weight: bold;');
            console.log('   This might happen if:');
            console.log('   - Service Worker is not active yet');
            console.log('   - VAPID key is incorrect');
            console.log('   - Firebase config is incorrect');
        }
    })
    .catch((err) => {
        console.log('%c❌ CRITICAL ERROR: Failed to get FCM token!', 'color: #ef4444; font-weight: bold;');
        console.error('\n%cError Details:', 'color: #ef4444; font-weight: bold;');
        console.error('   Error Object:', err);
        console.error('   Error Name:', err.name);
        console.error('   Error Message:', err.message);
        console.error('   Error Code:', err.code);
        console.error('   Error Stack:', err.stack);
        
        console.log('\n%c💡 Common Causes:', 'color: #f59e0b; font-weight: bold;');
        console.log('   1. VAPID key is incorrect or expired');
        console.log('   2. Service Worker file has errors');
        console.log('   3. Firebase project configuration mismatch');
        console.log('   4. Browser blocking third-party cookies/storage');
        console.log('   5. Service Worker not activated yet');
        
        // Additional debugging for specific errors
        if (err.code === 'messaging/permission-blocked') {
            console.log('\n%c🔧 Specific Fix: Notification permission is blocked', 'color: #f59e0b; font-weight: bold;');
        } else if (err.code === 'messaging/vapid-key-unavailable') {
            console.log('\n%c🔧 Specific Fix: VAPID key is missing or invalid', 'color: #f59e0b; font-weight: bold;');
        }
    });
}

// Function: Save Token to Laravel Backend
function saveTokenToServer(token) {
    console.log('\n%c💾 Saving Token to Server...', 'color: #8b5cf6; font-weight: bold; font-size: 14px;');
    
    const userRole = '{{ auth()->user()?->role?->name ?? "guest" }}';
    let endpoint = '/save-fcm-token';
    
    // Determine endpoint based on role
    if (userRole === 'student') {
        endpoint = '/student/save-fcm-token';
    } else if (userRole === 'teacher') {
        endpoint = '/teacher/save-fcm-token';
    } else if (userRole === 'admin') {
        endpoint = '/admin/save-fcm-token';
    }
    
    console.log('   User Role:', userRole);
    console.log('   Endpoint:', endpoint);
    console.log('   Full URL:', location.origin + endpoint);
    console.log('   User ID:', userId);
    console.log('   Token to save:', token.substring(0, 30) + '...');
    
    const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content;
    console.log('   CSRF Token:', csrfToken ? csrfToken.substring(0, 20) + '...' : 'NOT FOUND');
    
    const requestBody = {
        token: token,
        user_id: userId
    };
    
    console.log('   Request Body:', requestBody);
    
    console.log('\n⏳ Sending POST request...');
    
    fetch(endpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRF-TOKEN': csrfToken || ''
        },
        body: JSON.stringify(requestBody)
    })
    .then(response => {
        console.log('   Response Status:', response.status, response.statusText);
        console.log('   Response OK:', response.ok);
        console.log('   Response Headers:', response.headers);
        
        return response.json().then(data => {
            return { status: response.status, data: data };
        });
    })
    .then(({ status, data }) => {
        if (status >= 200 && status < 300) {
            console.log('%c✅ Token Saved to Server Successfully!', 'color: #10b981; font-weight: bold;');
            console.log('   Server Response:', data);
        } else {
            console.log('%c⚠️ Server returned non-success status:', 'color: #f59e0b; font-weight: bold;');
            console.log('   Status:', status);
            console.log('   Response:', data);
        }
    })
    .catch(error => {
        console.log('%c❌ CRITICAL ERROR: Failed to save token to server!', 'color: #ef4444; font-weight: bold;');
        console.error('   Error:', error);
        console.error('   Error Name:', error.name);
        console.error('   Error Message:', error.message);
        
        console.log('\n%c💡 Possible Causes:', 'color: #f59e0b; font-weight: bold;');
        console.log('   1. Laravel route not defined: ' + endpoint);
        console.log('   2. CSRF token mismatch');
        console.log('   3. Network error or CORS issue');
        console.log('   4. Server-side error in Laravel controller');
        console.log('   5. Authentication middleware blocking request');
    });
}

console.log('\n%c═══════════════════════════════════════════════════════════', 'color: #667eea; font-weight: bold;');
console.log('%c🔥 FCM INITIALIZATION DEBUG - COMPLETE', 'color: #667eea; font-weight: bold; font-size: 16px;');
console.log('%c═══════════════════════════════════════════════════════════', 'color: #667eea; font-weight: bold;');
console.log('\n%c📝 Next Steps:', 'color: #3b82f6; font-weight: bold;');
console.log('   1. Review all logs above for any ❌ or ⚠️ symbols');
console.log('   2. If token was saved successfully, test notification from Laravel');
console.log('   3. Check your Laravel logs for any backend errors');
console.log('   4. Try sending test notification from Firebase Console');
console.log('\n');

</script>

    @stack('scripts')

</body>

</html>
