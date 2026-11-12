import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../Contexts/LanguageContext';
import { 
  X, 
  Calendar, 
  Clock, 
  GraduationCap, 
  Laptop, 
  Home, 
  AlertCircle, 
  Loader2 
} from 'lucide-react';
import { Button } from '../ui/Button';
import { studentService } from '../../Services/api';

interface CreateOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const CreateOrderModal: React.FC<CreateOrderModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { language } = useLanguage();
  const isAr = language === 'ar';

  const [loading, setLoading] = useState(false);
  const [loadingSubjects, setLoadingSubjects] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [educationLevels, setEducationLevels] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);

  const [selectedLevel, setSelectedLevel] = useState<number | ''>('');
  const [selectedClass, setSelectedClass] = useState<number | ''>('');
  const [selectedSubject, setSelectedSubject] = useState<number | ''>('');
  const [sessionType, setSessionType] = useState<'online' | 'in_house'>('online');
  const [minPrice, setMinPrice] = useState<number | ''>('');
  const [maxPrice, setMaxPrice] = useState<number | ''>('');
  const [description, setDescription] = useState('');

  const getTomorrowDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  };

  const [date, setDate] = useState(getTomorrowDate());
  const [time, setTime] = useState('16:00');

  useEffect(() => {
    if (!isOpen) return;

    setSelectedLevel('');
    setSelectedClass('');
    setSelectedSubject('');
    setClasses([]);
    setSubjects([]);
    setDate(getTomorrowDate());
    setTime('16:00');
    setError(null);

    const fetchLevels = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await studentService.getEducationLevels().catch(() => []);
        const rawLevels = Array.isArray(res) ? res : (res?.education_levels || res?.data || []);
        setEducationLevels(rawLevels);
      } catch (err: any) {
        setError(err.message || (isAr ? 'فشل تحميل المراحل التعليمية' : 'Error loading education levels'));
      } finally {
        setLoading(false);
      }
    };

    fetchLevels();
  }, [isOpen]);

  const handleLevelChange = async (levelId: number) => {
    setSelectedLevel(levelId);
    setSelectedClass('');
    setSelectedSubject('');
    setClasses([]);
    setSubjects([]);

    if (!levelId) return;

    const foundLevel = educationLevels.find((l) => Number(l.id) === Number(levelId));
    let lvlClasses = foundLevel?.classes && Array.isArray(foundLevel.classes) && foundLevel.classes.length > 0
      ? foundLevel.classes
      : [];

    if (lvlClasses.length === 0) {
      try {
        const clsRes = await studentService.getClasses(levelId);
        lvlClasses = Array.isArray(clsRes) ? clsRes : (clsRes?.classes || clsRes?.data || []);
      } catch {
        lvlClasses = [];
      }
    }

    setClasses(lvlClasses);
  };

  const handleClassChange = async (classId: number) => {
    setSelectedClass(classId);
    setSelectedSubject('');
    setSubjects([]);

    if (!classId) return;

    setLoadingSubjects(true);
    let classSubs: any[] = [];

    try {
      const apiSubs = await studentService.getReferenceSubjects(classId);
      const rawList = Array.isArray(apiSubs) ? apiSubs : (apiSubs?.subject || apiSubs?.subjects || apiSubs?.data || []);
      if (Array.isArray(rawList) && rawList.length > 0) {
        classSubs = rawList;
      }
    } catch {
      classSubs = [];
    }

    if (classSubs.length === 0) {
      const foundClass = classes.find((c) => Number(c.id) === Number(classId));
      if (foundClass?.subjects && Array.isArray(foundClass.subjects) && foundClass.subjects.length > 0) {
        classSubs = foundClass.subjects;
      }
    }

    const uniqueMap = new Map<string, any>();
    classSubs.forEach((sub: any) => {
      const name = isAr ? (sub.name_ar || sub.name) : (sub.name_en || sub.name);
      const key = (name || '').trim().toLowerCase();
      if (key && !uniqueMap.has(key)) {
        uniqueMap.set(key, sub);
      }
    });

    setSubjects(Array.from(uniqueMap.values()));
    setLoadingSubjects(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubject) {
      setError(isAr ? 'يرجى اختيار المادة الدراسية' : 'Please select a subject');
      return;
    }
    if (!date) {
      setError(isAr ? 'يرجى تحديد التاريخ المطلوب' : 'Please select a date');
      return;
    }
    if (!time) {
      setError(isAr ? 'يرجى تحديد الوقت المطلوب' : 'Please select time');
      return;
    }
    if (!description.trim()) {
      setError(isAr ? 'يرجى كتابة تفاصيل الحصة' : 'Please provide session description');
      return;
    }

    const [hStr, mStr] = time.split(':');
    const h = parseInt(hStr || '16', 10);
    const m = parseInt(mStr || '00', 10);
    const startFormatted = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
    let endFormatted = '';
    if (h >= 23) {
      endFormatted = '23:59';
    } else {
      endFormatted = `${(h + 1).toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
    }

    const payload: Record<string, any> = {
      subject_id: Number(selectedSubject),
      type: 'single',
      order_type: sessionType,
      notes: description.trim(),
      availability_slots: [
        {
          date: date,
          start_time: startFormatted,
          end_time: endFormatted,
        },
      ],
    };

    if (selectedClass) {
      payload.class_id = Number(selectedClass);
    }
    if (selectedLevel) {
      payload.education_level_id = Number(selectedLevel);
    }

    const hasMin = minPrice !== '' && minPrice !== null && minPrice !== undefined && Number(minPrice) >= 0;
    const hasMax = maxPrice !== '' && maxPrice !== null && maxPrice !== undefined && Number(maxPrice) >= 0;

    if (hasMax) {
      payload.max_price = Number(maxPrice);
      payload.min_price = hasMin ? Number(minPrice) : 0;
    } else if (hasMin) {
      payload.min_price = Number(minPrice);
      payload.max_price = Number(minPrice);
    }

    setSubmitting(true);
    setError(null);

    try {
      await studentService.createOrder(payload);
      onSuccess();
      onClose();
    } catch (err: any) {
      let msg = err.message_ar || err.message;
      if (err.errors && typeof err.errors === 'object') {
        const firstErr = Object.values(err.errors).flat()[0];
        if (firstErr) msg = String(firstErr);
      }
      setError(msg || (isAr ? 'حدث خطأ أثناء حفظ الطلب' : 'Failed to create order'));
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-[#F1F5F9] animate-fade-in my-8">
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#F1F5F9] bg-[#EFF6F4]/50">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#5B9F48]/12 text-[#5B9F48] flex items-center justify-center shrink-0">
              <GraduationCap size={24} />
            </div>
            <div>
              <h3 className="font-bold text-lg text-[#0D4A5F]">
                {isAr ? 'طلب عاجل' : 'Urgent Order'}
              </h3>
              <p className="text-xs text-[#64748B]">
                {isAr
                  ? 'هذا الطلب للحالات العاجلة عندما لا يمكنك انتظار المواعيد المتاحة للمعلمين.'
                  : 'This request is for urgent situations when you cannot wait for available times.'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white flex items-center justify-center text-[#0D4A5F] hover:bg-gray-100 transition-colors shadow-sm"
          >
            <X size={18} />
          </button>
        </div>

        {error && (
          <div className="mx-6 mt-4 p-4 rounded-2xl bg-red-50 text-[#EF4444] text-sm flex items-center gap-2 border border-red-200">
            <AlertCircle size={18} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="p-16 flex justify-center items-center">
            <Loader2 className="animate-spin h-8 w-8 text-[#5B9F48]" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div>
              <h4 className="text-[15px] font-bold text-[#0D4A5F] mb-3">
                {isAr ? 'التفاصيل' : 'Academic Details'}
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-[#64748B] mb-1.5">
                    {isAr ? 'المرحلة التعليمية' : 'Education Level'}
                  </label>
                  <select
                    value={selectedLevel}
                    onChange={(e) => handleLevelChange(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-white text-xs text-[#0D4A5F] focus:outline-none focus:border-[#5B9F48] transition-colors"
                  >
                    <option value="">{isAr ? 'اختر مستواك التعليمي' : 'Select Education Level'}</option>
                    {educationLevels.map((lvl) => (
                      <option key={lvl.id} value={lvl.id}>
                        {isAr ? (lvl.name_ar || lvl.name) : (lvl.name_en || lvl.name)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#64748B] mb-1.5">
                    {isAr ? 'الصف الدراسي' : 'Grade'}
                  </label>
                  <select
                    value={selectedClass}
                    onChange={(e) => handleClassChange(Number(e.target.value))}
                    disabled={!selectedLevel || classes.length === 0}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-white text-xs text-[#0D4A5F] focus:outline-none focus:border-[#5B9F48] transition-colors disabled:opacity-50 disabled:bg-gray-50"
                  >
                    <option value="">
                      {!selectedLevel
                        ? (isAr ? 'اختر المرحلة أولاً' : 'Select Level First')
                        : classes.length === 0
                        ? (isAr ? 'لا توجد صفوف متاحة' : 'No grades available')
                        : (isAr ? 'اختر الصف الدراسي' : 'Select Grade')}
                    </option>
                    {classes.map((cls) => (
                      <option key={cls.id} value={cls.id}>
                        {isAr ? (cls.name_ar || cls.name) : (cls.name_en || cls.name)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#64748B] mb-1.5 flex items-center justify-between">
                    <span>{isAr ? 'المادة *' : 'Subject *'}</span>
                    {loadingSubjects && <Loader2 size={12} className="animate-spin text-[#5B9F48]" />}
                  </label>
                  <select
                    value={selectedSubject}
                    onChange={(e) => setSelectedSubject(Number(e.target.value))}
                    required
                    disabled={!selectedClass || loadingSubjects || subjects.length === 0}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-white text-xs text-[#0D4A5F] focus:outline-none focus:border-[#5B9F48] transition-colors disabled:opacity-50 disabled:bg-gray-50"
                  >
                    <option value="">
                      {!selectedClass
                        ? (isAr ? 'اختر الصف أولاً' : 'Select Grade First')
                        : loadingSubjects
                        ? (isAr ? 'جاري تحميل المواد...' : 'Loading subjects...')
                        : subjects.length === 0
                        ? (isAr ? 'لا توجد مواد متاحة' : 'No subjects available')
                        : (isAr ? 'اختر المادة' : 'Select Subject')}
                    </option>
                    {subjects.map((sub) => (
                      <option key={sub.id} value={sub.id}>
                        {isAr ? (sub.name_ar || sub.name) : (sub.name_en || sub.name)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-[15px] font-bold text-[#0D4A5F] mb-3">
                {isAr ? 'نوع الحصة' : 'Session Type'}
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div
                  onClick={() => setSessionType('online')}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col items-center text-center shadow-sm ${
                    sessionType === 'online'
                      ? 'border-[#5B9F48] bg-[#5B9F48]/10'
                      : 'border-gray-200 bg-white hover:bg-gray-50'
                  }`}
                >
                  <Laptop
                    size={26}
                    className={sessionType === 'online' ? 'text-[#5B9F48]' : 'text-[#0D4A5F]'}
                  />
                  <span
                    className={`mt-2 font-bold text-sm ${
                      sessionType === 'online' ? 'text-[#5B9F48]' : 'text-[#0D4A5F]'
                    }`}
                  >
                    {isAr ? 'أونلاين' : 'Online'}
                  </span>
                  <span className="text-[11px] text-[#64748B] mt-0.5">
                    {isAr ? 'حصة عن بُعد عبر المنصة' : 'Online lesson via platform'}
                  </span>
                </div>

                <div
                  onClick={() => setSessionType('in_house')}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col items-center text-center shadow-sm ${
                    sessionType === 'in_house'
                      ? 'border-[#5B9F48] bg-[#5B9F48]/10'
                      : 'border-gray-200 bg-white hover:bg-gray-50'
                  }`}
                >
                  <Home
                    size={26}
                    className={sessionType === 'in_house' ? 'text-[#5B9F48]' : 'text-[#0D4A5F]'}
                  />
                  <span
                    className={`mt-2 font-bold text-sm ${
                      sessionType === 'in_house' ? 'text-[#5B9F48]' : 'text-[#0D4A5F]'
                    }`}
                  >
                    {isAr ? 'حضوري' : 'In Person'}
                  </span>
                  <span className="text-[11px] text-[#64748B] mt-0.5">
                    {isAr ? 'حصة حضورية في الموقع' : 'In-person lesson'}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-[15px] font-bold text-[#0D4A5F] mb-3">
                {isAr ? 'التاريخ والوقت' : 'Date & Time'}
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-[#64748B] mb-1.5 flex items-center gap-1">
                    <Calendar size={13} className="text-[#5B9F48]" />
                    <span>{isAr ? 'التاريخ *' : 'Date *'}</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={date}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-white text-xs text-[#0D4A5F] focus:outline-none focus:border-[#5B9F48]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#64748B] mb-1.5 flex items-center gap-1">
                    <Clock size={13} className="text-[#5B9F48]" />
                    <span>{isAr ? 'الوقت * (مدة الحصة ساعة واحدة)' : 'Time * (1 Hour Duration)'}</span>
                  </label>
                  <input
                    type="time"
                    required
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-white text-xs text-[#0D4A5F] focus:outline-none focus:border-[#5B9F48]"
                  />
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-[15px] font-bold text-[#0D4A5F] mb-3">
                {isAr ? 'وصف الحصة' : 'Session Description'}
              </h4>
              <div>
                <label className="block text-xs font-semibold text-[#64748B] mb-1.5">
                  {isAr ? 'تفاصيل الحصة *' : 'Session Details *'}
                </label>
                <textarea
                  rows={3}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={
                    isAr
                      ? 'اكتب تفاصيل ما تحتاج المساعدة فيه...'
                      : 'Write details of what you need help with...'
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-white text-xs text-[#0D4A5F] focus:outline-none focus:border-[#5B9F48]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-semibold text-[#64748B] mb-1.5">
                  {isAr ? 'السعر الأدنى (اختياري)' : 'Min Price'}
                </label>
                <input
                  type="number"
                  min="0"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value ? Number(e.target.value) : '')}
                  placeholder="0"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-white text-xs text-[#0D4A5F] focus:outline-none focus:border-[#5B9F48]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#64748B] mb-1.5">
                  {isAr ? 'السعر الأعلى (اختياري)' : 'Max Price'}
                </label>
                <input
                  type="number"
                  min="0"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value ? Number(e.target.value) : '')}
                  placeholder="200"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-white text-xs text-[#0D4A5F] focus:outline-none focus:border-[#5B9F48]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#F1F5F9]">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={submitting}
                className="rounded-2xl text-xs h-11 px-5 border-gray-200 text-[#0D4A5F]"
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="rounded-2xl text-xs h-11 px-7 bg-[#5B9F48] hover:bg-[#4d863d] text-white font-bold flex items-center gap-2 shadow-sm"
              >
                {submitting && <Loader2 size={16} className="animate-spin" />}
                <span>{isAr ? 'إرسال الطلب' : 'Send Request'}</span>
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default CreateOrderModal;
