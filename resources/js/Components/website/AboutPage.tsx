import React from 'react';
import { Link } from '@inertiajs/react';
import { useLanguage } from '../../Contexts/LanguageContext';
import { Footer } from './Footer';
import { Award, Target, Eye, Users, ChevronLeft } from 'lucide-react';

const avatarPalette = ['avatar-green', 'avatar-navy', 'avatar-accent', 'avatar-teal'];

const TeamCard = ({ name, position, idx }: { name: string; position: string; idx: number }) => (
  <div className="team-card group">
    <div className={`team-avatar ${avatarPalette[idx % avatarPalette.length]} relative overflow-hidden`}>
      <img
        src={`/assets/team/${position.toLowerCase().replace(/\s+/g, '-')}.png`}
        alt={name}
        className="w-full h-full object-cover opacity-0 group-hover:opacity-100 transition-opacity"
        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
      />
      <div className="absolute inset-0 flex items-center justify-center">
        <Users size={36} className="opacity-40" />
      </div>
    </div>
    <h4>{name}</h4>
    <p className="role">{position}</p>
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
      <section className="page-hero -mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="hero-badge">
            <Users size={14} />
            {language === 'ar' ? 'فريق عمل إيوان' : 'Ewan Team'}
          </div>
          <nav className="breadcrumb-custom">
            <Link href="/">{language === 'ar' ? 'الرئيسية' : 'Home'}</Link>
            <ChevronLeft size={12} />
            <span className="current">{language === 'ar' ? 'من نحن' : 'About Us'}</span>
          </nav>
          <h1 className="text-4xl lg:text-5xl font-bold">{language === 'ar' ? 'من نحن' : 'About Us'}</h1>
          <p className="text-lg max-w-3xl leading-relaxed">
            {language === 'ar'
              ? 'إيوان للتقنية المعلومات والتعليم هي شركة سعودية ناشئة متخصصة في تطوير حلول تعليمية رقمية مبتكرة. نؤمن بأن التعليم الجيد يجب أن يكون متاحاً للجميع.'
              : 'Ewan for Information Technology & Education is a Saudi startup specialized in developing innovative digital education solutions. We believe quality education should be accessible to all.'}
          </p>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="section-pad bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="value-card">
              <div className="value-icon"><Target size={26} /></div>
              <div>
                <h4>{language === 'ar' ? 'رسالتنا' : 'Our Mission'}</h4>
                <p className="mb-0">
                  {language === 'ar'
                    ? 'تمكين الطلاب والمعلمين من خلال منصة تعليمية ذكية تجمع بين أحدث التقنيات وأفضل الممارسات التعليمية.'
                    : 'Empowering students and teachers through a smart educational platform combining the latest technologies with best teaching practices.'}
                </p>
              </div>
            </div>
            <div className="value-card">
              <div className="value-icon"><Eye size={26} /></div>
              <div>
                <h4>{language === 'ar' ? 'رؤيتنا' : 'Our Vision'}</h4>
                <p className="mb-0">
                  {language === 'ar'
                    ? 'أن نكون المنصة الرقمية الرائدة في التعليم في العالم العربي، نصنع جيلاً مبدعاً قادراً على المنافسة عالمياً.'
                    : 'To be the leading digital platform for education in the Arab world, nurturing a creative generation capable of global competition.'}
                </p>
              </div>
            </div>
            <div className="value-card">
              <div className="value-icon"><Award size={26} /></div>
              <div>
                <h4>{language === 'ar' ? 'قيمنا' : 'Our Values'}</h4>
                <p className="mb-0">
                  {language === 'ar'
                    ? 'النزاهة، الابتكار، الجودة، والالتزام برضا العملاء هي الأسس التي نبني عليها كل قراراتنا.'
                    : 'Integrity, innovation, quality, and commitment to customer satisfaction are the foundations of every decision we make.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="section-pad bg-light-custom">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="section-title text-3xl font-bold mb-4">{language === 'ar' ? 'فريق العمل' : 'Our Team'}</h2>
            <p className="section-subtitle mb-0">
              {language === 'ar'
                ? 'نخبة من المحترفين في مختلف المجالات يعملون معاً لتقديم أفضل تجربة تعليمية.'
                : 'A team of professionals across various fields working together to deliver the best educational experience.'}
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {teamMembers.map((member, idx) => (
              <TeamCard key={idx} name={member.name} position={member.position} idx={idx} />
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="stats-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { val: '500+', label: language === 'ar' ? 'معلم معتمد' : 'Certified Teachers' },
              { val: '10k+', label: language === 'ar' ? 'مستخدم نشط' : 'Active Users' },
              { val: '5k+', label: language === 'ar' ? 'طالب مستفيد' : 'Students Served' },
              { val: '4.9', label: language === 'ar' ? 'تقييم المستخدمين' : 'User Rating' },
            ].map((stat, idx) => (
              <div key={idx} className="stat-card">
                <span className="stat-number">{stat.val}</span>
                <div className="stat-label">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};
