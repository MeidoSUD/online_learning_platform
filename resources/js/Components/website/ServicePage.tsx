import React from 'react';
import { useLanguage } from '../../Contexts/LanguageContext';
import { Footer } from './Footer';
import { BookOpen, Globe, Users, GraduationCap, Award, Smartphone, Monitor, Sparkles, ChevronRight } from 'lucide-react';

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
    }
  ];

  return (
    <div className="min-h-screen bg-white" dir={direction}>
      {/* Hero */}
      <section className="pt-32 pb-20 bg-gradient-to-br from-slate-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-sm font-semibold mb-6">
            <Sparkles size={14} />
            {language === 'ar' ? 'كل ما تحتاج في مكان واحد' : 'Everything you need in one place'}
          </div>
          <h1 className="text-4xl lg:text-5xl font-bold text-slate-900 mb-4">{language === 'ar' ? 'خدماتنا' : 'Our Services'}</h1>
          <p className="text-slate-500 max-w-3xl mx-auto text-lg">
            {language === 'ar'
              ? 'نقدم مجموعة متكاملة من الخدمات التعليمية والتقنية المصممة لتلبية احتياجات الأفراد والمؤسسات على حد سواء.'
              : 'We offer a comprehensive suite of educational and technical services designed to meet the needs of both individuals and institutions.'}
          </p>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((service, idx) => (
              <div key={idx} className={`bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden group hover:shadow-2xl transition-all ${direction === 'rtl' ? 'text-right' : 'text-left'}`}>
                <div className={`bg-gradient-to-r ${service.color} p-6 text-white`}>
                  <service.icon size={36} className="opacity-90" />
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold text-slate-900 mb-3">{service.title}</h3>
                  <p className="text-slate-500 text-sm leading-relaxed mb-4">{service.desc}</p>
                  <div className="flex flex-wrap gap-2">
                    {service.features.map((feat, i) => (
                      <span key={i} className="px-3 py-1 bg-slate-50 text-slate-600 rounded-lg text-xs font-semibold">{feat}</span>
                    ))}
                  </div>
                  <button className={`mt-6 text-primary font-semibold text-sm flex items-center gap-1 group ${direction === 'rtl' ? 'flex-row' : 'flex-row'}`}>
                    {language === 'ar' ? 'اعرف أكثر' : 'Learn More'} <ChevronRight size={14} className={`transition-transform group-hover:translate-x-1 ${direction === 'rtl' ? 'rotate-180 group-hover:-translate-x-1' : ''}`} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-br from-primary to-blue-700 rounded-3xl p-12 text-center text-white shadow-2xl">
            <h2 className="text-3xl font-bold mb-4">{language === 'ar' ? 'هل لديك استفسار؟' : 'Have a Question?'}</h2>
            <p className="text-blue-100 mb-8 max-w-2xl mx-auto">
              {language === 'ar'
                ? 'فريقنا جاهز للإجابة على جميع استفساراتك ومساعدتك في اختيار الخدمة المناسبة.'
                : 'Our team is ready to answer all your questions and help you choose the right service.'}
            </p>
            <a
              href="mailto:contact@ewan-geniuses.com"
              className="inline-block bg-white text-primary px-8 py-4 rounded-xl font-bold shadow-lg hover:bg-slate-50 transition-colors"
            >
              {language === 'ar' ? 'تواصل معنا' : 'Contact Us'}
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};
