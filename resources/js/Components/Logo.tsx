import React from 'react';
import { Hexagon } from 'lucide-react';

export const Logo = ({ className = '' }: { className?: string }) => {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="relative flex h-10 w-10 items-center justify-center">
        <img src="/assets/logo.png" alt="Ewan" className="absolute inset-0 h-full w-full object-contain" />
      </div>
      <div className="flex flex-col">
        <span className="text-xl font-black tracking-tight text-slate-900 leading-none font-cairo">Ewan</span>
        <span className="text-[10px] font-semibold text-primary tracking-[0.15em] uppercase leading-tight">For IT & Education</span>
      </div>
    </div>
  );
};
