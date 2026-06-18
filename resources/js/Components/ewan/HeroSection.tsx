
import React from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '../../Contexts/LanguageContext';
import { ewanContent } from '../../data/ewanContent';
import { ewanTheme } from '../../theme/ewanTheme';
import { ArrowRight, Globe } from 'lucide-react';

export const HeroSection: React.FC = () => {
  const { language } = useLanguage();
  const content = ewanContent.hero[language as 'ar' | 'en'];
  const isAr = language === 'ar';

  return (
    <section className="relative h-screen min-h-[800px] flex items-center overflow-hidden bg-[#f1f1f2]">
      {/* Diagonal Design Elements (Right Side) */}
      <div className="absolute top-0 right-0 w-[60%] h-full z-0 hidden lg:block">
        {/* Large Image Slice */}
        <div 
          className="absolute top-0 right-[20%] w-[50%] h-full bg-white z-10 shadow-2xl"
          style={{ clipPath: 'polygon(25% 0, 100% 0, 75% 100%, 0% 100%)' }}
        >
          <img src="https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&q=80" className="w-full h-full object-cover opacity-90" alt="Student" />
        </div>

        {/* Small Image Slice (Far Right) */}
        <div 
          className="absolute top-0 right-0 w-[25%] h-full bg-white z-10 shadow-xl"
          style={{ clipPath: 'polygon(25% 0, 100% 0, 75% 100%, 0% 100%)' }}
        >
          <img src="https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80" className="w-full h-full object-cover" alt="Technology" />
        </div>

        {/* Cyan Triangle (Top) */}
        <div 
          className="absolute top-0 right-[60%] w-[30%] h-[35%] bg-[#00aeef] z-0"
          style={{ clipPath: 'polygon(25% 0, 100% 0, 75% 100%, 0% 100%)' }}
        ></div>

        {/* Green Triangle (Bottom) */}
        <div 
          className="absolute bottom-0 right-[55%] w-[25%] h-[30%] bg-[#00d19e] z-0"
          style={{ clipPath: 'polygon(25% 0, 100% 0, 75% 100%, 0% 100%)' }}
        ></div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-12 relative z-10">
        <div className={`max-w-2xl ${isAr ? 'mr-auto text-right' : 'ml-0 text-left'}`}>
          <div className="space-y-4 mb-20">
            <h1 className="text-7xl md:text-8xl font-black text-[#1a1a1a] tracking-[0.2em] leading-tight uppercase">
              {content.title}
            </h1>
            <h2 className="text-5xl md:text-6xl font-bold text-[#414042]">
              {isAr ? 'ايوان التعلم' : 'Ewan Learning'}
            </h2>
          </div>

          <div className="relative inline-block">
            <div className="bg-[#00d19e] text-white px-16 py-8 rounded-full text-3xl md:text-4xl font-bold shadow-2xl transform transition-transform hover:scale-105">
              {content.subtitle}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

