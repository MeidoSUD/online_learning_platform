
import React from 'react';
import { useLanguage } from '../../Contexts/LanguageContext';
import { ewanContent } from '../../data/ewanContent';
import { Section } from './Section';
import { Users, PieChart, GraduationCap, MessageSquare, CheckCircle2, Globe } from 'lucide-react';
import { motion } from 'framer-motion';

const ModuleDetail: React.FC<{ 
  title: string; 
  items: string[]; 
  cta: string; 
  icon: any; 
  color: string; 
  isReversed?: boolean;
  image: string;
}> = ({ title, items, cta, icon: Icon, color, isReversed, image }) => {
  const { language } = useLanguage();
  const isAr = language === 'ar';

  return (
    <Section className="bg-[#f1f1f2]">
      <div className="container mx-auto px-12">
        <div className={`flex flex-col lg:flex-row gap-16 items-center ${isReversed ? 'lg:flex-row-reverse' : ''}`}>
          <div className="flex-1 space-y-10 w-full">
            <div className="flex items-center gap-6">
              <div 
                className="inline-flex items-center gap-6 px-12 py-6 rounded-full text-white font-black text-3xl shadow-2xl"
                style={{ background: `linear-gradient(to right, #00aeef, #00d19e)` }}
              >
                {title}
                <div className="flex gap-2">
                  <div className="w-4 h-4 rounded-full border-2 border-white"></div>
                  <div className="w-4 h-4 rounded-full border-2 border-white"></div>
                </div>
              </div>
            </div>
            
            <ul className="space-y-6">
              {items.map((item, idx) => (
                <li key={idx} className={`flex items-center gap-6 ${isAr ? 'flex-row-reverse' : ''}`}>
                  <div className="w-3 h-3 rounded-full bg-[#1a1a1a]"></div>
                  <div className="flex-1 bg-[#e6e7e8] px-10 py-5 rounded-full text-2xl font-bold text-[#414042] shadow-sm">
                    {item}
                  </div>
                </li>
              ))}
            </ul>

            <div className="bg-[#414042] text-white px-12 py-8 rounded-[40px] text-center shadow-xl">
               <p className="text-3xl font-black">{cta}</p>
            </div>
          </div>

          <div className="flex-1 relative w-full flex justify-center">
             <div className="relative w-[500px] h-[500px] bg-white rounded-[60px] shadow-2xl overflow-hidden p-12 flex items-center justify-center">
                {/* Mockup of the Chart / Image */}
                <div className="w-full h-full relative">
                   <img src={image} className="w-full h-full object-cover rounded-[40px] opacity-20 absolute inset-0" alt="" />
                   <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-72 h-72 rounded-full border-[40px] border-[#00aeef] border-t-[#00d19e] border-r-[#00d19e] flex items-center justify-center shadow-inner relative">
                         <div className="text-3xl font-black text-[#414042]">85%</div>
                         {/* Small indicator dots/labels could go here */}
                      </div>
                   </div>
                </div>
             </div>
             
             {/* Diagonal Decorative Triangle at bottom right of the whole section */}
             <div 
               className="absolute -bottom-20 -right-20 w-64 h-64 bg-[#00d19e] z-0 opacity-80"
               style={{ clipPath: 'polygon(100% 0, 0 100%, 100% 100%)' }}
             ></div>
          </div>
        </div>
      </div>
    </Section>
  );
};

export const ModulesLayout: React.FC = () => {
  const { language } = useLanguage();
  const content = ewanContent;

  return (
    <>
      <Section className="bg-[#f5f5f5]">
        <div className="container mx-auto text-center">
          <h2 className="text-6xl md:text-8xl font-black text-[#1a1a1a] mb-12 uppercase">{content.modules[language as 'ar' | 'en'].title}</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
             {content.modules[language as 'ar' | 'en'].items.map((m, i) => (
               <div key={i} className="bg-white p-10 rounded-[40px] shadow-lg border border-gray-100">
                  <h3 className="text-3xl font-black text-[#00aeef]">{m.title}</h3>
                  <span className="text-xl font-bold text-gray-400 uppercase tracking-widest">{m.subtitle}</span>
               </div>
             ))}
          </div>
        </div>
      </Section>

      <ModuleDetail 
        title={content.administration[language as 'ar' | 'en'].title}
        items={content.administration[language as 'ar' | 'en'].items}
        cta={content.administration[language as 'ar' | 'en'].cta}
        icon={Users}
        color="#00aeef"
        image="https://images.unsplash.com/photo-1454165833767-027ffea9e778?auto=format&fit=crop&q=80"
      />

      <ModuleDetail 
        title={content.finance[language as 'ar' | 'en'].title}
        items={content.finance[language as 'ar' | 'en'].items}
        cta={content.finance[language as 'ar' | 'en'].cta}
        icon={PieChart}
        color="#00d19e"
        isReversed
        image="https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&q=80"
      />

      <ModuleDetail 
        title={content.academics[language as 'ar' | 'en'].title}
        items={content.academics[language as 'ar' | 'en'].items}
        cta={content.academics[language as 'ar' | 'en'].cta}
        icon={GraduationCap}
        color="#414042"
        image="https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&q=80"
      />

      <ModuleDetail 
        title={content.communication[language as 'ar' | 'en'].title}
        items={content.communication[language as 'ar' | 'en'].items}
        cta={content.communication[language as 'ar' | 'en'].cta}
        icon={MessageSquare}
        color="#00aeef"
        isReversed
        image="https://images.unsplash.com/photo-1521791136064-7986c2959213?auto=format&fit=crop&q=80"
      />

      <ModuleDetail 
        title={content.marketing[language as 'ar' | 'en'].title}
        items={content.marketing[language as 'ar' | 'en'].items}
        cta={content.marketing[language as 'ar' | 'en'].cta}
        icon={Globe}
        color="#00d19e"
        image="https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80"
      />
    </>
  );
};
