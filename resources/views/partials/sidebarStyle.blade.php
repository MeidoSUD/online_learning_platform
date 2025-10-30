<style>
/* ============================================
   SIDEBAR STYLES - Reusable Component
   ============================================ */

/* App Wrapper */
.app-wrapper {
    display: flex;
    min-height: 100vh;
    background: #f5f7fa;
}

/* Sidebar Styles */
.sidebar {
    width: 280px;
    height: 100vh;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    position: fixed;
    top: 0;
    transition: all 0.3s ease;
    box-shadow: 2px 0 15px rgba(0, 0, 0, 0.1);
    display: flex;
    flex-direction: column;
    z-index: 1000;
    overflow-y: auto;
    overflow-x: hidden;
}

.sidebar[dir="rtl"] {
    right: 0;
    box-shadow: -2px 0 15px rgba(0, 0, 0, 0.1);
}

.sidebar[dir="ltr"] {
    left: 0;
}

/* Custom Scrollbar */
.sidebar::-webkit-scrollbar {
    width: 6px;
}

.sidebar::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.1);
}

.sidebar::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.3);
    border-radius: 3px;
}

.sidebar::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.5);
}

/* Sidebar Header */
.sidebar-header {
    padding: 25px 20px;
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(10px);
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.user-info {
    display: flex;
    align-items: center;
    gap: 15px;
}

.user-avatar {
    width: 50px;
    height: 50px;
    border-radius: 50%;
    overflow: hidden;
    border: 3px solid rgba(255, 255, 255, 0.3);
    flex-shrink: 0;
}

.user-avatar img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.avatar-placeholder {
    width: 100%;
    height: 100%;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 20px;
    font-weight: 600;
}

.user-details {
    flex: 1;
    min-width: 0;
}

.user-name {
    color: white;
    font-size: 16px;
    font-weight: 600;
    margin: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.user-role {
    color: rgba(255, 255, 255, 0.8);
    font-size: 13px;
    display: block;
}

/* Sidebar Navigation */
.sidebar-nav {
    flex: 1;
    padding: 20px 0;
}

.sidebar-nav .nav {
    gap: 5px;
}

.sidebar-nav .nav-item {
    position: relative;
}

.sidebar-nav .nav-link {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 20px;
    color: rgba(255, 255, 255, 0.9);
    text-decoration: none;
    transition: all 0.3s ease;
    position: relative;
    font-size: 15px;
    border-radius: 0;
}

.sidebar-nav .nav-link:hover {
    background: rgba(255, 255, 255, 0.1);
    color: white;
    transform: translateX(-3px);
}

.sidebar[dir="rtl"] .nav-link:hover {
    transform: translateX(3px);
}

.sidebar-nav .nav-link i {
    font-size: 20px;
    width: 24px;
    text-align: center;
    flex-shrink: 0;
}

.sidebar-nav .nav-link span {
    flex: 1;
}

/* Active State */
.sidebar-nav .nav-item.active > .nav-link {
    background: rgba(255, 255, 255, 0.2);
    color: white;
    font-weight: 600;
    position: relative;
}

.sidebar-nav .nav-item.active > .nav-link::before {
    content: '';
    position: absolute;
    top: 0;
    height: 100%;
    width: 4px;
    background: white;
    border-radius: 0 4px 4px 0;
}

.sidebar[dir="ltr"] .nav-item.active > .nav-link::before {
    left: 0;
}

.sidebar[dir="rtl"] .nav-item.active > .nav-link::before {
    right: 0;
    border-radius: 4px 0 0 4px;
}

/* Submenu Icon */
.submenu-icon {
    margin-left: auto;
    font-size: 16px !important;
    transition: transform 0.3s ease;
    width: auto !important;
}

.sidebar[dir="rtl"] .submenu-icon {
    margin-left: 0;
    margin-right: auto;
}

.nav-item.active > .nav-link .submenu-icon {
    transform: rotate(180deg);
}

/* Submenu Styles */
.sub-menu {
    display: none;
    background: rgba(0, 0, 0, 0.15);
    padding: 5px 0;
    animation: slideDown 0.3s ease;
}

@keyframes slideDown {
    from {
        opacity: 0;
        max-height: 0;
    }
    to {
        opacity: 1;
        max-height: 300px;
    }
}

.sub-menu .nav-item {
    margin: 0;
}

.sub-menu .nav-link {
    padding: 10px 20px 10px 56px;
    font-size: 14px;
}

.sidebar[dir="rtl"] .sub-menu .nav-link {
    padding: 10px 56px 10px 20px;
}

.sub-menu .nav-link:hover {
    background: rgba(255, 255, 255, 0.05);
}

.sub-menu .nav-item.active .nav-link {
    background: rgba(255, 255, 255, 0.1);
    color: white;
    font-weight: 500;
}

.sub-menu .nav-item.active .nav-link::before {
    content: '';
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    width: 6px;
    height: 6px;
    background: white;
    border-radius: 50%;
}

.sidebar[dir="ltr"] .sub-menu .nav-item.active .nav-link::before {
    left: 35px;
}

.sidebar[dir="rtl"] .sub-menu .nav-item.active .nav-link::before {
    right: 35px;
}

/* Badge Notification */
.badge-notification {
    background: #ff4757;
    color: white;
    font-size: 11px;
    padding: 3px 7px;
    border-radius: 10px;
    font-weight: 600;
    margin-left: auto;
    animation: pulse 2s infinite;
}

.sidebar[dir="rtl"] .badge-notification {
    margin-left: 0;
    margin-right: auto;
}

@keyframes pulse {
    0%, 100% {
        transform: scale(1);
    }
    50% {
        transform: scale(1.1);
    }
}

/* Sidebar Footer */
.sidebar-footer {
    padding: 20px;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    background: rgba(0, 0, 0, 0.1);
}

.btn-logout {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 20px;
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    color: white;
    font-size: 15px;
    border-radius: 8px;
    transition: all 0.3s ease;
    cursor: pointer;
}

.btn-logout:hover {
    background: rgba(255, 77, 87, 0.8);
    border-color: rgba(255, 77, 87, 1);
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(255, 77, 87, 0.3);
}

.btn-logout i {
    font-size: 20px;
}

.btn-logout span {
    flex: 1;
    text-align: left;
}

.sidebar[dir="rtl"] .btn-logout span {
    text-align: right;
}

/* ============================================
   MAIN CONTENT STYLES
   ============================================ */

.main-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    transition: all 0.3s ease;
}

[dir="ltr"] .main-content {
    margin-left: 280px;
}

[dir="rtl"] .main-content {
    margin-right: 280px;
}

/* Top Navbar */
.top-navbar {
    height: 70px;
    background: white;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 30px;
    position: sticky;
    top: 0;
    z-index: 100;
}

.navbar-left {
    display: flex;
    align-items: center;
    gap: 20px;
}

.sidebar-toggle {
    display: none;
    width: 40px;
    height: 40px;
    border: none;
    background: #f5f7fa;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.3s ease;
}

.sidebar-toggle:hover {
    background: #667eea;
    color: white;
}

.sidebar-toggle i {
    font-size: 20px;
}

.page-title {
    margin: 0;
    font-size: 24px;
    color: #2c3e50;
}

.navbar-right {
    display: flex;
    align-items: center;
    gap: 20px;
}

.btn-language,
.btn-notification {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 15px;
    background: #f5f7fa;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.3s ease;
}

.btn-language:hover,
.btn-notification:hover {
    background: #667eea;
    color: white;
}

.btn-notification {
    position: relative;
}

.notification-badge {
    position: absolute;
    top: -5px;
    right: -5px;
    background: #ff4757;
    color: white;
    font-size: 10px;
    padding: 2px 6px;
    border-radius: 10px;
    font-weight: 600;
}

/* Content Wrapper */
.content-wrapper {
    flex: 1;
    padding: 30px;
    min-height: calc(100vh - 140px);
}

/* Footer */
.main-footer {
    background: white;
    padding: 20px 30px;
    text-align: center;
    border-top: 1px solid #e0e6ed;
}

.main-footer p {
    margin: 0;
    color: #7c8db5;
    font-size: 14px;
}

/* Sidebar Overlay */
.sidebar-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    z-index: 999;
    display: none;
    opacity: 0;
    transition: opacity 0.3s ease;
}

.sidebar-overlay.show {
    display: block;
    opacity: 1;
}

/* ============================================
   RESPONSIVE DESIGN
   ============================================ */

@media (max-width: 991px) {
    /* Show toggle button */
    .sidebar-toggle {
        display: flex;
        align-items: center;
        justify-content: center;
    }
    
    /* Hide sidebar by default */
    .sidebar {
        transform: translateX(-100%);
    }
    
    .sidebar[dir="rtl"] {
        transform: translateX(100%);
    }
    
    /* Show sidebar when active */
    .sidebar.show {
        transform: translateX(0);
    }
    
    /* Remove margin from main content */
    [dir="ltr"] .main-content,
    [dir="rtl"] .main-content {
        margin-left: 0;
        margin-right: 0;
    }
    
    /* Prevent body scroll when sidebar is open */
    body.sidebar-open {
        overflow: hidden;
    }
}

@media (max-width: 768px) {
    .sidebar {
        width: 280px;
    }
    
    .content-wrapper {
        padding: 20px 15px;
    }
    
    .top-navbar {
        padding: 0 15px;
    }
    
    .page-title {
        font-size: 18px;
    }
}

@media (max-width: 576px) {
    .sidebar {
        width: 100%;
        max-width: 280px;
    }
    
    .page-title {
        font-size: 16px;
    }
    
    .navbar-right {
        gap: 10px;
    }
    
    .btn-language span {
        display: none;
    }
}

/* Loading Animation */
@keyframes fadeIn {
    from {
        opacity: 0;
        transform: translateY(-10px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.sidebar-nav .nav-item {
    animation: fadeIn 0.3s ease forwards;
    opacity: 0;
}

.sidebar-nav .nav-item:nth-child(1) { animation-delay: 0.05s; }
.sidebar-nav .nav-item:nth-child(2) { animation-delay: 0.1s; }
.sidebar-nav .nav-item:nth-child(3) { animation-delay: 0.15s; }
.sidebar-nav .nav-item:nth-child(4) { animation-delay: 0.2s; }
.sidebar-nav .nav-item:nth-child(5) { animation-delay: 0.25s; }
.sidebar-nav .nav-item:nth-child(6) { animation-delay: 0.3s; }
.sidebar-nav .nav-item:nth-child(7) { animation-delay: 0.35s; }
</style>