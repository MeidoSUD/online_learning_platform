// @ts-nocheck
import React from 'react';

export const Logo = ({ className = '' }) => {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="relative flex h-10 w-10 items-center justify-center">
        <img src="/logo.png" alt="Ewan logo" className="h-10 w-10 rounded-xl object-cover" />
      </div>
      <div className="flex flex-col">
        <span className="text-xl font-black tracking-tight text-slate-900 leading-none font-cairo">Ewan</span>
        <span className="text-[10px] font-semibold text-primary tracking-[0.15em] uppercase leading-tight">For IT & Education</span>
      </div>
    </div>
  );
};
