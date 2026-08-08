import React, { useState } from 'react';
import { useLanguage } from '../../Contexts/LanguageContext';
import { MessageCircle, Phone, Mail, ChevronDown, ChevronUp, Headphones } from 'lucide-react';

export const SupportTab: React.FC = () => {
  const { t, language } = useLanguage();
  const [activeTab, setActiveTab] = useState<'faq' | 'contact'>('faq');
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const faqs = [
    { q: t.faq1_q, a: t.faq1_a },
    { q: t.faq2_q, a: t.faq2_a },
    { q: t.faq3_q, a: t.faq3_a },
  ];

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
    <div className="max-w-3xl mx-auto animate-fade-in">
      <h2 className="text-2xl font-bold text-[var(--text-main)] flex items-center gap-2 mb-6">
        <Headphones className="text-primary" /> {t.technicalSupport}
      </h2>

      {/* Tabs */}
      <div className="flex border-b border-[var(--border)] mb-6">
        <button
          onClick={() => setActiveTab('faq')}
          className={`px-6 py-3 text-sm font-medium transition-colors border-b-2 ${
            activeTab === 'faq'
              ? 'text-primary border-primary'
              : 'text-[var(--text-muted)] border-transparent hover:text-navy'
          }`}
        >
          {t.popularQuestions}
        </button>
        <button
          onClick={() => setActiveTab('contact')}
          className={`px-6 py-3 text-sm font-medium transition-colors border-b-2 ${
            activeTab === 'contact'
              ? 'text-primary border-primary'
              : 'text-[var(--text-muted)] border-transparent hover:text-navy'
          }`}
        >
          {t.callCenter}
        </button>
      </div>

      {/* FAQ Tab */}
      {activeTab === 'faq' && (
        <div className="space-y-3">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="bg-white rounded-[var(--radius-md)] border border-[var(--border)] shadow-[var(--shadow-sm)] overflow-hidden"
            >
              <button
                onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                className="w-full px-6 py-4 flex items-center justify-between text-start"
              >
                <span className="font-bold text-[var(--text-main)] text-sm">
                  {faq.q}
                </span>
                {expandedFaq === index ? (
                  <ChevronUp size={18} className="text-[var(--text-muted)] shrink-0" />
                ) : (
                  <ChevronDown size={18} className="text-[var(--text-muted)] shrink-0" />
                )}
              </button>
              {expandedFaq === index && (
                <div className="px-6 pb-4">
                  <p className="text-[var(--text-muted)] text-sm leading-relaxed">
                    {faq.a}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Contact Tab */}
      {activeTab === 'contact' && (
        <div className="space-y-4 pt-4">
          {contactMethods.map((method, index) => (
            <a
              key={index}
              href={method.href}
              target={method.href.startsWith('http') ? '_blank' : undefined}
              rel={method.href.startsWith('http') ? 'noopener noreferrer' : undefined}
              className="flex items-center gap-4 bg-white p-5 rounded-[var(--radius-md)] border border-[var(--border)] shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)] transition-shadow"
            >
              <div className={`h-14 w-14 rounded-[var(--radius-md)] ${method.bg} flex items-center justify-center shrink-0`}>
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
