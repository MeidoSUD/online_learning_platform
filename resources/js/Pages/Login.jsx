import React, { useEffect } from 'react';
import { LoginScreen } from '../Components/LoginScreen';
import { tokenService } from '../Services/api';
import { router } from '@inertiajs/react';

export default function Login() {
  useEffect(() => {
    if (tokenService.isAuthenticated()) {
      router.visit('/dashboard');
    }
  }, []);

  const handleLoginSuccess = (data) => {
    console.log("[Login Page] Login success:", data);
  };

  const handleSwitchToRegister = () => {
    router.visit('/register');
  };

  const handleBack = () => {
    router.visit('/');
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-slate-50 relative">
      <LoginScreen
        onSwitch={handleSwitchToRegister}
        onLoginSuccess={handleLoginSuccess}
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
