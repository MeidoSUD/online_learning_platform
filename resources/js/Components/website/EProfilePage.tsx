import React from 'react';
import { useLanguage } from '../../Contexts/LanguageContext';
import { motion } from 'framer-motion';
import { 
  BookOpen, Globe, Heart, Rocket, Lightbulb, Users, PlayCircle, Play, GraduationCap, UserCheck, Award, Code, Smartphone, Database, Server, Layers, Zap, Layout 
} from 'lucide-react';
import { profileStyles as s } from './ProfileView.styles';
import { Footer } from './Footer';

export const ProfileView: React.FC = () => {
  const { language, direction } = useLanguage();

  return (
    <div className={`animate-fade-in bg-white overflow-x-hidden`} dir={direction}>
      {/* Hero Section */}
      <section className={s.hero}>
        <div className="absolute top-0 right-0 w-full h-full bg-slate-50/50 -z-10" />
        <div className={`${s.container} grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-16 items-center`}>
          <motion.div initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} className={`${direction === 'rtl' ? 'text-right' : 'text-left'}`}>
            <div className="mb-6 md:mb-12">
              <div className={`w-20 h-20 md:w-32 md:h-32 mb-4 md:mb-8 flex items-center justify-center text-brand-blue border-4 border-brand-blue rounded-2xl md:rounded-3xl animate-pulse ${direction === 'rtl' ? '' : 'ml-auto'}`}>
                <BookOpen size={32} className="md:size-16" strokeWidth={1.5} />
              </div>
              <h1 className={s.heroTitle}>{language === 'ar' ? 'ايوان التعلم' : 'Ewan'} <br /> <span className="text-brand-blue border-b-[6px] md:border-b-[12px] border-brand-green">{language === 'ar' ? 'التعليم الذكي' : 'Smart Learning'}</span></h1>
              <p className={`text-base md:text-2xl text-slate-400 font-bold uppercase tracking-[0.15em] md:tracking-[0.2em] font-poppins pt-4 md:pt-8 ${direction === 'rtl' ? 'text-right' : 'text-left'}`}>ewan-geniuses.com</p>
            </div>
            <div className={`flex gap-3 md:gap-4 ${direction === 'rtl' ? 'justify-end' : 'justify-start'}`}>
              <div className="w-8 h-2 md:w-12 md:h-3 rounded-full bg-brand-blue" />
              <div className="w-8 h-2 md:w-12 md:h-3 rounded-full bg-brand-green" />
              <div className="w-8 h-2 md:w-12 md:h-3 rounded-full bg-slate-200" />
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="relative">
            <div className="aspect-[4/5] bg-slate-100 rounded-[2rem] md:rounded-[4rem] overflow-hidden shadow-2xl relative z-10 border-4 border-white">
              <img 
                src="https://images.unsplash.com/photo-1543269865-cbf427effbad?auto=format&fit=crop&q=80&w=1200" 
                alt="online ed" 
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent flex items-end p-4 md:p-12">
                <div className="text-white">
                  <p className="text-2xl md:text-4xl font-black font-cairo mb-1 md:mb-2">{language === 'ar' ? 'التعليم الإلكتروني' : 'E-LEARNING'}</p>
                  <p className="text-xs md:text-sm opacity-80 uppercase tracking-widest font-poppins">{language === 'ar' ? 'الريادة في العصر الرقمي' : 'Leading the digital era'}</p>
                </div>
              </div>
            </div>
            <div className="absolute -top-6 -right-6 md:-top-10 md:-right-10 w-32 h-32 md:w-64 md:h-64 bg-brand-blue opacity-10 rounded-full blur-3xl animate-pulse" />
            <div className={`absolute -bottom-6 md:-bottom-10 w-24 h-24 md:w-48 md:h-48 bg-brand-green rounded-[1.5rem] md:rounded-[3rem] -z-10 ${direction === 'rtl' ? '-left-6 md:-left-10' : '-right-6 md:-right-10'}`} />
          </motion.div>
        </div>
      </section>

      {/* What is Ewan App? */}
      <section className="py-12 md:py-24 bg-brand-blue text-white overflow-hidden relative">
        <div className={`${s.container} grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-12 text-center items-center`}>
          <div className={`space-y-3 md:space-y-6 ${direction === 'rtl' ? 'text-right md:text-right' : 'text-left md:text-left'}`}>
            <h3 className="text-2xl md:text-4xl font-black font-cairo">{language === 'ar' ? 'تطبيق Ewan' : 'Ewan App'}</h3>
            <p className="text-base md:text-xl opacity-90 leading-relaxed font-medium">
              {language === 'ar'
                ? 'تطبيق جوال ذكي يربط الطلاب بالمعلمين والمدربين في بيئة تعليمية متكاملة.'
                : 'A smart mobile app connecting students with teachers and trainers in an integrated learning environment.'}
            </p>
          </div>
          <motion.div whileHover={{ scale: 1.05 }} className="bg-white/10 backdrop-blur-3xl p-8 md:p-16 rounded-[2rem] md:rounded-[4rem] border border-white/20 shadow-[0_30px_60px_-12px_rgba(0,0,0,0.3)]">
            <div className="w-12 h-12 md:w-20 md:h-20 bg-white rounded-2xl md:rounded-3xl mx-auto mb-4 md:mb-8 flex items-center justify-center text-brand-blue shadow-xl">
              <Smartphone size={24} className="md:size-10" />
            </div>
            <h2 className="text-4xl md:text-6xl font-black font-cairo mb-2 md:mb-4">{language === 'ar' ? 'ما هو Ewan؟' : 'WHAT IS EWAN?'}</h2>
            <div className="h-1 md:h-2 w-16 md:w-24 bg-brand-green mx-auto mb-3 md:mb-6 rounded-full" />
            <p className="text-lg md:text-2xl font-poppins font-bold uppercase tracking-tighter opacity-80">{language === 'ar' ? 'تطبيق تعليمي متكامل' : 'Integrated Learning App'}</p>
          </motion.div>
          <div className={`space-y-3 md:space-y-6 ${direction === 'rtl' ? 'text-right' : 'text-left'}`}>
            <h3 className="text-2xl md:text-4xl font-black font-cairo">{language === 'ar' ? 'للمتعلمين والمحترفين' : 'For Learners & Professionals'}</h3>
            <p className="text-base md:text-xl opacity-90 leading-relaxed font-medium">
              {language === 'ar'
                ? 'منصة تجمع بين التعلم الفردي والجماعي مع نخبة من المعلمين والمدربين المعتمدين.'
                : 'A platform combining individual and group learning with elite certified teachers and trainers.'}
            </p>
          </div>
        </div>
      </section>

      {/* Core Values / What We Offer */}
      <section className="py-16 md:py-32 bg-slate-50">
        <div className={s.container}>
          <div className="text-center mb-12 md:mb-24">
            <h2 className={s.heading}>{language === 'ar' ? 'ماذا نقدم' : 'What We Offer'}</h2>
            <div className="h-1 md:h-1.5 w-20 md:w-32 bg-brand-green mx-auto rounded-full" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-12">
            {/* Private Lessons */}
            <div className={s.card}>
              <div className="mb-6 md:mb-10 p-4 md:p-6 bg-brand-blue/5 rounded-2xl md:rounded-3xl w-fit text-brand-blue group-hover:bg-brand-blue group-hover:text-white transition-all"><Users size={28} className="md:size-12" /></div>
              <h3 className="text-2xl md:text-3xl font-black font-cairo mb-4 md:mb-6 uppercase text-slate-900"> {language === 'ar' ? 'دروس خصوصية' : 'Private Lessons'} </h3>
              <p className={`text-base md:text-xl text-slate-600 mb-4 md:mb-6 font-medium leading-relaxed ${direction === 'rtl' ? '' : ''}`}>
                {language === 'ar'
                  ? 'جلسات فردية مع معلمين متخصصين في جميع المواد. نوفر بيئة تعليمية مرنة تناسب جدولك واحتياجاتك.'
                  : 'One-on-one sessions with specialized teachers in all subjects. A flexible learning environment that fits your schedule and needs.'}
              </p>
              <p className={`text-sm md:text-lg text-slate-400 font-poppins ${direction === 'rtl' ? '' : ''}`}>
                {language === 'ar' ? 'Individual sessions with expert teachers' : 'جلسات فردية مع معلمين خبراء'}
              </p>
            </div>
            {/* Courses */}
            <div className={`${s.blueCard} lg:-translate-y-8`}>
              <div className="mb-6 md:mb-10 p-4 md:p-6 bg-white/10 rounded-2xl md:rounded-3xl w-fit text-white"><BookOpen size={28} className="md:size-12" /></div>
              <h3 className="text-2xl md:text-3xl font-black font-cairo mb-4 md:mb-6 uppercase"> {language === 'ar' ? 'دورات تدريبية' : 'Training Courses'} </h3>
              <p className={`text-lg md:text-2xl font-cairo font-medium leading-relaxed mb-4 md:mb-6 ${direction === 'rtl' ? '' : ''}`}>
                {language === 'ar'
                  ? 'دورات متخصصة في مختلف المجالات الأكاديمية والمهنية مع شهادات إتمام معتمدة.'
                  : 'Specialized courses in various academic and professional fields with accredited certificates.'}
              </p>
              <p className={`text-sm md:text-lg opacity-60 font-poppins ${direction === 'rtl' ? '' : ''}`}>
                {language === 'ar' ? 'Accredited courses with certificates' : 'دورات معتمدة وشهادات'}
              </p>
            </div>
            {/* Language Learning */}
            <div className={`${s.card} border-brand-green/20 hover:border-brand-green`}>
              <div className="mb-6 md:mb-10 p-4 md:p-6 bg-brand-green/5 rounded-2xl md:rounded-3xl w-fit text-brand-green group-hover:bg-brand-green group-hover:text-white transition-all"><Globe size={28} className="md:size-12" /></div>
              <h3 className="text-2xl md:text-3xl font-black font-cairo mb-4 md:mb-6 uppercase text-slate-900"> {language === 'ar' ? 'تعلم اللغات' : 'Language Learning'} </h3>
              <p className={`text-base md:text-xl text-slate-600 mb-4 md:mb-6 font-medium leading-relaxed ${direction === 'rtl' ? '' : ''}`}>
                {language === 'ar'
                  ? 'تعلم لغات جديدة مع متحدثين أصليين ومناهج متطورة تناسب جميع المستويات من المبتدئ إلى المتقدم.'
                  : 'Learn new languages with native speakers and advanced curricula for all levels from beginner to advanced.'}
              </p>
              <p className={`text-sm md:text-lg text-slate-400 font-poppins ${direction === 'rtl' ? '' : ''}`}>
                {language === 'ar' ? 'Learn with native speakers' : 'تعلم مع متحدثين أصليين'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features - App Features */}
      <section className="py-12 md:py-24 bg-white">
        <div className={s.container}>
          <div className="flex flex-col lg:flex-row gap-8 md:gap-12 lg:gap-20 items-center">
            <div className={`flex-1 space-y-6 md:space-y-12 ${direction === 'rtl' ? 'text-right' : 'text-left'}`}>
              <div>
                <h2 className="text-4xl md:text-6xl font-black font-cairo mb-3 md:mb-4 tracking-tighter">{language === 'ar' ? 'مميزات التطبيق' : 'App Features'}</h2>
                <p className={s.subHeading}>{language === 'ar' ? 'تعليم ذكي... تجربة سلسة' : 'Smart Learning... Seamless Experience'}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
                {[
                  { label: language === 'ar' ? 'أ' : 'A', t: language === 'ar' ? 'دروس فردية وجماعية' : 'Individual & Group Lessons', desc: language === 'ar' ? 'نظام متكامل وواجهة مباشرة' : 'Integrated system with direct interface', icon: Users },
                  { label: language === 'ar' ? 'ب' : 'B', t: language === 'ar' ? 'بث مباشر وتسجيل' : 'Live Streaming & Recording', desc: language === 'ar' ? 'إمكانية المراجعة في أي وقت' : 'Review anytime', icon: PlayCircle },
                  { label: language === 'ar' ? 'ج' : 'C', t: language === 'ar' ? 'مكتبة رقمية شاملة' : 'Digital Library', desc: language === 'ar' ? 'كتب ومناهج تعليمية معتمدة' : 'Accredited books and curricula', icon: BookOpen },
                  { label: language === 'ar' ? 'د' : 'D', t: language === 'ar' ? 'كورسات تدريبية' : 'Training Courses', desc: language === 'ar' ? 'مهارات حديثة ونخبة من الخبراء' : 'Modern skills with elite experts', icon: Rocket },
                ].map((f, i) => (
                  <div key={i} className={`p-5 md:p-8 bg-slate-50 rounded-[1.5rem] md:rounded-[3rem] ${direction === 'rtl' ? 'border-r-4 md:border-r-8 border-brand-blue text-right' : 'border-l-4 md:border-l-8 border-brand-blue text-left'} flex flex-col hover:bg-white hover:shadow-2xl transition-all h-full`}>
                    <div className={`w-10 h-10 md:w-14 md:h-14 bg-brand-blue/10 rounded-xl md:rounded-2xl flex items-center justify-center text-brand-blue font-black text-lg md:text-2xl mb-3 md:mb-6 ${direction === 'rtl' ? '' : ''}`}>{f.label}</div>
                    <h4 className="text-lg md:text-2xl font-black font-cairo mb-1 md:mb-3">{f.t}</h4>
                    <p className="text-sm md:text-base text-slate-500 font-medium">{f.desc}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex-1 w-full relative">
              <div className="aspect-[4/5] bg-slate-900 rounded-[2rem] md:rounded-[4rem] overflow-hidden shadow-2xl relative z-10 flex flex-col items-center justify-center text-center p-6 md:p-12">
                <img src="https://images.unsplash.com/photo-1577891721396-22c4b8505d9d?auto=format&fit=crop&q=80&w=1200" className="absolute inset-0 w-full h-full object-cover opacity-50" alt="feature bg" />
                <div className="relative z-10">
                  <Play size={40} className="md:size-20 text-brand-green fill-brand-green mx-auto mb-4 md:mb-10 animate-pulse" />
                  <h3 className="text-3xl md:text-5xl font-black font-cairo text-white mb-3 md:mb-6">{language === 'ar' ? 'التجربة الذكية' : 'Smart Experience'}</h3>
                  <p className="text-lg md:text-2xl text-white/80 leading-relaxed font-medium">{language === 'ar' ? 'لأننا نؤمن أن التعليم يجب أن يكون فعالاً وبسيطاً ومتاحاً' : 'Because we believe learning should be effective, simple, and accessible'}</p>
                </div>
              </div>
              <div className={`absolute -bottom-6 md:-bottom-10 w-full h-full bg-brand-green/20 rounded-[2rem] md:rounded-[4rem] -z-10 ${direction === 'rtl' ? '-right-6 md:-right-10' : '-left-6 md:-left-10'}`} />
            </div>
          </div>
        </div>
      </section>

      {/* Users - Students & Teachers */}
      <section className="py-16 md:py-32 bg-slate-50">
        <div className={s.container}>
          <div className="text-center mb-12 md:mb-24">
            <h2 className="text-3xl md:text-5xl font-black font-cairo mb-3 md:mb-4 text-slate-800">{language === 'ar' ? 'المستخدمون' : 'Users'}</h2>
            <div className="h-1 md:h-1.5 w-24 md:w-40 bg-brand-blue mx-auto rounded-full" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10">
            {[
              { 
                titleAr: 'الطالب', titleEn: 'Student', icon: UserCheck, color: 'brand-green',
                descAr: 'يمكن للطالب التسجيل في الدروس، حضور المحاضرات المباشرة، متابعة تقدمه الأكاديمي، والحصول على شهادات معتمدة.',
                descEn: 'Students can register for lessons, attend live lectures, track academic progress, and receive accredited certificates.'
              },
              { 
                titleAr: 'المعلم / المدرب', titleEn: 'Teacher / Trainer', icon: GraduationCap, color: 'brand-blue',
                descAr: 'يمكن للمعلم إنشاء الدروس، تحديد المواعيد، إدارة الطلاب، متابعة النتائج، وبناء مسيرته المهنية.',
                descEn: 'Teachers can create lessons, set appointments, manage students, track results, and build their professional career.'
              },
            ].map((u, i) => (
              <motion.div whileHover={{ y: -10 }} key={i} className="bg-white p-6 md:p-12 rounded-[2rem] md:rounded-[4rem] shadow-xl text-center flex flex-col items-center">
                <div className={`w-16 h-16 md:w-24 md:h-24 rounded-[1.5rem] md:rounded-[2rem] bg-${u.color} text-white flex items-center justify-center mb-4 md:mb-10 shadow-lg`}>
                  <u.icon size={28} className="md:size-12" />
                </div>
                <h3 className="text-2xl md:text-3xl font-black font-cairo mb-1 md:mb-2 text-slate-900">{language === 'ar' ? u.titleAr : u.titleEn}</h3>
                <div className="space-y-2 md:space-y-4 text-center">
                  <p className="text-slate-600 text-base md:text-xl font-cairo leading-relaxed">{language === 'ar' ? u.descAr : u.descEn}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Technical Overview */}
      <section className="py-12 md:py-24 bg-white relative overflow-hidden">
        <div className={s.container}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 lg:gap-20 items-center">
            <div className={`${direction === 'rtl' ? 'text-right' : 'text-left'} space-y-6 md:space-y-12`}>
              <div>
                <h2 className="text-3xl md:text-5xl font-black font-cairo text-slate-900 mb-3 md:mb-4">{language === 'ar' ? 'بنية تقنية' : 'Technical'}</h2>
                <p className="text-xl md:text-3xl font-cairo font-bold text-brand-green">{language === 'ar' ? 'بنية تقنية حديثة تدعم النمو والتوسع' : 'Modern technical infrastructure supporting growth'}</p>
              </div>
              <p className="text-lg md:text-2xl text-slate-600 leading-relaxed font-medium">
                {language === 'ar'
                  ? 'تم تطوير تطبيق Ewan باستخدام أحدث التقنيات لضمان الأمان والموثوقية والمرونة اللازمة للنمو والتوسع.'
                  : 'The Ewan app is developed using the latest technologies to ensure security, reliability, and the flexibility needed for growth.'}
              </p>
              <div className={`grid grid-cols-3 md:grid-cols-4 gap-4 md:gap-8 grayscale opacity-60 hover:grayscale-0 hover:opacity-100 transition-all duration-700 ${direction === 'rtl' ? '' : ''}`}>
                <div className="flex flex-col items-center gap-1 md:gap-2"><Smartphone size={24} className="md:size-10 text-brand-blue" /> <span className="font-bold text-xs md:text-base">Flutter</span></div>
                <div className="flex flex-col items-center gap-1 md:gap-2"><Code size={24} className="md:size-10 text-blue-500" /> <span className="font-bold text-xs md:text-base">React</span></div>
                <div className="flex flex-col items-center gap-1 md:gap-2"><Database size={24} className="md:size-10 text-slate-900" /> <span className="font-bold text-xs md:text-base">MySQL</span></div>
                <div className="flex flex-col items-center gap-1 md:gap-2"><Server size={24} className="md:size-10 text-purple-600" /> <span className="font-bold text-xs md:text-base">PHP</span></div>
                <div className="flex flex-col items-center gap-1 md:gap-2"><Layers size={24} className="md:size-10 text-red-500" /> <span className="font-bold text-xs md:text-base">Laravel</span></div>
                <div className="flex flex-col items-center gap-1 md:gap-2"><Layout size={24} className="md:size-10 text-orange-500" /> <span className="font-bold text-xs md:text-base">HTML5</span></div>
              </div>
            </div>

            <div className="bg-brand-green p-1 w-full rounded-[2rem] md:rounded-[4rem] shadow-2xl">
              <div className="bg-slate-900 rounded-[1.8rem] md:rounded-[3.8rem] p-6 md:p-16 text-white text-center relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 md:p-10 opacity-10"><Code size={60} className="md:size-[150px]" /></div>
                <div className="relative z-10 py-4 md:py-10">
                  <div className="w-12 h-12 md:w-20 md:h-20 bg-brand-green rounded-2xl md:rounded-3xl mx-auto mb-4 md:mb-10 flex items-center justify-center shadow-lg"><Zap size={24} className="md:size-10" /></div>
                  <h3 className="text-xl md:text-3xl font-black font-cairo mb-3 md:mb-6">{language === 'ar' ? 'بنية تحتية تقنية حديثة' : 'Modern Technical Infrastructure'}</h3>
                  <p className="text-base md:text-xl opacity-80 leading-relaxed font-poppins mb-6 md:mb-10">
                    {language === 'ar' ? 'مبنية على الأمان والموثوقية والمرونة اللازمة للنجاح' : 'Built on security, reliability, and the flexibility required for success'}
                  </p>
                  <div className="flex items-center justify-center gap-4 md:gap-8">
                    <div className="flex flex-col gap-1 md:gap-2">
                      <Smartphone size={20} className="md:size-8 mx-auto" />
                      <span className="font-bold text-xs md:text-base">Android & iOS</span>
                    </div>
                    <div className="w-px h-8 md:h-12 bg-white/20" />
                    <div className="flex flex-col gap-1 md:gap-2">
                      <Globe size={20} className="md:size-8 mx-auto" />
                      <span className="font-bold text-xs md:text-base">{language === 'ar' ? 'نظام ويب' : 'Web System'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>






      <Footer />
    </div>
  );
};
