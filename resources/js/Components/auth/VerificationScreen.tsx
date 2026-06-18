
import React, { useState } from 'react';
import { useLanguage } from '../../Contexts/LanguageContext';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Logo } from '../Logo';
import { authService, tokenService } from '../../Services/api';
import { CheckCircle, AlertCircle } from 'lucide-react';
import { useToast } from '../../Contexts/ToastContext';

interface VerificationScreenProps {
  userId: number;
  onSuccess: () => void;
}

export const VerificationScreen: React.FC<VerificationScreenProps> = ({ userId, onSuccess }) => {
  const { t, language } = useLanguage();
  const { showToast } = useToast();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [timer, setTimer] = useState(0);

  React.useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code) return;

    setLoading(true);
    setError(null);
    try {
      const response = await authService.verifyCode({ user_id: userId, code });
      if (response.token) {
        tokenService.setToken(response.token);
      }
      showToast("Verification successful!", 'success');
      setTimeout(onSuccess, 1500);
    } catch (err: any) {
      const msg = err.message || "Verification failed. Invalid code.";
      setError(msg);
      showToast(msg, 'error');
      setCode(''); // Clear inputs on wrong code
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setLoading(true);
    try {
      await authService.resendCode({ user_id: userId });
      showToast("Code resent successfully!", 'success');
      setTimer(30);
    } catch (err: any) {
      showToast(err.message || "Failed to resend code.", 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md space-y-8 bg-white p-8 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100">
      <Logo />
      <div className="text-center">
        <h2 className="mt-6 text-3xl font-bold tracking-tight text-slate-900">
          {language === 'ar' ? 'تفعيل الحساب' : 'Verify Account'}
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          {language === 'ar'
            ? 'أدخل رمز التحقق المرسل إلى هاتفك'
            : 'Enter the verification code sent to your phone'}
        </p>
      </div>

      <form className="mt-8 space-y-6" onSubmit={handleVerify}>
        {error && (
          <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg flex items-center gap-2">
            <AlertCircle size={16} /> {error}
          </div>
        )}
        {success && (
          <div className="p-3 bg-green-50 text-green-700 text-sm rounded-lg flex items-center gap-2">
            <CheckCircle size={16} /> {success}
          </div>
        )}

        <Input
          label={language === 'ar' ? 'رمز التحقق' : 'Verification Code'}
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="123456"
          className="text-center tracking-widest text-lg font-bold"
        />

        <Button type="submit" className="w-full" isLoading={loading}>
          {language === 'ar' ? 'تفعيل' : 'Verify'}
        </Button>

        <div className="text-center">
          <button
            type="button"
            onClick={handleResend}
            className={`text-sm font-medium ${timer > 0 ? 'text-slate-400 cursor-not-allowed' : 'text-primary hover:underline'}`}
            disabled={loading || timer > 0}
          >
            {language === 'ar'
              ? (timer > 0 ? `إعادة الإرسال خلال ${timer} ثانية` : 'إعادة إرسال الرمز')
              : (timer > 0 ? `Resend in ${timer}s` : 'Resend Code')}
          </button>
        </div>
      </form>
    </div>
  );
};
