import React from 'react';

export default function GuestLayout({ children }) {
  return (
    <div className="min-h-screen bg-background font-sans text-text">
      {children}
    </div>
  );
}
