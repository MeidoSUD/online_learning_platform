
import React, { useState } from 'react';
import { useLanguage } from '../Contexts/LanguageContext';
import { Input } from './ui/Input';
import { Button } from './ui/Button';
import { Logo } from './Logo';
import { Mail, Lock, Globe, AlertCircle, Settings, Save, ShieldCheck } from 'lucide-react';
import { authService, AuthResponse, API_BASE_URL, setApiUrl, resetApiUrl } from '../Services/api';
import { ForgotPasswordScreen } from './auth/ForgotPasswordScreen';
import { useFcm } from '../Hooks/useFcm';
import { useToast } from '../Contexts/ToastContext';

interface LoginScreenProps {
  onSwitch: () => void;
  onLoginSuccess: (data: AuthResponse) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onSwitch, onLoginSuccess }) => {
  const { t, language, setLanguage } = useLanguage();
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const { getFcmToken } = useFcm();
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '', rememberMe: false });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [showSettings, setShowSettings] = useState(false);
  const [customUrl, setCustomUrl] = useState(API_BASE_URL);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.email) newErrors.email = t.required;
    if (!formData.password) newErrors.password = t.required;
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(null);
    if (!validate()) return;
    setIsLoading(true);

    let loginIdentifier = formData.email;
    if (!loginIdentifier.includes('@')) {
      const cleanInput = loginIdentifier.replace(/\D/g, '');
      if (/^5\d{8}$/.test(cleanInput)) {
        loginIdentifier = `+966${cleanInput}`;
      } else if (/^05\d{8}$/.test(cleanInput)) {
        loginIdentifier = `+966${cleanInput.substring(1)}`;
      }
    }

    try {
      let fcmToken = null;
      try {
        fcmToken = await getFcmToken();
      } catch (fcmError) {
        console.error("[Login] FCM Token fetch failed:", fcmError);
      }

      const payload = {
        ...formData,
        email: loginIdentifier,
        fcm_token: fcmToken
      };

      const response = await authService.login(payload);
      console.log("FULL LOGIN RESPONSE (STRINGIFIED):", JSON.stringify(response, null, 2));
      onLoginSuccess(response);
      showToast(t.loginSuccess || "Login successful", 'success');
    } catch (error: any) {
      console.error("Login Error Catch:", error);

      if (error.status === 422 && error.errors) {
        setErrors(prev => ({
          ...prev,
          ...Object.keys(error.errors).reduce((acc: any, key) => {
            acc[key] = error.errors[key][0];
            return acc;
          }, {})
        }));
      } else {
        const errorMsg = error.message || "Login failed.";
        setApiError(errorMsg);
        showToast(errorMsg, 'error');

        if (errorMsg.includes('Network') || errorMsg.includes('HTML')) {
          setShowSettings(true);
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveUrl = () => {
    if (customUrl) setApiUrl(customUrl);
  };

  const isNetworkError = apiError && (apiError.includes('Network') || apiError.includes('HTML'));

  if (showForgotPassword) {
    return <ForgotPasswordScreen onBack={() => setShowForgotPassword(false)} />;
  }

  return (
    <div className="w-full max-w-md space-y-8 bg-surface p-8 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 relative">

      <div className="flex justify-between items-center">

        <button
          onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
          className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-primary transition-colors"
        >
          <Globe size={16} />
          {language === 'en' ? 'العربية' : 'English'}
        </button>
      </div>



      <Logo />
      <div className="text-center">
        <h2 className="mt-6 text-3xl font-bold tracking-tight text-text">{t.loginTitle}</h2>
        <p className="mt-2 text-sm text-slate-500">{t.loginSubtitle}</p>
      </div>

      <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
        {apiError && (
          <div className="p-4 rounded-lg bg-red-50 border border-red-200 space-y-3">
            <div className="flex items-start gap-3">
              <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={20} />
              <p className="text-xs text-red-700 whitespace-pre-wrap font-medium">{apiError}</p>
            </div>
          </div>
        )}

        <div className="space-y-4">
          <Input
            label={t.email}
            name="email"
            type="text"
            placeholder={t.phEmail}
            icon={<Mail size={18} />}
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            error={errors.email}
            autoComplete="email"
          />
          <Input
            label={t.password}
            name="password"
            type="password"
            placeholder={t.phPassword}
            icon={<Lock size={18} />}
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            error={errors.password}
            autoComplete="current-password"
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <input id="remember-me" type="checkbox" checked={formData.rememberMe} onChange={(e) => setFormData({ ...formData, rememberMe: e.target.checked })} className="h-4 w-4 rounded border-border text-primary focus:ring-primary" />
            <label htmlFor="remember-me" className="ms-2 block text-sm text-text">{t.rememberMe}</label>
          </div>
          <button type="button" onClick={() => setShowForgotPassword(true)} className="text-sm font-medium text-primary hover:text-blue-600">
            {t.forgotPassword}
          </button>
        </div>

        <Button type="submit" className="w-full shadow-lg shadow-primary/20" isLoading={isLoading}>
          {t.loginBtn}
        </Button>
      </form>

      <div className="text-center text-sm">
        <span className="text-slate-500">{t.noAccount} </span>
        <button onClick={onSwitch} className="font-semibold text-primary hover:text-blue-600">{t.switchToRegister}</button>
      </div>
    </div>
  );
};
