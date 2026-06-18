
import React from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '../../Contexts/LanguageContext';

interface SectionProps {
  children: React.ReactNode;
  className?: string;
  id?: string;
  delay?: number;
}

import { Globe, ArrowRight } from 'lucide-react';

export const Section: React.FC<SectionProps> = ({ children, className = "", id, delay = 0 }) => {
  const { language } = useLanguage();
  const isAr = language === 'ar';

  return (
    <motion.section
      id={id}
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 1, delay }}
      className={`relative min-h-screen py-24 px-12 overflow-hidden flex flex-col justify-center ${className}`}
    >
      {/* Top Left Logo (Slide Constant) */}
      <div className="absolute top-12 left-12 z-20 opacity-40">
        <svg viewBox="0 0 100 60" className="w-20 h-auto text-[#00aeef]">
           <path d="M50 10 C30 10 10 20 10 30 C10 40 30 50 50 50 C70 50 90 40 90 30 C90 20 70 10 50 10 Z" fill="none" stroke="currentColor" strokeWidth="2" />
           <path d="M10 30 L90 30 M50 10 L50 50" fill="none" stroke="currentColor" strokeWidth="2" />
        </svg>
      </div>

      {/* Watermark Logo (Slide Constant) */}
      <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none select-none -z-0">
        <svg viewBox="0 0 200 120" className="w-[70%] h-auto">
          <path d="M100 20 C60 20 20 40 20 60 C20 80 60 100 100 100 C140 100 180 80 180 60 C180 40 140 20 100 20 Z" fill="none" stroke="currentColor" strokeWidth="1" />
          <path d="M20 60 L180 60 M100 20 L100 100" fill="none" stroke="currentColor" strokeWidth="1" />
        </svg>
      </div>

      <div className="relative z-10 w-full">
        {children}
      </div>

      {/* Bottom Footer Bar (Slide Constant) */}
      <div className="absolute bottom-0 left-0 w-full h-16 bg-[#414042]/10 z-20 flex items-center px-12 justify-between border-t border-gray-200">
        <div className="flex items-center gap-4 text-[#414042] text-xl font-bold">
          <div className="w-8 h-8 bg-[#00aeef] rounded-full flex items-center justify-center text-white">
            <Globe className="w-5 h-5" />
          </div>
          <span>ewan-geniuses.com</span>
        </div>
        <div className="w-10 h-10 border border-[#414042] rounded-full flex items-center justify-center text-[#414042]">
          <ArrowRight className={`w-5 h-5 ${isAr ? 'rotate-180' : ''}`} />
        </div>
      </div>
    </motion.section>
  );
};
