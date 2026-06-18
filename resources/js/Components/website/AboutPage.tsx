import React from 'react';
import { useLanguage } from '../../Contexts/LanguageContext';
import { Footer } from './Footer';
import { Award, Target, Eye, Users, Code, Megaphone, Headphones, Rocket } from 'lucide-react';

const PhotoPlaceholder = ({ name, position }: { name: string; position: string }) => (
  <div className="group flex flex-col items-center">
    <div className="w-28 h-28 md:w-36 md:h-36 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center mb-4 shadow-lg border-2 border-white group-hover:shadow-xl transition-all overflow-hidden">
      <img
        src={`/assets/team/${position.toLowerCase().replace(/\s+/g, '-')}.png`}
        alt={name}
        className="w-full h-full object-cover opacity-0 group-hover:opacity-100 transition-opacity"
        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
      />
      <div className="absolute inset-0 flex items-center justify-center text-slate-300">
        <Users size={36} className="opacity-40" />
      </div>
    </div>
    <h4 className="text-base font-bold text-slate-900 text-center">{name}</h4>
    <p className="text-xs text-primary font-semibold text-center">{position}</p>
  </div>
);

export const AboutPage: React.FC = () => {
  const { language, direction } = useLanguage();

  const teamMembers = [
    { name: language === 'ar' ? 'نهي الدوسري' : 'Noha Al-Dosari', position: language === 'ar' ? 'المدير العام' : 'General Manager' },
    { name: language === 'ar' ? 'فالح السبيعي' : 'Faleh alsubaia', position: language === 'ar' ? 'مساعد المدير العام' : 'General Manager Assistant' },
    { name: language === 'ar' ? 'محمد الفاتح' : 'Mohamed Al-Fatih', position: language === 'ar' ? 'المدير التقني' : 'CTO' },
    { name: language === 'ar' ? 'أحمد السلمي' : 'Ahmed Al-Sulami', position: language === 'ar' ? 'مطور أول' : 'Senior Developer' },
    { name: language === 'ar' ? 'سارة القحطاني' : 'Sara Al-Qahtani', position: language === 'ar' ? 'مطور' : 'Developer' },
    { name: language === 'ar' ? 'خالد الزهراني' : 'Khalid Al-Zahrani', position: language === 'ar' ? 'مسؤول تسويق أول' : 'Senior Marketing Officer' },
    { name: language === 'ar' ? 'نوف الشهراني' : 'Nouf Al-Shahrani', position: language === 'ar' ? 'مسؤول تسويق' : 'Marketing Officer' },
    { name: language === 'ar' ? 'فيصل العتيبي' : 'Faisal Al-Otaibi', position: language === 'ar' ? 'دعم فني أول' : 'Senior Technical Support' },
    { name: language === 'ar' ? 'ريم الغامدي' : 'Reem Al-Ghamdi', position: language === 'ar' ? 'دعم فني' : 'Technical Support' },
  ];

  return (
    <div className="min-h-screen bg-white" dir={direction}>
      {/* Hero */}
      <section className="pt-32 pb-16 bg-gradient-to-br from-slate-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-sm font-semibold mb-6">
            <Users size={14} />
            {language === 'ar' ? 'فريق عمل إيوان' : 'Ewan Team'}
          </div>
          <h1 className="text-4xl lg:text-5xl font-bold text-slate-900 mb-4">{language === 'ar' ? 'من نحن' : 'About Us'}</h1>
          <p className="text-slate-500 max-w-3xl mx-auto text-lg leading-relaxed">
            {language === 'ar'
              ? 'إيوان للتقنية المعلومات والتعليم هي شركة سعودية ناشئة متخصصة في تطوير حلول تعليمية رقمية مبتكرة. نؤمن بأن التعليم الجيد يجب أن يكون متاحاً للجميع.'
              : 'Ewan for Information Technology & Education is a Saudi startup specialized in developing innovative digital education solutions. We believe quality education should be accessible to all.'}
          </p>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className={`bg-white rounded-2xl p-8 shadow-xl border border-slate-100 ${direction === 'rtl' ? 'text-right' : 'text-left'}`}>
              <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-primary mb-6"><Target size={28} /></div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">{language === 'ar' ? 'رسالتنا' : 'Our Mission'}</h3>
              <p className="text-slate-500 leading-relaxed">
                {language === 'ar'
                  ? 'تمكين الطلاب والمعلمين من خلال منصة تعليمية ذكية تجمع بين أحدث التقنيات وأفضل الممارسات التعليمية.'
                  : 'Empowering students and teachers through a smart educational platform combining the latest technologies with best teaching practices.'}
              </p>
            </div>
            <div className={`bg-gradient-to-br from-primary to-blue-700 rounded-2xl p-8 shadow-xl text-white ${direction === 'rtl' ? 'text-right' : 'text-left'}`}>
              <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mb-6"><Eye size={28} /></div>
              <h3 className="text-xl font-bold mb-3">{language === 'ar' ? 'رؤيتنا' : 'Our Vision'}</h3>
              <p className="text-blue-100 leading-relaxed">
                {language === 'ar'
                  ? 'أن نكون المنصة الرقمية الرائدة في التعليم في العالم العربي، نصنع جيلاً مبدعاً قادراً على المنافسة عالمياً.'
                  : 'To be the leading digital platform for education in the Arab world, nurturing a creative generation capable of global competition.'}
              </p>
            </div>
            <div className={`bg-white rounded-2xl p-8 shadow-xl border border-slate-100 ${direction === 'rtl' ? 'text-right' : 'text-left'}`}>
              <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center text-green-600 mb-6"><Award size={28} /></div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">{language === 'ar' ? 'قيمنا' : 'Our Values'}</h3>
              <p className="text-slate-500 leading-relaxed">
                {language === 'ar'
                  ? 'النزاهة، الابتكار، الجودة، والالتزام برضا العملاء هي الأسس التي نبني عليها كل قراراتنا.'
                  : 'Integrity, innovation, quality, and commitment to customer satisfaction are the foundations of every decision we make.'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">{language === 'ar' ? 'فريق العمل' : 'Our Team'}</h2>
            <p className="text-slate-500 max-w-2xl mx-auto">
              {language === 'ar'
                ? 'نخبة من المحترفين في مختلف المجالات يعملون معاً لتقديم أفضل تجربة تعليمية.'
                : 'A team of professionals across various fields working together to deliver the best educational experience.'}
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {teamMembers.map((member, idx) => (
              <PhotoPlaceholder key={idx} name={member.name} position={member.position} />
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { val: '500+', label: language === 'ar' ? 'معلم معتمد' : 'Certified Teachers' },
              { val: '10k+', label: language === 'ar' ? 'مستخدم نشط' : 'Active Users' },
              { val: '5k+', label: language === 'ar' ? 'طالب مستفيد' : 'Students Served' },
              { val: '4.9', label: language === 'ar' ? 'تقييم المستخدمين' : 'User Rating' },
            ].map((stat, idx) => (
              <div key={idx} className="p-6">
                <div className="text-3xl font-bold text-primary mb-1">{stat.val}</div>
                <div className="text-sm text-slate-500 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};
