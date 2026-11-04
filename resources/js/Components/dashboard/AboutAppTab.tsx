import React from 'react';
import { useLanguage } from '../../Contexts/LanguageContext';
import { Info, ShieldCheck, Award, Heart, Mail, Phone, ExternalLink } from 'lucide-react';
import { Logo } from '../Logo';

export const AboutAppTab: React.FC = () => {
  const { language } = useLanguage();

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in pb-12">
      <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm text-center space-y-4">
        <div className="flex justify-center mb-2">
          <Logo className="scale-90" />
        </div>
        <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 inline-block">
          {language === 'ar' ? 'الإصدار 2.5.0 - معتمد رسمياً' : 'Version 2.5.0 - Officially Certified'}
        </span>
        <h2 className="text-xl font-black text-slate-900">
          {language === 'ar' ? 'منصة إيوان التعليمية الذكية' : 'Ewan Educational Platform'}
        </h2>
        <p className="text-xs text-slate-500 leading-relaxed max-w-lg mx-auto">
          {language === 'ar'
            ? 'منصة تعليمية متكاملة تهدف إلى ربط الطلاب بأفضل الكفاءات التعليمية والمعلمين المعتمدين عبر أحدث تقنيات التعليم الرقمي التفاعلي والذكاء الاصطناعي في المملكة العربية السعودية والوطن العربي.'
            : 'A comprehensive educational platform connecting students with certified tutors using modern interactive virtual classroom technologies and AI.'}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm text-center space-y-2">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
            <ShieldCheck size={20} />
          </div>
          <h3 className="font-bold text-slate-800 text-xs">
            {language === 'ar' ? 'معلمون موثقون' : 'Verified Tutors'}
          </h3>
          <p className="text-[11px] text-slate-400">
            {language === 'ar' ? 'فحص شامل للشهادات والخبرات' : 'Rigorous background & certificate checks'}
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm text-center space-y-2">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
            <Award size={20} />
          </div>
          <h3 className="font-bold text-slate-800 text-xs">
            {language === 'ar' ? 'جودة وضمان' : 'Quality Guaranteed'}
          </h3>
          <p className="text-[11px] text-slate-400">
            {language === 'ar' ? 'حماية المستحقات وتتبع الحضور' : 'Session tracking & payment protection'}
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm text-center space-y-2">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mx-auto">
            <Heart size={20} />
          </div>
          <h3 className="font-bold text-slate-800 text-xs">
            {language === 'ar' ? 'دعم مستمر' : '24/7 Support'}
          </h3>
          <p className="text-[11px] text-slate-400">
            {language === 'ar' ? 'فريق خدمة عملاء في خدمتك' : 'Dedicated support at your service'}
          </p>
        </div>
      </div>
    </div>
  );
};

