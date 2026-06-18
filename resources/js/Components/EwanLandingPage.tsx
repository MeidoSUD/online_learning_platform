import React from 'react';
import { useLanguage } from '../Contexts/LanguageContext';
import { ewanContent } from '../data/ewanContent';
import { HeroSection } from '../Components/ewan/HeroSection';
import { AboutSection } from '../Components/ewan/AboutSection';
import { OnePlatformSection } from '../Components/ewan/OnePlatformSection';
import { ModulesLayout } from '../Components/ewan/ModulesLayout';
import { PillListSection } from '../Components/ewan/PillListSection';
import { FinalCTASection } from '../Components/ewan/FinalCTASection';
import { motion, useScroll, useSpring } from 'framer-motion';

export const EwanLandingPage: React.FC = () => {
  const { language } = useLanguage();
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  const content = ewanContent;
  const lang = language as 'ar' | 'en';

  return (
    <div className="bg-[#f1f1f2] min-h-screen">
      {/* Progress Bar */}
      <motion.div 
        className="fixed top-0 left-0 right-0 h-2 bg-[#00aeef] z-[100] origin-left"
        style={{ scaleX }}
      />

      {/* Slide 1 & 4: Hero */}
      <HeroSection />

      {/* Slide 2 & 3: About */}
      <AboutSection />

      {/* Slide 5: The Challenge */}
      <PillListSection 
        title={content.challenge[lang].title}
        subtitle={content.challenge[lang].subtitle}
        mainText={content.challenge[lang].mainText}
        items={content.challenge[lang].items}
      />

      {/* Slide 6: Vision 2030 */}
      <PillListSection 
        title={content.vision2030[lang].title}
        items={content.vision2030[lang].items}
        pillColor="#00aeef"
      />

      {/* Slide 7: One Platform */}
      <OnePlatformSection />

      {/* Slides 8-14: System Modules */}
      <ModulesLayout />

      {/* Slide 16: The Impact */}
      <PillListSection 
        title={content.impact[lang].title}
        items={content.impact[lang].items}
      />

      {/* Slide 17: Implementation */}
      <PillListSection 
        title={content.implementation[lang].title}
        items={content.implementation[lang].items}
        pillColor="#00aeef"
      />

      {/* Slide 18: Business Model */}
      <PillListSection 
        title={content.businessModel[lang].title}
        mainText={content.businessModel[lang].description}
        items={content.businessModel[lang].packages}
      />

      {/* Slide 19: Final CTA */}
      <FinalCTASection />
    </div>
  );
};

export default EwanLandingPage;
