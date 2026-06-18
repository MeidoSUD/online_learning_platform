
import React from 'react';
import { useLanguage } from '../../Contexts/LanguageContext';
import { ewanContent } from '../../data/ewanContent';
import { Section } from './Section';
import { Database, Monitor, Globe, Smartphone, Megaphone } from 'lucide-react';

export const OnePlatformSection: React.FC = () => {
  const { language } = useLanguage();
  const content = ewanContent.platform[language as 'ar' | 'en'];
  const isAr = language === 'ar';

  const icons = [Database, Monitor, Globe, Smartphone, Megaphone];

  return (
    <Section className="bg-[#f1f1f2] relative overflow-hidden">
      <div className="container mx-auto px-12">
        <div className="text-center space-y-12 mb-20">
          <h2 className="text-6xl md:text-8xl font-black text-[#1a1a1a] leading-tight">
            {content.title}
          </h2>
          
          <div className="flex flex-col lg:flex-row gap-8 justify-center items-center">
             <div className="bg-[#e6e7e8] px-12 py-6 rounded-full text-2xl font-bold text-[#414042] shadow-sm">
                We don't offer software. We deliver a complete ecosystem.
             </div>
             <div className="bg-[#e6e7e8] px-12 py-6 rounded-full text-2xl font-bold text-[#414042] shadow-sm">
                نحن لا نقدم مجرد برنامج. نحن نقدم منظومة متكاملة.
             </div>
          </div>
        </div>

        <div className="relative flex justify-center mb-24">
           <div className="w-[600px] h-[600px] rounded-full border-[30px] border-[#00d19e] p-4 relative z-10 overflow-hidden shadow-2xl">
              <div className="w-full h-full rounded-full border-[10px] border-[#00aeef] p-4">
                 <img 
                   src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&q=80" 
                   alt="One Platform" 
                   className="w-full h-full rounded-full object-cover"
                 />
              </div>
           </div>
           
           {/* Decorative Background Book Logo */}
           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-auto opacity-[0.03] -z-0">
              <svg viewBox="0 0 100 60" className="w-full h-auto text-[#00aeef]">
                 <path d="M50 10 C30 10 10 20 10 30 C10 40 30 50 50 50 C70 50 90 40 90 30 C90 20 70 10 50 10 Z" fill="none" stroke="currentColor" strokeWidth="1" />
              </svg>
           </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
           {content.items.map((item, idx) => {
             const Icon = icons[idx];
             return (
               <div key={idx} className="flex flex-col items-center gap-6">
                 <div className="w-32 h-32 rounded-full bg-[#e6e7e8] flex items-center justify-center text-[#00aeef] shadow-inner hover:scale-110 transition-transform cursor-pointer">
                    <Icon className="w-16 h-16" />
                 </div>
                 <span className="text-3xl font-black text-[#1a1a1a]">{item}</span>
               </div>
             );
           })}
        </div>
      </div>
    </Section>
  );
};
