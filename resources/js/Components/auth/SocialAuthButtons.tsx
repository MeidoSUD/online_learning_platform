// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../Contexts/LanguageContext';
import { useToast } from '../../Contexts/ToastContext';
import { useFcm } from '../../Hooks/useFcm';
import { authService, tokenService } from '../../Services/api';
import { signInWithGooglePopup, signInWithApplePopup } from '../../firebase/init';
import { Loader2 } from 'lucide-react';

interface SocialAuthButtonsProps {
  roleId?: number; // 4 = student (default), 3 = teacher
  onSuccess: (data: any) => void;
  onError?: (msg: string) => void;
  mode?: 'login' | 'register';
  customLabel?: string;
}

export const SocialAuthButtons: React.FC<SocialAuthButtonsProps> = ({
  roleId = 4,
  onSuccess,
  onError,
  mode = 'login',
  customLabel,
}) => {
  const { language } = useLanguage();
  const { showToast } = useToast();
  const { getFcmToken } = useFcm();
  const isAr = language === 'ar';

  const [loadingProvider, setLoadingProvider] = useState<'google' | 'apple' | null>(null);
  const [isEnabled, setIsEnabled] = useState<boolean | null>(() => {
    try {
      const cached = localStorage.getItem('social_login_enabled');
      return cached !== null ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    let mounted = true;
    authService.getSocialLoginEnabled().then((status) => {
      if (mounted) setIsEnabled(status);
    });

    const handleChanged = (e: any) => {
      if (mounted && typeof e?.detail?.enabled === 'boolean') {
        setIsEnabled(e.detail.enabled);
      }
    };
    window.addEventListener('app:social-login-changed', handleChanged);

    return () => {
      mounted = false;
      window.removeEventListener('app:social-login-changed', handleChanged);
    };
  }, []);

  if (isEnabled === false) {
    return null;
  }

  const handleSocialAuth = async (provider: 'google' | 'apple') => {
    setLoadingProvider(provider);
    try {
      const socialResult = provider === 'google'
        ? await signInWithGooglePopup()
        : await signInWithApplePopup();

      let fcmToken = null;
      try {
        fcmToken = await getFcmToken();
      } catch (e) {
        // FCM token is optional
      }

      const clientTz = typeof Intl !== 'undefined'
        ? Intl.DateTimeFormat().resolvedOptions().timeZone
        : 'Asia/Riyadh';

      const payload = {
        provider: socialResult.provider,
        id_token: socialResult.id_token,
        role_id: roleId,
        email: socialResult.email || undefined,
        first_name: socialResult.displayName?.split(' ')[0] || undefined,
        last_name: socialResult.displayName?.split(' ').slice(1).join(' ') || undefined,
        fcm_token: fcmToken || undefined,
        device_type: 'web',
        timezone: clientTz,
      };

      const res = await authService.socialLogin(payload);
      const data = res?.data || res;
      const token = data?.token || res?.token;

      if (token) {
        tokenService.setToken(token);
      }

      const successMsg = data?.is_new_user
        ? (isAr ? (roleId === 3 ? 'تم إنشاء حساب المعلم بنجاح' : 'تم إنشاء حساب الطالب بنجاح') : 'Account created successfully')
        : (isAr ? 'تم تسجيل الدخول بنجاح' : 'Logged in successfully');

      showToast(successMsg, 'success');
      onSuccess(res);
    } catch (err: any) {
      console.error(`[SocialAuth] ${provider} error:`, err);
      // Don't show toast if user simply cancelled the popup
      if (err?.code === 'auth/popup-closed-by-user' || err?.code === 'auth/cancelled-popup-request') {
        setLoadingProvider(null);
        return;
      }
      let msg = err.message_ar && isAr
        ? err.message_ar
        : (err.message || (isAr ? `فشل تسجيل الدخول عبر ${provider === 'google' ? 'جوجل' : 'أبل'}` : `Failed to sign in with ${provider}`));

      if (err?.code === 'auth/unauthorized-domain') {
        msg = isAr
          ? 'النطاق الحالي غير مصرح به في Firebase. يرجى إضافة النطاق (ngrok/localhost) في Authorized Domains داخل Firebase Console.'
          : 'Current domain is not authorized in Firebase. Please add this domain (ngrok/localhost) to Authorized Domains in Firebase Console.';
      } else if (err?.code === 'auth/popup-blocked') {
        msg = isAr
          ? 'تم حظر النافذة المنبثقة من قِبل المتصفح. يرجى السماح بالنوافذ المنبثقة لهذا الموقع.'
          : 'Popup was blocked by your browser. Please allow popups for this site.';
      } else if (err?.code === 'auth/operation-not-allowed') {
        msg = isAr
          ? 'تسجيل الدخول عبر Google غير مفعّل في Firebase Console. يرجى تفعيله من Authentication > Sign-in method.'
          : 'Google sign-in is not enabled in Firebase Console. Please enable it under Authentication > Sign-in method.';
      }
      showToast(msg, 'error');
      if (onError) onError(msg);
    } finally {
      setLoadingProvider(null);
    }
  };

  const dividerText = customLabel || (
    mode === 'register'
      ? (isAr ? `أو التسجيل السريع كـ ${roleId === 3 ? 'معلم' : 'طالب'} عبر` : `Or sign up as ${roleId === 3 ? 'Teacher' : 'Student'} with`)
      : (isAr ? 'أو المتابعة عبر' : 'Or continue with')
  );

  return (
    <div className="space-y-3 pt-2">
      <div className="relative flex items-center justify-center">
        <div className="border-t border-[var(--border)] w-full" />
        <span className="bg-surface px-3 text-xs text-[var(--text-muted)] font-medium shrink-0 uppercase tracking-wider text-center">
          {dividerText}
        </span>
        <div className="border-t border-[var(--border)] w-full" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        {/* Google Button */}
        <button
          type="button"
          onClick={() => handleSocialAuth('google')}
          disabled={loadingProvider !== null}
          className="flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 active:scale-[0.98] transition-all text-xs md:text-sm font-semibold text-slate-800 shadow-sm disabled:opacity-60 disabled:cursor-not-allowed hover:shadow hover:border-slate-300"
        >
          {loadingProvider === 'google' ? (
            <Loader2 className="animate-spin text-slate-600" size={18} />
          ) : (
            <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
          )}
          <span>Google</span>
        </button>

        {/* Apple Button */}
        <button
          type="button"
          onClick={() => handleSocialAuth('apple')}
          disabled={loadingProvider !== null}
          className="flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl border border-neutral-900 bg-black hover:bg-neutral-900 active:scale-[0.98] transition-all text-xs md:text-sm font-semibold text-white shadow-sm disabled:opacity-60 disabled:cursor-not-allowed hover:shadow"
        >
          {loadingProvider === 'apple' ? (
            <Loader2 className="animate-spin text-white" size={18} />
          ) : (
            <svg className="w-5 h-5 fill-white shrink-0" viewBox="0 0 24 24">
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.62-.75 1.04-1.8 0.92-2.85-.9.04-1.98.6-2.61 1.34-.56.65-.99 1.7-0.88 2.73 1 .08 2.01-.52 2.57-1.22z" />
            </svg>
          )}
          <span>Apple</span>
        </button>
      </div>
    </div>
  );
};

