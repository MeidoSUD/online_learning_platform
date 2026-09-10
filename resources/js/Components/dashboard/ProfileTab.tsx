// =====================================================
// ProfileTab — Flutter parity (edit_profile_screen_v2.dart)
// - أقسام منفصلة مثل فلاتر: الاسم / الجوال / البريد / كلمة المرور
//   (+ للمعلم: نبذة / مواد-لغات-قدرات / السعر / المؤهلات / معاينة)
// - كل قسم له حوار تعديل خاص وحفظ فوري، ورفع الصورة فوري.
// =====================================================

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLanguage } from '../../Contexts/LanguageContext';
import { useToast } from '../../Contexts/ToastContext';
import {
  Camera, ChevronLeft, ChevronRight, Eye, Loader2, Lock, Pencil, Trash2,
} from 'lucide-react';
import {
  authService, profileService, teacherService, UserData, getStorageUrl, tokenService,
} from '../../Services/api';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';

interface ProfileTabProps {
  onNavigate?: (tab: string) => void;
}

const PHONE_CODES = [
  { code: '+966', country: 'السعودية', countryEn: 'Saudi Arabia', flag: '🇸🇦' },
  { code: '+971', country: 'الإمارات', countryEn: 'UAE', flag: '🇦🇪' },
  { code: '+965', country: 'الكويت', countryEn: 'Kuwait', flag: '🇰🇼' },
  { code: '+968', country: 'عمان', countryEn: 'Oman', flag: '🇴🇲' },
  { code: '+973', country: 'البحرين', countryEn: 'Bahrain', flag: '🇧🇭' },
  { code: '+974', country: 'قطر', countryEn: 'Qatar', flag: '🇶🇦' },
  { code: '+20', country: 'مصر', countryEn: 'Egypt', flag: '🇪🇬' },
  { code: '+1', country: 'أمريكا', countryEn: 'USA', flag: '🇺🇸' },
];

/** بطاقة قسم بنفس شكل فلاتر _buildSectionCard */
const SectionCard: React.FC<{
  title: string;
  icon?: React.ReactNode;
  onIconTap?: () => void;
  children: React.ReactNode;
}> = ({ title, icon, onIconTap, children }) => (
  <div className="w-full bg-white rounded-[18px] shadow-[0_3px_10px_rgba(0,0,0,0.03)]">
    <div className="flex items-center justify-between px-4 pt-[14px] pb-[10px]">
      <span className="font-bold text-[15px] text-[#1F3D3A]">{title}</span>
      {onIconTap ? (
        <button
          type="button"
          onClick={onIconTap}
          className="w-8 h-8 rounded-full bg-black/[0.04] flex items-center justify-center text-[#1F3D3A]/70 hover:bg-black/10 transition-colors"
        >
          {icon}
        </button>
      ) : (
        <span className="w-8 h-8" />
      )}
    </div>
    <div className="h-px bg-black/[0.05]" />
    <div className="p-4">{children}</div>
  </div>
);

type DialogKind = 'name' | 'phone' | 'email' | 'bio' | 'price' | 'password' | null;

export const ProfileTab: React.FC<ProfileTabProps> = ({ onNavigate }) => {
  const { t, language, direction } = useLanguage();
  const { showToast } = useToast();
  const isAr = language === 'ar';

  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [dialog, setDialog] = useState<DialogKind>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // حقول الحوارات
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phoneCode, setPhoneCode] = useState('+966');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [bio, setBio] = useState('');
  const [price, setPrice] = useState('');
  const [pwdForm, setPwdForm] = useState({ current_password: '', new_password: '', new_password_confirmation: '' });

  const okMsg = (ar: string, en: string) => (isAr ? ar : en);

  const fetchProfile = async () => {
    if (!loading) setLoading(true);
    try {
      const response = await authService.getProfile();
      const userData: UserData = response.user?.data || response.data || response.user || response;
      if (!userData?.id) throw new Error('Invalid user data from API');
      setUser(userData);
      syncFromUser(userData);
      setPhotoPreview(null);
    } catch (error) {
      console.error('Failed to load profile', error);
    } finally {
      setLoading(false);
    }
  };

  /** نفس منطق _syncProfileData في فلاتر */
  const syncFromUser = (u: UserData) => {
    setFirstName(u.first_name || '');
    setLastName(u.last_name || '');
    setEmail(u.email || '');

    const fullPhone = (u.phone_number || '').trim();
    const codes = PHONE_CODES.map((c) => c.code);
    let matched: string | undefined;
    for (const c of codes) {
      if (fullPhone.startsWith(c)) { matched = c; break; }
    }
    if (u.role_id === 4) {
      setPhoneCode('+966');
      setPhoneNumber(
        fullPhone.startsWith('+966')
          ? fullPhone.substring(4).replace(/^[-\s]+/, '')
          : fullPhone,
      );
    } else if (matched) {
      setPhoneCode(matched);
      setPhoneNumber(fullPhone.substring(matched.length).replace(/^[-\s]+/, ''));
    } else {
      setPhoneCode('+966');
      setPhoneNumber(fullPhone);
    }

    const p: any = u.profile || {};
    const bioVal = p.user_bio ?? p.bio ?? (u as any).bio ?? '';
    setBio(bioVal || '');
    const priceVal = p.individual_hour_price ?? (u as any).individual_hour_price ?? '';
    if (priceVal === '' || priceVal == null) {
      setPrice('');
    } else {
      const num = Number(priceVal);
      setPrice(Number.isFinite(num) ? num.toFixed(2) : String(priceVal));
    }
  };

  useEffect(() => {
    fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isTeacher = user?.role_id === 3;
  const isStudent = user?.role_id === 4;

  const profile: any = useMemo(() => user?.profile || {}, [user]);

  const rawImage: any =
    isTeacher
      ? ((user as any)?.profile_image ?? profile?.profile_photo)
      : profile?.profile_photo;
  const imageUrl =
    typeof rawImage === 'string' && rawImage.startsWith('http')
      ? rawImage
      : getStorageUrl(rawImage);

  const displayName = `${firstName} ${lastName}`.trim();
  const displayBio: string = bio || profile?.user_bio || profile?.bio || '';
  const displayPrice: string =
    price !== '' ? price : (profile?.individual_hour_price != null ? Number(profile.individual_hour_price).toFixed(2) : '0.00');

  // ---- قسم التدريس (مواد / لغات / قدرات) بنفس منطق فلاتر ----
  const mainKey: string = String(
    profile?.main_service_key ??
    profile?.services?.[0]?.key_name ??
    profile?.services?.[0]?.keyName ??
    '',
  ).toLowerCase();
  const isLanguageService = mainKey.includes('lang');
  const isAbilityService = mainKey.includes('abilit');

  const pickName = (m: any): string => {
    const ar = m?.name_ar ?? m?.nameAr;
    const en = m?.name_en ?? m?.nameEn;
    if (isAr) {
      const a = String(ar ?? en ?? '').trim();
      if (a) return a;
      return String(en ?? '').trim();
    }
    const e = String(en ?? ar ?? '').trim();
    if (e) return e;
    return String(ar ?? '').trim();
  };

  const liveSubjects: string[] = useMemo(() => {
    const arr = profile?.teacher_subjects;
    if (!Array.isArray(arr)) return [];
    return arr
      .map((s: any) => String(s?.title ?? s?.classTitle ?? s?.name_ar ?? s?.name_en ?? '').trim())
      .filter(Boolean);
  }, [profile]);

  const liveLanguages: string[] = useMemo(() => {
    const arr = profile?.languages;
    if (!Array.isArray(arr)) return [];
    const out: string[] = [];
    for (const e of arr) {
      if (typeof e === 'string' && e.trim()) out.push(e.trim());
      else if (e && typeof e === 'object') {
        const n = e?.language ? String(e.language?.name_ar || e.language?.name_en || '').trim() : pickName(e);
        if (n) out.push(n);
      }
    }
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile, isAr]);

  const liveAbilities: string[] = useMemo(() => {
    const arr = profile?.abilities;
    if (!Array.isArray(arr)) return [];
    const out: string[] = [];
    for (const e of arr) {
      if (typeof e === 'string' && e.trim()) out.push(e.trim());
      else if (e && typeof e === 'object') {
        const n = pickName(e);
        if (n) out.push(n);
      }
    }
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile, isAr]);

  const teachTitle = isLanguageService
    ? okMsg('اللغات التي أدرّسها', 'Languages I teach')
    : isAbilityService
      ? okMsg('القدرات التي أدرّسها', 'Abilities I teach')
      : okMsg('المواد التي أدرّسها', 'Subjects I teach');
  const teachItems = isLanguageService ? liveLanguages : isAbilityService ? liveAbilities : liveSubjects;
  const teachEmpty = isLanguageService
    ? okMsg('لا توجد لغات مضافة بعد.', 'No languages added yet.')
    : isAbilityService
      ? okMsg('لا توجد قدرات مضافة بعد.', 'No abilities added yet.')
      : okMsg('لا توجد مواد مضافة بعد.', 'No subjects added yet.');
  const teachTab = isLanguageService ? 'languages' : isAbilityService ? 'abilities' : 'private-lessons';

  const hasCertificate = Boolean(
    (profile?.certificate && String(profile.certificate).length > 0) ||
    (profile?.resume && String(profile.resume).length > 0) ||
    profile?.certificate_attachment,
  );
  const certUrl: string = (() => {
    const raw: string =
      profile?.certificate || profile?.certificate_attachment?.file_path || profile?.certificate_attachment?.filePath || profile?.resume || '';
    if (!raw) return '';
    // رابط كامل؟ يُستخدم كما هو — وإلا يُبنى من مسار التخزين مع منع تكرار storage/
    if (/^https?:\/\//i.test(raw)) return raw;
    const clean = String(raw).replace(/^\//, '').replace(/^storage\//, '');
    return getStorageUrl(clean);
  })();

  // ---- حفظ ----
  const saveProfileFields = async (fields: Record<string, string>, file?: File, key = 'save') => {
    setSavingKey(key);
    try {
      const fd = new FormData();
      Object.entries(fields).forEach(([k, v]) => fd.append(k, v));
      if (file) fd.append('profile_photo', file);
      await profileService.updateProfile(fd);
      await fetchProfile();
      showToast(okMsg('تم الحفظ بنجاح', 'Saved successfully'), 'success');
      setDialog(null);
    } catch (e: any) {
      showToast(e?.message || okMsg('فشل الحفظ', 'Save failed'), 'error');
    } finally {
      setSavingKey(null);
    }
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoPreview(URL.createObjectURL(file));
    // رفع فوري مثل فلاتر _pickImage
    await saveProfileFields({}, file, 'photo');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSaveName = async () => {
    if (!firstName.trim()) return;
    await saveProfileFields({ first_name: firstName.trim(), last_name: lastName.trim() }, undefined, 'name');
  };

  const handleSavePhone = async () => {
    let entered = phoneNumber.trim();
    if (!entered) return;
    if (entered.startsWith('0')) entered = entered.substring(1);
    await saveProfileFields({ phone_number: `${phoneCode}${entered}` }, undefined, 'phone');
  };

  const handleSaveEmail = async () => {
    if (!email.trim()) return;
    await saveProfileFields({ email: email.trim() }, undefined, 'email');
  };

  const handleSaveBio = async () => {
    await saveProfileFields({ bio }, undefined, 'bio');
  };

  const handleSavePrice = async () => {
    const val = Number(price);
    if (isNaN(val) || val < 0) {
      showToast(okMsg('يرجى إدخال سعر صحيح', 'Please enter a valid price'), 'error');
      return;
    }
    setSavingKey('price');
    try {
      await teacherService.updateInfo({
        teach_individual: 1,
        individual_hour_price: val,
        teach_group: 0,
        group_hour_price: 0,
        max_group_size: 0,
      });
      await fetchProfile();
      showToast(okMsg('تم الحفظ بنجاح', 'Saved successfully'), 'success');
      setDialog(null);
    } catch (e: any) {
      showToast(e?.message || okMsg('فشل الحفظ', 'Save failed'), 'error');
    } finally {
      setSavingKey(null);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pwdForm.new_password !== pwdForm.new_password_confirmation) {
      showToast(okMsg('كلمات المرور غير متطابقة', 'Passwords do not match'), 'error');
      return;
    }
    setSavingKey('password');
    try {
      await authService.confirmPassword({ password: pwdForm.current_password });
      await authService.changePassword({
        new_password: pwdForm.new_password,
        new_password_confirmation: pwdForm.new_password_confirmation,
      });
      showToast(okMsg('تم تغيير كلمة المرور بنجاح', 'Password updated successfully'), 'success');
      setPwdForm({ current_password: '', new_password: '', new_password_confirmation: '' });
      setDialog(null);
    } catch (err: any) {
      showToast(err?.message || okMsg('فشل تغيير كلمة المرور', 'Failed to update password'), 'error');
    } finally {
      setSavingKey(null);
    }
  };

  const handleDeleteAccount = async () => {
    if (!confirm(okMsg('هل أنت متأكد؟ سيتم حذف حسابك نهائياً.', 'Are you sure? This will permanently delete your account.'))) return;
    try {
      await authService.deleteAccount();
      tokenService.removeToken();
      window.location.reload();
    } catch (e) {
      console.error(e);
      showToast(okMsg('فشل حذف الحساب', 'Failed to delete account'), 'error');
    }
  };

  const openDialogWithFresh = (kind: Exclude<DialogKind, null>) => {
    if (user) {
      if (kind === 'name') { setFirstName(user.first_name || firstName); setLastName(user.last_name || lastName); }
      if (kind === 'email') setEmail(user.email || '');
      if (kind === 'phone' && isStudent) setPhoneCode('+966');
    }
    setDialog(kind);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="animate-spin h-8 w-8 text-primary" />
      </div>
    );
  }

  if (!user) return <div className="p-10 text-center text-red-500">{okMsg('فشل تحميل الملف الشخصي.', 'Failed to load profile.')}</div>;

  const dialogTitle =
    dialog === 'name' ? okMsg('تعديل الاسم', 'Edit name')
    : dialog === 'phone' ? okMsg('تعديل رقم الجوال', 'Edit phone number')
    : dialog === 'email' ? okMsg('تعديل البريد الإلكتروني', 'Edit email')
    : dialog === 'bio' ? okMsg('تعديل نبذة عني', 'Edit bio')
    : dialog === 'price' ? okMsg('تعديل سعر الساعة', 'Edit hourly price')
    : dialog === 'password' ? okMsg('تغيير كلمة المرور', 'Change password')
    : '';

  const avatarSrc = photoPreview || imageUrl || '';
  const chevIcon = direction === 'rtl'
    ? <ChevronLeft size={18} className="text-primary" />
    : <ChevronRight size={18} className="text-primary" />;

  return (
    <div className="max-w-3xl mx-auto px-5 py-5 space-y-4 animate-fade-in" dir={direction}>
      {/* الصورة الشخصية */}
      <div className="flex flex-col items-center">
        <div className="w-[92px] h-[92px] rounded-full bg-black/[0.05] overflow-hidden flex items-center justify-center text-3xl font-bold text-[#1F3D3A]">
          {avatarSrc
            ? <img src={avatarSrc} alt="Profile" className="h-full w-full object-cover" />
            : (displayName.charAt(0)?.toUpperCase() || 'U')}
        </div>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={savingKey === 'photo'}
          className="mt-3 px-[18px] py-2 rounded-[14px] bg-[#6B8782] text-white text-[13px] font-bold hover:opacity-90 transition-opacity disabled:opacity-60 inline-flex items-center gap-2"
        >
          {savingKey === 'photo' ? <Loader2 size={14} className="animate-spin" /> : <Camera size={14} />}
          {okMsg('تغيير الصورة الشخصية', 'Change profile photo')}
        </button>
        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handlePhotoChange} />
      </div>

      <div className="h-2" />

      {/* الاسم */}
      <SectionCard title={okMsg('الاسم', 'Name')} icon={<Pencil size={18} />} onIconTap={() => openDialogWithFresh('name')}>
        <p className={`text-[15px] font-medium ${displayName ? 'text-[#1F3D3A]' : 'text-[#1F3D3A]/50'}`}>
          {displayName || okMsg('لا يوجد اسم مضاف', 'No name added')}
        </p>
      </SectionCard>

      {/* رقم الجوال */}
      <SectionCard title={okMsg('رقم الجوال', 'Phone number')} icon={<Pencil size={18} />} onIconTap={() => openDialogWithFresh('phone')}>
        <div dir="ltr" className="flex items-center gap-[6px]">
          <span className="text-[15px] font-bold text-[#1F3D3A]">{phoneCode}</span>
          <span className="text-[15px] font-medium text-[#1F3D3A]">{phoneNumber || user.phone_number}</span>
        </div>
      </SectionCard>

      {/* البريد الإلكتروني */}
      <SectionCard title={okMsg('البريد الإلكتروني', 'Email')} icon={<Pencil size={18} />} onIconTap={() => openDialogWithFresh('email')}>
        <p className={`text-[15px] font-medium ${user.email ? 'text-[#1F3D3A]' : 'text-[#1F3D3A]/50'}`}>
          {user.email || okMsg('لا يوجد بريد إلكتروني', 'No email')}
        </p>
      </SectionCard>

      {/* كلمة المرور */}
      <SectionCard title={okMsg('كلمة المرور', 'Password')} icon={<Lock size={18} />} onIconTap={() => setDialog('password')}>
        <button type="button" onClick={() => setDialog('password')} className="w-full flex items-center justify-between">
          <span className="text-base font-bold tracking-[2px] text-[#1F3D3A]">••••••••</span>
          <span className="inline-flex items-center gap-1 text-[12px] font-semibold text-primary">
            {okMsg('تغيير كلمة المرور', 'Change password')}
            {chevIcon}
          </span>
        </button>
      </SectionCard>

      {isTeacher && (
        <>
          {/* نبذة عني */}
          <SectionCard title={t.bio || okMsg('نبذة عني', 'Bio')} icon={<Pencil size={18} />} onIconTap={() => openDialogWithFresh('bio')}>
            <p className={`text-sm leading-[1.6] ${displayBio ? 'text-[#1F3D3A]' : 'text-[#1F3D3A]/50'}`}>
              {displayBio || okMsg('لا توجد نبذة تعريفية مضافة بعد.', 'No bio added yet.')}
            </p>
          </SectionCard>

          {/* المواد / اللغات / القدرات */}
          <SectionCard
            title={teachTitle}
            icon={<Pencil size={18} />}
            onIconTap={() => { if (onNavigate) onNavigate(teachTab); }}
          >
            {teachItems.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {teachItems.map((s, i) => (
                  <span key={i} className="px-[14px] py-2 rounded-xl bg-[#F4F7F6] text-[#1F3D3A] text-[13px] font-semibold">
                    {s}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-[#1F3D3A]/50">{teachEmpty}</p>
            )}
          </SectionCard>

          {/* الخدمات والأسعار */}
          <SectionCard title={okMsg('الخدمات والأسعار', 'Services & Pricing')} icon={<Pencil size={18} />} onIconTap={() => openDialogWithFresh('price')}>
            <div className="flex items-center gap-1" dir={isAr ? 'rtl' : 'ltr'}>
              <span className="text-xl font-bold text-[#1F3D3A]">{displayPrice} </span>
              <span className="text-sm text-[#1F3D3A]/70">{t.sar || (isAr ? 'ر.س' : 'SAR')}{t.perHour || (isAr ? '/ساعة' : '/hr')}</span>
            </div>
          </SectionCard>

          {/* المؤهلات التعليمية */}
          <SectionCard
            title={okMsg('المؤهلات التعليمية', 'Qualifications')}
            icon={<Pencil size={18} />}
            onIconTap={() => { if (onNavigate) onNavigate('services'); }}
          >
            {hasCertificate && certUrl ? (
              <a href={certUrl} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-primary underline">
                {okMsg('المؤهلات التعليمية مرفقة (عرض الملف)', 'Qualifications attached (view file)')}
              </a>
            ) : (
              <p className="text-sm text-[#1F3D3A]/50">{okMsg('لا توجد بيانات مرفقة', 'No attachments')}</p>
            )}
          </SectionCard>

          <div className="h-2" />

          {/* معاينة ملفي التعريفي */}
          <button
            type="button"
            onClick={() => setPreviewOpen(true)}
            className="w-full h-[52px] rounded-2xl border-[1.5px] border-primary bg-white text-primary text-base font-bold hover:bg-primary hover:text-white transition-colors inline-flex items-center justify-center gap-2"
          >
            <Eye size={18} />
            {okMsg('معاينة ملفي التعريفي', 'Preview my profile')}
          </button>
        </>
      )}

      <div className="pt-4 border-t border-[var(--border)] flex justify-center">
        <button onClick={handleDeleteAccount} className="flex items-center gap-2 text-red-500 hover:text-red-700 text-sm font-medium transition-colors">
          <Trash2 size={16} /> {isAr ? 'حذف الحساب' : 'Delete Account'}
        </button>
      </div>

      {/* ===== الحوارات (كل حوار مستقل مثل فلاتر) ===== */}
      <Modal isOpen={dialog !== null} onClose={() => setDialog(null)} title={dialogTitle}>
        {dialog === 'name' && (
          <div className="space-y-3">
            <Input label={t.firstName} value={firstName} onChange={(e) => setFirstName(e.target.value)} />
            <Input label={t.lastName} value={lastName} onChange={(e) => setLastName(e.target.value)} />
            <div className="flex gap-3 pt-1">
              <Button variant="ghost" className="flex-1" onClick={() => setDialog(null)}>{t.cancel}</Button>
              <Button className="flex-1" onClick={handleSaveName} isLoading={savingKey === 'name'}>{t.save}</Button>
            </div>
          </div>
        )}

        {dialog === 'phone' && (
          <div className="space-y-4">
            <div dir="ltr" className="flex gap-2">
              <select
                value={phoneCode}
                onChange={(e) => setPhoneCode(e.target.value)}
                disabled={isStudent}
                className="rounded-xl border border-[var(--border)] bg-[#F4F7F6] px-2 py-3 text-sm font-medium focus:outline-none disabled:opacity-70 max-w-[150px]"
              >
                {(isStudent ? PHONE_CODES.filter((c) => c.code === '+966') : PHONE_CODES).map((c) => (
                  <option key={c.code} value={c.code}>{c.flag} {c.code}</option>
                ))}
              </select>
              <input
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="5xxxxxxxx"
                inputMode="tel"
                className="flex-1 rounded-xl border border-[var(--border)] px-3 py-3 text-sm focus:outline-none focus:border-primary"
              />
            </div>
            {isStudent && (
              <p className="text-xs text-[var(--text-muted)]" dir={direction}>
                {okMsg('للطالب: الرقم السعودي (+966) فقط.', 'For students: Saudi numbers (+966) only.')}
              </p>
            )}
            <div className="flex gap-3">
              <Button variant="ghost" className="flex-1" onClick={() => setDialog(null)}>{t.cancel}</Button>
              <Button className="flex-1" onClick={handleSavePhone} isLoading={savingKey === 'phone'}>{t.save}</Button>
            </div>
          </div>
        )}

        {dialog === 'email' && (
          <div className="space-y-3">
            <Input label={okMsg('البريد الإلكتروني', 'Email')} type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            <div className="flex gap-3">
              <Button variant="ghost" className="flex-1" onClick={() => setDialog(null)}>{t.cancel}</Button>
              <Button className="flex-1" onClick={handleSaveEmail} isLoading={savingKey === 'email'}>{t.save}</Button>
            </div>
          </div>
        )}

        {dialog === 'bio' && (
          <div className="space-y-3">
            <label className="block text-sm font-medium text-navy">{t.bio}</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={4}
              placeholder={okMsg('اكتب نبذة عن خبراتك وأسلوبك في التدريس...', 'Write about your experience and teaching style...')}
              className="w-full rounded-xl border border-[var(--border)] p-3 text-sm focus:outline-none focus:border-primary"
            />
            <div className="flex gap-3">
              <Button variant="ghost" className="flex-1" onClick={() => setDialog(null)}>{t.cancel}</Button>
              <Button className="flex-1" onClick={handleSaveBio} isLoading={savingKey === 'bio'}>{t.save}</Button>
            </div>
          </div>
        )}

        {dialog === 'price' && (
          <div className="space-y-3">
            <Input
              label={`${okMsg('السعر بالساعة', 'Hourly price')} (${t.sar || (isAr ? 'ر.س' : 'SAR')})`}
              type="number"
              min="0"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
            <div className="flex gap-3">
              <Button variant="ghost" className="flex-1" onClick={() => setDialog(null)}>{t.cancel}</Button>
              <Button className="flex-1" onClick={handleSavePrice} isLoading={savingKey === 'price'}>{t.save}</Button>
            </div>
          </div>
        )}

        {dialog === 'password' && (
          <form onSubmit={handleChangePassword} className="space-y-3">
            <Input label={okMsg('كلمة المرور الحالية', 'Current password')} type="password" value={pwdForm.current_password} onChange={(e) => setPwdForm({ ...pwdForm, current_password: e.target.value })} required />
            <Input label={okMsg('كلمة المرور الجديدة', 'New password')} type="password" value={pwdForm.new_password} onChange={(e) => setPwdForm({ ...pwdForm, new_password: e.target.value })} required />
            <Input label={t.confirmPassword} type="password" value={pwdForm.new_password_confirmation} onChange={(e) => setPwdForm({ ...pwdForm, new_password_confirmation: e.target.value })} required />
            <div className="flex gap-3 pt-1">
              <Button variant="ghost" className="flex-1" type="button" onClick={() => setDialog(null)}>{t.cancel}</Button>
              <Button className="flex-1" type="submit" isLoading={savingKey === 'password'}>{t.save}</Button>
            </div>
          </form>
        )}
      </Modal>

      {/* معاينة الملف التعريفي */}
      <Modal isOpen={previewOpen} onClose={() => setPreviewOpen(false)} title={okMsg('معاينة ملفي التعريفي', 'My public profile')}>
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="w-20 h-20 rounded-full overflow-hidden bg-black/[0.05] flex items-center justify-center text-2xl font-bold text-[#1F3D3A]">
            {avatarSrc ? <img src={avatarSrc} alt="" className="h-full w-full object-cover" /> : displayName.charAt(0)?.toUpperCase()}
          </div>
          <h3 className="text-lg font-bold">{displayName}</h3>
          {displayBio && <p className="text-sm text-[var(--text-muted)] leading-relaxed">{displayBio}</p>}
          {teachItems.length > 0 && (
            <div className="flex flex-wrap justify-center gap-2">
              {teachItems.map((s, i) => (
                <span key={i} className="px-3 py-1 rounded-lg bg-[#F4F7F6] text-xs font-semibold text-[#1F3D3A]">{s}</span>
              ))}
            </div>
          )}
          <p className="font-bold text-[#1F3D3A]">{displayPrice} {t.sar || (isAr ? 'ر.س' : 'SAR')}{t.perHour || (isAr ? '/ساعة' : '/hr')}</p>
        </div>
      </Modal>
    </div>
  );
};
