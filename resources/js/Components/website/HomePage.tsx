import React from 'react';
import { useLanguage } from '../../Contexts/LanguageContext';
import { Footer } from './Footer';
import { Users, ChevronRight, PlayCircle, Star, Smartphone, Monitor, Sparkles } from 'lucide-react';

interface HomePageProps {
    onLoginClick: () => void;
    onRegisterClick: () => void;
    onPageChange: (page: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onLoginClick, onRegisterClick, onPageChange }) => {
    const { t, language, direction } = useLanguage();

    return (
        <div className="min-h-screen bg-white font-sans text-[var(--text-main)] scroll-smooth" dir={direction}>

            {/* Hero Section */}
            <section id="home" className="hero -mt-20">
                <div className="hero-shape hero-shape-1"></div>
                <div className="hero-shape hero-shape-2"></div>
                <div className="hero-shape hero-shape-3"></div>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative w-full">
                    <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
                        <div className="flex-1 text-center lg:text-start">
                            <div className="hero-badge">
                                <Sparkles size={14} />
                                {language === 'ar' ? 'شركة تقنية تعليمية' : 'EdTech Company'}
                            </div>
                            <h1 className="hero-title text-4xl lg:text-6xl font-bold leading-tight">
                                {language === 'ar' ? 'إيوان للتقنية' : 'Ewan for'} <br />
                                <span>
                                    {language === 'ar' ? 'المعلومات والتعليم' : 'Information Technology'}
                                </span>
                            </h1>
                            <p className="hero-subtitle text-lg max-w-xl mx-auto lg:mx-0 leading-relaxed">
                                {language === 'ar'
                                    ? 'شركة تقنية متخصصة في تقديم حلول تعليمية مبتكرة. نطور منصة Ewan للتعلّم الفردي ونظام المدرسة الذكية للإدارة المدرسية.'
                                    : 'A technology company specialized in innovative education solutions. We develop Ewan for individual learning and Smart School for school management.'}
                            </p>
                            <div className="hero-actions flex-col sm:flex-row items-center justify-center lg:justify-start">
                                <button className="btn-primary-custom text-base" onClick={onRegisterClick}>
                                    {language === 'ar' ? 'سجل مجاناً' : 'Get Started Free'}
                                </button>
                                <button className="btn-secondary-custom text-base flex items-center gap-2" onClick={() => onPageChange('services')}>
                                    <PlayCircle size={20} /> {language === 'ar' ? 'خدماتنا' : 'Our Services'}
                                </button>
                            </div>
                            <div className="hero-stats justify-center lg:justify-start">
                                <div className="hero-stat-item">
                                    <span className="hero-stat-num">500<span>+</span></span>
                                    <span className="hero-stat-label">{language === 'ar' ? 'معلم معتمد' : 'Certified Teachers'}</span>
                                </div>
                                <div className="hero-divider"></div>
                                <div className="hero-stat-item">
                                    <span className="hero-stat-num">10k<span>+</span></span>
                                    <span className="hero-stat-label">{language === 'ar' ? 'مستخدم نشط' : 'Active Users'}</span>
                                </div>
                                <div className="hero-divider"></div>
                                <div className="hero-stat-item">
                                    <span className="hero-stat-num">5k<span>+</span></span>
                                    <span className="hero-stat-label">{language === 'ar' ? 'طالب مستفيد' : 'Students Served'}</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex-1 relative animate-fade-in w-full">
                            <div className="hero-visual">
                                <div className="hero-book-visual" style={{ borderRadius: 'var(--radius-lg)', background: 'transparent', boxShadow: 'none', overflow: 'hidden' }}>
                                    <img
                                        src="/heros/hero1.png"
                                        alt="Ewan learning"
                                        className="w-full h-[400px] object-cover"
                                    />
                                </div>
                                <div className="hero-card-float card-1">
                                    <Users size={24} style={{ color: '#7DC242' }} />
                                    <div>
                                        <p className="text-[11px] text-white/70 font-bold uppercase">{language === 'ar' ? 'طلاب ومعلمون' : 'Students & Teachers'}</p>
                                        <p className="text-xl font-bold text-white">15,000+</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Products Section - Two Main Products */}
            <section className="section-pad bg-light-custom">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center max-w-3xl mx-auto mb-16">
                        <h2 className="section-title text-3xl font-bold mb-4">{language === 'ar' ? 'منتجاتنا' : 'Our Products'}</h2>
                        <p className="section-subtitle mb-0">
                            {language === 'ar'
                                ? 'نقدم منتجين رئيسيين يخدمان قطاعين مختلفين: التعليم الفردي وإدارة المؤسسات التعليمية.'
                                : 'We offer two main products serving two different sectors: individual learning and school management.'}
                        </p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Ewan App */}
                        <div className="feature-card cursor-pointer" onClick={() => onPageChange('e_profile')}>
                            <div className="flex items-start gap-6 mb-6">
                                <div className="feature-icon"><Smartphone size={32} /></div>
                                <div>
                                    <h3 className="text-2xl font-bold text-navy mb-2">{language === 'ar' ? 'تطبيق Ewan' : 'Ewan App'}</h3>
                                    <p className="text-green font-semibold text-sm">{language === 'ar' ? 'للطلاب والمعلمين' : 'For Students & Teachers'}</p>
                                </div>
                            </div>
                            <p className="text-[var(--text-muted)] mb-6 leading-relaxed">
                                {language === 'ar'
                                    ? 'تطبيق جوال متكامل يربط الطلاب بأفضل المعلمين. نقدم دروساً خصوصية، دورات تدريبية، وتعليم لغات في بيئة تفاعلية.'
                                    : 'A fully integrated mobile app connecting students with top teachers. Offering private lessons, training courses, and language learning.'}
                            </p>
                            <div className="flex flex-wrap gap-3 mb-6">
                                {[
                                    language === 'ar' ? 'دروس خصوصية' : 'Private Lessons',
                                    language === 'ar' ? 'دورات تدريبية' : 'Courses',
                                    language === 'ar' ? 'تعليم لغات' : 'Language Learning',
                                    language === 'ar' ? 'شهادات معتمدة' : 'Certificates'
                                ].map((tag, i) => (
                                    <span key={i} className="px-3 py-1 bg-[var(--green-pale)] text-green rounded-full text-sm font-medium">{tag}</span>
                                ))}
                            </div>
                            <div className="pt-4 border-t border-[var(--border)] text-green font-semibold text-sm flex items-center gap-1">
                                {language === 'ar' ? 'اعرف أكثر' : 'Learn More'} <ChevronRight size={14} />
                            </div>
                        </div>

                        {/* Smart School */}
                        <div className="feature-card cursor-pointer" onClick={() => onPageChange('ewan_school')}>
                            <div className="flex items-start gap-6 mb-6">
                                <div className="feature-icon"><Monitor size={32} /></div>
                                <div>
                                    <h3 className="text-2xl font-bold text-navy mb-2">{language === 'ar' ? 'نظام المدرسة الذكية' : 'Smart School System'}</h3>
                                    <p className="text-green font-semibold text-sm">{language === 'ar' ? 'للمؤسسات التعليمية' : 'For Educational Institutions'}</p>
                                </div>
                            </div>
                            <p className="text-[var(--text-muted)] mb-6 leading-relaxed">
                                {language === 'ar'
                                    ? 'نظام متكامل لإدارة المدارس. يشمل إدارة الطلاب، النظام المالي، الجانب الأكاديمي، والتواصل مع أولياء الأمور.'
                                    : 'An integrated system for managing schools. Covers student management, financial system, academics, and parent communication.'}
                            </p>
                            <div className="flex flex-wrap gap-3 mb-6">
                                {[
                                    language === 'ar' ? 'إدارة الطلاب' : 'Student Management',
                                    language === 'ar' ? 'النظام المالي' : 'Finance',
                                    language === 'ar' ? 'الأكاديمي' : 'Academics',
                                    language === 'ar' ? 'تواصل أولياء الأمور' : 'Parent Communication'
                                ].map((tag, i) => (
                                    <span key={i} className="px-3 py-1 bg-[var(--green-pale)] text-green rounded-full text-sm font-medium">{tag}</span>
                                ))}
                            </div>
                            <div className="pt-4 border-t border-[var(--border)] text-green font-semibold text-sm flex items-center gap-1">
                                {language === 'ar' ? 'اعرف أكثر' : 'Learn More'} <ChevronRight size={14} />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Stats Bar */}
            <section className="stats-section">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                        {[
                            { val: '500+', label: language === 'ar' ? 'معلم معتمد' : 'Certified Teachers' },
                            { val: '10k+', label: language === 'ar' ? 'مستخدم نشط' : 'Active Users' },
                            { val: '5k+', label: language === 'ar' ? 'طالب مستفيد' : 'Students Served' },
                            { val: '4.9', label: language === 'ar' ? 'تقييم المستخدمين' : 'User Rating', icon: true }
                        ].map((stat, idx) => (
                            <div key={idx} className="stat-card">
                                <span className="stat-number flex items-center justify-center gap-1">
                                    {stat.val} {stat.icon && <Star size={18} fill="currentColor" className="text-amber-400" />}
                                </span>
                                <div className="stat-label">{stat.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* App Download Links */}
            <section className="section-pad-sm bg-light-custom">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
                        <div>
                            <h2 className="text-2xl font-bold text-navy mb-2">{language === 'ar' ? 'حمل تطبيق Ewan الآن' : 'Download Ewan App Now'}</h2>
                            <p className="text-[var(--text-muted)]">{language === 'ar' ? 'متوفر على iOS و Android' : 'Available on iOS and Android'}</p>
                        </div>
                        <div className="flex flex-wrap gap-4">
                            <a href="https://play.google.com/store/apps/details?id=com.ewan_mobile_app" target="_blank" rel="noopener noreferrer"
                                className="btn-primary-custom py-3 px-5">
                                <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current"><path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.53,12.9 20.18,13.18L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z"/></svg>
                                <div className="text-left"><div className="text-xs text-white/80">GET IT ON</div><div className="font-semibold">Google Play</div></div>
                            </a>
                            <a href="https://apps.apple.com/us/app/ewan-%D8%A5%D9%8A%D9%88%D8%A7%D9%86/id6754520719" target="_blank" rel="noopener noreferrer"
                                className="btn-navy py-3 px-5">
                                <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current"><path d="M18.71,19.5C17.88,20.74 17,21.95 15.66,21.97C14.32,22 13.89,21.18 12.37,21.18C10.84,21.18 10.37,21.95 9.1,22C7.79,22.05 6.8,20.68 5.96,19.47C4.25,17 2.94,12.45 4.7,9.39C5.57,7.87 7.13,6.91 8.82,6.88C10.1,6.86 11.32,7.75 12.11,7.75C12.89,7.75 14.37,6.68 15.92,6.84C16.57,6.87 18.39,7.1 19.56,8.82C19.47,8.88 17.39,10.1 17.41,12.63C17.44,15.65 20.06,16.66 20.09,16.67C20.06,16.74 19.67,18.11 18.71,19.5M13,3.5C13.73,2.67 14.94,2.04 15.94,2C16.07,3.17 15.6,4.35 14.9,5.19C14.21,6.04 13.07,6.7 11.95,6.61C11.8,5.37 12.36,4.26 13,3.5Z"/></svg>
                                <div className="text-left"><div className="text-xs text-white/80">DOWNLOAD ON</div><div className="font-semibold">App Store</div></div>
                            </a>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="cta-section section-pad">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative">
                    <h2 className="text-3xl md:text-4xl font-bold mb-4">
                        {language === 'ar' ? 'مستعد لبدء رحلتك مع إيوان؟' : 'Ready to Start with Ewan?'}
                    </h2>
                    <p className="text-lg mb-8 max-w-2xl mx-auto">
                        {language === 'ar'
                            ? 'انضم إلى آلاف المستفيدين من خدماتنا التعليمية والتقنية.'
                            : 'Join thousands benefiting from our educational and technical services.'}
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <button className="btn-primary-custom text-base" onClick={onRegisterClick}>
                            {language === 'ar' ? 'سجل مجاناً' : 'Sign Up for Free'}
                        </button>
                        <button className="btn-secondary-custom text-base" onClick={onLoginClick}>
                            {t.loginBtn}
                        </button>
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    );
};
