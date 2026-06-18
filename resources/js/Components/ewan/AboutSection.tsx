
import React from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '../../Contexts/LanguageContext';
import { ewanContent } from '../../data/ewanContent';
import { Section } from './Section';
import { Eye, Target } from 'lucide-react';

export const AboutSection: React.FC = () => {
  const { language } = useLanguage();
  const content = ewanContent.about[language as 'ar' | 'en'];

  return (
    <Section className="bg-white">
      <div className="container mx-auto">
        <div className="grid lg:grid-cols-2 gap-20 items-center">
          <div className="space-y-12">
            <div className="space-y-4">
              <span className="text-[#00aeef] font-black uppercase tracking-widest text-xl">{content.subtitle}</span>
              <h2 className="text-5xl md:text-7xl font-black text-[#1a1a1a] leading-tight">
                {content.title}
              </h2>
            </div>
            
            <p className="text-2xl md:text-3xl text-gray-500 leading-relaxed font-medium">
              {content.content}
            </p>

            <div className="grid md:grid-cols-2 gap-8 pt-8">
              <motion.div 
                whileHover={{ y: -10 }}
                className="p-8 bg-gray-50 rounded-[40px] border-l-8 border-[#00aeef] space-y-4"
              >
                <div className="w-14 h-14 bg-[#00aeef] rounded-2xl flex items-center justify-center text-white">
                  <Eye className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-black">{content.vision.title}</h3>
                <p className="text-lg text-gray-600 font-bold">{content.vision.content}</p>
              </motion.div>

              <motion.div 
                whileHover={{ y: -10 }}
                className="p-8 bg-gray-50 rounded-[40px] border-l-8 border-[#00d19e] space-y-4"
              >
                <div className="w-14 h-14 bg-[#00d19e] rounded-2xl flex items-center justify-center text-white">
                  <Target className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-black">{content.mission.title}</h3>
                <p className="text-lg text-gray-600 font-bold">{content.mission.content}</p>
              </motion.div>
            </div>
          </div>

          <div className="relative hidden lg:block">
            <div className="w-[500px] h-[500px] rounded-full border-[20px] border-[#00d19e] p-5 mx-auto relative z-10 overflow-hidden">
               <img 
                 src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&q=80" 
                 alt="About Ewan" 
                 className="w-full h-full rounded-full object-cover"
               />
            </div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#00aeef]/5 rounded-full -z-0"></div>
          </div>
        </div>
      </div>
    </Section>
  );
};
