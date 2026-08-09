import React, { useEffect } from 'react';
import { LoginScreen } from '../Components/LoginScreen';
import { tokenService } from '../Services/api';
import { router } from '@inertiajs/react';

export default function Login() {
  // NOTE: removed automatic redirect on mount. Auto-redirecting when a token
  // exists caused immediate navigation/refresh in some dev setups and prevented
  // users from interacting with the login form. We keep redirecting after a
  // successful login in handleLoginSuccess.

  const handleLoginSuccess = (data) => {
    console.log("[Login Page] Login success:", data);
    try {
      // If API returns the token in data.data.token (AuthResponse shape), persist and redirect
      const token = data?.data?.token || data?.token || null;
      if (token) {
        tokenService.setToken(token);
      }
    } catch (e) {
      console.error("[Login Page] Failed to persist token:", e);
    }
    // Navigate to dashboard after successful login
    router.visit('/dashboard');
  };

  const handleSwitchToRegister = () => {
    router.visit('/register');
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
      <div className="relative w-full max-w-md">
        <LoginScreen
          onSwitch={handleSwitchToRegister}
          onLoginSuccess={handleLoginSuccess}
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
