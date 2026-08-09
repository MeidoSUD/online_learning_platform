import React, { useEffect } from 'react';
import { RegisterScreen } from '../Components/RegisterScreen';
import { tokenService } from '../Services/api';
import { router } from '@inertiajs/react';

export default function Register() {
  // Removed automatic redirect on mount to prevent immediate navigation/refresh
  // which can interfere with form interactions during development.

  const handleSwitchToLogin = () => {
    router.visit('/login');
  };

  const handleVerifySuccess = () => {
    router.visit('/dashboard');
  };

  const handleBack = () => {
    router.visit('/');
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-[var(--navy-dark)] via-[var(--navy)] to-[var(--navy-mid)] overflow-hidden">
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-[var(--green-light)] opacity-10 blur-2xl" />
        <div className="absolute -bottom-32 -left-24 w-96 h-96 rounded-full bg-[var(--accent)] opacity-10 blur-2xl" />
        <div className="absolute top-1/3 left-1/2 w-64 h-64 -translate-x-1/2 rounded-full bg-[var(--green)] opacity-10 blur-3xl" />
      </div>
      <div className="relative w-full max-w-lg">
        <RegisterScreen
          onSwitch={handleSwitchToLogin}
          onVerifySuccess={handleVerifySuccess}
        />
      </div>
      <button
        onClick={handleBack}
        className="absolute top-4 left-4 text-sm text-white/80 hover:text-[var(--green-light)] font-medium z-10 transition-colors"
      >
        ← Back
      </button>
    </div>
  );
}
