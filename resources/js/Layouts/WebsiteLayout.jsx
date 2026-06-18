import React from 'react';
import { WebsiteNavbar } from '../Components/website/WebsiteNavbar';

export default function WebsiteLayout({ children }) {
  return (
    <div className="min-h-screen bg-background font-sans text-text">
      <WebsiteNavbar />
      <div className="pt-20">
        {children}
      </div>
    </div>
  );
}
