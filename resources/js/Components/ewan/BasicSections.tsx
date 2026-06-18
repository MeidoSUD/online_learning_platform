
import React from 'react';
import { useLanguage } from '../../Contexts/LanguageContext';
import { ewanContent } from '../../data/ewanContent';
import { Section } from './Section';
import { BookOpen, Monitor, Layout, Smartphone, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

export const OfferSection: React.FC = () => {
  const { language } = useLanguage();
  const content = ewanContent.offers[language as 'ar' | 'en'];
  
  const icons = [BookOpen, Monitor, Layout, Smartphone];

  return (
    <Section className="bg-[#f5f5f5]">
      <div className="container mx-auto text-center">
        <div className="mb-20 space-y-4">
          <span className="text-[#00aeef] font-black uppercase tracking-widest text-xl">{content.subtitle}</span>
          <h2 className="text-5xl md:text-7xl font-black text-[#1a1a1a]">{content.title}</h2>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {content.items.map((item, idx) => {
            const Icon = icons[idx % icons.length];
            return (
              <motion.div 
                key={idx}
                whileHover={{ scale: 1.05 }}
                className="bg-white p-12 rounded-[50px] shadow-xl hover:shadow-2xl transition-all border border-gray-100 group"
              >
                <div className="w-20 h-20 bg-gray-50 rounded-3xl flex items-center justify-center mb-8 mx-auto group-hover:bg-[#00aeef] group-hover:text-white transition-colors">
                  <Icon className="w-10 h-10" />
                </div>
                <h3 className="text-2xl font-black text-gray-800">{item}</h3>
              </motion.div>
            );
          })}
        </div>
      </div>
    </Section>
  );
};

export const EcosystemSection: React.FC = () => {
  const { language } = useLanguage();
  const content = ewanContent.ecosystem[language as 'ar' | 'en'];

  return (
    <Section className="bg-white relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[40%] h-full bg-[#00aeef]/5 -skew-x-12"></div>
      <div className="container mx-auto">
        <div className="grid lg:grid-cols-2 gap-20 items-center">
          <div className="space-y-12">
            <div className="space-y-4">
               <div className="w-24 h-2 bg-[#00d19e] mb-8"></div>
               <h2 className="text-6xl md:text-8xl font-black text-[#1a1a1a] leading-none uppercase tracking-tighter">
                 {content.title}
               </h2>
               <p className="text-3xl font-bold text-[#00aeef] uppercase">{content.brand}</p>
            </div>
            
            <div className="bg-[#00d19e] inline-flex items-center rounded-full px-12 py-6 text-white font-black text-2xl md:text-3xl shadow-2xl">
              {content.subtitle}
            </div>
          </div>
          
          <div className="relative">
            <div className="grid grid-cols-2 gap-6 p-4">
               <div className="space-y-6">
                 <div className="h-64 rounded-[40px] bg-gray-200 overflow-hidden transform skew-y-3 shadow-xl border-4 border-white">
                    <img src="https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&q=80" className="w-full h-full object-cover" alt="System" />
                 </div>
                 <div className="h-48 rounded-[40px] bg-[#00aeef] p-10 text-white flex flex-col justify-end shadow-xl">
                    <Layout className="w-12 h-12 mb-4" />
                    <span className="font-black text-2xl uppercase">ERP System</span>
                 </div>
               </div>
               <div className="space-y-6 pt-12">
                 <div className="h-48 rounded-[40px] bg-[#00d19e] p-10 text-white flex flex-col justify-end shadow-xl">
                    <Monitor className="w-12 h-12 mb-4" />
                    <span className="font-black text-2xl uppercase">Digital Lab</span>
                 </div>
                 <div className="h-64 rounded-[40px] bg-gray-200 overflow-hidden transform -skew-y-3 shadow-xl border-4 border-white">
                    <img src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&q=80" className="w-full h-full object-cover" alt="Kids" />
                 </div>
               </div>
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
};

export const ChallengeSection: React.FC = () => {
  const { language } = useLanguage();
  const content = ewanContent.challenge[language as 'ar' | 'en'];

  return (
    <Section className="bg-[#1a1a1a] text-white">
      <div className="container mx-auto">
        <div className="grid lg:grid-cols-2 gap-20 items-center">
          <div className="space-y-12">
            <div className="space-y-4">
              <span className="text-[#00aeef] font-black uppercase tracking-widest text-xl">{content.subtitle}</span>
              <h2 className="text-5xl md:text-7xl font-black leading-tight">
                {content.title}
              </h2>
            </div>
            
            <p className="text-3xl md:text-4xl font-bold text-[#00d19e] leading-tight italic">
              {content.mainText}
            </p>
          </div>

          <div className="grid gap-6">
            {content.items.map((item, idx) => (
              <motion.div 
                key={idx}
                whileHover={{ x: 10, backgroundColor: 'rgba(255,255,255,0.1)' }}
                className="p-8 bg-white/5 backdrop-blur-md rounded-3xl border border-white/10 flex items-center gap-6 transition-all"
              >
                <div className="w-12 h-12 bg-[#00aeef]/20 rounded-xl flex items-center justify-center text-[#00aeef]">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <span className="text-2xl font-bold">{item}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </Section>
  );
};
