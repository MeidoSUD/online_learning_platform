import React from 'react';

export const Logo = ({ className = '' }: { className?: string }) => {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="relative flex h-10 w-10 items-center justify-center">
        {/* Inline SVG fallback to avoid 404 when /assets/logo.png is missing */}
        <svg viewBox="0 0 48 48" className="h-10 w-10" xmlns="http://www.w3.org/2000/svg" fill="none">
          <rect width="48" height="48" rx="10" fill="#0EA5A4" />
          <path d="M14 26 L20 18 L28 30 L34 22" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <div className="flex flex-col">
        <span className="text-xl font-black tracking-tight text-slate-900 leading-none font-cairo">Ewan</span>
        <span className="text-[10px] font-semibold text-primary tracking-[0.15em] uppercase leading-tight">For IT & Education</span>
      </div>
    </div>
  );
};
