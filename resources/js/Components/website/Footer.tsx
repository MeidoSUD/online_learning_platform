import React from 'react';
import { Link } from '@inertiajs/react';
import { useLanguage } from '../../Contexts/LanguageContext';
import { Hexagon, Mail, Phone, MapPin, Globe, Link2, Camera, ChevronLeft } from 'lucide-react';

export const Footer: React.FC = () => {
    const { t, language } = useLanguage();

    return (
        <footer className="footer">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
                    {/* Brand */}
                    <div>
                        <Link href="/" className="flex items-center gap-2 mb-6">
                            <Hexagon className="text-green-light fill-green-light" size={32} />
                            <span className="text-xl font-bold tracking-tight text-white">Ewan</span>
                        </Link>
                        <p className="footer-desc">
                            {language === 'ar'
                                ? 'شركة تقنية رائدة متخصصة في تقديم حلول تعليمية مبتكرة للأفراد والمؤسسات.'
                                : 'A leading technology company specialized in innovative education solutions for individuals and institutions.'}
                        </p>
                        <div className="footer-social">
                            <a href="#" aria-label="Globe"><Globe size={18} /></a>
                            <a href="#" aria-label="Camera"><Camera size={18} /></a>
                            <a href="#" aria-label="Link"><Link2 size={18} /></a>
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h5>{language === 'ar' ? 'روابط سريعة' : 'Quick Links'}</h5>
                        <ul className="footer-links">
                            <li><Link href="/"><ChevronLeft size={14} />{language === 'ar' ? 'الرئيسية' : 'Home'}</Link></li>
                            <li><Link href="/services"><ChevronLeft size={14} />{language === 'ar' ? 'الخدمات' : 'Services'}</Link></li>
                            <li><Link href="/about"><ChevronLeft size={14} />{language === 'ar' ? 'من نحن' : 'About Us'}</Link></li>
                            <li><Link href="/contact"><ChevronLeft size={14} />{language === 'ar' ? 'اتصل بنا' : 'Contact'}</Link></li>
                        </ul>
                    </div>

                    {/* Products */}
                    <div>
                        <h5>{language === 'ar' ? 'منتجاتنا' : 'Our Products'}</h5>
                        <ul className="footer-links">
                            <li><Link href="/e-profile"><ChevronLeft size={14} />{language === 'ar' ? 'تطبيق Ewan' : 'Ewan App'}</Link></li>
                            <li><Link href="/ecosystem"><ChevronLeft size={14} />{language === 'ar' ? 'نظام المدرسة الذكية' : 'Smart School System'}</Link></li>
                            <li><Link href="/ewan-landing"><ChevronLeft size={14} />{language === 'ar' ? 'منصة Ewan' : 'Ewan Platform'}</Link></li>
                        </ul>
                    </div>

                    {/* Contact */}
                    <div>
                        <h5>{language === 'ar' ? 'تواصل معنا' : 'Contact Us'}</h5>
                        <ul className="footer-links">
                            <li>
                                <a href="#"><MapPin size={16} />{language === 'ar' ? 'جدة - شارع الأمير سلطان' : 'Jeddah - ALameer Sultan Street'}</a>
                            </li>
                            <li>
                                <a href="tel:+966555683154"><Phone size={16} /><span dir="ltr">+966 555683154</span></a>
                            </li>
                            <li>
                                <a href="mailto:contact@ewan-geniuses.com"><Mail size={16} />contact@ewan-geniuses.com</a>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="footer-bottom flex flex-col md:flex-row justify-between items-center gap-4">
                    <p>&copy; {new Date().getFullYear()} Ewan. All rights reserved.</p>
                    <div className="flex gap-6">
                        <a href="#" className="hover:text-green-light transition-colors">Privacy Policy</a>
                        <a href="#" className="hover:text-green-light transition-colors">Terms of Service</a>
                    </div>
                </div>
            </div>
        </footer>
    );
};
