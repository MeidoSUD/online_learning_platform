import React from 'react';
import { useLanguage } from '../../Contexts/LanguageContext';
import { Footer } from '../website/Footer';
import { motion } from 'framer-motion';
import { 
  Zap, Globe, Layout, Receipt, GraduationCap, Phone, ChevronLeft, 
  Settings, UserPlus, FileText, PieChart, TrendingUp, ShieldCheck, 
  Smartphone, MessageSquare, Mail, RefreshCw, BarChart3, Database, 
  MapPin, CheckCircle2, AlertTriangle, Lightbulb, TrendingDown,
  Users, Rocket, Award, Monitor, Heart, PlayCircle, Star, BookOpen
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart as RePieChart, Pie, Cell, 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';
import { ecosystemStyles as s } from './EcosystemView.styles';

const Handshake = ({ size, className }: { size: number; className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="m11 17 2 2 6-7c.3-.3.5-.7.5-1.1v-2.4c0-.4-.2-.8-.5-1.1l-1.1-1.1c-.3-.3-.7-.5-1.1-.5h-2.1c-.4 0-.8.2-1.1.5l-6.5 6.5c-.3.3-.5.7-.5 1.1v2.1c0 .4.2.8.5 1.1l1.1 1.1c.3.3.7.5 1.1.5h2.1c.4 0 .8-.2 1.1-.5l3.9-3.9"/>
    <path d="m4.89 12.11 3 3"/>
  </svg>
);

const adminData = [
  { name: 'Manual Processes', value: 100 },
  { name: 'Automated System', value: 60 }
];

const getFinanceData = (lang: string) => [
  { name: lang === 'ar' ? 'محصّل' : 'Collected', value: 85, color: '#3ABEF9' },
  { name: lang === 'ar' ? 'معلق' : 'Pending', value: 10, color: '#FCD34D' },
  { name: lang === 'ar' ? 'متأخر' : 'Overdue', value: 5, color: '#F87171' }
];

const getAcademicData = (lang: string) => [
  { subject: lang === 'ar' ? 'الحضور' : 'Attendance', A: 85, full: 100 },
  { subject: lang === 'ar' ? 'الامتحانات' : 'Exam Scores', A: 75, full: 100 },
  { subject: lang === 'ar' ? 'المشاركة' : 'Participation', A: 90, full: 100 },
  { subject: lang === 'ar' ? 'الواجبات' : 'Assignments', A: 70, full: 100 },
];

interface EcosystemViewProps {
  onSwitchToProfile: () => void;
}

const stagger = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.1 } }
};

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] } }
};

const fadeLeft = {
  hidden: { opacity: 0, x: -50 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] } }
};

const fadeRight = {
  hidden: { opacity: 0, x: 50 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] } }
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.85 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] } }
};

export const EcosystemView: React.FC<EcosystemViewProps> = ({ onSwitchToProfile }) => {
  const { language, direction } = useLanguage();
  return (
    <div className="animate-fade-in bg-white scroll-smooth overflow-x-hidden" dir={direction}>
      {/* PAGE 4: Hero Section */}
      <section className={`${s.hero} relative`}>
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-brand-blue/5 -z-10" />
        <div className="absolute top-0 right-0 w-1/2 h-full bg-slate-50/50 -z-10" />
        <div className="absolute top-0 right-20 w-[400px] h-full bg-brand-blue/10 transform -skew-x-12 z-0 hidden lg:block" />
        <div className="absolute bottom-0 right-80 w-[300px] h-40 bg-brand-green transform -skew-x-12 z-0 hidden lg:block" />
        <div className="absolute top-40 -left-20 w-72 h-72 bg-brand-blue/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 -left-40 w-96 h-96 bg-brand-green/5 rounded-full blur-3xl" />

        <div className={`${s.container} flex flex-col lg:flex-row items-center gap-8 md:gap-16 py-16 md:py-24 lg:py-32`}>
          <motion.div 
            initial={{ opacity: 0, x: -50 }} 
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="lg:w-1/2 text-right z-10"
          >
            <div className="mb-6 md:mb-12">
              <motion.div 
                initial={{ opacity: 0, scale: 0.8, rotate: -5 }}
                whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="w-20 h-20 md:w-32 lg:w-40 md:h-32 lg:h-40 mb-6 md:mb-10 flex items-center justify-center text-brand-blue border-4 border-brand-blue rounded-3xl bg-gradient-to-br from-brand-blue/5 to-brand-blue/10 shadow-xl hover:shadow-2xl hover:scale-105 transition-all"
              >
                <Zap size={36} className="md:size-14 lg:size-[80px] fill-brand-blue/10" />
              </motion.div>
              <h1 className="text-4xl md:text-5xl lg:text-7xl xl:text-[6rem] font-black font-cairo text-slate-900 leading-[0.9] mb-4 md:mb-8">
                EWAN <br /> 
                <span className="text-brand-blue">{language === 'ar' ? 'المدرسة الذكية' : 'SMART SCHOOL'}</span> <br />
                {language === 'ar' ? 'المنظومة' : 'ECOSYSTEM'}
              </h1>
              <h2 className="text-2xl md:text-4xl lg:text-5xl font-black font-cairo text-slate-800 mb-4 md:mb-6">{language === 'ar' ? 'نظام ايوان التعليمي الذكي' : 'Ewan Smart School System'}</h2>
            </div>

            <motion.div 
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="bg-gradient-to-r from-brand-green/20 to-brand-green/5 border-r-4 md:border-r-8 border-brand-green p-4 md:p-6 mb-6 md:mb-12 rounded-l-2xl"
            >
              <p className="text-lg md:text-xl lg:text-2xl font-black font-cairo text-brand-green">{language === 'ar' ? 'التحول الرقمي المتكامل للمدارس' : 'Integrated Digital Transformation for Schools'}</p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="flex gap-4 justify-end"
            >
              <div className="flex items-center gap-2 md:gap-3 px-4 md:px-6 py-2 md:py-3 bg-slate-100 rounded-full hover:shadow-lg hover:bg-white transition-all">
                <Globe size={18} className="md:size-6 text-brand-blue" />
                <span className="font-poppins font-bold text-slate-500 text-xs md:text-base">ewan-geniuses.com</span>
              </div>
            </motion.div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }} 
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="lg:w-1/2 relative z-10"
          >
            <div className="grid grid-cols-2 gap-2 md:gap-4 h-[220px] sm:h-[300px] md:h-[450px] lg:h-[550px] xl:h-[600px]">
              <div className="rounded-[1.5rem] md:rounded-[3rem] lg:rounded-[4rem] overflow-hidden rotate-[-3deg] md:rotate-[-5deg] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] border-4 md:border-8 border-white transition-all duration-500 hover:rotate-0 hover:scale-[1.02]">
                <img src="https://images.unsplash.com/photo-1571260899304-425eee4c7efc?auto=format&fit=crop&q=80&w=800" className="w-full h-full object-cover" />
              </div>
              <div className="flex flex-col gap-2 md:gap-4">
                <div className="h-2/3 rounded-[1.2rem] md:rounded-[2rem] lg:rounded-[3rem] overflow-hidden rotate-[3deg] md:rotate-[5deg] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] border-4 md:border-8 border-white transition-all duration-500 hover:rotate-0 hover:scale-[1.02]">
                  <img src="https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&q=80&w=800" className="w-full h-full object-cover" />
                </div>
                <div className="h-1/3 rounded-[1rem] md:rounded-[1.5rem] lg:rounded-[2rem] bg-gradient-to-br from-brand-blue to-blue-600 p-3 md:p-5 lg:p-8 flex items-center justify-center text-white shadow-xl">
                  <Zap size={28} className="md:size-10 lg:size-[60px]" strokeWidth={3} />
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* PAGE 5: The Challenge */}
      <section className={s.sectionLight}>
        <div className={s.container}>
          <motion.div 
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 lg:gap-20 items-center"
          >
            <motion.div 
              variants={fadeLeft}
              className="text-right space-y-6 md:space-y-10"
            >
              <div>
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-black font-cairo text-slate-800 mb-3 md:mb-4 leading-tight">
                  {language === 'ar' ? <>المدارس <span className="text-brand-blue">تتحول رقمياً...</span> <br /> لكنها <span className="text-slate-900 border-b-4 md:border-b-8 border-brand-green">غير متكاملة</span></> : <>Schools Are <span className="text-brand-blue">Digitizing...</span> <br /> But Not <span className="text-slate-900 border-b-4 md:border-b-8 border-brand-green">Transforming</span></>}
                </h2>
              </div>

              <div className="bg-gradient-to-br from-brand-blue to-blue-700 p-6 md:p-10 lg:p-12 rounded-[2rem] md:rounded-[3rem] lg:rounded-[3.5rem] text-white shadow-[0_20px_70px_-15px_rgba(58,190,249,0.4)]">
                <div className="flex items-center gap-4 md:gap-6 mb-4 md:mb-8 justify-end">
                  <h4 className="text-2xl md:text-3xl lg:text-4xl font-black font-cairo text-right">{language === 'ar' ? 'التحدي' : 'The Challenge'}</h4>
                  <div className="w-3 h-3 md:w-4 md:h-4 bg-white rounded-full" />
                </div>
                <ul className="space-y-3 md:space-y-4 lg:space-y-6 text-lg md:text-xl lg:text-2xl font-bold">
                  <li className="flex items-center gap-3 md:gap-4 justify-end group"><span>{language === 'ar' ? 'أنظمة منفصلة وغير مترابطة' : 'Disconnected, non-integrated systems'}</span> <div className="w-2 h-2 bg-brand-green rounded-full group-hover:scale-150 transition-transform" /></li>
                  <li className="flex items-center gap-3 md:gap-4 justify-end group"><span>{language === 'ar' ? 'عمليات يدوية تستهلك الوقت' : 'Time-consuming manual processes'}</span> <div className="w-2 h-2 bg-brand-green rounded-full group-hover:scale-150 transition-transform" /></li>
                  <li className="flex items-center gap-3 md:gap-4 justify-end group"><span>{language === 'ar' ? 'ضعف التحكم المالي' : 'Weak financial control'}</span> <div className="w-2 h-2 bg-brand-green rounded-full group-hover:scale-150 transition-transform" /></li>
                  <li className="flex items-center gap-3 md:gap-4 justify-end group"><span>{language === 'ar' ? 'غیاب الرؤية الفورية للإدارة' : 'No real-time management visibility'}</span> <div className="w-2 h-2 bg-brand-green rounded-full group-hover:scale-150 transition-transform" /></li>
                </ul>
              </div>
            </motion.div>

            <motion.div variants={fadeRight}>
              <div className="relative group">
                <div className="bg-white p-6 md:p-10 lg:p-12 rounded-[2rem] md:rounded-[3rem] lg:rounded-[4rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.15)] relative z-10 transition-all duration-500 group-hover:scale-[1.02]">
                  <img src="https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&q=80&w=800" className="rounded-[1.5rem] md:rounded-[2.5rem] lg:rounded-[3rem] w-full shadow-lg" />
                </div>
                <div className="relative md:absolute md:-bottom-10 md:-right-10 mt-4 md:mt-0 bg-gradient-to-br from-brand-green to-emerald-600 p-5 md:p-10 lg:p-12 rounded-[2rem] md:rounded-[3rem] lg:rounded-[3.5rem] shadow-[0_20px_50px_-10px_rgba(0,0,0,0.3)] text-white z-20 max-w-sm text-right">
                  <p className="text-lg md:text-xl lg:text-2xl font-black font-cairo mb-3 md:mb-4 leading-tight">{language === 'ar' ? 'المشكلة ليست في الأدوات... بل في غياب التكامل' : 'The problem is not lack of tools... its lack of integration'}</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* PAGE 6: Market Drivers */}
      <section className={s.section}>
        <div className={s.container}>
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-10 md:mb-16 lg:mb-20"
          >
            <h2 className="text-3xl md:text-5xl lg:text-6xl font-black font-cairo text-slate-900 mb-3 md:mb-4">Vision 2030 Drives Digital Education</h2>
            <div className="h-1 md:h-2 w-24 md:w-40 bg-gradient-to-r from-brand-blue to-blue-400 mx-auto rounded-full" />
          </motion.div>

          <motion.div 
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 md:gap-8 lg:gap-12 text-center"
          >
            {[
              { tEn: 'Growing demand for smart schools', tAr: 'تزايد الطلب على المدارس الذكية', icon: TrendingUp, color: 'bg-blue-500' },
              { tEn: 'Increasing competition between schools', tAr: 'زيادة المنافسة بين المدارس', icon: Users, color: 'bg-emerald-500' },
              { tEn: 'Need for data-driven decisions', tAr: 'الحاجة إلى اتخاذ قرارات مبنية على البيانات', icon: Lightbulb, color: 'bg-blue-500' },
            ].map((item, i) => (
              <motion.div 
                key={i} 
                variants={scaleIn}
                whileHover={{ y: -10, scale: 1.03 }}
                transition={{ type: "spring", stiffness: 300, damping: 15 }}
                className={`${item.color} p-6 md:p-10 lg:p-12 rounded-[2rem] md:rounded-[3rem] lg:rounded-[4rem] text-white shadow-2xl flex flex-col items-center gap-4 md:gap-6 lg:gap-8 cursor-default`}
              >
                <div className="p-4 md:p-6 lg:p-8 bg-white/20 rounded-[1.5rem] md:rounded-[2rem] lg:rounded-[2.5rem] backdrop-blur-sm">
                  <item.icon size={32} className="md:size-12 lg:size-16" strokeWidth={2.5} />
                </div>
                <div>
                  <h4 className="text-lg md:text-xl lg:text-2xl font-bold font-poppins mb-2 md:mb-4">{language === 'ar' ? item.tAr : item.tEn}</h4>
                </div>
              </motion.div>
            ))}
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-10 md:mt-16 lg:mt-20 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-6 md:p-10 lg:p-12 rounded-[2rem] md:rounded-[3rem] lg:rounded-[4rem] text-center text-white relative overflow-hidden group"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-brand-blue/20 to-transparent transform -skew-x-12 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
            <h3 className="text-xl md:text-2xl lg:text-3xl font-bold font-poppins mb-3 md:mb-4 relative z-10">{language === 'ar' ? 'المدارس التي تتحول رقمياً بشكل كامل ستقود السوق!' : 'Schools that digitize fully will dominate the market!'}</h3>
          </motion.div>
        </div>
      </section>

      {/* PAGE 7: Full Ecosystem One Login */}
      <section className={s.sectionLight}>
        <div className={s.container}>
          <motion.div 
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 lg:gap-20 items-center"
          >
            <motion.div variants={fadeLeft} className="text-right">
              <h2 className="text-4xl md:text-5xl lg:text-7xl font-black font-cairo text-slate-900 mb-4 md:mb-8 leading-tight">
                {language === 'ar' ? <>منصة واحدة ... <br /><span className="text-brand-blue">دخول واحد ...</span> <br /> تحكم كامل!</> : <>One Platform ... <br /><span className="text-brand-blue">One login ...</span> <br />Total Control!</>}
              </h2>
              <div className="space-y-3 md:space-y-6">
                <p className="text-xl md:text-2xl lg:text-3xl font-bold text-slate-500">{language === 'ar' ? 'نحن لا نقدم مجرد برنامج. نحن نقدم منظومة متكاملة.' : "We don't offer software. We deliver a complete ecosystem."}</p>
              </div>
            </motion.div>

            <motion.div variants={fadeRight} className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 lg:gap-8">
              {[
                { name: 'ERP', icon: Database, bg: 'bg-blue-50' },
                { name: 'LMS', icon: BookOpen, bg: 'bg-emerald-50' },
                { name: 'Website', icon: Globe, bg: 'bg-purple-50' },
                { name: 'Mobile App', icon: Smartphone, bg: 'bg-orange-50' },
                { name: 'Marketing', icon: Rocket, bg: 'bg-pink-50' }
              ].map((item, i) => (
                <motion.div 
                  key={i} 
                  whileHover={{ y: -10, scale: 1.05 }}
                  transition={{ type: "spring", stiffness: 300, damping: 15 }}
                  className={`${item.bg} p-5 md:p-8 lg:p-10 rounded-[1.5rem] md:rounded-[2.5rem] lg:rounded-[3rem] flex flex-col items-center justify-center gap-3 md:gap-5 lg:gap-6 shadow-lg hover:shadow-2xl transition-all border border-slate-100 cursor-default`}
                >
                  <item.icon size={28} className="md:size-10 lg:size-[50px] text-brand-blue data-[lms=true]:text-brand-green" />
                  <span className="text-sm md:text-xl lg:text-2xl font-black font-poppins text-slate-800">{item.name}</span>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* PAGE 8: Mobile Application */}
      <section className={s.section}>
        <div className={s.container}>
          <motion.div 
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="flex flex-col lg:flex-row items-center gap-8 md:gap-12 lg:gap-20"
          >
            <motion.div variants={fadeRight} className="lg:w-1/2 grid grid-cols-2 gap-3 md:gap-6 lg:gap-8 justify-center items-center">
              <div className="bg-gradient-to-br from-brand-blue to-blue-600 p-3 md:p-4 lg:p-6 rounded-[1.5rem] md:rounded-[2rem] lg:rounded-[3rem] shadow-2xl relative z-10 translate-y-4 md:translate-y-6 lg:translate-y-10">
                <img src="https://images.unsplash.com/photo-1551650975-87deedd944c3?auto=format&fit=crop&q=80&w=800" className="rounded-[1rem] md:rounded-[1.5rem] lg:rounded-[2.5rem] w-full" />
              </div>
              <div className="bg-gradient-to-br from-brand-green to-emerald-600 p-3 md:p-4 lg:p-6 rounded-[1.5rem] md:rounded-[2rem] lg:rounded-[3rem] shadow-2xl relative z-0">
                <img src="https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fit=crop&q=80&w=800" className="rounded-[1rem] md:rounded-[1.5rem] lg:rounded-[2.5rem] w-full" />
              </div>
            </motion.div>

            <motion.div variants={fadeLeft} className="lg:w-1/2 text-right">
              <h2 className="text-3xl md:text-5xl lg:text-6xl font-black font-cairo text-slate-800 mb-4 md:mb-8 lg:mb-10 tracking-tighter">{language === 'ar' ? 'تطبيق الهاتف' : 'Mobile Application'}</h2>

              <div className="flex flex-col md:flex-row gap-3 md:gap-5 lg:gap-6 mb-6 md:mb-10 lg:mb-12 justify-end">
                <div className="bg-gradient-to-br from-brand-blue to-blue-700 text-white p-5 md:p-8 lg:p-10 rounded-[1.5rem] md:rounded-[2.5rem] lg:rounded-[3rem] flex-1 text-right shadow-xl">
                  <div className="flex gap-2 mb-2 md:mb-4 justify-end"><div className="w-2 h-2 md:w-3 md:h-3 bg-white rounded-full"/><div className="w-2 h-2 md:w-3 md:h-3 bg-white rounded-full opacity-30"/></div>
                  <h4 className="text-xl md:text-2xl lg:text-3xl font-black font-cairo mb-1 md:mb-2">{language === 'ar' ? 'تطبيق جوال متكامل' : 'Fully branded mobile app'}</h4>
                  <p className="text-base md:text-lg lg:text-xl font-bold opacity-80">{language === 'ar' ? '(أندرويد و iOS)' : '(iOS & Android)'}</p>
                </div>
              </div>

              <ul className="grid grid-cols-2 gap-3 md:gap-6 lg:gap-8 text-base md:text-xl lg:text-2xl font-black text-slate-600 mb-8 md:mb-12 lg:mb-16">
                <li className="flex items-center gap-2 md:gap-4 justify-end group">{language === 'ar' ? 'الحضور' : 'Attendance'} <CheckCircle2 size={18} className="md:size-6 text-brand-green group-hover:scale-125 transition-transform"/></li>
                <li className="flex items-center gap-2 md:gap-4 justify-end group">{language === 'ar' ? 'الواجبات' : 'Homework'} <CheckCircle2 size={18} className="md:size-6 text-brand-green group-hover:scale-125 transition-transform"/></li>
                <li className="flex items-center gap-2 md:gap-4 justify-end group">{language === 'ar' ? 'الرسوم' : 'Fees'} <CheckCircle2 size={18} className="md:size-6 text-brand-green group-hover:scale-125 transition-transform"/></li>
                <li className="flex items-center gap-2 md:gap-4 justify-end group">{language === 'ar' ? 'الإشعارات' : 'Notifications'} <CheckCircle2 size={18} className="md:size-6 text-brand-green group-hover:scale-125 transition-transform"/></li>
              </ul>

              <div className="bg-gradient-to-r from-slate-100 to-slate-50 p-5 md:p-8 lg:p-10 rounded-[1.5rem] md:rounded-[2.5rem] lg:rounded-[3rem] text-center shadow-inner">
                <p className="text-xl md:text-2xl lg:text-3xl font-black font-cairo text-slate-800">{language === 'ar' ? 'متصل دائماً... في أي وقت ومن أي مكان' : 'Always connected. Anytime. Anywhere'}</p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* PAGE 9: Live System */}
      <section className={s.sectionLight}>
        <div className={s.container}>
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="bg-white rounded-[2rem] md:rounded-[4rem] lg:rounded-[5rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.1)] p-6 md:p-12 lg:p-24 relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-4 h-full bg-gradient-to-b from-brand-blue to-blue-400" />
            <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-brand-blue/5 rounded-full blur-3xl" />
            <motion.div 
              variants={stagger}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 lg:gap-20 items-center relative z-10"
            >
              <motion.div variants={fadeLeft} className="text-right space-y-6 md:space-y-10 lg:space-y-12">
                <div>
                  <h2 className="text-4xl md:text-5xl lg:text-7xl font-black font-cairo text-slate-900 mb-2 md:mb-4">{language === 'ar' ? <>نظام حقيقي. <span className="text-brand-blue">نتائج حقيقية</span></> : <>Real System. <span className="text-brand-blue">Real Results</span></>}</h2>
                </div>

                <div className="bg-gradient-to-r from-brand-blue/10 to-brand-blue/5 p-3 md:p-4 rounded-full w-fit pr-5 md:pr-8 ml-auto flex items-center gap-2 md:gap-4 border border-brand-blue/20 backdrop-blur-sm">
                  <span className="text-lg md:text-xl lg:text-2xl font-black text-brand-blue font-cairo">{language === 'ar' ? 'نظام يعمل الآن' : 'Live System'}</span>
                  <div className="flex gap-2"><div className="w-2 h-2 md:w-3 md:h-3 bg-brand-blue rounded-full animate-pulse"/><div className="w-2 h-2 md:w-3 md:h-3 bg-brand-blue rounded-full opacity-30"/></div>
                </div>

                <div className="space-y-4 md:space-y-6 lg:space-y-8">
                  <p className="text-xl md:text-2xl lg:text-3xl font-bold text-slate-400 italic">{language === 'ar' ? '"نظام يعمل فعلياً على أرض الواقع - لوحة تحكم فورية لإدارة المدرسة"' : '"Fully operational system currently in use - Real-time dashboard for school management"'}</p>
                </div>
              </motion.div>

              <motion.div variants={fadeRight} className="relative">
                <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-4 md:p-6 lg:p-8 rounded-[2rem] md:rounded-[3rem] lg:rounded-[4rem] shadow-2xl relative z-10 border-4 md:border-6 lg:border-8 border-slate-700">
                  <img src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=800" className="rounded-[1.5rem] md:rounded-[2rem] lg:rounded-[2.5rem] w-full" />
                </div>
                <div className="absolute -top-10 -right-10 w-24 h-24 md:w-32 md:h-32 lg:w-40 lg:h-40 bg-brand-green rounded-full blur-3xl opacity-30 animate-pulse" />
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* PAGE 10: Modules Overview */}
      <section className={s.section}>
        <div className={s.container}>
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-8 md:mb-12 lg:mb-20"
          >
            <h2 className="text-3xl md:text-5xl lg:text-6xl font-black font-cairo text-slate-900 mb-3 md:mb-4 tracking-tighter">{language === 'ar' ? 'مكونات النظام' : 'System Modules'}</h2>
            <div className="h-1 md:h-2 w-20 md:w-32 bg-gradient-to-r from-brand-green to-emerald-400 mx-auto rounded-full" />
          </motion.div>

          <motion.div 
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 lg:gap-10"
          >
            {[
              { tEn: 'Administration', tAr: 'الإدارة', color: 'bg-blue-500', icon: Layout },
              { tEn: 'Finance', tAr: 'النظام المالي', color: 'bg-emerald-500', icon: Receipt },
              { tEn: 'Academics', tAr: 'الأكاديمي', color: 'bg-blue-500', icon: GraduationCap },
              { tEn: 'Communication', tAr: 'التواصل', color: 'bg-emerald-500', icon: Phone },
            ].map((m, i) => (
              <motion.div 
                key={i} 
                variants={scaleIn}
                whileHover={{ y: -10, scale: 1.05 }}
                transition={{ type: "spring", stiffness: 300, damping: 15 }}
                className={`${m.color} text-white p-6 md:p-10 lg:p-12 rounded-[2rem] md:rounded-[3rem] lg:rounded-[3.5rem] shadow-2xl flex flex-col justify-between h-[200px] md:h-[280px] lg:h-[350px] relative overflow-hidden group cursor-default`}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="absolute top-0 right-0 p-4 md:p-8 lg:p-10 opacity-10 transform group-hover:scale-150 group-hover:rotate-12 transition-all duration-700">
                  <m.icon size={60} className="md:size-24 lg:size-[150px]" />
                </div>
                <div className="flex gap-2 justify-end mb-4 md:mb-8 lg:mb-10"><div className="w-2 h-2 md:w-3 md:h-3 bg-white rounded-full"/><div className="w-2 h-2 md:w-3 md:h-3 bg-white rounded-full opacity-30"/></div>
                <h4 className="text-xl md:text-2xl lg:text-3xl font-black font-cairo text-right leading-tight relative z-10">{language === 'ar' ? m.tAr : m.tEn}</h4>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* PAGE 11: Administration */}
      <section className={s.sectionLight}>
        <div className={s.container}>
          <motion.div 
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="bg-white rounded-[2rem] md:rounded-[4rem] lg:rounded-[5rem] shadow-2xl p-6 md:p-12 lg:p-16 grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 lg:gap-20 items-center"
          >
            <motion.div variants={fadeLeft} className="text-right space-y-5 md:space-y-8 lg:space-y-10">
              <div className="bg-gradient-to-r from-brand-blue to-blue-600 p-3 md:p-4 lg:p-5 rounded-full w-fit pr-6 md:pr-8 lg:pr-10 ml-auto flex items-center gap-3 md:gap-4 lg:gap-5 shadow-lg">
                <h3 className="text-xl md:text-2xl lg:text-3xl font-black text-white font-cairo">{language === 'ar' ? 'الإدارة' : 'Administration'}</h3>
                <div className="flex gap-2"><div className="w-2 h-2 md:w-3 md:h-3 bg-white rounded-full"/><div className="w-2 h-2 md:w-3 md:h-3 bg-white rounded-full opacity-30"/></div>
              </div>

              <ul className="text-lg md:text-xl lg:text-2xl font-bold text-slate-500 space-y-2 md:space-y-3 lg:space-y-4">
                <li className="hover:text-slate-700 transition-colors">• {language === 'ar' ? 'إدارة كاملة لدورة حياة الطالب' : 'Full student lifecycle management'}</li>
                <li className="hover:text-slate-700 transition-colors">• {language === 'ar' ? 'إدارة الموظفين والرواتب' : 'Staff & payroll management'}</li>
                <li className="hover:text-slate-700 transition-colors">• {language === 'ar' ? 'سجلات رقمية متكاملة' : 'Digital records'}</li>
              </ul>

              <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-6 md:p-8 lg:p-10 rounded-[2rem] md:rounded-[2.5rem] lg:rounded-[3rem] text-center text-white shadow-xl">
                <p className="text-xl md:text-2xl lg:text-3xl font-black">{language === 'ar' ? 'تقليل الجهد الإداري حتى 40%!' : 'Reduce workload by up to 40%!'}</p>
              </div>
            </motion.div>

            <motion.div variants={fadeRight} className="bg-gradient-to-br from-slate-50 to-white p-5 md:p-8 lg:p-10 rounded-[2rem] md:rounded-[3rem] lg:rounded-[4rem] text-center border-2 border-slate-100 h-[300px] md:h-[450px] lg:h-[600px] flex flex-col items-center shadow-inner">
              <h4 className="text-lg md:text-xl lg:text-2xl font-black mb-4 md:mb-6 lg:mb-10 text-slate-800 font-poppins">Administration Workload Reduction</h4>
              <ResponsiveContainer width="100%" height="80%">
                <BarChart data={adminData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.1}/>
                  <XAxis dataKey="name" fontSize={12} fontWeight="black" />
                  <YAxis hide />
                  <Tooltip contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }} />
                  <Bar dataKey="value" fill="#3ABEF9" radius={[20, 20, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* PAGE 12: Finance */}
      <section className={s.section}>
        <div className={s.container}>
          <motion.div 
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-[2rem] md:rounded-[4rem] lg:rounded-[5rem] shadow-2xl p-6 md:p-12 lg:p-16 grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 lg:gap-20 items-center text-white"
          >
            <motion.div variants={fadeRight} className="order-2 lg:order-1 bg-gradient-to-br from-white to-slate-50 p-5 md:p-8 lg:p-10 rounded-[2rem] md:rounded-[3rem] lg:rounded-[4rem] shadow-xl h-[300px] md:h-[450px] lg:h-[600px] flex flex-col items-center text-slate-900 border border-slate-100">
              <h4 className="text-lg md:text-xl lg:text-2xl font-black mb-4 md:mb-6 lg:mb-10 text-slate-800 font-poppins">Fee Collection Status</h4>
              <ResponsiveContainer width="100%" height="80%">
                <RePieChart>
                  <Pie
                    data={getFinanceData(language)}
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {getFinanceData(language).map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                    <Tooltip contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }} />
                  </Pie>
                </RePieChart>
                </ResponsiveContainer>
                <div className="flex gap-3 md:gap-5 lg:gap-8 mt-2 md:mt-3 lg:mt-4 flex-wrap justify-center">
                  {getFinanceData(language).map(f => (
                  <div key={f.name} className="flex items-center gap-1 md:gap-2">
                    <div className="w-3 h-3 md:w-4 md:h-4 rounded-full" style={{ background: f.color }} />
                    <span className="text-xs md:text-sm lg:text-base font-bold">{f.name} {f.value}%</span>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div variants={fadeLeft} className="order-1 lg:order-2 text-right space-y-6 md:space-y-10 lg:space-y-12">
              <div className="bg-gradient-to-r from-brand-green to-emerald-600 p-3 md:p-4 lg:p-5 rounded-full w-fit pr-6 md:pr-8 lg:pr-10 ml-auto flex items-center gap-3 md:gap-4 lg:gap-5 shadow-lg">
                <h3 className="text-xl md:text-2xl lg:text-3xl font-black text-white font-cairo">{language === 'ar' ? 'النظام المالي' : 'Finance'}</h3>
                <div className="flex gap-2"><div className="w-2 h-2 md:w-3 md:h-3 bg-white rounded-full"/><div className="w-2 h-2 md:w-3 md:h-3 bg-white rounded-full opacity-30"/></div>
              </div>

              <ul className="text-lg md:text-xl lg:text-2xl font-bold text-white/70 space-y-2 md:space-y-3 lg:space-y-4">
                <li className="hover:text-white transition-colors">• {language === 'ar' ? 'تحصيل الرسوم تلقائياً' : 'Automated fee collection'}</li>
                <li className="hover:text-white transition-colors">• {language === 'ar' ? 'لوحات مالية لحظية' : 'Real-time financial dashboards'}</li>
                <li className="hover:text-white transition-colors">• {language === 'ar' ? 'تتبع المصروفات' : 'Expense tracking'}</li>
              </ul>

              <div className="bg-gradient-to-r from-brand-blue to-blue-600 p-6 md:p-8 lg:p-10 rounded-[2rem] md:rounded-[2.5rem] lg:rounded-[3rem] text-center text-white shadow-2xl shadow-brand-blue/40">
                <p className="text-xl md:text-2xl lg:text-3xl font-black">{language === 'ar' ? 'شفافية مالية كاملة !' : 'Full financial transparency !'}</p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* PAGE 13: Academics */}
      <section className={s.sectionLight}>
        <div className={s.container}>
          <motion.div 
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="bg-white rounded-[2rem] md:rounded-[4rem] lg:rounded-[5rem] shadow-2xl p-6 md:p-12 lg:p-16 grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 lg:gap-20 items-center"
          >
            <motion.div variants={fadeLeft} className="text-right space-y-5 md:space-y-8 lg:space-y-10">
              <div className="bg-gradient-to-r from-brand-blue to-blue-600 p-3 md:p-4 lg:p-5 rounded-full w-fit pr-6 md:pr-8 lg:pr-10 ml-auto flex items-center gap-3 md:gap-4 lg:gap-5 shadow-lg">
                <h3 className="text-xl md:text-2xl lg:text-3xl font-black text-white font-cairo">{language === 'ar' ? 'الأكاديمي' : 'Academics'}</h3>
                <div className="flex gap-2"><div className="w-2 h-2 md:w-3 md:h-3 bg-white rounded-full"/><div className="w-2 h-2 md:w-3 md:h-3 bg-white rounded-full opacity-30"/></div>
              </div>

              <ul className="text-lg md:text-xl lg:text-2xl font-bold text-slate-500 space-y-2 md:space-y-3 lg:space-y-4">
                <li className="hover:text-slate-700 transition-colors">• {language === 'ar' ? 'تخطيط الدروس' : 'Lesson planning'}</li>
                <li className="hover:text-slate-700 transition-colors">• {language === 'ar' ? 'اختبارات إلكترونية' : 'Online exams'}</li>
                <li className="hover:text-slate-700 transition-colors">• {language === 'ar' ? 'تحليل الأداء' : 'Performance analytics'}</li>
              </ul>

              <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-6 md:p-10 lg:p-12 rounded-[2rem] md:rounded-[3rem] lg:rounded-[3.5rem] text-center text-white shadow-xl">
                <p className="text-lg md:text-xl lg:text-2xl font-bold mb-1 md:mb-2">{language === 'ar' ? 'تحويل التعليم إلى تميز قابل للقياس قائم على البيانات' : 'Transform learning into measurable, data-driven excellence'}</p>
              </div>
            </motion.div>

            <motion.div variants={fadeRight} className="bg-gradient-to-br from-slate-50 to-white p-5 md:p-8 lg:p-10 rounded-[2rem] md:rounded-[3rem] lg:rounded-[4rem] h-[300px] md:h-[450px] lg:h-[600px] flex flex-col items-center shadow-inner border border-slate-100">
              <h4 className="text-lg md:text-xl lg:text-2xl font-black mb-4 md:mb-6 lg:mb-10 text-slate-800 font-poppins">Student Performance</h4>
              <ResponsiveContainer width="100%" height="80%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={getAcademicData(language)}>
                  <PolarGrid stroke="#E2E8F0" />
                  <PolarAngleAxis dataKey="subject" tick={{ fontWeight: 'bold', fontSize: 12 }} />
                  <PolarRadiusAxis tick={false} axisLine={false} />
                  <Radar name={language === 'ar' ? 'طالب' : 'Student A'} dataKey="A" stroke="#3ABEF9" fill="#3ABEF9" fillOpacity={0.6} />
                </RadarChart>
              </ResponsiveContainer>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* PAGE 14: Communication */}
      <section className={s.section}>
        <div className={s.container}>
          <motion.div 
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="bg-gradient-to-br from-brand-green to-emerald-700 rounded-[2rem] md:rounded-[4rem] lg:rounded-[5rem] shadow-2xl p-6 md:p-12 lg:p-16 grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 lg:gap-20 items-center text-white"
          >
            <motion.div variants={fadeRight} className="order-2 lg:order-1 bg-gradient-to-br from-white to-slate-50 p-5 md:p-8 lg:p-10 rounded-[2rem] md:rounded-[3rem] lg:rounded-[4rem] h-[300px] md:h-[450px] lg:h-[600px] flex flex-col items-center text-slate-900 justify-center border border-slate-100">
              <h4 className="text-lg md:text-xl lg:text-2xl font-black mb-6 md:mb-10 lg:mb-16 text-slate-800 font-poppins">{language === 'ar' ? 'شبكة التواصل' : 'Communication Network'}</h4>
              <div className="relative w-48 h-48 md:w-64 md:h-64 lg:w-80 lg:h-80 flex items-center justify-center scale-75 md:scale-90 lg:scale-100 origin-center">
                <div className="w-20 h-20 md:w-28 md:h-28 lg:w-32 lg:h-32 bg-gradient-to-br from-brand-blue to-blue-600 rounded-full flex items-center justify-center text-white font-black text-sm md:text-xl lg:text-2xl z-20 shadow-2xl">{language === 'ar' ? 'المدرسة' : 'School'}</div>
                <div className="absolute top-0 right-0 w-14 h-14 md:w-20 md:h-20 lg:w-24 lg:h-24 bg-white rounded-2xl flex flex-col items-center justify-center text-slate-400 gap-1 md:gap-2 shadow-lg hover:scale-110 transition-transform"><Smartphone size={14} className="md:size-5 text-brand-blue" /><span className="text-[10px] md:text-xs lg:text-sm">Mobile</span></div>
                <div className="absolute top-0 left-0 w-14 h-14 md:w-20 md:h-20 lg:w-24 lg:h-24 bg-white rounded-2xl flex flex-col items-center justify-center text-slate-400 gap-1 md:gap-2 shadow-lg hover:scale-110 transition-transform"><MessageSquare size={14} className="md:size-5 text-brand-green" /><span className="text-[10px] md:text-xs lg:text-sm">WhatsApp</span></div>
                <div className="absolute bottom-0 right-0 w-14 h-14 md:w-20 md:h-20 lg:w-24 lg:h-24 bg-white rounded-2xl flex flex-col items-center justify-center text-slate-400 gap-1 md:gap-2 shadow-lg hover:scale-110 transition-transform"><Mail size={14} className="md:size-5 text-red-500" /><span className="text-[10px] md:text-xs lg:text-sm">Email</span></div>
                <div className="absolute bottom-0 left-0 w-14 h-14 md:w-20 md:h-20 lg:w-24 lg:h-24 bg-white rounded-2xl flex flex-col items-center justify-center text-slate-400 gap-1 md:gap-2 shadow-lg hover:scale-110 transition-transform"><FileText size={14} className="md:size-5 text-orange-500" /><span className="text-[10px] md:text-xs lg:text-sm">SMS</span></div>
                <div className="absolute w-[180px] md:w-[250px] lg:w-[300px] h-0.5 bg-slate-200 rotate-45" />
                <div className="absolute w-[180px] md:w-[250px] lg:w-[300px] h-0.5 bg-slate-200 -rotate-45" />
              </div>
            </motion.div>

            <motion.div variants={fadeLeft} className="order-1 lg:order-2 text-right space-y-6 md:space-y-10 lg:space-y-12">
              <div className="bg-white/20 p-3 md:p-4 lg:p-5 rounded-full w-fit pr-6 md:pr-8 lg:pr-10 ml-auto flex items-center gap-3 md:gap-4 lg:gap-5 backdrop-blur-xl shadow-lg">
                <h3 className="text-xl md:text-2xl lg:text-3xl font-black text-white font-cairo">{language === 'ar' ? 'التواصل' : 'Communication'}</h3>
                <div className="flex gap-2"><div className="w-2 h-2 md:w-3 md:h-3 bg-white rounded-full"/><div className="w-2 h-2 md:w-3 md:h-3 bg-white rounded-full opacity-30"/></div>
              </div>

              <ul className="text-lg md:text-xl lg:text-2xl font-bold text-white/80 space-y-2 md:space-y-3 lg:space-y-4">
                <li className="hover:text-white transition-colors">• {language === 'ar' ? 'تطبيق لأولياء الأمور' : 'Parent mobile application'}</li>
                <li className="hover:text-white transition-colors">• {language === 'ar' ? 'إشعارات فورية' : 'Real-time notifications'}</li>
                <li className="hover:text-white transition-colors">• {language === 'ar' ? 'تكامل مع واتساب والرسائل' : 'SMS & WhatsApp integration'}</li>
              </ul>

              <div className="bg-slate-900/40 p-6 md:p-10 lg:p-12 rounded-[2rem] md:rounded-[3rem] lg:rounded-[3.5rem] text-center text-white border-2 md:border-4 border-white/20 backdrop-blur-sm shadow-xl">
                <p className="text-xl md:text-2xl lg:text-3xl font-black italic">{language === 'ar' ? 'تواصل أقوى وثقة أكبر!' : 'Stronger engagement, better trust!'}</p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* PAGE 15: Beyond Software */}
      <section className={s.sectionLight}>
        <div className={s.container}>
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="bg-white rounded-[2rem] md:rounded-[4rem] lg:rounded-[5rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] p-6 md:p-12 lg:p-16 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-full h-full bg-slate-900/5 -z-0 transform translate-x-1/2 -skew-x-12" />
            <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-brand-blue/5 rounded-full blur-3xl" />
            <motion.div 
              variants={stagger}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 lg:gap-20 items-center relative z-10"
            >
              <motion.div variants={fadeLeft} className="text-right space-y-6 md:space-y-10 lg:space-y-12">
                <h2 className="text-3xl md:text-5xl lg:text-6xl font-black font-cairo text-slate-900 uppercase">{language === 'ar' ? 'ما بعد النظام' : 'BEYOND SOFTWARE'}</h2>

                <div className="flex flex-col sm:flex-row gap-4 md:gap-5 lg:gap-6 justify-end">
                  <div className="bg-gradient-to-br from-brand-blue to-blue-700 p-5 md:p-6 lg:p-8 rounded-[2rem] md:rounded-[2.5rem] lg:rounded-[3rem] text-white flex-1 text-right shadow-2xl">
                    <div className="flex gap-2 mb-2 md:mb-4 justify-end"><div className="w-2 h-2 md:w-3 md:h-3 bg-white rounded-full"/><div className="w-2 h-2 md:w-3 md:h-3 bg-white rounded-full opacity-30"/></div>
                    <ul className="space-y-2 md:space-y-3 lg:space-y-4 text-base md:text-lg lg:text-xl font-bold">
                      <li>• {language === 'ar' ? 'تصميم موقع المدرسة' : 'Website development'}</li>
                      <li>• {language === 'ar' ? 'إدارة وسائل التواصل الاجتماعي' : 'Social media management'}</li>
                      <li>• {language === 'ar' ? 'حملات تسويقية رقمية' : 'Digital marketing campaigns'}</li>
                    </ul>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-6 md:p-10 lg:p-12 rounded-[2rem] md:rounded-[3.5rem] lg:rounded-[4rem] text-center text-white shadow-2xl">
                  <p className="text-2xl md:text-3xl lg:text-4xl font-bold font-poppins mb-1 md:mb-2 italic">{language === 'ar' ? 'نساعد مدرستك على النمو!' : 'We grow your school!'}</p>
                </div>
              </motion.div>

              <motion.div variants={fadeRight} className="relative">
                <div className="bg-white p-4 md:p-8 lg:p-10 rounded-[2rem] md:rounded-[3rem] lg:rounded-[4rem] shadow-2xl border-4 md:border-6 lg:border-8 border-slate-50 relative transition-all duration-500 hover:shadow-[0_30px_80px_-20px_rgba(0,0,0,0.2)]">
                  <img src="https://images.unsplash.com/photo-1542744094-24638eff58bb?auto=format&fit=crop&q=80&w=800" className="rounded-[2rem] md:rounded-[2.5rem] lg:rounded-[3rem] w-full" />
                  <div className="absolute -top-4 -left-4 md:-top-8 md:-left-8 lg:-top-10 lg:-left-10 bg-gradient-to-br from-brand-green to-emerald-600 p-4 md:p-6 lg:p-8 rounded-full shadow-2xl text-white transform rotate-12 hover:rotate-0 transition-transform duration-500">
                    <Rocket size={24} className="md:size-8 lg:size-12" />
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* PAGE 16: The Impact */}
      <section className={s.section}>
        <div className={s.container}>
          <motion.div 
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 lg:gap-20 items-center"
          >
            <motion.div 
              variants={fadeLeft}
              className="bg-gradient-to-br from-slate-900 to-slate-800 p-6 md:p-12 lg:p-16 rounded-[2rem] md:rounded-[4rem] lg:rounded-[5rem] shadow-2xl text-white relative group"
            >
              <div className="absolute -top-10 -right-10 bg-brand-blue/20 w-24 h-24 md:w-32 md:h-32 lg:w-40 lg:h-40 rounded-full blur-3xl" />
              <h2 className="text-[5rem] md:text-[8rem] lg:text-[12rem] font-black font-cairo absolute -top-16 md:-top-24 lg:-top-32 -left-4 md:-left-8 lg:-left-10 opacity-5 -z-0 select-none leading-none">IMPACT</h2>
              <div className="relative z-10">
                <h2 className="text-5xl md:text-6xl lg:text-8xl font-black font-cairo mb-2 md:mb-3 lg:mb-4 text-right">{language === 'ar' ? 'النتائج!' : 'The Impact!'}</h2>

                <div className="space-y-4 md:space-y-6 lg:space-y-10">
                  {[
                    { en: '30-40% reduction in administrative work', ar: 'تقليل العمل الإداري بنسبة 30-40%' },
                    { en: '20-30% improvement in fee collection', ar: 'تحسين تحصيل الرسوم بنسبة 20-30%' },
                    { en: 'Higher parent satisfaction', ar: 'زيادة رضا أولياء الأمور' },
                    { en: 'Increased student enrollment', ar: 'ارتفاع معدل تسجيل الطلاب' },
                  ].map((impact, i) => (
                    <motion.div 
                      key={i} 
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.1 }}
                      className="flex flex-col items-end gap-1 md:gap-2 group/item"
                    >
                      <p className="text-base md:text-xl lg:text-2xl font-bold flex items-center gap-2 md:gap-4 transition-all group-hover/item:text-brand-blue group-hover/item:translate-x-[-10px]">
                          {language === 'ar' ? impact.ar : impact.en} <div className="w-3 h-0.5 md:w-4 md:h-0.5 bg-brand-green"/>
                      </p>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>

            <motion.div variants={fadeRight} className="relative">
              <div className="bg-gradient-to-br from-slate-50 to-white p-8 md:p-14 lg:p-20 rounded-[2rem] md:rounded-[4rem] lg:rounded-[5rem] shadow-xl relative overflow-hidden border border-slate-100 flex items-center justify-center group">
                <div className="absolute inset-0 bg-gradient-to-br from-brand-blue/5 via-transparent to-transparent transform -skew-y-12" />
                <div className="text-center relative z-10 space-y-4 md:space-y-6 lg:space-y-8">
                  <motion.div 
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    transition={{ type: "spring", stiffness: 300 }}
                    className="w-36 h-36 md:w-48 md:h-48 lg:w-64 lg:h-64 bg-white rounded-full shadow-2xl mx-auto flex items-center justify-center"
                  >
                    <Users size={60} className="md:size-24 lg:size-[120px] text-brand-blue" />
                  </motion.div>
                  <h4 className="text-3xl md:text-4xl lg:text-5xl font-black font-cairo text-slate-800">{language === 'ar' ? 'شريككم في النجاح' : 'Your Partner in Success'}</h4>
                  <div className="h-1 md:h-2 w-20 md:w-32 bg-gradient-to-r from-brand-green to-emerald-400 mx-auto rounded-full" />
                </div>
              </div>
              <div className="absolute -bottom-4 -right-4 md:-bottom-8 md:-right-8 lg:-bottom-10 lg:-right-10 bg-gradient-to-br from-slate-900 to-slate-800 p-4 md:p-8 lg:p-10 rounded-[1.5rem] md:rounded-[2.5rem] lg:rounded-[3rem] shadow-2xl text-white transform -rotate-3 hover:rotate-0 transition-transform duration-500">
                <TrendingUp size={24} className="md:size-8 lg:size-12 text-brand-green mb-2 md:mb-4" />
                <p className="text-sm md:text-lg lg:text-2xl font-black">{language === 'ar' ? 'رفع الكفاءة' : 'Efficiency Boost'}</p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* PAGE 17: Implementation */}
      <section className={s.sectionLight}>
        <div className={s.container}>
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="bg-slate-100/50 border-4 md:border-6 lg:border-8 border-slate-200 rounded-[2rem] md:rounded-[4rem] lg:rounded-[5rem] p-6 md:p-12 lg:p-16 text-center"
          >
            <h2 className="text-4xl md:text-6xl lg:text-8xl font-black font-cairo text-slate-900 mb-10 md:mb-16 lg:mb-20 tracking-tighter">{language === 'ar' ? 'التنفيذ' : 'Implementation'}</h2>

            <motion.div 
              variants={stagger}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 md:gap-10 lg:gap-12 mb-10 md:mb-16 lg:mb-20"
            >
              {[
                { tAr: 'تنفيذ سريع (4-8 أسابيع)', tEn: 'Fast deployment (4-8 weeks)', icon: Zap, color: 'bg-blue-500' },
                { tAr: 'تدريب كامل للفريق', tEn: 'Full training and onboarding', icon: Users, color: 'bg-emerald-500' },
                { tAr: 'دعم فني مستمر', tEn: 'Continuous support', icon: ShieldCheck, color: 'bg-blue-500' },
              ].map((item, i) => (
                <motion.div 
                  key={i} 
                  variants={scaleIn}
                  className="flex flex-col items-center group"
                >
                  <div className={`${item.color} w-20 h-20 md:w-28 md:h-28 lg:w-32 lg:h-32 text-white rounded-full flex items-center justify-center shadow-2xl mb-4 md:mb-6 lg:mb-8 group-hover:scale-110 group-hover:rotate-6 transition-all`}>
                    <item.icon size={28} className="md:size-10 lg:size-[50px]" />
                  </div>
                  <h4 className="text-xl md:text-2xl lg:text-3xl font-black font-cairo mb-2 md:mb-3 lg:mb-4 leading-tight">{language === 'ar' ? item.tAr : item.tEn}</h4>
                </motion.div>
              ))}
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-6 md:p-10 lg:p-12 rounded-[2rem] md:rounded-[3.5rem] lg:rounded-[4rem] text-center text-white relative group"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-brand-green/10 via-transparent to-transparent transform -skew-x-12 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              <h3 className="text-3xl md:text-4xl lg:text-5xl font-black font-cairo text-brand-green mb-2 md:mb-3 lg:mb-4 relative z-10">{language === 'ar' ? 'بدون أي تعقيد' : 'Zero disruption'}</h3>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* PAGE 18: Why Us? */}
      <section className={s.section}>
        <div className={s.container}>
          <motion.div 
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="flex flex-col lg:flex-row items-center gap-8 md:gap-12 lg:gap-20"
          >
            <motion.div variants={fadeLeft} className="lg:w-1/2 relative order-2 lg:order-1">
              <div className="bg-brand-blue/5 p-8 md:p-14 lg:p-20 rounded-[2rem] md:rounded-[4rem] lg:rounded-[5rem] border-4 border-dashed border-brand-blue/20 flex items-center justify-center group">
                <div className="relative text-black text-center space-y-6 md:space-y-10 lg:space-y-12">
                  <div className="text-[6rem] md:text-[9rem] lg:text-[12rem] font-black opacity-10 select-none leading-none">?</div>
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 space-y-2 md:space-y-3 lg:space-y-4">
                    <h2 className="text-5xl md:text-7xl lg:text-9xl font-black font-cairo group-hover:scale-105 transition-transform">{language === 'ar' ? 'لماذا نحن؟' : 'Why US'}</h2>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div variants={fadeRight} className="lg:w-1/2 text-right space-y-5 md:space-y-8 lg:space-y-10 order-1 lg:order-2">
              <div className="flex flex-col gap-4 md:gap-6 lg:gap-8">
                <div className="bg-gradient-to-br from-brand-green to-emerald-700 p-5 md:p-8 lg:p-10 rounded-[2rem] md:rounded-[3rem] lg:rounded-[3.5rem] text-white shadow-2xl">
                  <div className="flex gap-2 mb-3 md:mb-5 lg:mb-6 justify-end"><div className="w-2 h-2 md:w-3 md:h-3 bg-white rounded-full"/><div className="w-2 h-2 md:w-3 md:h-3 bg-white rounded-full opacity-30"/></div>
                  <ul className="text-lg md:text-xl lg:text-2xl font-bold space-y-2 md:space-y-3 lg:space-y-4">
                    <li>• {language === 'ar' ? 'حل متكامل في منصة واحدة' : 'All-in-one solution'}</li>
                    <li>• {language === 'ar' ? 'مخصص للسوق السعودي' : 'Localized for Saudi market'}</li>
                    <li>• {language === 'ar' ? 'دعم عربي وإنجليزي' : 'Bilingual support'}</li>
                    <li>• {language === 'ar' ? 'توفير في التكاليف' : 'Cost-efficient'}</li>
                  </ul>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* PAGE 19: Business Model */}
      <section className={s.sectionLight}>
        <div className={s.container}>
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-10 md:mb-16 lg:mb-24"
          >
            <h2 className="text-4xl md:text-5xl lg:text-7xl font-black font-cairo text-slate-900 mb-3 md:mb-4 tracking-tighter">{language === 'ar' ? 'نموذج العمل' : 'Business Model'}</h2>
            <div className="h-1 md:h-2 w-28 md:w-48 bg-gradient-to-r from-brand-green to-emerald-400 mx-auto rounded-full" />
          </motion.div>

          <motion.div 
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-10 lg:gap-12 items-center"
          >
            <motion.div variants={fadeLeft} className="lg:col-span-2 space-y-4 md:space-y-6 lg:space-y-10">
              {[
                { en: 'Subscription-based model', ar: 'نموذج اشتراك سنوي', color: 'bg-blue-500' },
                { en: 'Scalable packages', ar: 'باقات متعددة حسب الحاجة', color: 'bg-emerald-500' },
                { en: 'Recurring revenue', ar: 'إيرادات مستمرة قابلة للنمو', color: 'bg-blue-500' },
              ].map((item, i) => (
                <motion.div 
                  key={i} 
                  initial={{ opacity: 0, x: -30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className={`${item.color} p-5 md:p-8 lg:p-10 rounded-[2rem] md:rounded-[2.5rem] lg:rounded-[3rem] text-white flex flex-col md:flex-row justify-between items-center gap-4 md:gap-6 shadow-2xl hover:scale-[1.02] transition-all`}
                >
                  <div className="flex gap-2"><div className="w-2 h-2 md:w-3 md:h-3 bg-white rounded-full"/><div className="w-2 h-2 md:w-3 md:h-3 bg-white rounded-full opacity-30"/></div>
                  <div className="text-center md:text-right">
                    <h4 className="text-lg md:text-xl lg:text-2xl font-bold font-poppins mb-1 md:mb-2">{language === 'ar' ? item.ar : item.en}</h4>
                  </div>
                </motion.div>
              ))}
            </motion.div>

            <motion.div variants={fadeRight} className="flex flex-col gap-3 md:gap-5 lg:gap-6">
              {['Basic', 'Standard', 'Premium'].map((tier, i) => (
                <motion.div 
                  key={tier} 
                  whileHover={{ scale: 1.03, x: -5 }}
                  className={`${i === 0 ? 'bg-gradient-to-r from-emerald-500 to-emerald-600' : i === 1 ? 'bg-gradient-to-r from-blue-500 to-blue-600' : 'bg-gradient-to-r from-slate-900 to-slate-800'} p-5 md:p-6 lg:p-8 rounded-[1.5rem] md:rounded-[2rem] lg:rounded-[2.5rem] text-white flex items-center justify-between shadow-xl cursor-default`}
                >
                  <div className="flex gap-2"><div className="w-2 h-2 bg-white rounded-full"/><div className="w-2 h-2 bg-white rounded-full opacity-30"/></div>
                  <span className="text-xl md:text-2xl lg:text-3xl font-black font-poppins">{tier}</span>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* PAGE 20: Final CTA */}
      <section className="py-0 overflow-hidden bg-white">
        <div className="max-w-[1920px] mx-auto grid grid-cols-1 lg:grid-cols-2">
          <div className="p-6 md:p-12 lg:p-24 xl:p-32 text-right flex flex-col justify-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <h2 className="text-4xl md:text-5xl lg:text-7xl font-black font-cairo text-slate-800 mb-4 md:mb-6 lg:mb-8 leading-[1.1]">
                {language === 'ar' ? <>حوّل مدرستك إلى <br /><span className="text-brand-blue uppercase">مدرسة ذكية</span></> : <>TRANSFORM YOUR SCHOOL INTO A <br /><span className="text-brand-blue uppercase">Smart Institution</span></>}
              </h2>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="space-y-6 md:space-y-10 lg:space-y-12"
            >
              <div className="text-center md:text-right">
                <p className="text-xl md:text-2xl lg:text-3xl font-bold font-poppins text-slate-400 mb-1 md:mb-2">{language === 'ar' ? 'احجز عرضاً توضيحياً اليوم!' : 'Schedule a demo today!'}</p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 md:gap-8 lg:gap-12 justify-end items-center">
                <button 
                  onClick={onSwitchToProfile}
                  className="text-lg md:text-xl lg:text-2xl font-black font-cairo text-slate-400 hover:text-brand-blue transition-colors flex items-center gap-2 md:gap-4 group order-2 sm:order-1"
                >
                  <ChevronLeft size={20} className="md:size-6 lg:size-8 group-hover:-translate-x-2 transition-transform" /> {language === 'ar' ? 'العودة للبروفايل' : 'Back to Profile'}
                </button>
                <motion.button 
                  whileHover={{ scale: 1.05, boxShadow: '0 20px 40px -10px rgba(58,190,249,0.5)' }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-gradient-to-r from-brand-blue to-blue-600 text-white px-8 md:px-12 lg:px-16 py-5 md:py-6 lg:py-8 rounded-[2rem] md:rounded-[2.5rem] lg:rounded-[3rem] text-xl md:text-2xl lg:text-3xl font-black shadow-2xl transition-all order-1 sm:order-2 w-full sm:w-auto"
                >
                  {language === 'ar' ? 'احجز العرض الآن' : 'Book a Demo Now'}
                </motion.button>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="mt-16 md:mt-24 lg:mt-32 pt-6 md:pt-10 lg:pt-12 border-t flex flex-col md:flex-row justify-between items-center gap-4 md:gap-0"
            >
              <div className="text-brand-blue font-black font-poppins text-lg md:text-xl lg:text-2xl">EWAN GENIUSES</div>
              <div className="flex items-center gap-2 md:gap-4 text-slate-400 font-bold font-poppins uppercase tracking-widest text-sm md:text-base">
                ewan-geniuses.com <MapPin size={16} className="md:size-5" />
              </div>
            </motion.div>
          </div>

          <div className="relative min-h-[300px] md:min-h-[400px] lg:min-h-[600px] bg-slate-900">
            <img src="https://images.unsplash.com/photo-1523240795204-5a2fe2126839?auto=format&fit=crop&q=80&w=1200" className="w-full h-full object-cover opacity-60" />
            <div className="absolute inset-0 bg-gradient-to-l from-white via-transparent to-transparent hidden lg:block" />
            <div className="absolute top-0 right-0 w-16 md:w-24 lg:w-40 h-full bg-brand-blue/30 transform -skew-x-12 translate-x-8 md:translate-x-12 lg:translate-x-20 z-10" />
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};
