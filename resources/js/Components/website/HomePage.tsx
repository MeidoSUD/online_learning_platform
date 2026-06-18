import React from 'react';
import { useLanguage } from '../../Contexts/LanguageContext';
import { Button } from '../ui/Button';
import { Footer } from './Footer';
import { BookOpen, Users, Globe, Award, ChevronRight, PlayCircle, Star, Smartphone, Monitor, Sparkles } from 'lucide-react';

interface HomePageProps {
    onLoginClick: () => void;
    onRegisterClick: () => void;
    onPageChange: (page: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onLoginClick, onRegisterClick, onPageChange }) => {
    const { t, language, direction } = useLanguage();

    return (
        <div className="min-h-screen bg-white font-sans text-slate-900 scroll-smooth">

            {/* Hero Section */}
            <section id="home" className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-purple-50 -z-10"></div>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
                        <div className="flex-1 text-center lg:text-start">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-sm font-semibold mb-6 animate-fade-in">
                                <Sparkles size={14} />
                                {language === 'ar' ? 'شركة تقنية تعليمية' : 'EdTech Company'}
                            </div>
                            <h1 className="text-4xl lg:text-6xl font-bold tracking-tight text-slate-900 mb-6 leading-tight">
                                {language === 'ar' ? 'إيوان للتقنية' : 'Ewan for'} <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-600">
                                    {language === 'ar' ? 'المعلومات والتعليم' : 'Information Technology'}
                                </span>
                            </h1>
                            <p className="text-lg text-slate-600 mb-8 max-w-xl mx-auto lg:mx-0 leading-relaxed">
                                {language === 'ar'
                                    ? 'شركة تقنية متخصصة في تقديم حلول تعليمية مبتكرة. نطور منصة Ewan للتعلّم الفردي ونظام المدرسة الذكية للإدارة المدرسية.'
                                    : 'A technology company specialized in innovative education solutions. We develop Ewan for individual learning and Smart School for school management.'}
                            </p>
                            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                                <Button size="lg" className="shadow-xl shadow-primary/20 px-8 py-4 text-base" onClick={onRegisterClick}>
                                    {language === 'ar' ? 'سجل مجاناً' : 'Get Started Free'}
                                </Button>
                                <Button size="lg" variant="outline" className="px-8 py-4 text-base flex items-center gap-2" onClick={() => onPageChange('services')}>
                                    <PlayCircle size={20} /> {language === 'ar' ? 'خدماتنا' : 'Our Services'}
                                </Button>
                            </div>
                        </div>
                        <div className="flex-1 relative animate-fade-in">
                            <div className="absolute -inset-4 bg-gradient-to-r from-primary to-purple-600 rounded-full blur-3xl opacity-20"></div>
                            <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-100 p-2">
                                <img
                                    src="https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&q=80&w=1200"
                                    alt="Ewan learning"
                                    className="rounded-xl w-full object-cover h-[400px]"
                                />
                                <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 bg-white p-4 rounded-xl shadow-xl border border-slate-50 flex items-center gap-4 whitespace-nowrap">
                                    <div className="bg-green-100 p-3 rounded-full text-green-600">
                                        <Users size={24} />
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500 font-bold uppercase">{language === 'ar' ? 'طلاب ومعلمون' : 'Students & Teachers'}</p>
                                        <p className="text-xl font-bold text-slate-900">15,000+</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Products Section - Two Main Products */}
            <section className="py-20 bg-slate-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center max-w-3xl mx-auto mb-16">
                        <h2 className="text-3xl font-bold text-slate-900 mb-4">{language === 'ar' ? 'منتجاتنا' : 'Our Products'}</h2>
                        <p className="text-slate-500">
                            {language === 'ar'
                                ? 'نقدم منتجين رئيسيين يخدمان قطاعين مختلفين: التعليم الفردي وإدارة المؤسسات التعليمية.'
                                : 'We offer two main products serving two different sectors: individual learning and school management.'}
                        </p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Ewan App */}
                        <div className="bg-white rounded-3xl p-8 lg:p-12 shadow-xl border border-slate-100 hover:shadow-2xl transition-all group cursor-pointer" onClick={() => onPageChange('e_profile')}>
                            <div className="flex items-start gap-6 mb-6">
                                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shrink-0">
                                    <Smartphone size={32} />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-bold text-slate-900 mb-2">{language === 'ar' ? 'تطبيق Ewan' : 'Ewan App'}</h3>
                                    <p className="text-primary font-semibold text-sm">{language === 'ar' ? 'للطلاب والمعلمين' : 'For Students & Teachers'}</p>
                                </div>
                            </div>
                            <p className="text-slate-600 mb-6 leading-relaxed">
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
                                    <span key={i} className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-sm font-medium">{tag}</span>
                                ))}
                            </div>
                            <div className="pt-4 border-t border-slate-100 text-primary font-semibold text-sm flex items-center gap-1">
                                {language === 'ar' ? 'اعرف أكثر' : 'Learn More'} <ChevronRight size={14} />
                            </div>
                        </div>

                        {/* Smart School */}
                        <div className="bg-white rounded-3xl p-8 lg:p-12 shadow-xl border border-slate-100 hover:shadow-2xl transition-all group cursor-pointer" onClick={() => onPageChange('ewan_school')}>
                            <div className="flex items-start gap-6 mb-6">
                                <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center text-white shadow-lg shrink-0">
                                    <Monitor size={32} />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-bold text-slate-900 mb-2">{language === 'ar' ? 'نظام المدرسة الذكية' : 'Smart School System'}</h3>
                                    <p className="text-emerald-600 font-semibold text-sm">{language === 'ar' ? 'للمؤسسات التعليمية' : 'For Educational Institutions'}</p>
                                </div>
                            </div>
                            <p className="text-slate-600 mb-6 leading-relaxed">
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
                                    <span key={i} className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-sm font-medium">{tag}</span>
                                ))}
                            </div>
                            <div className="pt-4 border-t border-slate-100 text-emerald-600 font-semibold text-sm flex items-center gap-1">
                                {language === 'ar' ? 'اعرف أكثر' : 'Learn More'} <ChevronRight size={14} />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Stats Bar */}
            <section className="py-12 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                        {[
                            { val: '500+', label: language === 'ar' ? 'معلم معتمد' : 'Certified Teachers' },
                            { val: '10k+', label: language === 'ar' ? 'مستخدم نشط' : 'Active Users' },
                            { val: '5k+', label: language === 'ar' ? 'طالب مستفيد' : 'Students Served' },
                            { val: '4.9', label: language === 'ar' ? 'تقييم المستخدمين' : 'User Rating', icon: true }
                        ].map((stat, idx) => (
                            <div key={idx} className="p-4">
                                <div className="text-3xl font-bold text-primary mb-1 flex items-center justify-center gap-1">
                                    {stat.val} {stat.icon && <Star size={18} fill="currentColor" className="text-amber-400" />}
                                </div>
                                <div className="text-sm text-slate-500 font-medium">{stat.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* App Download Links */}
            <section className="py-16 bg-slate-900 text-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
                        <div>
                            <h2 className="text-2xl font-bold mb-2">{language === 'ar' ? 'حمل تطبيق Ewan الآن' : 'Download Ewan App Now'}</h2>
                            <p className="text-slate-400">{language === 'ar' ? 'متوفر على iOS و Android' : 'Available on iOS and Android'}</p>
                        </div>
                        <div className="flex flex-wrap gap-4">
                            <a href="https://play.google.com/store/apps/details?id=com.ewan_mobile_app" target="_blank" rel="noopener noreferrer"
                                className="flex items-center gap-3 bg-white/10 hover:bg-white/20 transition-colors px-6 py-4 rounded-xl border border-white/10">
                                <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current"><path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.53,12.9 20.18,13.18L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z"/></svg>
                                <div className="text-left"><div className="text-xs text-slate-400">GET IT ON</div><div className="font-semibold">Google Play</div></div>
                            </a>
                            <a href="https://apps.apple.com/us/app/ewan-%D8%A5%D9%8A%D9%88%D8%A7%D9%86/id6754520719" target="_blank" rel="noopener noreferrer"
                                className="flex items-center gap-3 bg-white/10 hover:bg-white/20 transition-colors px-6 py-4 rounded-xl border border-white/10">
                                <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current"><path d="M18.71,19.5C17.88,20.74 17,21.95 15.66,21.97C14.32,22 13.89,21.18 12.37,21.18C10.84,21.18 10.37,21.95 9.1,22C7.79,22.05 6.8,20.68 5.96,19.47C4.25,17 2.94,12.45 4.7,9.39C5.57,7.87 7.13,6.91 8.82,6.88C10.1,6.86 11.32,7.75 12.11,7.75C12.89,7.75 14.37,6.68 15.92,6.84C16.57,6.87 18.39,7.1 19.56,8.82C19.47,8.88 17.39,10.1 17.41,12.63C17.44,15.65 20.06,16.66 20.09,16.67C20.06,16.74 19.67,18.11 18.71,19.5M13,3.5C13.73,2.67 14.94,2.04 15.94,2C16.07,3.17 15.6,4.35 14.9,5.19C14.21,6.04 13.07,6.7 11.95,6.61C11.8,5.37 12.36,4.26 13,3.5Z"/></svg>
                                <div className="text-left"><div className="text-xs text-slate-400">DOWNLOAD ON</div><div className="font-semibold">App Store</div></div>
                            </a>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 bg-white">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="bg-gradient-to-br from-primary to-blue-700 rounded-3xl p-10 md:p-16 text-center text-white shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-16 bg-white/10 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
                        <div className="absolute bottom-0 left-0 p-20 bg-black/10 rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2"></div>
                        <h2 className="text-3xl md:text-4xl font-bold mb-4 relative z-10">
                            {language === 'ar' ? 'مستعد لبدء رحلتك مع إيوان؟' : 'Ready to Start with Ewan?'}
                        </h2>
                        <p className="text-blue-100 mb-8 max-w-2xl mx-auto text-lg relative z-10">
                            {language === 'ar'
                                ? 'انضم إلى آلاف المستفيدين من خدماتنا التعليمية والتقنية.'
                                : 'Join thousands benefiting from our educational and technical services.'}
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center relative z-10">
                            <Button className="bg-white text-primary hover:bg-slate-100 border-0 px-8 py-4 text-base shadow-lg" onClick={onRegisterClick}>
                                {language === 'ar' ? 'سجل مجاناً' : 'Sign Up for Free'}
                            </Button>
                            <Button variant="outline" className="border-white text-white hover:bg-white/10 px-8 py-4 text-base" onClick={onLoginClick}>
                                {t.loginBtn}
                            </Button>
                        </div>
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    );
};
