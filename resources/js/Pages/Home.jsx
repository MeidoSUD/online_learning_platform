import React from 'react';
import WebsiteLayout from '../Layouts/WebsiteLayout';
import { HomePage } from '../Components/website/HomePage';
import { router } from '@inertiajs/react';

export default function Home() {
  const handleLogin = () => router.visit('/login');
  const handleRegister = () => router.visit('/register');
  const handlePageChange = (page) => {
    switch (page) {
      case 'services': return router.visit('/services');
      case 'e_profile': return router.visit('/e-profile');
      case 'ewan_school': return router.visit('/ewan-landing');
      default: return;
    }
  };

  return (
    <WebsiteLayout>
      <HomePage onLoginClick={handleLogin} onRegisterClick={handleRegister} onPageChange={handlePageChange} />
    </WebsiteLayout>
  );
}
