
import React from 'react';
import { useLanguage } from '../../Contexts/LanguageContext';
import { ewanContent } from '../../data/ewanContent';
import { Section } from './Section';
import { Layout, BookOpen, Globe, Smartphone, Users, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

export const PlatformSection: React.FC = () => {
  const { language } = useLanguage();
  const content = ewanContent.platform[language as 'ar' | 'en'];
  const isAr = language === 'ar';

  const icons = [Layout, BookOpen, Smartphone, Globe, Users];

  return (
    <Section className="bg-[#f8f9fa]">
      <div className="container mx-auto text-center">
        <div className="mb-20 space-y-6">
          <h2 className="text-5xl md:text-7xl font-black text-[#1a1a1a] leading-tight">
            {content.title}
          </h2>
          <p className="text-3xl font-bold text-[#00aeef]">{content.description}</p>
        </div>

        <div className="flex flex-wrap justify-center gap-12 pt-10">
          {content.items.map((item, idx) => {
            const Icon = icons[idx % icons.length];
            return (
              <motion.div 
                key={idx}
                whileHover={{ y: -15, scale: 1.1 }}
                className="flex flex-col items-center space-y-4 group"
              >
                <div className="w-32 h-32 bg-white rounded-full flex items-center justify-center shadow-xl group-hover:bg-[#00aeef] group-hover:text-white transition-all">
                  <Icon className="w-16 h-16" />
                </div>
                <span className="font-black text-2xl text-gray-700">{item}</span>
              </motion.div>
            );
          })}
        </div>
      </div>
    </Section>
  );
};

export const MobileAppSection: React.FC = () => {
  const { language } = useLanguage();
  const content = ewanContent.mobileApp[language as 'ar' | 'en'];
  const isAr = language === 'ar';

  return (
    <Section className="bg-white overflow-hidden">
      <div className="container mx-auto">
        <div className="grid lg:grid-cols-2 gap-20 items-center">
          <div className="space-y-12">
            <div className="space-y-4">
              <span className="text-[#00d19e] font-black uppercase tracking-widest text-xl">{content.subtitle}</span>
              <h2 className="text-5xl md:text-7xl font-black text-[#1a1a1a] leading-tight">
                {content.title}
              </h2>
            </div>
            
            <p className="text-3xl font-bold text-gray-500">{content.description}</p>

            <div className="grid grid-cols-2 gap-8">
              {content.features.map((feature, idx) => (
                <div key={idx} className="flex items-center gap-4 text-2xl font-black text-gray-800">
                  <div className="w-4 h-4 rounded-full bg-[#00d19e]"></div>
                  {feature}
                </div>
              ))}
            </div>

            <div className="pt-10">
               <div className="bg-[#414042] inline-block px-12 py-5 rounded-full text-white text-2xl font-black shadow-xl">
                 {content.footerText}
               </div>
            </div>
          </div>

          <div className="relative">
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-[#00d19e]/5 rounded-full -z-10"></div>
             <motion.div 
               initial={{ rotate: -10, y: 50 }}
               whileInView={{ rotate: 0, y: 0 }}
               viewport={{ once: true }}
               transition={{ duration: 1 }}
               className="max-w-[400px] mx-auto bg-[#1a1a1a] rounded-[60px] p-4 shadow-2xl border-[12px] border-[#414042]"
             >
                <div className="h-[700px] rounded-[50px] overflow-hidden bg-white">
                   <img src="https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fit=crop&q=80" className="w-full h-full object-cover" alt="Mobile App" />
                </div>
             </motion.div>
          </div>
        </div>
      </div>
    </Section>
  );
};
