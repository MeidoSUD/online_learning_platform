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
