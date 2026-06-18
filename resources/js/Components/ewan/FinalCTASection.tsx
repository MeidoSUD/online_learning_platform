
import React from 'react';
import { useLanguage } from '../../Contexts/LanguageContext';
import { ewanContent } from '../../data/ewanContent';
import { Section } from './Section';
import { ArrowRight, Globe } from 'lucide-react';

export const FinalCTASection: React.FC = () => {
  const { language } = useLanguage();
  const content = ewanContent.finalCTA[language as 'ar' | 'en'];
  const isAr = language === 'ar';

  return (
    <Section className="bg-[#f1f1f2] relative min-h-[600px] flex items-center justify-center">
      <div className="container mx-auto px-12 text-center">
        <div className="space-y-16">
          <h2 className="text-6xl md:text-8xl font-black text-[#1a1a1a] leading-tight uppercase">
            {content.title}
          </h2>

          <div className="flex flex-col items-center gap-12">
            <button className="bg-[#00aeef] text-white px-20 py-10 rounded-full text-4xl font-black shadow-2xl hover:scale-105 transition-transform flex items-center gap-6">
              {content.cta}
              <ArrowRight className={`w-12 h-12 ${isAr ? 'rotate-180' : ''}`} />
            </button>

            <div className="flex items-center gap-6 text-[#414042] text-3xl font-black">
               <div className="w-16 h-16 bg-[#00d19e] rounded-full flex items-center justify-center text-white">
                 <Globe className="w-10 h-10" />
               </div>
               <span>{content.domain}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Decorative Triangles */}
      <div 
        className="absolute bottom-0 right-0 w-96 h-96 bg-[#00d19e]"
        style={{ clipPath: 'polygon(100% 0, 0 100%, 100% 100%)' }}
      ></div>
      <div 
        className="absolute top-0 left-0 w-64 h-64 bg-[#00aeef] opacity-50"
        style={{ clipPath: 'polygon(0 0, 100% 0, 0 100%)' }}
      ></div>
    </Section>
  );
};
