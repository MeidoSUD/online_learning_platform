import React, { useState } from 'react';
import { useLanguage } from '../../Contexts/LanguageContext';
import { HelpCircle, ChevronDown } from 'lucide-react';

export const FaqTab: React.FC = () => {
  const { language } = useLanguage();
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = language === 'ar' ? [
    {
      q: 'كيف يمكنني حجز درس خصوصي أو حصة جماعية؟',
      a: 'يمكنك اختيار الخدمة المناسبة من الصفحة الرئيسية (دروس خصوصية أو حصص جماعية)، تصفح المعلمين المتاحين، تحديد موعد الدرس المناسب، وإتمام الدفع بسهولة عبر وسائل الدفع الإلكترونية المعتمدة.'
    },
    {
      q: 'ما هي باقات الساعات التعليمية وما مميزاتها؟',
      a: 'باقات الساعات تتيح لك شراء رصيد ساعات متعددة بخصم مالي خاص، مما يمكنك من حجز حصص متتابعة مع المعلم بالسحب التلقائي من رصيد الباقة دون الحاجة للدفع في كل مرة.'
    },
    {
      q: 'كيف يتم حضور الحصص المباشرة؟',
      a: 'تتم الحصص عبر فصول افتراضية مدمجة بالمنصة باستخدام تقنية Agora. يكفي التوجه لتبويب "جلساتي" أو "الجلسات الجماعية" والنقر على زر "دخول الفصل الافتراضي" في موعد الحصة.'
    },
    {
      q: 'ماذا أفعل في حال عدم حضور المعلم أو مواجهة مشكلة فنية؟',
      a: 'يمكنك فتح تذكرة عبر قسم "الشكاوى والنزاعات" وسيقوم فريق الدعم الفني بمراجعة تسجيل الجلسة وحفظ حقوقك المالية وإعادة جدولة الدرس أو استرداد الرصيد.'
    },
    {
      q: 'كيف يستلم المعلم أرباحه ومستحقاته المالية؟',
      a: 'تُضاف قيمة الحصص المنجزة إلى محفظة المعلم مباشرة فور انتهاء الدرس، ويمكنه طلب سحب أرباحه في أي وقت إلى حسابه البنكي أو بطاقات ومحافظ STC Pay المسجلة لديه.'
    }
  ] : [
    {
      q: 'How do I book a private or group lesson?',
      a: 'Choose your desired service from the home screen, select an accredited tutor, pick an available time slot, and confirm payment.'
    },
    {
      q: 'What are educational packages and their benefits?',
      a: 'Packages offer bundles of tutoring hours at discounted rates, allowing seamless booking directly deducted from your hour balance.'
    },
    {
      q: 'How do I attend virtual live classes?',
      a: 'Classes are conducted via high-quality interactive virtual rooms powered by Agora. Go to My Sessions and click Join Classroom at the scheduled time.'
    },
    {
      q: 'What happens if a tutor misses a scheduled session?',
      a: 'You can submit a ticket in Complaints & Disputes. Our support team will verify attendance and restore your balance or reschedule.'
    },
    {
      q: 'How do teachers withdraw their earnings?',
      a: 'Completed sessions are credited immediately to your wallet. You can request payouts to your verified bank account or STC Pay card.'
    }
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in pb-12">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
          <HelpCircle size={22} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {language === 'ar' ? 'الأسئلة الشائعة' : 'Frequently Asked Questions'}
          </h1>
          <p className="text-xs text-slate-500">
            {language === 'ar' ? 'إجابات على أكثر الأسئلة والاستفسارات شيوعاً حول المنصة' : 'Answers to common inquiries regarding the platform'}
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {faqs.map((faq, index) => {
          const isOpen = openIndex === index;
          return (
            <div
              key={index}
              className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden transition-all"
            >
              <button
                onClick={() => setOpenIndex(isOpen ? null : index)}
                className="w-full px-5 py-4 flex items-center justify-between text-start font-bold text-slate-800 text-sm hover:bg-slate-50 transition-colors"
              >
                <span>{faq.q}</span>
                <ChevronDown
                  size={18}
                  className={`text-slate-400 transition-transform duration-200 shrink-0 ${isOpen ? 'rotate-180 text-primary' : ''}`}
                />
              </button>
              {isOpen && (
                <div className="px-5 pb-5 text-xs text-slate-600 leading-relaxed border-t border-slate-50 pt-3">
                  {faq.a}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

