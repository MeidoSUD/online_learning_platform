import React, { useState } from 'react';
import { useLanguage } from '../Contexts/LanguageContext';
import { Input } from './ui/Input';
import { CountrySelect } from './ui/CountrySelect';
import { COUNTRIES } from '../Utils/constants';
import { PhoneInput } from './ui/PhoneInput';
import { Button } from './ui/Button';
import { Logo } from './Logo';
import { User, Mail, Globe, GraduationCap, Briefcase, ShieldCheck } from 'lucide-react';
import { authService } from '../Services/api';
import { VerificationScreen } from './auth/VerificationScreen';
import { useToast } from '../Contexts/ToastContext';

interface RegisterScreenProps {
  onSwitch: () => void;
  onVerifySuccess?: () => void;
}

export const RegisterScreen: React.FC<RegisterScreenProps> = ({ onSwitch, onVerifySuccess }) => {
  const { t, language, setLanguage } = useLanguage();
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const isAr = language === 'ar';

  const [showVerification, setShowVerification] = useState(false);
  const [registeredUserId, setRegisteredUserId] = useState<number | null>(null);

  // Registration step: 'role' or 'info'
  const [step, setStep] = useState<'role' | 'info'>('role');

  // Default to Student (4)
  const [roleId, setRoleId] = useState<number>(4);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    notionalId: '',
    nationality: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^5[0-9]{8}$/;

    if (!formData.firstName.trim()) newErrors.firstName = t.required;
    if (!formData.lastName.trim()) newErrors.lastName = t.required;

    const hasEmail = Boolean(formData.email.trim());
    const hasPhone = Boolean(formData.phone.trim());

    // At least one contact method is required (email or phone)
    if (!hasEmail && !hasPhone) {
      newErrors.email = isAr ? 'يجب إدخال البريد الإلكتروني أو رقم الهاتف' : 'Either email or phone is required';
      newErrors.phone = isAr ? 'يجب إدخال البريد الإلكتروني أو رقم الهاتف' : 'Either email or phone is required';
    } else {
      if (hasEmail && !emailRegex.test(formData.email.trim())) {
        newErrors.email = t.invalidEmail || (isAr ? 'البريد الإلكتروني غير صالح' : 'Invalid email address');
      }
      if (hasPhone && !phoneRegex.test(formData.phone.trim())) {
        newErrors.phone = isAr ? 'يجب أن يبدأ بـ 5 ويتكون من 9 أرقام' : 'Must start with 5 and be 9 digits';
      }
    }

    if (roleId === 3 && !formData.nationality) {
      newErrors.nationality = t.required;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const apiData: Record<string, any> = {
      first_name: formData.firstName.trim(),
      last_name: formData.lastName.trim(),
      role_id: roleId,
    };

    if (formData.email.trim()) {
      apiData.email = formData.email.trim();
    }

    if (formData.phone.trim()) {
      apiData.phone_number = `+966${formData.phone.trim()}`;
    }

    if (formData.notionalId.trim()) {
      apiData.notional_id = formData.notionalId.trim();
    }

    if (roleId === 3) {
      apiData.nationality = formData.nationality;
      apiData.country_key = COUNTRIES.find(country => country.label === formData.nationality)?.code;
    }

    setIsLoading(true);
    try {
      const response = roleId === 3
        ? await authService.registerTeacherWeb(apiData)
        : await authService.register(apiData);

      const userId = response.user?.id || response.data?.id || response.user?.data?.id || response.data?.user?.id;

      if (userId) {
        setRegisteredUserId(userId);
        setShowVerification(true);
        showToast(isAr ? (response.message_ar || "تم إرسال رمز التحقق بنجاح") : (response.message_en || "Verification code sent"), 'success');

        // Analytics tracking
        try {
          if (typeof window !== 'undefined') {
            const win: any = window;
            win.dataLayer = win.dataLayer || [];
            win.dataLayer.push({ event: 'sign_up', role: roleId === 3 ? 'teacher' : 'student', method: 'web' });
            if (typeof win.fbq === 'function') {
              win.fbq('track', 'CompleteRegistration', { role: roleId === 3 ? 'teacher' : 'student' });
            }
            if (typeof win.snaptr === 'function') {
              win.snaptr('track', 'SIGN_UP', { role: roleId === 3 ? 'teacher' : 'student' });
            }
          }
        } catch {
          // Analytics must not break flow
        }
      } else {
        showToast(t.successRegister || (isAr ? "تم التسجيل بنجاح" : "Registration successful"), 'success');
        onSwitch();
      }
    } catch (error: any) {
      console.error("Registration Error:", error);
      if (error.status === 422 && error.errors) {
        setErrors(prev => ({
          ...prev,
          ...Object.keys(error.errors).reduce((acc: any, key) => {
            let field = key;
            if (key === 'phone_number') field = 'phone';
            if (key === 'first_name') field = 'firstName';
            if (key === 'last_name') field = 'lastName';
            const message = error.errors[key][0];
            acc[field] = message === 'validation.unique'
              ? (isAr ? 'البيانات المدخلة مسجلة مسبقاً' : 'Already registered')
              : message;
            return acc;
          }, {})
        }));
      } else {
        const errorMsg = error.message_ar && isAr ? error.message_ar : (error.message || "Registration failed.");
        showToast(errorMsg, 'error');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  if (showVerification && registeredUserId) {
    return <VerificationScreen userId={registeredUserId} onSuccess={onVerifySuccess || onSwitch} />;
  }

  return (
    <div className="w-full max-w-lg space-y-6 bg-surface p-8 rounded-[var(--radius-lg)] shadow-[var(--shadow-md)] border border-[var(--border)] my-4 relative overflow-hidden">
      <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-green-light to-green" />
      <div className="flex justify-end">
        <button
          onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
          className="flex items-center gap-2 text-sm font-bold text-navy transition-all border-2 border-navy rounded-[50px] px-3 py-1.5 shadow-sm hover:bg-navy hover:text-white"
        >
          <Globe size={16} />
          {language === 'en' ? 'العربية' : 'English'}
        </button>
      </div>

      <Logo className="scale-90" />

      {step === 'role' ? (
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="mt-2 text-2xl md:text-3xl font-bold tracking-tight text-navy">
              {t.chooseAccount || (isAr ? "اختر نوع الحساب" : "Choose Account Type")}
            </h2>
            <p className="mt-2 text-sm text-[var(--text-muted)]">
              {t.roleSelectionDesc || (isAr ? "حدد نوع الحساب المناسب لك للمتابعة" : "Select the appropriate account type to continue")}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 mt-6">
            <div
              onClick={() => setRoleId(4)}
              className={`cursor-pointer p-5 rounded-[var(--radius-md)] border-2 flex items-center gap-4 transition-all hover:-translate-y-[2px] ${
                roleId === 4 ? 'border-primary bg-primary/5 shadow-sm' : 'border-[var(--border)] bg-white hover:shadow-sm'
              }`}
            >
              <div className={`p-3 rounded-xl transition-all ${roleId === 4 ? 'bg-primary text-white' : 'bg-primary/10 text-primary'}`}>
                <GraduationCap size={26} />
              </div>
              <div className="flex-1">
                <p className={`font-bold text-base md:text-lg ${roleId === 4 ? 'text-primary' : 'text-navy'}`}>
                  {isAr ? 'طالب' : 'Student'}
                </p>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">
                  {t.studentDesc || (isAr ? "الوصول إلى أفضل المعلمين وحجز الحصص التعليمية" : "Access top teachers and book lessons")}
                </p>
              </div>
            </div>

            <div
              onClick={() => setRoleId(3)}
              className={`cursor-pointer p-5 rounded-[var(--radius-md)] border-2 flex items-center gap-4 transition-all hover:-translate-y-[2px] ${
                roleId === 3 ? 'border-primary bg-primary/5 shadow-sm' : 'border-[var(--border)] bg-white hover:shadow-sm'
              }`}
            >
              <div className={`p-3 rounded-xl transition-all ${roleId === 3 ? 'bg-primary text-white' : 'bg-primary/10 text-primary'}`}>
                <Briefcase size={26} />
              </div>
              <div className="flex-1">
                <p className={`font-bold text-base md:text-lg ${roleId === 3 ? 'text-primary' : 'text-navy'}`}>
                  {t.teacherInstitute || (isAr ? "معلم / معهد" : "Teacher / Institute")}
                </p>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">
                  {t.teacherInstituteDesc || (isAr ? "قدّم خدماتك التعليمية للطلاب وابدأ بتحقيق دخل إضافي" : "Offer your lessons and generate income")}
                </p>
              </div>
            </div>
          </div>

          <div className="pt-2">
            <Button onClick={() => setStep('info')} className="w-full py-3.5 text-base shadow-[var(--shadow-md)]">
              {t.continue || (isAr ? "متابعة" : "Continue")}
            </Button>
          </div>
        </div>
      ) : (
        <>
          <div className="text-center">
            <div className="flex items-center justify-between mb-2">
              <button onClick={() => setStep('role')} className="text-xs md:text-sm text-[var(--text-muted)] hover:text-primary flex items-center gap-1">
                ← {t.back || (isAr ? "رجوع" : "Back")}
              </button>
              <span className="text-xs font-bold text-primary uppercase tracking-wider bg-primary/10 px-2.5 py-1 rounded-full">
                {roleId === 4 ? (isAr ? "تسجيل طالب" : "Student Registration") : (isAr ? "تسجيل معلم" : "Teacher Registration")}
              </span>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-navy">
              {t.registerTitle || (isAr ? "إنشاء حساب جديد" : "Create Account")}
            </h2>
            <p className="mt-1 text-xs md:text-sm text-[var(--text-muted)]">
              {isAr ? "أدخل بياناتك للتسجيل والتفعيل الفوري عبر رمز التحقق OTP" : "Enter your details to register and verify via OTP"}
            </p>
          </div>

          <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label={t.firstName || (isAr ? "الاسم الأول" : "First Name")}
                placeholder={t.phName || (isAr ? "مثال: أحمد" : "e.g. Ahmed")}
                icon={<User size={18} />}
                value={formData.firstName}
                onChange={(e) => handleChange('firstName', e.target.value)}
                error={errors.firstName}
              />
              <Input
                label={t.lastName || (isAr ? "اسم العائلة" : "Last Name")}
                placeholder={t.phName || (isAr ? "مثال: علي" : "e.g. Ali")}
                icon={<User size={18} />}
                value={formData.lastName}
                onChange={(e) => handleChange('lastName', e.target.value)}
                error={errors.lastName}
              />
            </div>

            <div className="p-3 bg-primary/5 rounded-xl border border-primary/15 text-xs text-primary font-medium flex items-center gap-2">
              <ShieldCheck size={16} className="shrink-0" />
              <span>
                {isAr
                  ? "تسجيل سريع بدون كلمة مرور - أدخل البريد الإلكتروني أو رقم الهاتف لاستلام رمز التحقق"
                  : "Passwordless sign-up - enter email or phone to receive your verification code"}
              </span>
            </div>

            <Input
              label={`${t.email || (isAr ? 'البريد الإلكتروني' : 'Email')} ${!formData.phone ? '' : (isAr ? '(اختياري)' : '(Optional)')}`}
              placeholder={t.phEmail || "example@email.com"}
              icon={<Mail size={18} />}
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              error={errors.email}
              autoComplete="email"
            />

            <PhoneInput
              label={`${t.phone || (isAr ? 'رقم الهاتف' : 'Phone Number')} ${!formData.email ? '' : (isAr ? '(اختياري)' : '(Optional)')}`}
              value={formData.phone}
              onChangeText={(text) => handleChange('phone', text)}
              error={errors.phone}
            />

            {roleId === 3 && (
              <CountrySelect
                label={t.nationality || (isAr ? "الجنسية" : "Nationality")}
                value={formData.nationality}
                onChange={(value) => handleChange('nationality', value)}
                error={errors.nationality}
              />
            )}

            <Input
              label={`${t.notionalId || (isAr ? 'الهوية الوطنية / الإقامة' : 'National ID')} (${t.optional || (isAr ? 'اختياري' : 'Optional')})`}
              placeholder={isAr ? "10xxxxxxxxx" : "10xxxxxxxxx"}
              icon={<User size={18} />}
              value={formData.notionalId}
              onChange={(e) => handleChange('notionalId', e.target.value)}
              error={errors.notionalId}
            />

            <div className="pt-2">
              <Button type="submit" className="w-full shadow-[var(--shadow-md)] py-3 text-base font-bold" isLoading={isLoading}>
                {isAr ? "إنشاء الحساب واستلام الرمز" : "Create Account & Get Code"}
              </Button>
            </div>
          </form>
        </>
      )}

      <div className="text-center text-xs md:text-sm pb-1 border-t border-[var(--border)] pt-3">
        <span className="text-[var(--text-muted)]">{t.haveAccount || (isAr ? "لديك حساب بالفعل؟" : "Already have an account?")} </span>
        <button onClick={onSwitch} className="font-bold text-primary hover:text-primary-light transition-colors">
          {t.switchToLogin || (isAr ? "تسجيل الدخول" : "Sign In")}
        </button>
      </div>
    </div>
  );
};
