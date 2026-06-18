

import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../Contexts/LanguageContext';
import { Bell, LogOut, Settings, User, Globe, Menu, AlertCircle, CreditCard, FileText, Award, Layers } from 'lucide-react';
import { AuthResponse } from '../Services/api';
import { Logo } from './Logo';

interface NavbarProps {
  userData: AuthResponse;
  onLogout: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ userData, onLogout, activeTab, setActiveTab }) => {
  const { t, language, setLanguage, direction } = useLanguage();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifs, setShowNotifs] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const profileRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  const user = userData.user.data;
  const userRole = userData.user.role;

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
    { id: 'schedule', label: t.mySchedule },
  ];

  const navLinks = userRole === 'student' ? studentLinks : getTeacherLinks();

  return (
    <nav className="sticky top-0 z-30 w-full bg-white border-b border-slate-200 shadow-sm">
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
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === link.id 
                      ? 'bg-primary/10 text-primary' 
                      : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
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
              className="p-2 rounded-full text-slate-500 hover:bg-slate-100 transition-colors"
              title={t.language}
            >
              <Globe size={20} />
            </button>

            {/* Notifications */}
            <div className="relative" ref={notifRef}>
              <button 
                onClick={() => setShowNotifs(!showNotifs)}
                className="p-2 rounded-full text-slate-500 hover:bg-slate-100 transition-colors relative"
              >
                <Bell size={20} />
                <span className="absolute top-1 right-1 h-2.5 w-2.5 rounded-full bg-red-500 border-2 border-white"></span>
              </button>

              {showNotifs && (
                <div className={`absolute top-12 w-80 bg-white rounded-xl shadow-lg ring-1 ring-black ring-opacity-5 py-1 ${direction === 'rtl' ? 'left-0' : 'right-0'}`}>
                  <div className="px-4 py-3 border-b border-slate-100 flex justify-between items-center">
                    <h3 className="text-sm font-semibold text-slate-900">{t.notifications}</h3>
                    <button className="text-xs text-primary hover:underline">{t.markAllRead}</button>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    <div className="px-4 py-8 text-center text-slate-500 text-sm">
                      {t.noNotifications}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* User Dropdown */}
            <div className="relative ml-3" ref={profileRef}>
              <button 
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center gap-3 p-1 rounded-full hover:bg-slate-50 transition-colors focus:outline-none"
              >
                <div className="h-9 w-9 rounded-full bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center text-white font-bold shadow-md shadow-blue-200">
                   {(user.first_name?.charAt(0) || 'U').toUpperCase()}
                </div>
                <div className="hidden lg:block text-start">
                  <p className="text-sm font-medium text-slate-700">{user.first_name}</p>
                  <p className="text-xs text-slate-400 truncate max-w-[100px]">{userRole?.toUpperCase()}</p>
                </div>
              </button>

              {showProfileMenu && (
                <div className={`absolute top-12 w-56 bg-white rounded-xl shadow-lg ring-1 ring-black ring-opacity-5 py-1 ${direction === 'rtl' ? 'left-0' : 'right-0'}`}>
                  <div className="px-4 py-2 border-b border-slate-100 lg:hidden">
                    <p className="text-sm font-medium text-slate-900">{user.first_name} {user.last_name}</p>
                    <p className="text-xs text-slate-500 truncate">{user.email}</p>
                  </div>
                  
                  <button onClick={() => { setActiveTab('profile'); setShowProfileMenu(false); }} className="flex w-full items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">
                    <User size={16} /> {t.profile}
                  </button>
                  
                  {/* Student Specific Menu Items */}
                  {userRole === 'student' && (
                    <>
                      <button onClick={() => { setActiveTab('wallet'); setShowProfileMenu(false); }} className="flex w-full items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">
                        <CreditCard size={16} /> {t.paymentMethods}
                      </button>
                      <button onClick={() => { setActiveTab('transactions'); setShowProfileMenu(false); }} className="flex w-full items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">
                        <FileText size={16} /> {t.myTransactions}
                      </button>
                      <button onClick={() => { setActiveTab('certificates'); setShowProfileMenu(false); }} className="flex w-full items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">
                        <Award size={16} /> {t.myCertificates}
                      </button>
                    </>
                  )}

                  {/* Teacher Specific Menu Items */}
                  {userRole === 'teacher' && (
                      <button onClick={() => { setActiveTab('services'); setShowProfileMenu(false); }} className="flex w-full items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">
                        <Layers size={16} /> {language === 'ar' ? 'الخدمات' : 'Services'}
                      </button>
                  )}

                  <button className="flex w-full items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">
                    <Settings size={16} /> {t.settings}
                  </button>
                   <button onClick={() => { setActiveTab('disputes'); setShowProfileMenu(false); }} className="flex w-full items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">
                    <AlertCircle size={16} /> {t.disputes}
                  </button>
                  
                  <div className="border-t border-slate-100 my-1"></div>
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
                 className="p-2 rounded-md text-slate-400 hover:text-slate-500 hover:text-slate-900 hover:bg-slate-100"
               >
                 <Menu size={24} />
               </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Nav */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {navLinks.map(link => (
              <button
                key={link.id}
                onClick={() => { setActiveTab(link.id); setMobileMenuOpen(false); }}
                className={`block w-full text-start px-3 py-2 rounded-md text-base font-medium ${
                  activeTab === link.id 
                    ? 'bg-primary/10 text-primary' 
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
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