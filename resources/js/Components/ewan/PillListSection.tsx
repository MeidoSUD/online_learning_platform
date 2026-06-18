
import React from 'react';
import { useLanguage } from '../../Contexts/LanguageContext';
import { Section } from './Section';

interface PillListSectionProps {
  title: string;
  subtitle?: string;
  mainText?: string;
  items: string[];
  pillColor?: string;
  isArMain?: boolean;
}

export const PillListSection: React.FC<PillListSectionProps> = ({ 
  title, subtitle, mainText, items, pillColor = '#00d19e', isArMain 
}) => {
  const { language } = useLanguage();
  const isAr = language === 'ar';

  return (
    <Section className="bg-[#f1f1f2]">
      <div className="container mx-auto px-12">
        <div className="space-y-16">
          <div className="flex flex-col gap-6">
            {subtitle && (
              <span className="text-3xl font-black text-[#00aeef] uppercase tracking-widest">
                {subtitle}
              </span>
            )}
            <div 
              className="inline-block px-12 py-6 rounded-full text-white text-4xl md:text-5xl font-black shadow-2xl self-start"
              style={{ background: `linear-gradient(to right, #00aeef, ${pillColor})` }}
            >
              {title}
            </div>
          </div>

          {mainText && (
            <div className="bg-[#e6e7e8] px-12 py-8 rounded-[40px] text-3xl font-bold text-[#414042] border-l-[12px]" style={{ borderColor: pillColor }}>
               {mainText}
            </div>
          )}

          <ul className="space-y-6">
            {items.map((item, idx) => (
              <li key={idx} className={`flex items-center gap-6 ${isAr ? 'flex-row-reverse' : ''}`}>
                <div className="w-4 h-4 rounded-full bg-[#1a1a1a]"></div>
                <div className="flex-1 bg-[#e6e7e8] px-10 py-5 rounded-full text-2xl font-bold text-[#414042] shadow-sm">
                  {item}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Section>
  );
};
