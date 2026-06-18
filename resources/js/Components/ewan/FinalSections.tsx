
import React from 'react';
import { useLanguage } from '../../Contexts/LanguageContext';
import { ewanContent } from '../../data/ewanContent';
import { Section } from './Section';
import { motion } from 'framer-motion';
import { BarChart3, Rocket, Heart, TrendingUp, CheckCircle2 } from 'lucide-react';

export const MarketingSection: React.FC = () => {
  const { language } = useLanguage();
  const content = ewanContent.marketing[language as 'ar' | 'en'];

  return (
    <Section className="bg-[#1a1a1a] text-white">
      <div className="container mx-auto">
        <div className="text-center mb-20 space-y-4">
          <h2 className="text-6xl md:text-8xl font-black italic uppercase tracking-tighter text-[#00aeef]">
            {content.title}
          </h2>
          <p className="text-3xl font-bold uppercase">{content.subtitle}</p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-12">
          {content.items.map((item, idx) => (
            <motion.div 
              key={idx}
              whileHover={{ scale: 1.05, backgroundColor: 'rgba(0,174,239,0.1)' }}
              className="p-12 bg-white/5 backdrop-blur-md rounded-[50px] border border-white/10 text-center"
            >
              <span className="text-2xl font-black">{item}</span>
            </motion.div>
          ))}
        </div>

        <div className="mt-20 text-center">
           <div className="bg-[#00d19e] inline-block px-12 py-6 rounded-full font-black text-3xl shadow-2xl animate-pulse">
             {content.cta}
           </div>
        </div>
      </div>
    </Section>
  );
};

export const ImpactSection: React.FC = () => {
  const { language } = useLanguage();
  const content = ewanContent.impact[language as 'ar' | 'en'];

  const stats = ['-40%', '+30%', '100%', '+25%'];

  return (
    <Section className="bg-white">
      <div className="container mx-auto">
        <div className="text-center mb-20 space-y-4">
          <h2 className="text-6xl md:text-8xl font-black text-[#1a1a1a] uppercase">{content.title}</h2>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12">
          {content.items.map((item, idx) => (
            <div key={idx} className="space-y-6 text-center">
               <span className="text-7xl font-black text-[#00aeef]">{stats[idx]}</span>
               <p className="text-2xl font-bold text-gray-500 leading-snug">{item}</p>
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
};

export const ImplementationSection: React.FC = () => {
  const { language } = useLanguage();
  const content = ewanContent.implementation[language as 'ar' | 'en'];

  return (
    <Section className="bg-[#f5f5f5]">
      <div className="container mx-auto">
        <div className="grid lg:grid-cols-2 gap-20 items-center">
          <div className="space-y-12">
            <h2 className="text-5xl md:text-7xl font-black text-[#1a1a1a] leading-tight">
              {content.title}
            </h2>
            <div className="space-y-6">
               {content.items.map((item, idx) => (
                 <div key={idx} className="flex items-center gap-6 p-6 bg-white rounded-3xl shadow-sm">
                    <Rocket className="w-8 h-8 text-[#00d19e]" />
                    <span className="text-2xl font-bold text-gray-700">{item}</span>
                 </div>
               ))}
            </div>
          </div>
          
          <div className="relative">
             <div className="rounded-[60px] overflow-hidden shadow-2xl h-[600px] border-[20px] border-white">
                <img src="https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&q=80" className="w-full h-full object-cover" alt="Implementation" />
             </div>
          </div>
        </div>
      </div>
    </Section>
  );
};

export const WhyUsSection: React.FC = () => {
  const { language } = useLanguage();
  const content = ewanContent.whyUs[language as 'ar' | 'en'];

  return (
    <Section className="bg-white">
      <div className="container mx-auto">
        <h2 className="text-5xl md:text-7xl font-black text-[#1a1a1a] mb-16 text-center">{content.title}</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
           {content.items.map((item, idx) => (
             <div key={idx} className="p-10 bg-gray-50 rounded-[40px] border-b-8 border-[#00aeef] text-center space-y-6 group hover:bg-[#00aeef] transition-all">
                <Heart className="w-12 h-12 mx-auto text-[#00aeef] group-hover:text-white transition-colors" />
                <span className="text-2xl font-black text-gray-800 group-hover:text-white transition-colors">{item}</span>
             </div>
           ))}
        </div>
      </div>
    </Section>
  );
};

export const BusinessModelSection: React.FC = () => {
  const { language } = useLanguage();
  const content = ewanContent.businessModel[language as 'ar' | 'en'];

  return (
    <Section className="bg-[#f5f5f5]">
      <div className="container mx-auto text-center">
        <div className="mb-20 space-y-4">
          <h2 className="text-6xl md:text-8xl font-black text-[#1a1a1a] uppercase">{content.title}</h2>
          <p className="text-2xl font-bold text-gray-500">{content.description}</p>
        </div>

        <div className="grid md:grid-cols-3 gap-12">
           {content.packages.map((pkg, idx) => (
             <motion.div 
               key={idx}
               whileHover={{ y: -20 }}
               className={`p-16 rounded-[60px] shadow-2xl border-2 ${idx === 2 ? 'bg-[#1a1a1a] text-white border-transparent' : 'bg-white border-gray-100'}`}
             >
                <span className="text-3xl font-black uppercase mb-8 block">{pkg}</span>
                <div className="h-2 w-20 mx-auto bg-[#00aeef] mb-12"></div>
                <ul className="space-y-4 mb-12">
                   {[1,2,3].map(i => (
                     <li key={i} className="flex items-center gap-3 opacity-60">
                        <CheckCircle2 className="w-5 h-5" />
                        <span>Feature detail {i}</span>
                     </li>
                   ))}
                </ul>
                <button className={`w-full py-6 rounded-full font-black text-xl uppercase ${idx === 2 ? 'bg-[#00aeef] text-white' : 'bg-gray-100 text-[#1a1a1a]'}`}>
                  Get Started
                </button>
             </motion.div>
           ))}
        </div>
        
        <div className="mt-20">
           <div className="bg-[#00d19e]/10 inline-block px-12 py-6 rounded-full text-[#00d19e] font-black text-3xl">
             {content.cta}
           </div>
        </div>
      </div>
    </Section>
  );
};
