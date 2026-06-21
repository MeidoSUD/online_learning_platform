import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../../Contexts/LanguageContext';
import { Button } from '../ui/Button';
import { Logo } from '../Logo';
import { Menu, X, Globe, ChevronDown } from 'lucide-react';
import { Link, router, usePage } from '@inertiajs/react';

export const WebsiteNavbar: React.FC = () => {
  const { t, language, setLanguage } = useLanguage();
  const { url } = usePage();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentPath = url;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNavClick = (href: string) => {
    setIsMenuOpen(false);
    setOpenDropdown(null);
    router.visit(href);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const isActive = (path: string) => currentPath === path || currentPath.startsWith(path + '/');

  const products = [
    { id: 'eprofile', label: language === 'ar' ? 'تطبيق Ewan' : 'Ewan App', href: '/e-profile', desc: language === 'ar' ? 'للطلاب والمعلمين' : 'For Students & Teachers' },
    { id: 'school', label: language === 'ar' ? 'المدرسة الذكية' : 'Smart School', href: '/ecosystem', desc: language === 'ar' ? 'للمؤسسات التعليمية' : 'For Schools & Institutes' },
    { id: 'landing', label: language === 'ar' ? 'منصة Ewan' : 'Ewan Platform', href: '/ewan-landing', desc: language === 'ar' ? 'منصة التعلم' : 'Learning Platform' },
  ];

  const pageLinks = [
    { id: 'home', label: language === 'ar' ? 'الرئيسية' : 'Home', href: '/', desc: language === 'ar' ? 'الصفحة الرئيسية' : 'Back to homepage' },
    { id: 'services', label: language === 'ar' ? 'خدماتنا' : 'Services', href: '/services', desc: language === 'ar' ? 'ماذا نقدم' : 'What we offer' },
    { id: 'about', label: language === 'ar' ? 'من نحن' : 'About Us', href: '/about', desc: language === 'ar' ? 'تعرف علينا' : 'Learn about us' },
    { id: 'contact', label: language === 'ar' ? 'اتصل بنا' : 'Contact', href: '/contact', desc: language === 'ar' ? 'تواصل معنا' : 'Get in touch' },
  ];

  return (
    <nav className="fixed w-full z-50 bg-white/95 backdrop-blur-sm border-b border-slate-100 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          
          {/* Logo */}
          <Link href="/" className="flex-shrink-0">
            <Logo />
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center space-x-1 rtl:space-x-reverse" ref={dropdownRef}>
            {/* Products Dropdown */}
            <div className="relative">
              <button
                onMouseEnter={() => setOpenDropdown('products')}
                onClick={() => setOpenDropdown(openDropdown === 'products' ? null : 'products')}
                className={`flex items-center gap-1 px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                  openDropdown === 'products' || isActive('/e-profile') || isActive('/ecosystem') || isActive('/ewan-landing')
                    ? 'text-primary bg-blue-50' 
                    : 'text-slate-600 hover:text-primary hover:bg-slate-50'
                }`}
              >
                {language === 'ar' ? 'المنتجات' : 'Products'}
                <ChevronDown size={14} className={`transition-transform ${openDropdown === 'products' ? 'rotate-180' : ''}`} />
              </button>
              {openDropdown === 'products' && (
                <div 
                  onMouseLeave={() => setOpenDropdown(null)}
                  className="absolute top-full right-0 mt-1 w-64 bg-white rounded-xl shadow-xl border border-slate-100 py-3 animate-fade-in z-50"
                >
                  {products.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => handleNavClick(p.href)}
                      className={`w-full text-right px-5 py-3 hover:bg-slate-50 transition-colors flex flex-col group ${
                        isActive(p.href) ? 'bg-blue-50' : ''
                      }`}
                    >
                      <span className="font-bold text-slate-900 group-hover:text-primary transition-colors">{p.label}</span>
                      <span className="text-xs text-slate-400">{p.desc}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Page Links */}
            {pageLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => handleNavClick(link.href)}
                className={`relative px-4 py-2 text-sm font-medium rounded-lg transition-all group ${
                  isActive(link.href) ? 'text-primary bg-blue-50' : 'text-slate-600 hover:text-primary hover:bg-slate-50'
                }`}
              >
                {link.label}
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-[10px] text-primary whitespace-nowrap">
                  {link.desc}
                </span>
              </button>
            ))}
          </div>

          {/* Actions */}
          <div className="hidden md:flex items-center gap-4">
             <button 
                onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
                className="p-2 rounded-full text-slate-500 hover:bg-slate-100 transition-colors flex items-center gap-1 text-sm font-medium"
             >
                <Globe size={18} />
                {language === 'en' ? 'AR' : 'EN'}
             </button>
             <div className="h-6 w-px bg-slate-200"></div>
             <Link href="/login" className="text-slate-900 font-semibold hover:text-primary">
                 {t.loginBtn}
             </Link>
             <Link href="/register">
                 <Button size="sm">
                     {t.registerBtn}
                 </Button>
             </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 text-slate-600">
                {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-white border-b border-slate-100 animate-fade-in">
          <div className="px-4 pt-2 pb-6 space-y-4">
            {/* Products Section */}
            <div className="px-3">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">{language === 'ar' ? 'المنتجات' : 'Products'}</p>
              {products.map((p) => (
                <button
                  key={p.id}
                  onClick={() => handleNavClick(p.href)}
                  className={`w-full flex justify-between items-center px-3 py-3 text-sm font-medium rounded-lg transition-colors ${
                    isActive(p.href) ? 'bg-blue-50 text-primary' : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span className="text-xs text-slate-400">{p.desc}</span>
                  <span>{p.label}</span>
                </button>
              ))}
            </div>
            <div className="border-t border-slate-100" />
            {/* Page Links */}
            {pageLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => handleNavClick(link.href)}
                className="block w-full text-start px-3 py-2 text-base font-medium text-slate-700 hover:bg-slate-50 rounded-lg"
              >
                {link.label}
              </button>
            ))}
            <div className="border-t border-slate-100 pt-4 flex flex-col gap-3">
                 <button 
                    onClick={() => { setLanguage(language === 'en' ? 'ar' : 'en'); setIsMenuOpen(false); }}
                    className="flex items-center gap-2 px-3 py-2 text-slate-600"
                 >
                    <Globe size={18} /> {t.language}
                 </button>
                 <Link href="/login" onClick={() => setIsMenuOpen(false)}>
                     <Button variant="outline" className="w-full justify-center">
                         {t.loginBtn}
                     </Button>
                 </Link>
                 <Link href="/register" onClick={() => setIsMenuOpen(false)}>
                     <Button className="w-full justify-center">
                         {t.registerBtn}
                     </Button>
                 </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};
