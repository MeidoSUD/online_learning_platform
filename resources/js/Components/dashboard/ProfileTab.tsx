import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLanguage } from '../../Contexts/LanguageContext';
import { useToast } from '../../Contexts/ToastContext';
import {
  Camera,
  ChevronLeft,
  ChevronRight,
  Eye,
  Loader2,
  Pencil,
  Trash2,
  CheckCircle,
  CheckCircle2,
  Settings,
  BadgeCheck,
  Video,
  Upload,
  Globe,
  GraduationCap,
  BookOpen,
  Award,
  Play,
  RefreshCw,
  X,
  Check,
  Square,
  RotateCcw,
  SwitchCamera
} from 'lucide-react';
import {
  authService,
  profileService,
  teacherService,
  UserData,
  getStorageUrl,
  tokenService,
} from '../../Services/api';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { TeacherPublicProfileModal } from '../teacher/TeacherPublicProfileModal';

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

const SectionCard: React.FC<{
  title: string;
  icon?: React.ReactNode;
  onIconTap?: () => void;
  children: React.ReactNode;
}> = ({ title, icon, onIconTap, children }) => (
  <div className="w-full bg-white rounded-[18px] shadow-[0_3px_10px_rgba(0,0,0,0.03)] border border-slate-100">
    <div className="flex items-center justify-between px-4 pt-[14px] pb-[10px]">
      <span className="font-bold text-[15px] text-[#0D4A5F]">{title}</span>
      {onIconTap ? (
        <button
          type="button"
          onClick={onIconTap}
          className="w-8 h-8 rounded-full bg-black/[0.04] flex items-center justify-center text-[#0D4A5F]/70 hover:bg-black/10 transition-colors"
        >
          {icon}
        </button>
      ) : icon ? (
        <div className="w-8 h-8 rounded-full bg-black/[0.04] flex items-center justify-center text-[#0D4A5F]/70">
          {icon}
        </div>
      ) : (
        <span className="w-8 h-8" />
      )}
    </div>
    <div className="h-px bg-black/[0.05]" />
    <div className="p-4">{children}</div>
  </div>
);

type DialogKind = 'name' | 'phone' | 'email' | 'bio' | 'price' | null;

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
  const videoInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [videoSourceModal, setVideoSourceModal] = useState(false);
  const [videoPlayerModal, setVideoPlayerModal] = useState(false);
  const [cameraRecorderOpen, setCameraRecorderOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [recordedVideoBlob, setRecordedVideoBlob] = useState<Blob | null>(null);
  const [recordedVideoUrl, setRecordedVideoUrl] = useState<string | null>(null);
  const [cameraFacingMode, setCameraFacingMode] = useState<'user' | 'environment'>('user');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false);

  const cameraStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<any>(null);
  const cameraLiveVideoRef = useRef<HTMLVideoElement | null>(null);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phoneCode, setPhoneCode] = useState('+966');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [bio, setBio] = useState('');
  const [price, setPrice] = useState('');
  const [teacherServicesList, setTeacherServicesList] = useState<any[]>([]);

  const okMsg = (ar: string, en: string) => (isAr ? ar : en);

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

  const fetchProfile = async () => {
    try {
      const response = await authService.getProfile();
      const userData: UserData = response.user?.data || response.data || response.user || response;
      if (!userData?.id) throw new Error('Invalid user data from API');
      setUser(userData);
      syncFromUser(userData);
      setPhotoPreview(null);

      if (userData.role_id === 3) {
        teacherService.getTeacherServices()
          .then((res: any) => {
            const data = res?.data || res;
            const current = Array.isArray(data?.current_services) ? data.current_services : [];
            setTeacherServicesList(current);
          })
          .catch(() => {});
      }
    } catch (error) {
      console.error('Failed to load profile', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
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

  const mainKey: string = String(
    profile?.main_service_key ??
    profile?.services?.[0]?.key_name ??
    profile?.services?.[0]?.keyName ??
    '',
  ).toLowerCase();
  const isLanguageService = mainKey.includes('lang');
  const isAbilityService = mainKey.includes('abilit');
  const isCourseService = mainKey.includes('course') || mainKey.includes('training');

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
  }, [profile, isAr]);

  const liveCourses: string[] = useMemo(() => {
    const arr = profile?.courses;
    if (!Array.isArray(arr)) return [];
    const out: string[] = [];
    for (const e of arr) {
      if (typeof e === 'string' && e.trim()) out.push(e.trim());
      else if (e && typeof e === 'object') {
        const n = String(e.name || e.title || '').trim();
        if (n) out.push(n);
      }
    }
    return out;
  }, [profile]);

  const teachTitle = isLanguageService
    ? okMsg('اللغات التي أدرّسها', 'Languages I teach')
    : isAbilityService
      ? okMsg('القدرات التي أدرّسها', 'Abilities I teach')
      : isCourseService
        ? okMsg('الدورات التدريبية', 'Training courses')
        : okMsg('المواد التي أدرّسها', 'Subjects I teach');
  const teachItems = isLanguageService ? liveLanguages : isAbilityService ? liveAbilities : isCourseService ? liveCourses : liveSubjects;
  const teachEmpty = isLanguageService
    ? okMsg('لا توجد لغات مضافة بعد.', 'No languages added yet.')
    : isAbilityService
      ? okMsg('لا توجد قدرات مضافة بعد.', 'No abilities added yet.')
      : isCourseService
        ? okMsg('لا توجد دورات تدريبية مضافة بعد.', 'No courses added yet.')
        : okMsg('لا توجد مواد مضافة بعد.', 'No subjects added yet.');
  const teachTab = isLanguageService ? 'languages' : isAbilityService ? 'abilities' : isCourseService ? 'courses' : 'private-lessons';

  const userServicesList: any[] = useMemo(() => {
    if (Array.isArray(profile?.services) && profile.services.length > 0) {
      return profile.services;
    }
    if (Array.isArray(teacherServicesList) && teacherServicesList.length > 0) {
      return teacherServicesList;
    }
    return [];
  }, [profile, teacherServicesList]);

  const currentServiceName = useMemo(() => {
    if (userServicesList.length > 0) {
      const match = userServicesList.find((s: any) => {
        const k = String(s?.key_name || s?.keyName || '').toLowerCase();
        return mainKey && k === mainKey;
      });
      if (match) {
        return pickName(match);
      }
      return pickName(userServicesList[0]);
    }
    if (mainKey.includes('book')) return isAr ? 'الكتب الدراسية' : 'Study Books';
    if (mainKey.includes('lang')) return isAr ? 'تعليم اللغات' : 'Language Learning';
    if (mainKey.includes('abilit')) return isAr ? 'اختبارات القدرات' : 'Abilities Tests';
    if (mainKey.includes('course') || mainKey.includes('training')) return isAr ? 'الدورات التدريبية' : 'Training Courses';
    return isAr ? 'الدروس الخصوصية' : 'Private Lessons';
  }, [userServicesList, mainKey, isAr]);

  const introVideoUrl: string = useMemo(() => {
    const raw = String(
      profile?.intro_video ||
      (user as any)?.intro_video ||
      profile?.intro_video_url ||
      (user as any)?.intro_video_url ||
      ''
    ).trim();
    if (!raw) return '';
    if (/^https?:\/\//i.test(raw)) return raw;
    const clean = raw.replace(/^\//, '').replace(/^storage\//, '');
    return getStorageUrl(clean);
  }, [profile, user]);

  const hasCertificate = Boolean(
    (profile?.certificate && String(profile.certificate).length > 0) ||
    (profile?.resume && String(profile.resume).length > 0) ||
    profile?.certificate_attachment,
  );
  const certUrl: string = (() => {
    const raw: string =
      profile?.certificate || profile?.certificate_attachment?.file_path || profile?.certificate_attachment?.filePath || profile?.resume || '';
    if (!raw) return '';
    if (/^https?:\/\//i.test(raw)) return raw;
    const clean = String(raw).replace(/^\//, '').replace(/^storage\//, '');
    return getStorageUrl(clean);
  })();

  const saveProfileFields = async (
    fields: Record<string, string>,
    photoFile?: File,
    key = 'save',
  ) => {
    setSavingKey(key);
    try {
      const fd = new FormData();
      Object.entries(fields).forEach(([k, v]) => fd.append(k, v));
      if (photoFile) fd.append('profile_photo', photoFile);
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
    await saveProfileFields({}, file, 'photo');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleIntroVideoFile = async (file: File) => {
    if (!file) return;
    const maxSize = 95 * 1024 * 1024;
    if (file.size > maxSize) {
      showToast(okMsg('حجم الفيديو يتجاوز الحد المسموح به (100 ميجابايت)', 'Video size exceeds allowed limit (100 MB)'), 'error');
      return;
    }

    const rawExt = file.name.split('.').pop()?.toLowerCase() || 'mp4';
    const ext = rawExt.length <= 5 && !rawExt.includes('/') ? rawExt : 'mp4';
    const safeName = `intro_video_${Date.now()}.${ext}`;
    const safeMime = ext === 'mov' ? 'video/quicktime' : (file.type || 'video/mp4');
    const safeFile = new File([file], safeName, { type: safeMime });

    setUploadingVideo(true);
    setUploadProgress(0);

    try {
      const fd = new FormData();
      fd.append('intro_video', safeFile, safeName);
      if (user?.first_name) fd.append('first_name', user.first_name);
      if (user?.last_name) fd.append('last_name', user.last_name);
      if (user?.phone_number) fd.append('phone_number', user.phone_number);
      if (user?.email) fd.append('email', user.email);
      if (user?.nationality) fd.append('nationality', user.nationality);
      if (bio) fd.append('bio', bio);

      await profileService.updateProfileWithProgress(fd, (pct) => {
        setUploadProgress(pct);
      });

      const freshResponse = await authService.getProfile();
      const freshUser: UserData = freshResponse.user?.data || freshResponse.data || freshResponse.user || freshResponse;
      if (freshUser?.id) {
        setUser(freshUser);
        syncFromUser(freshUser);
      }

      const freshProfile = (freshUser?.profile || {}) as any;
      const serverVideo = (freshProfile?.intro_video || (freshUser as any)?.intro_video || '').trim();

      if (serverVideo) {
        showToast(okMsg('تم رفع الفيديو التعريفي بنجاح', 'Intro video uploaded successfully'), 'success');
      } else {
        showToast(okMsg('فشل رفع الفيديو — تحقق من الاتصال وحاول مجدداً', 'Failed to upload video — check connection and retry'), 'error');
      }
    } catch (e: any) {
      showToast(e?.message || okMsg('فشل رفع الفيديو — تحقق من الاتصال وحاول مجدداً', 'Failed to upload video — check connection and retry'), 'error');
    } finally {
      setUploadingVideo(false);
      setUploadProgress(0);
      if (videoInputRef.current) videoInputRef.current.value = '';
      if (cameraInputRef.current) cameraInputRef.current.value = '';
    }
  };

  const handleVideoInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    handleIntroVideoFile(file);
  };

  const stopCameraStream = () => {
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach((track) => track.stop());
      cameraStreamRef.current = null;
    }
    if (cameraLiveVideoRef.current) {
      cameraLiveVideoRef.current.srcObject = null;
    }
  };

  const closeCameraRecorder = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch {}
    }
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    stopCameraStream();
    if (recordedVideoUrl) {
      URL.revokeObjectURL(recordedVideoUrl);
    }
    setRecordedVideoUrl(null);
    setRecordedVideoBlob(null);
    setIsRecording(false);
    setRecordingSeconds(0);
    setCameraError(null);
    setCameraRecorderOpen(false);
  };

  const initCameraStream = async (mode: 'user' | 'environment') => {
    stopCameraStream();
    setCameraError(null);

    if (!navigator?.mediaDevices?.getUserMedia) {
      setCameraError(
        okMsg(
          'المتصفح لا يدعم تسجيل الكاميرا المباشر، يمكنك اختيار ملف فيديو بدلاً من ذلك.',
          'Browser does not support live camera recording, you can choose a video file instead.'
        )
      );
      return;
    }

    try {
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: mode,
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: true,
        });
      } catch {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: mode,
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });
      }

      cameraStreamRef.current = stream;
      if (cameraLiveVideoRef.current) {
        cameraLiveVideoRef.current.srcObject = stream;
        try {
          await cameraLiveVideoRef.current.play();
        } catch {}
      }

      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter((d) => d.kind === 'videoinput');
        setHasMultipleCameras(videoDevices.length > 1);
      } catch {}
    } catch {
      setCameraError(
        okMsg(
          'تعذر الوصول إلى الكاميرا. يرجى التأكد من توصيل الكاميرا والسماح بالوصول إليها من إعدادات المتصفح.',
          'Could not access camera. Please check camera connection and browser permissions.'
        )
      );
    }
  };

  const handleToggleFacingMode = () => {
    if (isRecording) return;
    const nextMode = cameraFacingMode === 'user' ? 'environment' : 'user';
    setCameraFacingMode(nextMode);
    initCameraStream(nextMode);
  };

  const startRecording = () => {
    if (!cameraStreamRef.current) return;
    if (recordedVideoUrl) {
      URL.revokeObjectURL(recordedVideoUrl);
      setRecordedVideoUrl(null);
    }
    setRecordedVideoBlob(null);
    recordedChunksRef.current = [];

    const types = [
      'video/mp4;codecs=avc1',
      'video/mp4',
      'video/webm;codecs=vp9,opus',
      'video/webm;codecs=vp8,opus',
      'video/webm',
    ];
    let selectedMime = '';
    for (const t of types) {
      if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(t)) {
        selectedMime = t;
        break;
      }
    }

    try {
      const options: MediaRecorderOptions = selectedMime ? { mimeType: selectedMime } : {};
      const recorder = new MediaRecorder(cameraStreamRef.current, options);

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const finalMime = recorder.mimeType || selectedMime || 'video/webm';
        const blob = new Blob(recordedChunksRef.current, { type: finalMime });
        setRecordedVideoBlob(blob);
        setRecordedVideoUrl(URL.createObjectURL(blob));
        setIsRecording(false);
        if (recordingTimerRef.current) {
          clearInterval(recordingTimerRef.current);
          recordingTimerRef.current = null;
        }
        stopCameraStream();
      };

      mediaRecorderRef.current = recorder;
      recorder.start(1000);
      setIsRecording(true);
      setRecordingSeconds(0);

      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => {
          if (prev >= 299) {
            stopRecording();
            return 300;
          }
          return prev + 1;
        });
      }, 1000);
    } catch {
      showToast(
        okMsg(
          'حدث خطأ أثناء بدء تسجيل الفيديو، يرجى المحاولة مرة أخرى',
          'Error starting video recording, please try again'
        ),
        'error'
      );
    }
  };

  const stopRecording = () => {
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch {}
    }
    setIsRecording(false);
  };

  const handleRetake = () => {
    if (recordedVideoUrl) {
      URL.revokeObjectURL(recordedVideoUrl);
    }
    setRecordedVideoUrl(null);
    setRecordedVideoBlob(null);
    setRecordingSeconds(0);
    initCameraStream(cameraFacingMode);
  };

  const handleConfirmRecordedVideo = () => {
    if (!recordedVideoBlob) return;
    const mime = recordedVideoBlob.type || 'video/webm';
    const ext = mime.includes('mp4') ? 'mp4' : 'webm';
    const fileName = `intro_camera_${Date.now()}.${ext}`;
    const file = new File([recordedVideoBlob], fileName, { type: mime });

    closeCameraRecorder();
    handleIntroVideoFile(file);
  };

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    if (cameraRecorderOpen && !recordedVideoBlob) {
      initCameraStream(cameraFacingMode);
    }
    return () => {
      if (cameraStreamRef.current) {
        cameraStreamRef.current.getTracks().forEach((track) => track.stop());
        cameraStreamRef.current = null;
      }
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
    };
  }, [cameraRecorderOpen]);

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
    : '';

  const avatarSrc = photoPreview || imageUrl || '';

  const displayServices = userServicesList.length > 0 ? userServicesList : [{ id: 3, name_ar: currentServiceName, name_en: currentServiceName }];

  return (
    <div className="max-w-3xl mx-auto px-5 py-5 space-y-4 animate-fade-in font-sans" dir={direction}>
      <div className="flex flex-col items-center">
        <div className="w-[92px] h-[92px] rounded-full bg-black/[0.05] overflow-hidden flex items-center justify-center text-3xl font-bold text-[#0D4A5F]">
          {avatarSrc
            ? <img src={avatarSrc} alt="Profile" className="h-full w-full object-cover" />
            : (displayName.charAt(0)?.toUpperCase() || 'U')}
        </div>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={savingKey === 'photo'}
          className="mt-3 px-[18px] py-2 rounded-[14px] bg-[#6B8782] text-white text-[13px] font-bold hover:opacity-90 transition-opacity disabled:opacity-60 inline-flex items-center gap-2 shadow-sm"
        >
          {savingKey === 'photo' ? <Loader2 size={14} className="animate-spin" /> : <Camera size={14} />}
          <span>{okMsg('تغيير الصورة الشخصية', 'Change profile photo')}</span>
        </button>
        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handlePhotoChange} />
      </div>

      <div className="h-2" />

      <SectionCard title={okMsg('الاسم', 'Name')} icon={<Pencil size={18} />} onIconTap={() => openDialogWithFresh('name')}>
        <p className={`text-[15px] font-medium ${displayName ? 'text-[#0D4A5F]' : 'text-[#0D4A5F]/50'}`}>
          {displayName || okMsg('لا يوجد اسم مضاف', 'No name added')}
        </p>
      </SectionCard>

      <SectionCard title={okMsg('رقم الجوال', 'Phone number')} icon={<Pencil size={18} />} onIconTap={() => openDialogWithFresh('phone')}>
        <div dir="ltr" className="flex items-center gap-[6px]">
          <span className="text-[15px] font-bold text-[#0D4A5F]">{phoneCode}</span>
          <span className="text-[15px] font-medium text-[#0D4A5F]">{phoneNumber || user.phone_number}</span>
        </div>
      </SectionCard>

      <SectionCard title={okMsg('البريد الإلكتروني', 'Email')} icon={<Pencil size={18} />} onIconTap={() => openDialogWithFresh('email')}>
        <p className={`text-[15px] font-medium ${user.email ? 'text-[#0D4A5F]' : 'text-[#0D4A5F]/50'}`}>
          {user.email || okMsg('لا يوجد بريد إلكتروني', 'No email')}
        </p>
      </SectionCard>

      {isTeacher && (
        <>
          <SectionCard title={t.bio || okMsg('نبذة عني', 'Bio')} icon={<Pencil size={18} />} onIconTap={() => openDialogWithFresh('bio')}>
            <p className={`text-sm leading-[1.6] ${displayBio ? 'text-[#0D4A5F]' : 'text-[#0D4A5F]/50'}`}>
              {displayBio || okMsg('لا توجد نبذة تعريفية مضافة بعد.', 'No bio added yet.')}
            </p>
          </SectionCard>

          <SectionCard
            title={okMsg('الفيديو التعريفي', 'Intro Video')}
            icon={<Video size={18} />}
            onIconTap={uploadingVideo ? undefined : () => setVideoSourceModal(true)}
          >
            <div className="space-y-3">
              <div
                onClick={uploadingVideo ? undefined : (introVideoUrl ? () => setVideoPlayerModal(true) : () => setVideoSourceModal(true))}
                className="relative w-full h-44 sm:h-52 rounded-2xl overflow-hidden bg-[#0D4A5F]/10 border border-slate-200 cursor-pointer group shadow-sm flex items-center justify-center select-none"
              >
                {introVideoUrl ? (
                  <>
                    <video
                      src={introVideoUrl}
                      preload="metadata"
                      muted
                      playsInline
                      className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                    />
                    <div className="absolute inset-0 bg-black/35 group-hover:bg-black/45 transition-colors" />
                  </>
                ) : imageUrl ? (
                  <>
                    <img
                      src={imageUrl}
                      alt=""
                      className="absolute inset-0 w-full h-full object-cover filter blur-[1px] brightness-75 pointer-events-none"
                    />
                    <div className="absolute inset-0 bg-[#0D4A5F]/40 group-hover:bg-[#0D4A5F]/50 transition-colors" />
                  </>
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-[#0D4A5F]/30 to-[#5B9F48]/25" />
                )}

                {uploadingVideo ? (
                  <div className="relative z-10 w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-primary flex items-center justify-center shadow-xl">
                    <Loader2 className="w-6 h-6 text-white animate-spin" />
                  </div>
                ) : (
                  <div className="relative z-10 w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-primary/95 text-white flex items-center justify-center shadow-lg transition-transform duration-200 group-hover:scale-110 active:scale-95">
                    <Play size={22} className="fill-white text-white translate-x-0.5" />
                  </div>
                )}

                <div className="absolute bottom-3 right-3 z-10 px-3 py-1 bg-black/60 backdrop-blur-sm text-white rounded-full flex items-center gap-1.5 text-xs font-medium">
                  <Video size={14} className="text-white" />
                  <span>
                    {introVideoUrl
                      ? okMsg('مشاهدة الفيديو التعريفي', 'Watch Intro Video')
                      : okMsg('أضف فيديو تعريفي', 'Add Intro Video')}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setVideoSourceModal(true)}
                disabled={uploadingVideo}
                className="w-full py-2.5 px-4 rounded-xl border border-primary text-primary hover:bg-emerald-50 active:bg-emerald-100 transition-colors flex items-center justify-center gap-2 text-sm font-semibold disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {uploadingVideo ? (
                  <>
                    <Loader2 size={18} className="animate-spin text-primary" />
                    <span>{okMsg(`جارٍ رفع الفيديو... ${uploadProgress}%`, `Uploading video... ${uploadProgress}%`)}</span>
                  </>
                ) : introVideoUrl ? (
                  <>
                    <RefreshCw size={18} className="text-primary" />
                    <span>{okMsg('تغيير الفيديو التعريفي', 'Change intro video')}</span>
                  </>
                ) : (
                  <>
                    <Upload size={18} className="text-primary" />
                    <span>{okMsg('رفع فيديو تعريفي', 'Upload intro video')}</span>
                  </>
                )}
              </button>

              {uploadingVideo && (
                <div className="w-full bg-black/[0.08] rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-primary h-full transition-all duration-150 rounded-full"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              )}

              <input
                type="file"
                ref={videoInputRef}
                className="hidden"
                accept="video/*"
                onChange={handleVideoInputChange}
              />
              <input
                type="file"
                ref={cameraInputRef}
                className="hidden"
                accept="video/*"
                capture="user"
                onChange={handleVideoInputChange}
              />

              <p className="text-xs text-[#0D4A5F]/60 leading-relaxed">
                {okMsg(
                  'اختر فيديو قصير (حتى 5 دقائق) يعرف بك وبأسلوبك في التدريس. سيظهر للطلاب في صفحة ملفك.',
                  'Choose a short video (up to 5 minutes) introducing yourself and your teaching style. It will appear to students on your profile page.',
                )}
              </p>
            </div>
          </SectionCard>

          <SectionCard
            title={userServicesList.length > 1 ? okMsg('الخدمات الحالية', 'Current Services') : okMsg('الخدمة الحالية', 'Current Service')}
            icon={<BadgeCheck size={18} />}
          >
            {userServicesList.length > 1 ? (
              <div className="flex flex-wrap gap-2">
                {userServicesList.map((srv: any, idx: number) => (
                  <span
                    key={idx}
                    className="inline-flex items-center px-3 py-1.5 rounded-xl text-sm font-bold bg-[#0D4A5F]/10 text-[#0D4A5F] border border-[#0D4A5F]/20"
                  >
                    {pickName(srv)}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-[15px] font-bold text-[#0D4A5F]">
                {currentServiceName}
              </p>
            )}
          </SectionCard>

          <SectionCard
            title={okMsg('إدارة الخدمات', 'Service Management')}
            icon={<Settings size={18} />}
            onIconTap={() => onNavigate && onNavigate('services')}
          >
            <div className="space-y-3">
              <p className="text-xs text-[#0D4A5F]/60 font-medium">
                {okMsg('خدماتك الحالية', 'Your current services')}
              </p>

              {displayServices.map((service: any, index: number) => {
                const sId = Number(service.id || index + 1);
                const sName = pickName(service) || currentServiceName;
                const isBlue = sId === 1;
                const isGreen = sId === 2;

                const chipBg = isBlue
                  ? 'bg-blue-50/60 border-blue-200'
                  : isGreen
                  ? 'bg-emerald-50/60 border-emerald-200'
                  : 'bg-amber-50/60 border-amber-200';
                const iconBg = isBlue
                  ? 'bg-blue-100/80 text-blue-600'
                  : isGreen
                  ? 'bg-emerald-100/80 text-emerald-600'
                  : 'bg-amber-100/80 text-amber-600';
                const checkColor = isBlue
                  ? 'text-blue-500'
                  : isGreen
                  ? 'text-emerald-500'
                  : 'text-amber-500';

                return (
                  <div
                    key={sId || index}
                    className={`flex items-center justify-between p-3 rounded-2xl border ${chipBg}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${iconBg}`}>
                        {isBlue ? (
                          <GraduationCap size={18} />
                        ) : isGreen ? (
                          <Globe size={18} />
                        ) : (
                          <BookOpen size={18} />
                        )}
                      </div>
                      <span className="text-sm font-semibold text-[#0D4A5F]">{sName}</span>
                    </div>
                    <CheckCircle2 size={20} className={checkColor} />
                  </div>
                );
              })}

              <button
                type="button"
                onClick={() => onNavigate && onNavigate('services')}
                className="w-full mt-2 py-2.5 px-4 rounded-xl border border-primary text-primary hover:bg-emerald-50 transition-colors flex items-center justify-center gap-2 text-xs font-bold"
              >
                <Settings size={16} />
                <span>{okMsg('إدارة الخدمات', 'Manage Services')}</span>
              </button>
            </div>
          </SectionCard>

          <SectionCard
            title={teachTitle}
            icon={<Pencil size={18} />}
            onIconTap={() => { if (onNavigate) onNavigate(teachTab); }}
          >
            {teachItems.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {teachItems.map((s, i) => (
                  <span key={i} className="px-[14px] py-2 rounded-xl bg-[#EFF6F4] text-[#0D4A5F] text-[13px] font-semibold">
                    {s}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-[#0D4A5F]/50">{teachEmpty}</p>
            )}
          </SectionCard>

          <SectionCard title={okMsg('الخدمات والأسعار', 'Services & Pricing')} icon={<Pencil size={18} />} onIconTap={() => openDialogWithFresh('price')}>
            <div className="flex items-center gap-1" dir={isAr ? 'rtl' : 'ltr'}>
              <span className="text-xl font-bold text-[#0D4A5F]">{displayPrice} </span>
              <span className="text-sm text-[#0D4A5F]/70">{t.sar || (isAr ? 'ر.س' : 'SAR')}{t.perHour || (isAr ? '/ساعة' : '/hr')}</span>
            </div>
          </SectionCard>

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
              <p className="text-sm text-[#0D4A5F]/50">{okMsg('لا توجد بيانات مرفقة', 'No attachments')}</p>
            )}
          </SectionCard>

          <div className="h-2" />

          <button
            type="button"
            onClick={() => setPreviewOpen(true)}
            className="w-full h-[52px] rounded-2xl border-[1.5px] border-primary bg-white text-primary text-base font-bold hover:bg-primary hover:text-white transition-colors inline-flex items-center justify-center gap-2 shadow-sm"
          >
            <Eye size={18} />
            <span>{okMsg('معاينة ملفي التعريفي', 'Preview my profile')}</span>
          </button>
        </>
      )}

      <div className="pt-4 border-t border-[var(--border)] flex justify-center">
        <button onClick={handleDeleteAccount} className="flex items-center gap-2 text-red-500 hover:text-red-700 text-sm font-medium transition-colors">
          <Trash2 size={16} /> <span>{isAr ? 'حذف الحساب' : 'Delete Account'}</span>
        </button>
      </div>

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
                className="rounded-xl border border-[var(--border)] bg-[#EFF6F4] px-2 py-3 text-sm font-medium focus:outline-none disabled:opacity-70 max-w-[150px]"
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
      </Modal>

      <TeacherPublicProfileModal
        user={user}
        isOpen={previewOpen}
        onClose={() => setPreviewOpen(false)}
      />

      {videoSourceModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-sm">
          <div className="fixed inset-0" onClick={() => setVideoSourceModal(false)} />
          <div className="relative w-full max-w-md bg-white rounded-t-3xl sm:rounded-2xl p-6 shadow-2xl z-10 space-y-4">
            <div className="w-10 h-1 bg-black/15 rounded-full mx-auto" />
            <div className="text-right">
              <h3 className="text-base font-bold text-[#0D4A5F]">
                {okMsg('الفيديو التعريفي', 'Intro Video')}
              </h3>
              <p className="text-xs text-[#0D4A5F]/60 mt-1">
                {okMsg('سجّل فيديو جديد أو ارفع ملف فيديو جاهز', 'Record a new video or upload a ready video file')}
              </p>
            </div>
            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setVideoSourceModal(false);
                  setCameraRecorderOpen(true);
                }}
                className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-slate-50 active:bg-slate-100 transition-colors text-right"
              >
                <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                  <Video size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[#0D4A5F]">
                    {okMsg('تسجيل فيديو', 'Record Video')}
                  </p>
                  <p className="text-xs text-[#0D4A5F]/60 mt-0.5">
                    {okMsg('سجّل الآن بالكاميرا', 'Record now with camera')}
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setVideoSourceModal(false);
                  videoInputRef.current?.click();
                }}
                className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-slate-50 active:bg-slate-100 transition-colors text-right"
              >
                <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                  <Upload size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[#0D4A5F]">
                    {okMsg('رفع ملف فيديو', 'Upload Video File')}
                  </p>
                  <p className="text-xs text-[#0D4A5F]/60 mt-0.5">
                    {okMsg('اختر من معرض الجهاز', 'Choose from device gallery')}
                  </p>
                </div>
              </button>
            </div>

            <button
              type="button"
              onClick={() => setVideoSourceModal(false)}
              className="w-full py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-[#0D4A5F]/70 hover:bg-slate-50 transition-colors"
            >
              {t.cancel || okMsg('إلغاء', 'Cancel')}
            </button>
          </div>
        </div>
      )}

      {videoPlayerModal && introVideoUrl && (
        <div className="fixed inset-0 z-50 flex flex-col bg-black/95 p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <button
              type="button"
              onClick={() => setVideoPlayerModal(false)}
              className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-colors"
            >
              <X size={20} />
            </button>
            <h3 className="text-base font-bold text-white">
              {okMsg('مشاهدة الفيديو التعريفي', 'Watch Intro Video')}
            </h3>
            <span className="w-10 h-10" />
          </div>
          <div className="flex-1 flex items-center justify-center min-h-0">
            <video
              src={introVideoUrl}
              controls
              autoPlay
              className="w-full max-h-[80vh] rounded-2xl object-contain bg-black shadow-2xl"
            />
          </div>
        </div>
      )}

      {cameraRecorderOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md">
          <div className="fixed inset-0" onClick={closeCameraRecorder} />
          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden z-10 flex flex-col max-h-[95vh]">
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100">
              <div className="text-right">
                <h3 className="text-base font-bold text-[#0D4A5F]">
                  {okMsg('تسجيل فيديو تعريفي', 'Record Intro Video')}
                </h3>
                <p className="text-xs text-[#0D4A5F]/60 mt-0.5">
                  {okMsg('سجّل فيديو قصير يعرف بك وبأسلوبك في التدريس', 'Record a short video introducing yourself')}
                </p>
              </div>
              <button
                type="button"
                onClick={closeCameraRecorder}
                className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-4 sm:p-5 flex-1 flex flex-col min-h-0">
              <div className="relative w-full aspect-[4/3] sm:aspect-video bg-black rounded-2xl overflow-hidden flex items-center justify-center shadow-inner">
                {cameraError ? (
                  <div className="p-6 text-center text-white space-y-4 max-w-xs">
                    <div className="w-12 h-12 rounded-full bg-red-500/20 text-red-400 mx-auto flex items-center justify-center">
                      <Video size={24} />
                    </div>
                    <p className="text-xs leading-relaxed text-slate-200">{cameraError}</p>
                    <div className="space-y-2 pt-1">
                      <button
                        type="button"
                        onClick={() => initCameraStream(cameraFacingMode)}
                        className="w-full py-2.5 px-4 rounded-xl bg-primary hover:bg-primary/90 text-white text-xs font-bold transition-colors"
                      >
                        {okMsg('إعادة المحاولة', 'Try Again')}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          closeCameraRecorder();
                          cameraInputRef.current?.click();
                        }}
                        className="w-full py-2.5 px-4 rounded-xl border border-white/20 text-white hover:bg-white/10 text-xs font-bold transition-colors"
                      >
                        {okMsg('استخدام كاميرا الجهاز / اختيار ملف', 'Use device camera / Choose file')}
                      </button>
                    </div>
                  </div>
                ) : recordedVideoUrl ? (
                  <video
                    src={recordedVideoUrl}
                    controls
                    autoPlay
                    playsInline
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <>
                    <video
                      ref={(el) => {
                        cameraLiveVideoRef.current = el;
                        if (el && cameraStreamRef.current && el.srcObject !== cameraStreamRef.current) {
                          el.srcObject = cameraStreamRef.current;
                          el.play().catch(() => {});
                        }
                      }}
                      autoPlay
                      playsInline
                      muted
                      style={{ transform: cameraFacingMode === 'user' ? 'scaleX(-1)' : 'none' }}
                      className="w-full h-full object-cover"
                    />

                    <div className="absolute top-3 inset-x-3 flex items-center justify-between pointer-events-none">
                      {isRecording ? (
                        <div className="flex items-center gap-2 bg-red-600/90 text-white text-xs font-mono font-bold px-3 py-1.5 rounded-full shadow-lg backdrop-blur-sm pointer-events-auto">
                          <span className="w-2.5 h-2.5 rounded-full bg-white animate-pulse" />
                          <span>{formatTimer(recordingSeconds)} / 05:00</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 bg-black/60 text-white text-[11px] font-bold px-2.5 py-1 rounded-full backdrop-blur-sm">
                          <span className="w-2 h-2 rounded-full bg-green-400" />
                          <span>{okMsg('الكاميرا نشطة', 'Camera active')}</span>
                        </div>
                      )}

                      {hasMultipleCameras && !isRecording && (
                        <button
                          type="button"
                          onClick={handleToggleFacingMode}
                          className="w-8 h-8 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center transition-colors pointer-events-auto backdrop-blur-sm"
                          title={okMsg('تبديل الكاميرا', 'Switch Camera')}
                        >
                          <SwitchCamera size={16} />
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>

              <div className="pt-4 flex items-center justify-center">
                {recordedVideoUrl ? (
                  <div className="w-full flex gap-3">
                    <button
                      type="button"
                      onClick={handleRetake}
                      className="flex-1 py-3 px-4 rounded-xl border border-slate-200 text-[#0D4A5F] hover:bg-slate-50 text-xs font-bold flex items-center justify-center gap-2 transition-colors"
                    >
                      <RotateCcw size={16} />
                      <span>{okMsg('إعادة التسجيل', 'Retake')}</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmRecordedVideo}
                      className="flex-1 py-3 px-4 rounded-xl bg-primary hover:bg-primary/90 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-colors"
                    >
                      <Check size={16} />
                      <span>{okMsg('استخدام هذا الفيديو', 'Use this video')}</span>
                    </button>
                  </div>
                ) : !cameraError ? (
                  isRecording ? (
                    <button
                      type="button"
                      onClick={stopRecording}
                      className="flex flex-col items-center gap-1.5 group"
                    >
                      <div className="w-16 h-16 rounded-full border-4 border-red-500/40 p-1 flex items-center justify-center animate-pulse">
                        <div className="w-12 h-12 rounded-full bg-red-600 flex items-center justify-center text-white shadow-lg group-hover:scale-105 active:scale-95 transition-transform">
                          <Square size={18} fill="currentColor" />
                        </div>
                      </div>
                      <span className="text-xs font-bold text-red-600">
                        {okMsg('إيقاف التسجيل', 'Stop Recording')}
                      </span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={startRecording}
                      className="flex flex-col items-center gap-1.5 group"
                    >
                      <div className="w-16 h-16 rounded-full border-4 border-red-500/30 group-hover:border-red-500/60 p-1 flex items-center justify-center transition-all">
                        <div className="w-12 h-12 rounded-full bg-red-600 group-hover:scale-105 active:scale-95 transition-transform flex items-center justify-center text-white shadow-lg">
                          <Video size={20} />
                        </div>
                      </div>
                      <span className="text-xs font-bold text-[#0D4A5F]">
                        {okMsg('بدء التسجيل', 'Start Recording')}
                      </span>
                    </button>
                  )
                ) : null}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
