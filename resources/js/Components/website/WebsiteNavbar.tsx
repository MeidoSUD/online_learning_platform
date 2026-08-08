import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../../Contexts/LanguageContext';
import { Logo } from '../Logo';
import { ChevronDown, Globe, X } from 'lucide-react';
import { Link, router, usePage } from '@inertiajs/react';

export const WebsiteNavbar: React.FC = () => {
  const { t, language, setLanguage } = useLanguage();
  const { url } = usePage();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentPath = url;

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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

  const isHome = currentPath === '/';
  const heroPage = isHome && !scrolled;
  const navClass = `navbar-site ${scrolled ? 'scrolled' : ''} ${heroPage ? 'hero-page' : 'page-nav'}`;
  const isLight = heroPage;

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
    <nav className={navClass}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          
          {/* Logo */}
          <Link href="/" className="flex-shrink-0 flex items-center gap-2">
            <Logo onDark={isLight} />
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center space-x-1 rtl:space-x-reverse" ref={dropdownRef}>
            {/* Products Dropdown */}
            <div className="relative">
              <button
                onMouseEnter={() => setOpenDropdown('products')}
                onClick={() => setOpenDropdown(openDropdown === 'products' ? null : 'products')}
                className={`nav-link flex items-center gap-1 ${
                  openDropdown === 'products' || isActive('/e-profile') || isActive('/ecosystem') || isActive('/ewan-landing')
                    ? 'active'
                    : ''
                }`}
              >
                {language === 'ar' ? 'المنتجات' : 'Products'}
                <ChevronDown size={14} className={`transition-transform ${openDropdown === 'products' ? 'rotate-180' : ''}`} />
              </button>
              {openDropdown === 'products' && (
                <div 
                  onMouseLeave={() => setOpenDropdown(null)}
                  className="absolute top-full right-0 mt-1 w-64 bg-white rounded-xl shadow-md border border-[var(--border)] py-3 animate-fade-in z-50"
                >
                  {products.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => handleNavClick(p.href)}
                      className={`w-full text-right px-5 py-3 hover:bg-[var(--light-bg)] transition-colors flex flex-col group ${
                        isActive(p.href) ? 'bg-[var(--green-pale)]' : ''
                      }`}
                    >
                      <span className="font-bold text-navy group-hover:text-green transition-colors">{p.label}</span>
                      <span className="text-xs text-[var(--text-muted)]">{p.desc}</span>
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
                className={`nav-link relative group ${
                  isActive(link.href) ? 'active' : ''
                }`}
              >
                {link.label}
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-[10px] text-green whitespace-nowrap">
                  {link.desc}
                </span>
              </button>
            ))}
          </div>

          {/* Actions */}
          <div className="hidden md:flex items-center gap-3">
             <button 
                onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
                className="lang-toggle"
             >
                <Globe size={14} />
                {language === 'en' ? 'AR' : 'EN'}
             </button>
             <Link href="/login" className="btn-login">
                 {t.loginBtn}
             </Link>
             <Link href="/register" className="btn-register">
                 {t.registerBtn}
             </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="navbar-toggler">
              {isMenuOpen ? (
                <X size={24} className={isLight ? 'text-white' : 'text-navy'} />
              ) : (
                <span className="toggler-icon"><span></span><span></span><span></span></span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className={`md:hidden mt-2 navbar-collapse-site animate-fade-in ${isLight ? '' : ''}`}>
          <div className="px-4 pt-2 pb-6 space-y-4">
            {/* Products Section */}
            <div className="px-3">
              <p className={`text-xs font-bold uppercase tracking-widest mb-2 ${isLight ? 'text-white/60' : 'text-[var(--text-muted)]'}`}>{language === 'ar' ? 'المنتجات' : 'Products'}</p>
              {products.map((p) => (
                <button
                  key={p.id}
                  onClick={() => handleNavClick(p.href)}
                  className={`w-full flex justify-between items-center px-3 py-3 text-sm font-medium rounded-lg transition-colors ${
                    isActive(p.href) ? 'bg-[var(--green-pale)] text-green' : `${isLight ? 'text-white/85 hover:bg-white/10' : 'text-slate-700 hover:bg-slate-50'}`
                  }`}
                >
                  <span className={`text-xs ${isLight ? 'text-white/50' : 'text-[var(--text-muted)]'}`}>{p.desc}</span>
                  <span>{p.label}</span>
                </button>
              ))}
            </div>
            <div className={`${isLight ? 'border-white/10' : 'border-slate-100'} border-t`} />
            {/* Page Links */}
            {pageLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => handleNavClick(link.href)}
                className={`block w-full text-start px-3 py-2 text-base font-medium rounded-lg ${isLight ? 'text-white/90 hover:bg-white/10' : 'text-slate-700 hover:bg-slate-50'} ${isActive(link.href) ? 'text-green' : ''}`}
              >
                {link.label}
              </button>
            ))}
            <div className={`${isLight ? 'border-white/10' : 'border-slate-100'} border-t pt-4 flex flex-col gap-3`}>
                 <button 
                    onClick={() => { setLanguage(language === 'en' ? 'ar' : 'en'); setIsMenuOpen(false); }}
                    className={`flex items-center gap-2 px-3 py-2 ${isLight ? 'text-white/90' : 'text-slate-600'}`}
                 >
                    <Globe size={18} /> {t.language}
                 </button>
                 <Link href="/login" onClick={() => setIsMenuOpen(false)} className="btn-login justify-center">
                     {t.loginBtn}
                 </Link>
                 <Link href="/register" onClick={() => setIsMenuOpen(false)} className="btn-register justify-center">
                     {t.registerBtn}
                 </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};
