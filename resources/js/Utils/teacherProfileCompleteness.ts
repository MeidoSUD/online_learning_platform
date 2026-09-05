// =========================================================
// Teacher profile completeness helper (web/view only).
// Mirrors the backend completion rules (ProfileCompleteHelper)
// and adds per-service dependencies:
//   private_lessons          -> subjects
//   language_learning        -> languages
//   specialized_courses      -> courses
// =========================================================

export interface TeacherMissingItem {
  key: string;                 // stable id
  tab: string;                 // dashboard tab to jump to
  textEn: string;
  textAr: string;
  lockedBeforeVerification?: boolean; // tab only unlocks after the account is verified
}

export const parseBool = (v: any): boolean =>
  v === true || v === 1 || String(v) === '1' || String(v).toLowerCase() === 'true';

export interface TeacherCompleteness {
  verified: boolean;
  hasService: boolean;
  serviceKeys: string[];
  missing: TeacherMissingItem[];
  isComplete: boolean;          // everything done (including admin verification)
  canOfferPackages: boolean;     // every item a teacher can fix by themselves is done
}

export const getTeacherProfileCompleteness = (user: any): TeacherCompleteness => {
  const profile = user?.profile || {};
  const services = Array.isArray(profile.services) ? profile.services : [];
  const serviceKeys = services
    .map((s: any) => s?.key_name)
    .filter((k: any): k is string => !!k);
  const hasService = services.length > 0 || !!profile.service;

  const verified = parseBool(user?.verified);

  const missing: TeacherMissingItem[] = [];

  if (!hasService) {
    missing.push({
      key: 'service',
      tab: 'services',
      textEn: 'Choose at least one service you provide',
      textAr: 'اختر خدمة واحدة على الأقل تقدمها',
    });
  }

  const hasCertificate = verified || !!(profile.certificate || profile.certificate_attachment || profile.resume);
  if (!hasCertificate) {
    missing.push({
      key: 'certificate',
      tab: 'services',
      textEn: 'Upload your certificate (PDF / JPG / PNG)',
      textAr: 'ارفع شهادتك (ملف PDF أو صورة)',
    });
  }

  const price = Number(profile.individual_hour_price || 0);
  if (price <= 0) {
    missing.push({
      key: 'price',
      tab: 'services',
      textEn: 'Set your hourly price',
      textAr: 'حدد سعر الساعة الخاص بك',
    });
  }

  const slots = Array.isArray(profile.available_times) ? profile.available_times : [];
  if (slots.length === 0) {
    missing.push({
      key: 'availability',
      tab: 'schedule',
      textEn: 'Add your available time slots',
      textAr: 'أضف أوقاتك المتاحة',
      lockedBeforeVerification: true,
    });
  }

  if (serviceKeys.includes('private_lessons')) {
    const subjects = Array.isArray(profile.teacher_subjects) ? profile.teacher_subjects : [];
    if (subjects.length === 0) {
      missing.push({
        key: 'subjects',
        tab: 'private-lessons',
        textEn: 'Add your subjects (Private Lessons service)',
        textAr: 'أضف موادك الدراسية (خدمة الدروس الخصوصية)',
        lockedBeforeVerification: true,
      });
    }
  }

  if (serviceKeys.includes('language_learning')) {
    const languages = Array.isArray(profile.languages) ? profile.languages : [];
    if (languages.length === 0) {
      missing.push({
        key: 'languages',
        tab: 'languages',
        textEn: 'Add the languages you teach (Language Learning service)',
        textAr: 'أضف اللغات التي تدرسها (خدمة تعلم اللغات)',
      });
    }
  }

  if (serviceKeys.includes('specialized_courses')) {
    const courses = Array.isArray(profile.courses) ? profile.courses : [];
    if (courses.length === 0) {
      missing.push({
        key: 'courses',
        tab: 'courses',
        textEn: 'Add at least one course (Specialized Courses service)',
        textAr: 'أضف دورة واحدة على الأقل (خدمة الدورات المتخصصة)',
      });
    }
  }

  if (!verified) {
    missing.push({
      key: 'verified',
      tab: 'services',
      textEn: 'Your account is awaiting verification by the admin',
      textAr: 'حسابك بانتظار توثيق الإدارة',
    });
  }

  const isComplete = missing.length === 0;
  // OFF is always allowed; ON requires a fully complete profile. Because
  // 'verified' is pushed into `missing` whenever the account is unverified,
  // missing.length === 0 implies the account is verified AND every item the
  // teacher controls (service, price, slots, per-service items) is done.
  const canOfferPackages = missing.length === 0;

  return { verified, hasService, serviceKeys, missing, isComplete, canOfferPackages };
};