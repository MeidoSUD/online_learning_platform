

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useLanguage } from '../Contexts/LanguageContext';
import { Bell, LogOut, Settings, User, Globe, Menu, AlertCircle, CreditCard, FileText, Award, Layers, Video, X, Check, School, CreditCard as PaymentIcon, BellRing, Clock, Loader2, Trash2, Headphones } from 'lucide-react';
import { AuthResponse, notificationService, AppNotification } from '../Services/api';
import { Logo } from './Logo';

interface NavbarProps {
  userData: AuthResponse;
  onLogout: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const NOTIF_ICONS: Record<string, { icon: any; color: string; bg: string }> = {
  payment_success: { icon: PaymentIcon, color: 'text-primary', bg: 'bg-primary-pale' },
  payment: { icon: PaymentIcon, color: 'text-primary', bg: 'bg-primary-pale' },
  booking_received: { icon: School, color: 'text-secondary', bg: 'bg-secondary-pale' },
  new_lesson: { icon: Video, color: 'text-[var(--accent)]', bg: 'bg-secondary-pale' },
  lesson_update: { icon: Video, color: 'text-[var(--accent)]', bg: 'bg-secondary-pale' },
  reminder: { icon: Clock, color: 'text-orange-600', bg: 'bg-orange-50' },
  application_received: { icon: User, color: 'text-indigo-600', bg: 'bg-indigo-50' },
  application_accepted: { icon: Check, color: 'text-primary', bg: 'bg-primary-pale' },
  application_rejected: { icon: X, color: 'text-red-600', bg: 'bg-red-50' },
  system: { icon: BellRing, color: 'text-[var(--text-muted)]', bg: 'bg-[var(--light-bg)]' },
};
const DEFAULT_ICON = { icon: BellRing, color: 'text-[var(--text-muted)]', bg: 'bg-[var(--light-bg)]' };

function getRelativeTime(dateStr: string, language: string): string {
  const now = Date.now();
  const d = new Date(dateStr).getTime();
  const diff = now - d;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return language === 'ar' ? 'الآن' : 'Now';
  if (mins < 60) return language === 'ar' ? `منذ ${mins} دقائق` : `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return language === 'ar' ? `منذ ${hours} ساعات` : `${hours} hours ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return language === 'ar' ? 'أمس' : 'Yesterday';
  if (days < 7) return language === 'ar' ? `منذ ${days} أيام` : `${days} days ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return language === 'ar' ? `منذ ${weeks} أسابيع` : `${weeks} weeks ago`;
  const months = Math.floor(days / 30);
  return language === 'ar' ? `منذ ${months} أشهر` : `${months} months ago`;
}

export const Navbar: React.FC<NavbarProps> = ({ userData, onLogout, activeTab, setActiveTab }) => {
  const { t, language, setLanguage, direction } = useLanguage();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifs, setShowNotifs] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [notifLoading, setNotifLoading] = useState(false);
  const [notifError, setNotifError] = useState<string | null>(null);
  
  const profileRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  const user = userData.user.data;
  const userRole = userData.user.role;

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const fetchNotifications = useCallback(async () => {
    setNotifLoading(true);
    setNotifError(null);
    try {
      const res = await notificationService.getAll();
      const list = Array.isArray(res) ? res : (res.data || []);
      setNotifications(list);
    } catch (e: any) {
      setNotifError(e.message || 'Failed to load');
    } finally {
      setNotifLoading(false);
    }
  }, []);

  const handleMarkAsRead = async (id: number) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch {}
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch {}
  };

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await notificationService.delete(id);
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch {}
  };

  useEffect(() => {
    if (showNotifs && notifications.length === 0 && !notifLoading) {
      fetchNotifications();
    }
  }, [showNotifs, fetchNotifications, notifications.length, notifLoading]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifs(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // --- Dynamic Teacher Navigation Logic ---
  const getTeacherLinks = () => {
    // Base links always visible
    const links = [
        { id: 'overview', label: t.overview },
        { id: 'my-lessons', label: language === 'ar' ? 'دروسي' : 'My Lessons' },
        { id: 'consultations', label: language === 'ar' ? 'الاستشارات' : 'Consultations' },
        { id: 'schedule', label: t.schedule },
        { id: 'wallet', label: t.wallet },
    ];

    // Check services array from backend (Now inside profile)
    // 3 = Private Lessons, 4 = Courses, 2 = Languages
    const activeServices = user.profile?.services || [];
    const mainServiceId = user.profile?.service; // Single ID if present

    // Helper to check if service is active either in array or main ID
    const hasService = (id: number) => {
        return activeServices.some(s => s.service_id === id) || mainServiceId === id;
    };

    // 1. Private Lessons (Maps to Subjects Tab)
    if (hasService(3)) {
        links.push({ id: 'private-lessons', label: language === 'ar' ? 'دروس خصوصية' : 'Private Lessons' });
    }

    // 2. Courses
    if (hasService(4)) { 
        links.push({ id: 'courses', label: t.courses });
    }

    // 3. Language Learning
    if (hasService(2)) {
        links.push({ id: 'languages', label: language === 'ar' ? 'لغات' : 'Languages' });
    }

    return links;
  };

  const studentLinks = [
    { id: 'overview', label: t.overview },
    { id: 'private-lessons', label: t.privateLessons },
    { id: 'courses', label: t.courses },
    { id: 'language-learning', label: t.languageLearning },
    { id: 'consultations', label: language === 'ar' ? 'الاستشارات' : 'Consultations' },
    { id: 'schedule', label: t.mySchedule },
  ];

  const navLinks = userRole === 'student' ? studentLinks : getTeacherLinks();

  return (
    <nav className="sticky top-0 z-30 w-full bg-gradient-to-br from-[var(--navy-dark)] via-[var(--navy)] to-[var(--navy-mid)] shadow-[var(--shadow-md)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20">
          {/* Logo & Desktop Nav */}
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center gap-2 cursor-pointer" onClick={() => setActiveTab('overview')}>
              <Logo className="scale-75" />
            </div>
            <div className="hidden md:flex md:items-center md:gap-1 mx-6">
              {navLinks.map(link => (
                <button
                  key={link.id}
                  onClick={() => setActiveTab(link.id)}
                  className={`px-4 py-2 rounded-[50px] text-sm font-medium transition-all ${
                    activeTab === link.id 
                      ? 'bg-white/15 text-[var(--green-light)]'
                      : 'text-white/70 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {link.label}
                </button>
              ))}
            </div>
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Language Switch */}
            <button 
              onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
              className="p-2 rounded-full text-white/80 hover:bg-white/10 transition-colors"
              title={t.language}
            >
              <Globe size={20} />
            </button>

            {/* Notifications */}
            <div className="relative" ref={notifRef}>
              <button 
                onClick={() => setShowNotifs(!showNotifs)}
                className="p-2 rounded-full text-white/80 hover:bg-white/10 transition-colors relative"
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 h-5 min-w-[20px] flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold border-2 border-white px-1">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {showNotifs && (
                <div className={`absolute top-12 w-80 sm:w-96 bg-white rounded-[var(--radius-md)] shadow-[var(--shadow-lg)] ring-1 ring-black ring-opacity-5 overflow-hidden ${direction === 'rtl' ? 'left-0' : 'right-0'}`}>
                  <div className="px-4 py-3 border-b border-[var(--border)] flex justify-between items-center">
                    <h3 className="text-sm font-semibold text-[var(--text-main)]">
                      {t.notifications}
                      {unreadCount > 0 && (
                        <span className="ml-2 text-[10px] font-normal text-[var(--text-muted)]">
                          {language === 'ar' ? `${unreadCount} غير مقروء` : `${unreadCount} unread`}
                        </span>
                      )}
                    </h3>
                    {unreadCount > 0 && (
                      <button onClick={handleMarkAllAsRead} className="text-xs text-primary hover:underline">
                        {t.markAllRead}
                      </button>
                    )}
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notifLoading ? (
                      <div className="flex justify-center py-8">
                        <Loader2 size={24} className="animate-spin text-primary" />
                      </div>
                    ) : notifError ? (
                      <div className="px-4 py-8 text-center">
                        <AlertCircle size={32} className="mx-auto text-[var(--text-muted)] mb-2" />
                        <p className="text-sm text-[var(--text-muted)]">{notifError}</p>
                        <button onClick={fetchNotifications} className="mt-2 text-xs text-primary hover:underline">
                          {language === 'ar' ? 'إعادة المحاولة' : 'Retry'}
                        </button>
                      </div>
                    ) : notifications.length === 0 ? (
                      <div className="px-4 py-8 text-center">
                        <BellRing size={36} className="mx-auto text-slate-200 mb-3" />
                        <p className="text-sm text-[var(--text-muted)] font-medium">{t.noNotifications}</p>
                        <p className="text-xs text-[var(--text-muted)] mt-1">{t.notificationsEmpty}</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-[var(--border)]">
                        {notifications.map(n => {
                          const iconDef = NOTIF_ICONS[n.type] || DEFAULT_ICON;
                          const IconComp = iconDef.icon;
                          return (
                            <div
                              key={n.id}
                              onClick={() => !n.is_read && handleMarkAsRead(n.id)}
                              className={`px-4 py-3 flex gap-3 cursor-pointer transition-colors hover:bg-[var(--light-bg)] ${!n.is_read ? 'bg-secondary-pale' : ''}`}
                            >
                              <div className={`h-10 w-10 rounded-[var(--radius-md)] ${iconDef.bg} flex items-center justify-center shrink-0`}>
                                <IconComp size={18} className={iconDef.color} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2">
                                  <p className={`text-sm ${!n.is_read ? 'font-bold text-[var(--text-main)]' : 'font-medium text-[var(--text-muted)]'}`}>
                                    {n.title}
                                  </p>
                                  {!n.is_read && (
                                    <span className="h-2 w-2 rounded-full bg-navy shrink-0 mt-1.5"></span>
                                  )}
                                </div>
                                <p className="text-xs text-[var(--text-muted)] mt-0.5 line-clamp-2">{n.message}</p>
                                <div className="flex items-center justify-between mt-1.5">
                                  <span className="text-[10px] text-[var(--text-muted)]">{getRelativeTime(n.created_at, language)}</span>
                                  <button
                                    onClick={(e) => handleDelete(n.id, e)}
                                    className="text-[var(--text-muted)] hover:text-red-400 transition-colors"
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* User Dropdown */}
            <div className="relative ml-3" ref={profileRef}>
              <button 
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center gap-3 p-1 rounded-full hover:bg-[var(--light-bg)] transition-colors focus:outline-none"
              >
                <div className="h-9 w-9 rounded-full bg-gradient-to-br from-[var(--green-light)] to-[var(--green)] flex items-center justify-center text-white font-bold shadow-[var(--shadow-md)]">
                   {(user.first_name?.charAt(0) || 'U').toUpperCase()}
                </div>
                <div className="hidden lg:block text-start">
                  <p className="text-sm font-medium text-white">{user.first_name}</p>
                  <p className="text-xs text-white/60 truncate max-w-[100px]">{userRole?.toUpperCase()}</p>
                </div>
              </button>

              {showProfileMenu && (
                <div className={`absolute top-12 w-56 bg-white rounded-[var(--radius-md)] shadow-[var(--shadow-lg)] ring-1 ring-black ring-opacity-5 py-1 ${direction === 'rtl' ? 'left-0' : 'right-0'}`}>
                  <div className="px-4 py-2 border-b border-[var(--border)] lg:hidden">
                    <p className="text-sm font-medium text-[var(--text-main)]">{user.first_name} {user.last_name}</p>
                    <p className="text-xs text-[var(--text-muted)] truncate">{user.email}</p>
                  </div>
                  
                  <button onClick={() => { setActiveTab('profile'); setShowProfileMenu(false); }} className="flex w-full items-center gap-2 px-4 py-2 text-sm text-[var(--text-main)] hover:bg-[var(--light-bg)]">
                    <User size={16} /> {t.profile}
                  </button>
                  
                  {/* Student Specific Menu Items */}
                  {userRole === 'student' && (
                    <>
                      <button onClick={() => { setActiveTab('sessions'); setShowProfileMenu(false); }} className="flex w-full items-center gap-2 px-4 py-2 text-sm text-[var(--text-main)] hover:bg-[var(--light-bg)]">
                        <Video size={16} /> {language === 'ar' ? 'جلساتي' : 'My Sessions'}
                      </button>
                      <button onClick={() => { setActiveTab('wallet'); setShowProfileMenu(false); }} className="flex w-full items-center gap-2 px-4 py-2 text-sm text-[var(--text-main)] hover:bg-[var(--light-bg)]">
                        <CreditCard size={16} /> {t.paymentMethods}
                      </button>
                      <button onClick={() => { setActiveTab('transactions'); setShowProfileMenu(false); }} className="flex w-full items-center gap-2 px-4 py-2 text-sm text-[var(--text-main)] hover:bg-[var(--light-bg)]">
                        <FileText size={16} /> {t.myTransactions}
                      </button>
                      <button onClick={() => { setActiveTab('certificates'); setShowProfileMenu(false); }} className="flex w-full items-center gap-2 px-4 py-2 text-sm text-[var(--text-main)] hover:bg-[var(--light-bg)]">
                        <Award size={16} /> {t.myCertificates}
                      </button>
                    </>
                  )}

                  {/* Teacher Specific Menu Items */}
                  {userRole === 'teacher' && (
                      <button onClick={() => { setActiveTab('services'); setShowProfileMenu(false); }} className="flex w-full items-center gap-2 px-4 py-2 text-sm text-[var(--text-main)] hover:bg-[var(--light-bg)]">
                        <Layers size={16} /> {language === 'ar' ? 'الخدمات' : 'Services'}
                      </button>
                  )}

                  <button onClick={() => { setActiveTab('support'); setShowProfileMenu(false); }} className="flex w-full items-center gap-2 px-4 py-2 text-sm text-[var(--text-main)] hover:bg-[var(--light-bg)]">
                    <Headphones size={16} /> {t.technicalSupport}
                  </button>
                  <button className="flex w-full items-center gap-2 px-4 py-2 text-sm text-[var(--text-main)] hover:bg-[var(--light-bg)]">
                    <Settings size={16} /> {t.settings}
                  </button>
                   <button onClick={() => { setActiveTab('disputes'); setShowProfileMenu(false); }} className="flex w-full items-center gap-2 px-4 py-2 text-sm text-[var(--text-main)] hover:bg-[var(--light-bg)]">
                    <AlertCircle size={16} /> {t.disputes}
                  </button>
                  
                  <div className="border-t border-[var(--border)] my-1"></div>
                  <button onClick={onLogout} className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50">
                    <LogOut size={16} /> {t.logout}
                  </button>
                </div>
              )}
            </div>
             
            {/* Mobile Menu Button */}
            <div className="md:hidden flex items-center">
               <button 
                 onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                 className="p-2 rounded-md text-white/80 hover:text-white hover:bg-white/10"
               >
                 <Menu size={24} />
               </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Nav */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-white/10 bg-gradient-to-br from-[var(--navy-dark)] via-[var(--navy)] to-[var(--navy-mid)]">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {navLinks.map(link => (
              <button
                key={link.id}
                onClick={() => { setActiveTab(link.id); setMobileMenuOpen(false); }}
                className={`block w-full text-start px-3 py-2 rounded-[50px] text-base font-medium ${
                  activeTab === link.id 
                    ? 'bg-white/15 text-[var(--green-light)]' 
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                }`}
              >
                {link.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
};