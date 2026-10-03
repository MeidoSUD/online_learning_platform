// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { useLanguage } from '../Contexts/LanguageContext';
import { Input } from './ui/Input';
import { Button } from './ui/Button';
import { Logo } from './Logo';
import { Globe, AlertCircle, ShieldCheck, Smartphone, CheckCircle } from 'lucide-react';
import { authService, tokenService } from '../Services/api';
import { useFcm } from '../Hooks/useFcm';
import { useToast } from '../Contexts/ToastContext';

export const LoginScreen = ({ onSwitch, onLoginSuccess }) => {
  const { t, language, setLanguage } = useLanguage();
  const { showToast } = useToast();
  const { getFcmToken } = useFcm();

  const isAr = language === 'ar';

  // OTP Login Step: 'request' or 'verify'
  const [step, setStep] = useState<'request' | 'verify'>('request');
  const [identifier, setIdentifier] = useState('');
  const [code, setCode] = useState('');
  const [userId, setUserId] = useState<number | null>(null);
  const [sentVia, setSentVia] = useState<string>('');
  const [timer, setTimer] = useState(0);

  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Countdown timer for resending OTP
  useEffect(() => {
    let interval;
    if (timer > 0) {
      interval = setInterval(() => setTimer(prev => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const normalizeIdentifier = (input: string) => {
    let id = input.trim();
    if (!id.includes('@')) {
      const clean = id.replace(/\D/g, '');
      if (/^5\d{8}$/.test(clean)) {
        id = `+966${clean}`;
      } else if (/^05\d{8}$/.test(clean)) {
        id = `+966${clean.substring(1)}`;
      }
    }
    return id;
  };

  // --- Step 1: Request OTP Code ---
  const handleRequestOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setApiError(null);

    if (!identifier.trim()) {
      setErrors({ identifier: t.required || (isAr ? 'هذا الحقل مطلوب' : 'This field is required') });
      return;
    }
    setErrors({});
    setIsLoading(true);

    const normalized = normalizeIdentifier(identifier);
    const payload = normalized.includes('@')
      ? { email: normalized }
      : { phone_number: normalized };

    try {
      const res = await authService.requestLoginOtp(payload);
      const data = res?.data || res;
      setUserId(data?.user_id);
      setSentVia(data?.sent_via === 'email' ? (isAr ? 'البريد الإلكتروني' : 'email') : (isAr ? 'رسالة نصية SMS' : 'SMS'));
      setStep('verify');
      setTimer(60);
      showToast(isAr ? "تم إرسال رمز التحقق بنجاح" : "OTP sent successfully", 'success');
    } catch (err: any) {
      const msg = err.message_ar && isAr ? err.message_ar : (err.message || (isAr ? "تعذر إرسال رمز التحقق" : "Failed to send OTP"));
      setApiError(msg);
      showToast(msg, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // --- Step 2: Verify OTP & Issue Token ---
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(null);

    if (!code.trim() || !userId) {
      setErrors({ code: t.required || (isAr ? 'يرجى إدخال رمز التحقق' : 'Please enter code') });
      return;
    }
    setErrors({});
    setIsLoading(true);

    try {
      let fcmToken = null;
      try {
        fcmToken = await getFcmToken();
      } catch (fcmError) {
        console.error("[OTP Login] FCM token fetch error:", fcmError);
      }

      const res = await authService.verifyLoginOtp({
        user_id: userId,
        code: code.trim(),
        fcm_token: fcmToken
      });

      const token = res?.data?.token || res?.token;
      if (token) {
        tokenService.setToken(token);
      }

      onLoginSuccess(res);
      showToast(isAr ? "تم تسجيل الدخول بنجاح" : "Login successful", 'success');
    } catch (err: any) {
      const msg = err.message_ar && isAr ? err.message_ar : (err.message || (isAr ? "رمز التحقق غير صحيح أو منتهي الصلاحية" : "Invalid or expired verification code"));
      setApiError(msg);
      showToast(msg, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md space-y-6 bg-surface p-8 rounded-[var(--radius-lg)] shadow-[var(--shadow-md)] border border-[var(--border)] relative overflow-hidden">
      <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-green-light to-green" />

      {/* Header with Language Switch */}
      <div className="flex justify-between items-center">
        <button
          onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
          className="flex items-center gap-2 text-sm font-bold text-navy transition-all border-2 border-navy rounded-[50px] px-3 py-1.5 shadow-sm hover:bg-navy hover:text-white"
        >
          <Globe size={16} />
          {language === 'en' ? 'العربية' : 'English'}
        </button>
      </div>

      <Logo />

      <div className="text-center">
        <h2 className="mt-4 text-2xl md:text-3xl font-bold tracking-tight text-navy">
          {t.loginTitle || (isAr ? "تسجيل الدخول" : "Sign In")}
        </h2>
        <p className="mt-1 text-xs md:text-sm text-[var(--text-muted)]">
          {isAr ? "تسجيل دخول سريع وآمن عبر رمز التحقق OTP" : "Fast & secure passwordless sign-in via OTP"}
        </p>
      </div>

      {apiError && (
        <div className="p-3.5 rounded-[var(--radius-sm)] bg-red-50 border border-red-200 space-y-2">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={18} />
            <p className="text-xs text-red-700 whitespace-pre-wrap font-medium">{apiError}</p>
          </div>
        </div>
      )}

      {/* OTP Request Step */}
      {step === 'request' ? (
        <form className="space-y-4" onSubmit={handleRequestOtp}>
          <div className="p-3 bg-primary/5 rounded-xl border border-primary/15 text-xs text-primary font-medium flex items-center gap-2">
            <ShieldCheck size={18} className="shrink-0 text-primary" />
            <span>
              {isAr
                ? "أدخل بريدك الإلكتروني أو رقم هاتفك وسنرسل لك رمز تحقق لتسجيل الدخول مباشرة"
                : "Enter your email or phone number and we will send you a verification code to sign in"}
            </span>
          </div>

          <Input
            label={isAr ? "البريد الإلكتروني أو رقم الهاتف" : "Email or Phone Number"}
            name="identifier"
            type="text"
            placeholder={isAr ? "05xxxxxxxx أو example@email.com" : "05xxxxxxxx or example@email.com"}
            icon={<Smartphone size={18} />}
            value={identifier}
            onChange={(e) => {
              setIdentifier(e.target.value);
              if (errors.identifier) setErrors({});
            }}
            error={errors.identifier}
            autoComplete="username"
            autoFocus
          />

          <Button type="submit" className="w-full shadow-[var(--shadow-md)] py-3 text-base font-bold" isLoading={isLoading}>
            {isAr ? "إرسال رمز التحقق" : "Send Verification Code"}
          </Button>
        </form>
      ) : (
        /* OTP Verify Step */
        <form className="space-y-4" onSubmit={handleVerifyOtp}>
          <div className="p-3 bg-primary-pale text-primary text-xs rounded-xl flex items-center justify-between border border-primary/20">
            <div className="flex items-center gap-2">
              <CheckCircle size={16} />
              <span>
                {isAr
                  ? `تم إرسال رمز التحقق إلى ${sentVia}`
                  : `Verification code sent via ${sentVia}`}
              </span>
            </div>
            <button
              type="button"
              onClick={() => { setStep('request'); setCode(''); }}
              className="font-bold underline text-xs text-primary hover:opacity-80"
            >
              {isAr ? "تغيير" : "Change"}
            </button>
          </div>

          <Input
            label={isAr ? "رمز التحقق (4 أرقام)" : "Verification Code (4 digits)"}
            name="code"
            type="text"
            maxLength={4}
            placeholder="••••"
            value={code}
            onChange={(e) => {
              setCode(e.target.value.replace(/\D/g, ''));
              if (errors.code) setErrors({});
            }}
            error={errors.code}
            className="text-center text-2xl tracking-[0.4em] font-mono font-bold"
            autoFocus
          />

          <Button type="submit" className="w-full shadow-[var(--shadow-md)] py-3 text-base font-bold" isLoading={isLoading}>
            {isAr ? "تأكيد وتسجيل الدخول" : "Verify & Sign In"}
          </Button>

          <div className="text-center text-xs pt-1">
            {timer > 0 ? (
              <span className="text-[var(--text-muted)]">
                {isAr ? `إعادة الإرسال بعد ${timer} ثانية` : `Resend in ${timer}s`}
              </span>
            ) : (
              <button
                type="button"
                onClick={() => handleRequestOtp()}
                disabled={isLoading}
                className="font-bold text-primary hover:text-primary-light"
              >
                {isAr ? "إعادة إرسال رمز التحقق" : "Resend Verification Code"}
              </button>
            )}
          </div>
        </form>
      )}

      {/* Footer Switch to Register */}
      <div className="text-center text-xs md:text-sm pt-2 border-t border-[var(--border)]">
        <span className="text-[var(--text-muted)]">{t.noAccount || (isAr ? "ليس لديك حساب؟" : "Don't have an account?")} </span>
        <button onClick={onSwitch} className="font-bold text-primary hover:text-primary-light transition-colors">
          {t.switchToRegister || (isAr ? "إنشاء حساب جديد" : "Create Account")}
        </button>
      </div>
    </div>
  );
};
