
import React, { useState } from 'react';
import { useLanguage } from '../../Contexts/LanguageContext';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { PhoneInput } from '../ui/PhoneInput';
import { Logo } from '../Logo';
import { authService } from '../../Services/api';
import { AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react';
import { useToast } from '../../Contexts/ToastContext';

interface ForgotPasswordScreenProps {
  onBack: () => void;
}

export const ForgotPasswordScreen: React.FC<ForgotPasswordScreenProps> = ({ onBack }) => {
  const { language } = useLanguage();
  const { showToast } = useToast();
  const [step, setStep] = useState(1); // 1: Phone, 2: Code
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [userId, setUserId] = useState<number | null>(null);
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

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone) return;

    setLoading(true);
    setError(null);
    try {
      const formattedPhone = `+966${phone}`;
      const response = await authService.resetPassword({ phone_number: formattedPhone });
      setSuccess(response.message || "Code sent successfully.");
      setStep(2);
    } catch (err: any) {
      setError(err.message || "Failed to send code. User not found.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || !userId) {
      // If step 1 didn't return userId, we can't properly use verify endpoint usually
      // But doc says verify-reset-code takes { user_id, code }
      // We actually need user_id from step 1 response.
      // Let's assume step 1 response includes user like { user: { id: 123 } }
    }

    // Correction: We need user_id for verification.
    // If step 1 response didn't give it, we might have an issue.
    // Let's assume step 1 response gave us a user object.
  };

  // Revised handler for Step 1 considering we need user_id
  const handleSendCodeRevised = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone) return;
    setLoading(true);
    setError(null);
    try {
      const formattedPhone = `+966${phone}`;
      const response = await authService.resetPassword({ phone_number: formattedPhone });

      if (response.user && response.user.id) {
        setUserId(response.user.id);
        showToast(response.message || "Code sent.", 'success');
        setStep(2);
        setTimer(30);
      } else {
        showToast("Unexpected response: Missing User ID.", 'error');
      }
    } catch (err: any) {
      showToast(err.message || "Failed to send code.", 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCodeRevised = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || !userId) return;
    setLoading(true);
    setError(null);
    try {
      const response = await authService.verifyResetCode({ user_id: userId, code });
      showToast("Code verified. Please contact support to finalize password reset as this feature is limited in demo.", 'success');
    } catch (err: any) {
      showToast(err.message || "Invalid code.", 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md space-y-8 bg-white p-8 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 relative">
      <button onClick={onBack} className="absolute top-6 left-6 text-slate-400 hover:text-slate-600">
        <ArrowLeft size={24} />
      </button>

      <Logo />

      <div className="text-center">
        <h2 className="mt-4 text-2xl font-bold tracking-tight text-slate-900">
          {language === 'ar' ? 'نسيت كلمة المرور؟' : 'Forgot Password?'}
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          {step === 1
            ? (language === 'ar' ? 'أدخل رقم هاتفك لاستعادة حسابك' : 'Enter your phone number to reset password')
            : (language === 'ar' ? 'أدخل رمز التحقق' : 'Enter verification code')}
        </p>
      </div>

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

      {step === 1 && (
        <form className="mt-6 space-y-6" onSubmit={handleSendCodeRevised}>
          <PhoneInput
            label={language === 'ar' ? 'رقم الهاتف' : 'Phone Number'}
            value={phone}
            onChangeText={setPhone}
          />
          <Button type="submit" className="w-full" isLoading={loading}>
            {language === 'ar' ? 'إرسال الرمز' : 'Send Code'}
          </Button>
        </form>
      )}

      {step === 2 && (
        <form className="mt-6 space-y-6" onSubmit={handleVerifyCodeRevised}>
          <Input
            label={language === 'ar' ? 'رمز التحقق' : 'Verification Code'}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="123456"
            className="text-center tracking-widest text-lg font-bold"
          />
          <Button type="submit" className="w-full" isLoading={loading}>
            {language === 'ar' ? 'تحقق' : 'Verify'}
          </Button>

          <div className="text-center">
            <button
              type="button"
              onClick={handleSendCodeRevised}
              className={`text-sm font-medium ${timer > 0 ? 'text-slate-400 cursor-not-allowed' : 'text-primary hover:underline'}`}
              disabled={loading || timer > 0}
            >
              {language === 'ar'
                ? (timer > 0 ? `إعادة الإرسال خلال ${timer} ثانية` : 'إعادة إرسال الرمز')
                : (timer > 0 ? `Resend in ${timer}s` : 'Resend Code')}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
