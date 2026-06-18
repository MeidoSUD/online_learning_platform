
import React, { useState } from 'react';
import { useLanguage } from '../Contexts/LanguageContext';
import { Input } from './ui/Input';
import { Select } from './ui/Select';
import { CountrySelect } from './ui/CountrySelect';
import { PhoneInput } from './ui/PhoneInput';
import { Button } from './ui/Button';
import { Logo } from './Logo';
import { User, Mail, Lock, Globe, GraduationCap, Briefcase } from 'lucide-react';
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
    password: '',
    confirmPassword: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^5[0-9]{8}$/;

    if (!formData.firstName) newErrors.firstName = t.required;
    if (!formData.lastName) newErrors.lastName = t.required;

    if (!formData.email) {
      newErrors.email = t.required;
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = t.invalidEmail;
    }

    if (!formData.phone) {
      newErrors.phone = t.required;
    } else if (!phoneRegex.test(formData.phone)) {
      newErrors.phone = "Must start with 5 and be 9 digits";
    }

    if (!formData.password) newErrors.password = t.required;
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = t.passwordsNoMatch;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const apiData = {
      first_name: formData.firstName,
      last_name: formData.lastName,
      email: formData.email,
      phone_number: `+966${formData.phone}`,
      password: formData.password,
      role_id: roleId
    };

    setIsLoading(true);
    try {
      const response = await authService.register(apiData);
      // Assuming register response contains user object with id
      const userId = response.user?.id || response.data?.id || response.user?.data?.id;

      if (userId) {
        setRegisteredUserId(userId);
        setShowVerification(true);
        showToast(language === 'ar' ? "تم إرسال رمز التحقق" : "Verification code sent", 'success');
      } else {
        // Fallback if no user ID returned but success (edge case)
        showToast(t.successRegister || "Registration successful", 'success');
        onSwitch(); // Go to login
      }
    } catch (error: any) {
      console.error(error);
      if (error.status === 422 && error.errors) {
        setErrors(prev => ({
          ...prev,
          ...Object.keys(error.errors).reduce((acc: any, key) => {
            // Map common backend field names to frontend state names if different
            let field = key;
            if (key === 'phone_number') field = 'phone';
            if (key === 'first_name') field = 'firstName';
            if (key === 'last_name') field = 'lastName';
            acc[field] = error.errors[key][0];
            return acc;
          }, {})
        }));
      } else {
        showToast(error.message || "Registration failed. Please try again.", 'error');
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
    <div className="w-full max-w-lg space-y-6 bg-surface p-8 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 my-4">
      <div className="flex justify-end">
        <button
          onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
          className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-primary transition-colors"
        >
          <Globe size={16} />
          {language === 'en' ? 'العربية' : 'English'}
        </button>
      </div>

      <Logo className="scale-90" />

      {step === 'role' ? (
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-text">
              {t.chooseAccount}
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              {t.roleSelectionDesc}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 mt-6">
            <div
              onClick={() => setRoleId(4)}
              className={`cursor-pointer p-6 rounded-2xl border-2 flex items-center gap-4 transition-all ${roleId === 4 ? 'border-primary bg-primary/5' : 'border-slate-100 bg-white hover:border-slate-200'}`}
            >
              <div className={`p-3 rounded-xl ${roleId === 4 ? 'bg-primary text-white' : 'bg-slate-100 text-slate-500'}`}>
                <GraduationCap size={28} />
              </div>
              <div className="flex-1">
                <p className={`font-bold text-lg ${roleId === 4 ? 'text-primary' : 'text-text'}`}>
                  {language === 'ar' ? 'طالب' : 'Student'}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  {t.studentDesc}
                </p>
              </div>
            </div>

            <div
              onClick={() => setRoleId(3)}
              className={`cursor-pointer p-6 rounded-2xl border-2 flex items-center gap-4 transition-all ${roleId === 3 ? 'border-primary bg-primary/5' : 'border-slate-100 bg-white hover:border-slate-200'}`}
            >
              <div className={`p-3 rounded-xl ${roleId === 3 ? 'bg-primary text-white' : 'bg-slate-100 text-slate-500'}`}>
                <Briefcase size={28} />
              </div>
              <div className="flex-1">
                <p className={`font-bold text-lg ${roleId === 3 ? 'text-primary' : 'text-text'}`}>
                  {t.teacherInstitute}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  {t.teacherInstituteDesc}
                </p>
              </div>
            </div>
          </div>

          {roleId === 3 && (
            <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl animate-fade-in">
              <p className="text-sm text-blue-700 leading-relaxed">
                {t.teacherDetailedDesc}
              </p>
            </div>
          )}

          <div className="pt-4">
            <Button onClick={() => setStep('info')} className="w-full py-4 text-lg shadow-lg shadow-primary/20">
              {t.continue}
            </Button>
          </div>
        </div>
      ) : (
        <>
          <div className="text-center">
            <div className="flex items-center justify-between mb-2">
              <button onClick={() => setStep('role')} className="text-sm text-slate-500 hover:text-primary flex items-center gap-1">
                ← {t.back}
              </button>
              <span className="text-xs font-bold text-primary uppercase tracking-wider">
                {roleId === 4 ? t.studentRegistration : t.teacherRegistration}
              </span>
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-text">
              {t.registerTitle}
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              {t.registerSubtitle}
            </p>
          </div>

          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label={t.firstName}
                placeholder={t.phName}
                icon={<User size={18} />}
                value={formData.firstName}
                onChange={(e) => handleChange('firstName', e.target.value)}
                error={errors.firstName}
              />
              <Input
                label={t.lastName}
                placeholder={t.phName}
                icon={<User size={18} />}
                value={formData.lastName}
                onChange={(e) => handleChange('lastName', e.target.value)}
                error={errors.lastName}
              />
            </div>

            <Input
              label={t.email}
              placeholder={t.phEmail}
              icon={<Mail size={18} />}
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              error={errors.email}
            />

            <PhoneInput
              label={t.phone}
              value={formData.phone}
              onChangeText={(text) => handleChange('phone', text)}
              error={errors.phone}
            />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label={t.password}
                type="password"
                placeholder={t.phPassword}
                icon={<Lock size={18} />}
                value={formData.password}
                onChange={(e) => handleChange('password', e.target.value)}
                error={errors.password}
              />
              <Input
                label={t.confirmPassword}
                type="password"
                placeholder={t.phPassword}
                icon={<Lock size={18} />}
                value={formData.confirmPassword}
                onChange={(e) => handleChange('confirmPassword', e.target.value)}
                error={errors.confirmPassword}
              />
            </div>

            <div className="pt-4">
              <Button type="submit" className="w-full shadow-lg shadow-primary/20" isLoading={isLoading}>
                {t.registerBtn}
              </Button>
            </div>
          </form>
        </>
      )}

      <div className="text-center text-sm pb-2">
        <span className="text-slate-500">{t.haveAccount} </span>
        <button onClick={onSwitch} className="font-semibold text-primary hover:text-blue-600 transition-colors">
          {t.switchToLogin}
        </button>
      </div>
    </div>
  );
};
