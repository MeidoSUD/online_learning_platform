import React, { useEffect } from 'react';
import { RegisterScreen } from '../Components/RegisterScreen';
import { tokenService } from '../Services/api';
import { router } from '@inertiajs/react';

export default function Register() {
  useEffect(() => {
    if (tokenService.isAuthenticated()) {
      router.visit('/dashboard');
    }
  }, []);

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
    <div className="flex items-center justify-center min-h-screen p-4 bg-slate-50 relative">
      <RegisterScreen
        onSwitch={handleSwitchToLogin}
        onVerifySuccess={handleVerifySuccess}
      />
      <button
        onClick={handleBack}
        className="absolute top-4 left-4 text-sm text-slate-500 hover:text-primary font-medium"
      >
        ← Back
      </button>
    </div>
  );
}
