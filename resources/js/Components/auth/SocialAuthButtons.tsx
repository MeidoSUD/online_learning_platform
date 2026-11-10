// @ts-nocheck
import React, { useState } from 'react';
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
}

export const SocialAuthButtons: React.FC<SocialAuthButtonsProps> = ({
  roleId = 4,
  onSuccess,
  onError,
  mode = 'login',
}) => {
  const { language } = useLanguage();
  const { showToast } = useToast();
  const { getFcmToken } = useFcm();
  const isAr = language === 'ar';

  const [loadingProvider, setLoadingProvider] = useState<'google' | 'apple' | null>(null);

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
        ? (isAr ? 'تم إنشاء الحساب بنجاح' : 'Account created successfully')
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
      const msg = err.message_ar && isAr
        ? err.message_ar
        : (err.message || (isAr ? `فشل تسجيل الدخول عبر ${provider === 'google' ? 'جوجل' : 'أبل'}` : `Failed to sign in with ${provider}`));
      showToast(msg, 'error');
      if (onError) onError(msg);
    } finally {
      setLoadingProvider(null);
    }
  };

  return (
    <div className="space-y-3 pt-2">
      <div className="relative flex items-center justify-center">
        <div className="border-t border-[var(--border)] w-full" />
        <span className="bg-surface px-3 text-xs text-[var(--text-muted)] font-medium shrink-0 uppercase tracking-wider">
          {isAr ? 'أو المتابعة عبر' : 'Or continue with'}
        </span>
        <div className="border-t border-[var(--border)] w-full" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        {/* Google Button */}
        <button
          type="button"
          onClick={() => handleSocialAuth('google')}
          disabled={loadingProvider !== null}
          className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-[var(--border)] bg-white hover:bg-slate-50 transition-all text-xs md:text-sm font-semibold text-slate-700 shadow-sm disabled:opacity-60 disabled:cursor-not-allowed hover:shadow"
        >
          {loadingProvider === 'google' ? (
            <Loader2 className="animate-spin text-slate-600" size={18} />
          ) : (
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
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
          className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-black bg-black hover:bg-neutral-900 transition-all text-xs md:text-sm font-semibold text-white shadow-sm disabled:opacity-60 disabled:cursor-not-allowed hover:shadow"
        >
          {loadingProvider === 'apple' ? (
            <Loader2 className="animate-spin text-white" size={18} />
          ) : (
            <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 170 170">
              <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.7-3.04-7.58-7.71-11.65-14.01-6.19-9.59-10.96-20.45-14.3-32.59-3.34-12.14-5.02-23.77-5.02-34.89 0-14.68 3.51-26.98 10.53-36.9 7.02-9.92 16.03-14.97 27.02-15.16 4.35 0 9.28 1.13 14.78 3.39 5.5 2.27 9.25 3.49 11.27 3.66 2.02-.17 6.03-1.48 12.03-3.92 6-2.45 11.13-3.55 15.4-3.3 11.22.61 20.37 4.79 27.46 12.54-9.82 5.92-14.65 14.15-14.5 24.69.17 8.52 3.42 15.82 9.76 21.9 6.34 6.08 13.91 9.48 22.71 10.19-1.95 5.92-4.22 11.66-6.8 17.22zm-35.39-95.27c0-6.19 2.24-12.22 6.72-18.09 4.48-5.87 10.14-9.87 16.99-12 0 .53.05 1.06.14 1.6.09.53.14 1.18.14 1.95 0 6.1-2.22 12.1-6.66 18-4.44 5.9-10.14 9.94-17.11 12.12-.13-.9-.22-2.09-.22-3.58z" />
            </svg>
          )}
          <span>Apple</span>
        </button>
      </div>
    </div>
  );
};

