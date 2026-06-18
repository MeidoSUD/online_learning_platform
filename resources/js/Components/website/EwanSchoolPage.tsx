import React from 'react';
import { motion } from 'framer-motion';
import { 
  Zap, Globe, Layout, Receipt, GraduationCap, Phone, ChevronLeft 
} from 'lucide-react';
import { ecosystemStyles as s } from './EwanSchoolPage.styles';

export const EwanSchoolPage: React.FC = () => {
  return (
    <div className="animate-fade-in bg-white" dir="rtl">
       <section className={s.hero}>
        <div className="absolute top-0 right-0 w-1/3 bg-brand-blue/10 h-full -skew-x-12 transform translate-x-20 z-0 hidden lg:block" />
        <div className={`${s.container} grid grid-cols-1 lg:grid-cols-2 gap-12 items-center`}>
          <motion.div initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8 }}>
            <div className={s.badge}>
              <Zap size={18} className="text-brand-blue fill-brand-blue" />
              <span className="text-sm font-bold text-brand-blue tracking-wide uppercase font-poppins">EWAN ECOSYSTEM</span>
            </div>
            <h1 className={s.heroTitle}>
              نظام ايوان <br /><span className="text-brand-blue">التعليمي الذكي</span>
            </h1>
            <p className="text-2xl md:text-3xl font-cairo text-slate-500 mb-8 font-medium text-right">
              Integrated Digital Transformation <br />
              <span className="text-brand-green">التحول الرقمي المتكامل للمدارس</span>
            </p>
            <div className="flex flex-wrap gap-4 justify-end">
              <button 
                className={s.secondaryButton} 
              >
                مشاهدة البروفايل <ChevronLeft size={20} />
              </button>
              <div className="flex items-center gap-4 px-6 text-slate-500 font-medium">
                <Globe size={20} className="text-brand-green" />
                <span className="font-poppins uppercase">EWAN-GENIUSES.COM</span>
              </div>
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="relative">
             <div className="grid grid-cols-2 gap-6 h-[500px]">
                <div className="bg-brand-blue rounded-3xl overflow-hidden shadow-2xl h-full"><img src="https://images.unsplash.com/photo-1571260899304-425eee4c7efc?auto=format&fit=crop&q=80&w=800" className="w-full h-full object-cover" /></div>
                <div className="flex flex-col gap-6">
                   <div className="flex-1 bg-brand-green rounded-3xl overflow-hidden shadow-xl"><img src="https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&q=80&w=800" className="w-full h-full object-cover" /></div>
                   <div className="flex-1 bg-slate-900 rounded-3xl flex items-center justify-center text-white text-3xl font-black font-cairo">40% <br/> تقليل <br/> الجهد</div>
                </div>
             </div>
          </motion.div>
        </div>
      </section>

      <section className="py-24 bg-white">
         <div className={s.container}>
            <div className="text-center mb-16">
               <h2 className="text-5xl font-black font-cairo mb-4 text-slate-800">مكونات النظام <span className="text-brand-blue">| Modules</span></h2>
               <div className="h-1.5 w-32 bg-brand-green mx-auto rounded-full" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
               {[
                 { t: 'الإدارة', d: 'ERP | حياة الطالب بالكامل', color: 'bg-blue-600', icon: Layout },
                 { t: 'النظام المالي', d: 'تحصيل تلقائي | لوحات لحظية', color: 'bg-emerald-600', icon: Receipt },
                 { t: 'الأكاديمي', d: 'اختبارات وخطط دروس', color: 'bg-purple-600', icon: GraduationCap },
                 { t: 'التواصل', d: 'تطبيق ولي الأمر | إشعارات', color: 'bg-orange-600', icon: Phone },
               ].map((m, i) => (
                 <div key={i} className={`${m.color} ${s.moduleCard}`}>
                    <m.icon size={48} className="mb-auto" />
                    <h3 className="text-2xl font-black mb-2">{m.t}</h3>
                    <p className="text-sm opacity-80">{m.d}</p>
                 </div>
               ))}
            </div>
         </div>
      </section>

      <section className="py-24 bg-slate-50 border-y border-slate-100">
         <div className={`${s.container} grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 text-center`}>
            {[
               { val: '30-40%', label: 'تقليل الجهد الإداري' },
               { val: '20-30%', label: 'تحصيل إيرادات أفضل' },
               { val: '95%', label: 'رضا أولياء الأمور' },
               { val: 'Turbo', label: 'كفاءة تشغيلية عالية' },
            ].map((stat, i) => (
              <div key={i} className={s.statCard}>
                 <div className="text-5xl font-black text-brand-blue mb-4">{stat.val}</div>
                 <div className="text-xl font-bold font-cairo text-slate-500">{stat.label}</div>
              </div>
            ))}
         </div>
      </section>
    </div>
  );
};
