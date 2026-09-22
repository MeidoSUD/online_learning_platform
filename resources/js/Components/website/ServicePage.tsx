import React from 'react';
import { Link } from '@inertiajs/react';
import { useLanguage } from '../../Contexts/LanguageContext';
import { Footer } from './Footer';
import { BookOpen, Globe, Users, GraduationCap, Smartphone, Monitor, Sparkles, ChevronLeft, Library, Bot } from 'lucide-react';

const cardThemes = ['green', 'navy', 'accent', 'orange', 'purple', 'teal'];

export const ServicePage: React.FC = () => {
  const { language, direction } = useLanguage();

  const services = [
    {
      icon: GraduationCap,
      title: language === 'ar' ? 'دروس خصوصية' : 'Private Lessons',
      desc: language === 'ar' ? 'جلسات تعليمية فردية مع نخبة من المعلمين المعتمدين في جميع المواد والتخصصات. نوفر بيئة تعليمية مرنة تناسب جدول الطالب.' : 'One-on-one educational sessions with certified teachers across all subjects. A flexible learning environment tailored to each student\'s schedule.',
      features: language === 'ar' ? ['جميع المواد الدراسية', 'جدول مرن', 'متابعة مستمرة', 'تقارير أداء'] : ['All subjects', 'Flexible schedule', 'Continuous follow-up', 'Performance reports'],
      color: 'from-blue-500 to-blue-600'
    },
    {
      icon: Globe,
      title: language === 'ar' ? 'تعليم اللغات' : 'Language Learning',
      desc: language === 'ar' ? 'برامج شاملة لتعليم اللغات مع متحدثين أصليين ومناهج معتمدة. دورات تناسب جميع المستويات من المبتدئ إلى المتقدم.' : 'Comprehensive language programs with native speakers and accredited curricula. Courses for all levels from beginner to advanced.',
      features: language === 'ar' ? ['الإنجليزية', 'الفرنسية', 'الألمانية', 'التركية'] : ['English', 'French', 'German', 'Turkish'],
      color: 'from-purple-500 to-purple-600'
    },
    {
      icon: BookOpen,
      title: language === 'ar' ? 'دورات تدريبية' : 'Training Courses',
      desc: language === 'ar' ? 'دورات متخصصة في مختلف المجالات المهنية والأكاديمية مع شهادات إتمام معتمدة. تطوير للمهارات مع خبراء في المجال.' : 'Specialized courses in various professional and academic fields with accredited certificates. Skill development with industry experts.',
      features: language === 'ar' ? ['تطوير مهني', 'شهادات معتمدة', 'محتوى تفاعلي', 'مشاريع تطبيقية'] : ['Professional development', 'Accredited certificates', 'Interactive content', 'Practical projects'],
      color: 'from-emerald-500 to-emerald-600'
    },
    {
      icon: Monitor,
      title: language === 'ar' ? 'نظام إدارة المدارس' : 'School Management System',
      desc: language === 'ar' ? 'نظام متكامل لإدارة المؤسسات التعليمية. يشمل إدارة الطلاب، النظام المالي، الجانب الأكاديمي، والتواصل مع أولياء الأمور.' : 'Integrated system for managing educational institutions. Covers student management, finance, academics, and parent communication.',
      features: language === 'ar' ? ['إدارة الطلاب', 'النظام المالي', 'الأكاديمي', 'تواصل أولياء الأمور'] : ['Student management', 'Finance system', 'Academics', 'Parent communication'],
      color: 'from-slate-900 to-slate-700'
    },
    {
      icon: Smartphone,
      title: language === 'ar' ? 'تطبيق جوال' : 'Mobile Application',
      desc: language === 'ar' ? 'تطبيق جوال ذكي متاح على iOS و Android يربط الطلاب بالمعلمين ويتيح متابعة التعليم في أي وقت ومن أي مكان.' : 'Smart mobile app available on iOS and Android connecting students with teachers for learning anytime, anywhere.',
      features: language === 'ar' ? ['iOS & Android', 'بث مباشر', 'مكتبة رقمية', 'إشعارات فورية'] : ['iOS & Android', 'Live streaming', 'Digital library', 'Instant notifications'],
      color: 'from-brand-blue to-blue-700'
    },
    {
      icon: Users,
      title: language === 'ar' ? 'استشارات تعليمية' : 'Educational Consulting',
      desc: language === 'ar' ? 'نقدم استشارات متخصصة للمؤسسات التعليمية في مجال التحول الرقمي وتطوير المناهج وتحسين الأداء التعليمي.' : 'Specialized consulting for educational institutions in digital transformation, curriculum development, and performance improvement.',
      features: language === 'ar' ? ['تحول رقمي', 'تطوير مناهج', 'تحليل أداء', 'تدريب كوادر'] : ['Digital transformation', 'Curriculum development', 'Performance analysis', 'Staff training'],
      color: 'from-orange-500 to-orange-600'
    },
    {
      icon: Bot,
      title: language === 'ar' ? 'المساعد الذكي' : 'AI Assistant',
      desc: language === 'ar' ? 'مساعد تعليمي ذكي يعتمد على الذكاء الاصطناعي لشرح الدروس وحل المسائل خطوة بخطوة على مدار الساعة.' : 'An AI-powered educational assistant that explains lessons and solves problems step by step around the clock.',
      features: language === 'ar' ? ['شروحات فورية', 'حل خطوة بخطوة', 'بالعربية والإنجليزية', 'متاح دائماً'] : ['Instant explanations', 'Step-by-step solutions', 'Arabic & English', 'Always available'],
      color: 'from-blue-600 to-indigo-600'
    },
    {
      icon: Library,
      title: language === 'ar' ? 'الكتب الدراسية' : 'Study Books',
      desc: language === 'ar' ? 'مكتبة رقمية من الكتب والحلول والملخصات لجميع المراحل الدراسية، من الابتدائية حتى الثانوية، مرتبة حسب الصف الدراسي.' : 'A digital library of textbooks, solutions and summaries for all school stages, from primary to secondary, organized by grade.',
      features: language === 'ar' ? ['جميع المراحل', 'حلول المناهج', 'ملخصات واختبارات', 'من الابتدائي للثانوي'] : ['All stages', 'Curriculum solutions', 'Summaries & tests', 'Primary to secondary'],
      color: 'from-teal-500 to-emerald-600'
    }
  ];

  const stageName = (stage: string, lang: string) => {
    if (lang === 'ar') {
      return stage === 'primary' ? 'المرحلة الابتدائية' : stage === 'middle' ? 'المرحلة المتوسطة' : 'المرحلة الثانوية';
    }
    return stage === 'primary' ? 'Primary Stage' : stage === 'middle' ? 'Intermediate Stage' : 'Secondary Stage';
  };

  return (
    <div className="min-h-screen bg-white" dir={direction}>
      {/* Hero */}
      <section className="page-hero -mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            <div className="flex-1 text-center lg:text-start">
              <div className="hero-badge">
                <Sparkles size={14} />
                {language === 'ar' ? 'كل ما تحتاج في مكان واحد' : 'Everything you need in one place'}
              </div>
              <nav className="breadcrumb-custom">
                <Link href="/">{language === 'ar' ? 'الرئيسية' : 'Home'}</Link>
                <ChevronLeft size={12} />
                <span className="current">{language === 'ar' ? 'خدماتنا' : 'Our Services'}</span>
              </nav>
              <h1 className="text-4xl lg:text-5xl font-bold">{language === 'ar' ? 'خدماتنا' : 'Our Services'}</h1>
              <p className="text-lg max-w-3xl">
                {language === 'ar'
                  ? 'نقدم مجموعة متكاملة من الخدمات التعليمية والتقنية المصممة لتلبية احتياجات الأفراد والمؤسسات على حد سواء.'
                  : 'We offer a comprehensive suite of educational and technical services designed to meet the needs of both individuals and institutions.'}
              </p>
            </div>
            <div className="flex-1">
              <img src="/heros/teacher.png" alt="Our Services" className="w-full max-w-md mx-auto rounded-[var(--radius-lg)] shadow-[var(--shadow-lg)] border border-white/20" />
            </div>
          </div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="section-pad bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((service, idx) => (
              <div key={idx} className="service-card">
                <div className={`service-card-top ${cardThemes[idx % cardThemes.length]}`}>
                  <service.icon size={56} />
                </div>
                <div className="service-card-body">
                  <h3 className="text-xl font-bold text-navy mb-3">{service.title}</h3>
                  <p className="text-sm leading-relaxed mb-4">{service.desc}</p>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {service.features.map((feat, i) => (
                      <span key={i} className="px-3 py-1 bg-[var(--green-pale)] text-green rounded-full text-xs font-semibold">{feat}</span>
                    ))}
                  </div>
                  <button className="service-link mt-2">
                    {language === 'ar' ? 'اعرف أكثر' : 'Learn More'} <ChevronLeft size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* كتبي-style Books By Grade */}
      <section className="section-pad bg-[var(--light-bg)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 hero-badge mb-4">
              <Library size={14} />
              {language === 'ar' ? 'مكتبة الكتب' : 'Book Library'}
            </div>
            <h2 className="text-3xl font-bold text-navy mb-3">
              {language === 'ar' ? 'تصفح الكتب حسب المرحلة الدراسية' : 'Browse Books by Grade'}
            </h2>
            <p className="text-[var(--text-muted)] max-w-2xl mx-auto">
              {language === 'ar'
                ? 'جميع الكتب والحلول والملخصات مرتبة حسب الصف الدراسي لتجد ما تحتاجه بضغطة زر.'
                : 'All books, solutions and summaries organized by grade so you can find what you need at the click of a button.'}
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {[
              { ar: 'الصف الأول الابتدائي', en: '1st Primary', stage: 'primary' },
              { ar: 'الصف الثاني الابتدائي', en: '2nd Primary', stage: 'primary' },
              { ar: 'الصف الثالث الابتدائي', en: '3rd Primary', stage: 'primary' },
              { ar: 'الصف الرابع الابتدائي', en: '4th Primary', stage: 'primary' },
              { ar: 'الصف الخامس الابتدائي', en: '5th Primary', stage: 'primary' },
              { ar: 'الصف السادس الابتدائي', en: '6th Primary', stage: 'primary' },
              { ar: 'الأول المتوسط', en: '1st Intermediate', stage: 'middle' },
              { ar: 'الثاني المتوسط', en: '2nd Intermediate', stage: 'middle' },
              { ar: 'الثالث المتوسط', en: '3rd Intermediate', stage: 'middle' },
              { ar: 'الأول الثانوي', en: '1st Secondary', stage: 'secondary' },
              { ar: 'الثاني الثانوي', en: '2nd Secondary', stage: 'secondary' },
              { ar: 'الثالث الثانوي', en: '3rd Secondary', stage: 'secondary' },
            ].map((grade, idx) => (
              <div key={grade.en} className="service-card cursor-pointer">
                <div className={`service-card-top ${cardThemes[(idx + 1) % cardThemes.length]}`}>
                  <div className="text-center">
                    <p className="text-white text-3xl font-extrabold">{idx + 1}</p>
                    <p className="text-white/70 text-xs font-semibold mt-1">{grade.en}</p>
                  </div>
                </div>
                <div className="service-card-body text-center">
                  <h3 className="text-base font-bold text-navy">{grade.ar}</h3>
                  <p className="text-xs text-[var(--text-muted)] mt-1">
                    {stageName(grade.stage, language)}
                  </p>
                  <span className="service-link inline-flex items-center justify-center mt-3">
                    {language === 'ar' ? 'تصفح الكتب' : 'Browse Books'} <ChevronLeft size={14} className="rtl:rotate-180" />
                  </span>
                </div>
              </div>
            ))}
          </div>

          <p className="text-center text-xs text-[var(--text-muted)] mt-8">
            {language === 'ar'
              ? 'مكتبة الكتب متاحة عبر خدمة «الكتب الدراسية» في التطبيق والموقع.'
              : 'The book library is available through the "Study Books" service in the app and website.'}
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="cta-section section-pad">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative">
          <h2 className="text-3xl font-bold mb-4">{language === 'ar' ? 'هل لديك استفسار؟' : 'Have a Question?'}</h2>
          <p className="mb-8 max-w-2xl mx-auto">
            {language === 'ar'
              ? 'فريقنا جاهز للإجابة على جميع استفساراتك ومساعدتك في اختيار الخدمة المناسبة.'
              : 'Our team is ready to answer all your questions and help you choose the right service.'}
          </p>
          <a
            href="mailto:contact@ewan-geniuses.com"
            className="btn-primary-custom"
          >
            {language === 'ar' ? 'تواصل معنا' : 'Contact Us'}
          </a>
        </div>
      </section>

      <Footer />
    </div>
  );
};
