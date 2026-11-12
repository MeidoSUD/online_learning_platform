import React, { useState } from 'react';
import { useLanguage } from '../../Contexts/LanguageContext';
import { MessageCircle, Phone, Mail, ChevronDown, ChevronUp, Headphones, HelpCircle } from 'lucide-react';

interface FaqItem {
  q: string;
  a: string;
}

export const SupportTab: React.FC = () => {
  const { t, language } = useLanguage();
  const [activeTab, setActiveTab] = useState<'faq' | 'contact'>('faq');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'general' | 'booking' | 'packages' | 'payments'>('all');
  const [expandedFaq, setExpandedFaq] = useState<number | null>(0);

  const categories = [
    { key: 'all', labelAr: 'الكل', labelEn: 'All' },
    { key: 'general', labelAr: 'عام', labelEn: 'General' },
    { key: 'booking', labelAr: 'الحجوزات والجلسات', labelEn: 'Bookings' },
    { key: 'packages', labelAr: 'الباقات والاشتراكات', labelEn: 'Packages' },
    { key: 'payments', labelAr: 'المدفوعات والنزاعات', labelEn: 'Payments' },
  ];

  const faqsByCategory: Record<string, FaqItem[]> = {
    general: [
      {
        q: language === 'ar' ? 'ما هي منصة إيوان العباقرة؟' : 'What is Ewan Geniuses platform?',
        a: language === 'ar'
          ? 'إيوان العباقرة هي منصة تعليمية ذكية تربط الطلاب بنخبة من المعلمين المعتمدين في جميع المواد والمراحل الدراسية، مع دعم كامل للدروس الفردية والجماعية والدورات.'
          : 'Ewan Geniuses is a smart educational platform connecting students with verified teachers across all subjects and grades.'
      },
      {
        q: language === 'ar' ? 'كيف يعمل المساعد التعليمي الذكي؟' : 'How does the AI Assistant work?',
        a: language === 'ar'
          ? 'يقوم المساعد الذكي بالإجابة الفورية على الأسئلة الأكاديمية وتقديم شروحات مبسطة وتلخيص المفاهيم الدراسية على مدار الساعة.'
          : 'The AI Assistant provides immediate answers to academic questions and simplified explanations 24/7.'
      }
    ],
    booking: [
      {
        q: language === 'ar' ? 'كيف يمكنني حجز درس خصوصي؟' : 'How do I book a private lesson?',
        a: language === 'ar'
          ? 'يمكنك تصفح قائمة المعلمين أو البحث بالمادة والمرحلة، واختيار المعلم المناسب، ثم تحديد الموعد المتاح من جدول المعلم وإتمام الحجز.'
          : 'Browse teachers, choose your preferred teacher and available slot from their schedule, then confirm the booking.'
      },
      {
        q: language === 'ar' ? 'متى يُفتح رابط قاعة الدرس الافتراضية؟' : 'When is the virtual classroom link opened?',
        a: language === 'ar'
          ? 'يُتاح زر الدخول للقاعة الافتراضية قبل موعد الحصة بـ 15 دقيقة، ويمكنك الانضمام مباشرة من شاشة جلساتي.'
          : 'The Join button opens 15 minutes before the session starts, and you can join directly from My Sessions.'
      }
    ],
    packages: [
      {
        q: language === 'ar' ? 'ما هي باقات الساعات التعليمية وما مميزاتها؟' : 'What are educational packages?',
        a: language === 'ar'
          ? 'باقات الساعات تتيح لك شراء عدد محدد من الحصص بسعر مخفض، واستخدام هذا الرصيد لحجز حصص مع أي معلم معتمد دون الحاجة للدفع في كل مرة.'
          : 'Packages allow purchasing session hours in advance at discounted rates, usable for any verified teacher booking.'
      },
      {
        q: language === 'ar' ? 'هل تنتهي صلاحية رصيد الحصص في الباقة؟' : 'Do package hours expire?',
        a: language === 'ar'
          ? 'تمتد صلاحية الباقات لفترات مرنة تصل إلى نهاية الفصل الدراسي، ويمكنك متابعة الساعات المتبقية وتاريخ الانتهاء من شاشة اشتراكاتي.'
          : 'Packages have flexible validity throughout the academic term. You can track remaining hours in My Subscriptions.'
      }
    ],
    payments: [
      {
        q: language === 'ar' ? 'ما هي وسائل الدفع المدعومة؟' : 'What payment methods are supported?',
        a: language === 'ar'
          ? 'تدعم المنصة بطاقات مدى، البطاقات الائتمانية (Visa / MasterCard)، أبل باي، والمحفظة الإلكترونية.'
          : 'We support Mada cards, Visa/MasterCard credit cards, Apple Pay, and internal digital wallet.'
      },
      {
        q: language === 'ar' ? 'ماذا أفعل إذا لم يحضر المعلم أو حدث خلل فني؟' : 'What if the teacher did not attend?',
        a: language === 'ar'
          ? 'يمكنك رفع شكوى رسمية فوراً من شاشة شكاواي ونزاعاتي أو تفاصيل الجلسة، وسيقوم فريق الدعم بمراجعة تسجيل الجلسة وإعادة رصيدك كاملاً.'
          : 'You can submit a formal complaint from Complaints tab or session details. Support team will review and refund credits.'
      }
    ]
  };

  const getFilteredFaqs = () => {
    if (selectedCategory === 'all') {
      return Object.values(faqsByCategory).flat();
    }
    return faqsByCategory[selectedCategory] || [];
  };

  const displayedFaqs = getFilteredFaqs();

  const contactMethods = [
    {
      icon: MessageCircle,
      title: t.whatsapp,
      subtitle: '+966555683154',
      color: 'text-green-500',
      bg: 'bg-primary-pale',
      href: 'https://wa.me/966555683154',
    },
    {
      icon: Phone,
      title: t.callUs,
      subtitle: '+966555683154',
      color: 'text-primary',
      bg: 'bg-secondary-pale',
      href: 'tel:+966555683154',
    },
    {
      icon: Mail,
      title: t.emailUs,
      subtitle: 'contact@ewan-geniuses.com',
      color: 'text-orange-500',
      bg: 'bg-orange-50',
      href: 'mailto:contact@ewan-geniuses.com',
    },
  ];

  return (
    <div className="max-w-3xl mx-auto animate-fade-in space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black text-[var(--text-main)] flex items-center gap-2">
          <Headphones className="text-primary" /> {t.technicalSupport}
        </h2>
      </div>

      <div className="flex border-b border-[var(--border)]">
        <button
          onClick={() => setActiveTab('faq')}
          className={`px-6 py-3 text-sm font-bold transition-colors border-b-2 ${
            activeTab === 'faq'
              ? 'text-primary border-primary'
              : 'text-[var(--text-muted)] border-transparent hover:text-navy'
          }`}
        >
          {t.popularQuestions}
        </button>
        <button
          onClick={() => setActiveTab('contact')}
          className={`px-6 py-3 text-sm font-bold transition-colors border-b-2 ${
            activeTab === 'contact'
              ? 'text-primary border-primary'
              : 'text-[var(--text-muted)] border-transparent hover:text-navy'
          }`}
        >
          {t.callCenter}
        </button>
      </div>

      {activeTab === 'faq' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {categories.map((c) => (
              <button
                key={c.key}
                onClick={() => setSelectedCategory(c.key as any)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                  selectedCategory === c.key
                    ? 'bg-primary text-white shadow-sm'
                    : 'bg-white text-[var(--text-muted)] hover:bg-gray-100 border border-[var(--border)]'
                }`}
              >
                {language === 'ar' ? c.labelAr : c.labelEn}
              </button>
            ))}
          </div>

          <div className="space-y-3">
            {displayedFaqs.map((faq, index) => (
              <div
                key={index}
                className="bg-white rounded-2xl border border-[var(--border)] shadow-sm overflow-hidden transition-all"
              >
                <button
                  onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                  className="w-full px-6 py-4 flex items-center justify-between text-start gap-4 hover:bg-gray-50/50"
                >
                  <span className="font-bold text-[var(--text-main)] text-sm">
                    {faq.q}
                  </span>
                  {expandedFaq === index ? (
                    <ChevronUp size={18} className="text-primary shrink-0" />
                  ) : (
                    <ChevronDown size={18} className="text-[var(--text-muted)] shrink-0" />
                  )}
                </button>
                {expandedFaq === index && (
                  <div className="px-6 pb-4 pt-1 border-t border-gray-100 bg-gray-50/40">
                    <p className="text-[var(--text-muted)] text-xs leading-relaxed">
                      {faq.a}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'contact' && (
        <div className="space-y-4 pt-2">
          {contactMethods.map((method, index) => (
            <a
              key={index}
              href={method.href}
              target={method.href.startsWith('http') ? '_blank' : undefined}
              rel={method.href.startsWith('http') ? 'noopener noreferrer' : undefined}
              className="flex items-center gap-4 bg-white p-5 rounded-2xl border border-[var(--border)] shadow-sm hover:shadow-md hover:border-primary/40 transition-all"
            >
              <div className={`h-14 w-14 rounded-2xl ${method.bg} flex items-center justify-center shrink-0`}>
                <method.icon size={26} className={method.color} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-[var(--text-main)]">{method.title}</p>
                <p className="text-[var(--text-muted)] text-sm mt-0.5">{method.subtitle}</p>
              </div>
              <ChevronDown size={16} className={`text-[var(--text-muted)] -rotate-90 shrink-0 ${language === 'ar' ? 'rotate-90' : ''}`} />
            </a>
          ))}
        </div>
      )}
    </div>
  );
};
