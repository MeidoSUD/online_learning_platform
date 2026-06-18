
import React from 'react';
import { useLanguage } from '../../Contexts/LanguageContext';
import { ewanContent } from '../../data/ewanContent';
import { Section } from './Section';
import { Globe2, Mail, Phone, MapPin } from 'lucide-react';

export const CTASection: React.FC = () => {
  const { language } = useLanguage();
  const content = ewanContent.finalCTA[language as 'ar' | 'en'];

  return (
    <Section className="bg-[#00aeef] text-white">
      <div className="container mx-auto text-center py-20 space-y-12">
        <h2 className="text-6xl md:text-8xl lg:text-9xl font-black italic uppercase leading-none tracking-tighter">
          {content.title}
        </h2>
        <div className="flex flex-col md:flex-row items-center justify-center gap-10">
           <button className="bg-white text-[#00aeef] px-16 py-8 rounded-full font-black text-3xl shadow-2xl hover:scale-105 transition-transform">
             {content.cta}
           </button>
           <div className="flex items-center gap-4 text-3xl font-black">
              <Globe2 className="w-10 h-10" />
              <span>{content.domain}</span>
           </div>
        </div>
      </div>
    </Section>
  );
};

export const Footer: React.FC = () => {
  const { language } = useLanguage();
  const isAr = language === 'ar';

  return (
    <footer className="py-20 bg-white border-t border-gray-100">
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-10 mb-20">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-[#1a1a1a] rounded-2xl flex items-center justify-center text-white font-black text-3xl shadow-xl">E</div>
            <span className="text-3xl font-black text-[#1a1a1a] tracking-tight uppercase">Ewan Geniuses</span>
          </div>
          
          <div className="flex gap-10">
             <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400 hover:text-[#00aeef] transition-colors cursor-pointer">
                <Mail className="w-8 h-8" />
             </div>
             <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400 hover:text-[#00d19e] transition-colors cursor-pointer">
                <Phone className="w-8 h-8" />
             </div>
             <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400 hover:text-[#00aeef] transition-colors cursor-pointer">
                <MapPin className="w-8 h-8" />
             </div>
          </div>
        </div>
        
        <div className="flex flex-col md:flex-row justify-between items-center text-gray-400 font-bold text-lg">
           <p>© {new Date().getFullYear()} EWAN GENIUSES. ALL RIGHTS RESERVED.</p>
           <div className="flex gap-10 mt-6 md:mt-0 uppercase tracking-widest text-sm">
              <span className="hover:text-[#00aeef] cursor-pointer">Privacy Policy</span>
              <span className="hover:text-[#00d19e] cursor-pointer">Terms of Service</span>
           </div>
        </div>
      </div>
    </footer>
  );
};
