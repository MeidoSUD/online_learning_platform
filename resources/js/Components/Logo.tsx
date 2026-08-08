// @ts-nocheck
import React from 'react';

export const Logo = ({ className = '', onDark = false }) => {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="relative flex h-10 w-10 items-center justify-center">
        <img src="/logo.png" alt="Ewan logo" className="h-10 w-10 rounded-xl object-cover" />
      </div>
      <div className="flex flex-col">
        <span className={`text-xl font-black tracking-tight leading-none font-cairo ${onDark ? 'text-white' : 'text-navy'}`}>Ewan</span>
        <span className={`text-[10px] font-semibold tracking-[0.15em] uppercase leading-tight ${onDark ? 'text-green-light' : 'text-primary'}`}>For IT & Education</span>
      </div>
    </div>
  );
};
