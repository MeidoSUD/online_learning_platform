import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../Contexts/LanguageContext';
import { X, Calendar, Clock, DollarSign, BookOpen, AlertCircle, Loader2, Check } from 'lucide-react';
import { Button } from '../ui/Button';
import { studentService } from '../../Services/api';

interface CreateOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const CreateOrderModal: React.FC<CreateOrderModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { language } = useLanguage();

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [educationLevels, setEducationLevels] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);

  const [selectedLevel, setSelectedLevel] = useState<number | ''>('');
  const [selectedClass, setSelectedClass] = useState<number | ''>('');
  const [selectedSubject, setSelectedSubject] = useState<number | ''>('');
  const [type, setType] = useState<'single' | 'group'>('single');
  const [minPrice, setMinPrice] = useState<number | ''>('');
  const [maxPrice, setMaxPrice] = useState<number | ''>('');
  const [notes, setNotes] = useState('');
  
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('16:00');
  const [endTime, setEndTime] = useState('17:00');

  useEffect(() => {
    if (!isOpen) return;
    const fetchInitialData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [levels, subs] = await Promise.all([
          studentService.getEducationLevels().catch(() => []),
          studentService.getSubjects().catch(() => []),
        ]);
        setEducationLevels(Array.isArray(levels) ? levels : []);
        setSubjects(Array.isArray(subs) ? subs : []);
      } catch (err: any) {
        setError(err.message || 'Error loading form data');
      } finally {
        setLoading(false);
      }
    };
    fetchInitialData();
  }, [isOpen]);

  const handleLevelChange = async (levelId: number) => {
    setSelectedLevel(levelId);
    setSelectedClass('');
    setClasses([]);
    if (!levelId) return;
    try {
      const cls = await studentService.getClasses(levelId);
      setClasses(Array.isArray(cls) ? cls : []);
    } catch {}
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubject) {
      setError(language === 'ar' ? 'يرجى اختيار المادة الدراسية' : 'Please select a subject');
      return;
    }
    if (!date) {
      setError(language === 'ar' ? 'يرجى تحديد التاريخ المطلوب' : 'Please select a date');
      return;
    }

    setSubmitting(true);
    setError(null);

    const payload = {
      subject_id: Number(selectedSubject),
      education_level_id: selectedLevel ? Number(selectedLevel) : null,
      class_id: selectedClass ? Number(selectedClass) : null,
      type: type,
      min_price: minPrice ? Number(minPrice) : null,
      max_price: maxPrice ? Number(maxPrice) : null,
      notes: notes.trim(),
      availability_slots: [
        {
          date: date,
          start_time: startTime,
          end_time: endTime,
        },
      ],
    };

    try {
      await studentService.createOrder(payload);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || (language === 'ar' ? 'حدث خطأ أثناء حفظ الطلب' : 'Failed to create order'));
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-[var(--border)] animate-fade-in my-8">
        <div className="flex items-center justify-between px-6 py-5 border-b border-[var(--border)] bg-[var(--light-bg)]">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary-pale text-primary flex items-center justify-center">
              <BookOpen size={20} />
            </div>
            <div>
              <h3 className="font-bold text-lg text-[var(--text-main)]">
                {language === 'ar' ? 'إنشاء طلب درس خاص جديد' : 'New Special Request'}
              </h3>
              <p className="text-xs text-[var(--text-muted)]">
                {language === 'ar' ? 'انشر طلبك لتلقي عروض الأسعار من المعلمين المؤهلين' : 'Post request to receive teacher offers'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-[var(--text-muted)] hover:bg-white hover:text-[var(--text-main)] transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {error && (
          <div className="mx-6 mt-4 p-4 rounded-xl bg-red-50 text-red-700 text-sm flex items-center gap-2 border border-red-200">
            <AlertCircle size={18} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="p-12 flex justify-center items-center">
            <Loader2 className="animate-spin h-8 w-8 text-primary" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-[var(--text-muted)] mb-1.5">
                  {language === 'ar' ? 'المرحلة التعليمية' : 'Education Level'}
                </label>
                <select
                  value={selectedLevel}
                  onChange={(e) => handleLevelChange(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border)] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="">{language === 'ar' ? 'اختر المرحلة' : 'Select Level'}</option>
                  {educationLevels.map((lvl) => (
                    <option key={lvl.id} value={lvl.id}>
                      {language === 'ar' ? (lvl.name_ar || lvl.name) : (lvl.name_en || lvl.name)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--text-muted)] mb-1.5">
                  {language === 'ar' ? 'الصف الدراسي' : 'Grade / Class'}
                </label>
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(Number(e.target.value))}
                  disabled={!selectedLevel}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border)] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
                >
                  <option value="">{language === 'ar' ? 'اختر الصف' : 'Select Class'}</option>
                  {classes.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {language === 'ar' ? (cls.name_ar || cls.name) : (cls.name_en || cls.name)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--text-muted)] mb-1.5">
                  {language === 'ar' ? 'المادة الدراسية *' : 'Subject *'}
                </label>
                <select
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(Number(e.target.value))}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border)] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="">{language === 'ar' ? 'اختر المادة' : 'Select Subject'}</option>
                  {subjects.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      {language === 'ar' ? (sub.name_ar || sub.name) : (sub.name_en || sub.name)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[var(--text-muted)] mb-1.5">
                  {language === 'ar' ? 'نوع الدرس' : 'Lesson Type'}
                </label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setType('single')}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-all ${
                      type === 'single'
                        ? 'border-primary bg-primary text-white shadow-sm'
                        : 'border-[var(--border)] bg-white text-[var(--text-main)] hover:bg-gray-50'
                    }`}
                  >
                    {language === 'ar' ? 'فردي' : 'Single'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setType('group')}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-all ${
                      type === 'group'
                        ? 'border-primary bg-primary text-white shadow-sm'
                        : 'border-[var(--border)] bg-white text-[var(--text-main)] hover:bg-gray-50'
                    }`}
                  >
                    {language === 'ar' ? 'مجموعة' : 'Group'}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-[var(--text-muted)] mb-1.5">
                    {language === 'ar' ? 'السعر الأدنى (ر.س)' : 'Min Price'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value ? Number(e.target.value) : '')}
                    placeholder="0"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border)] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[var(--text-muted)] mb-1.5">
                    {language === 'ar' ? 'السعر الأعلى (ر.س)' : 'Max Price'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value ? Number(e.target.value) : '')}
                    placeholder="200"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border)] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[var(--light-bg)] border border-[var(--border)] space-y-3">
              <span className="text-xs font-bold text-[var(--text-main)] block">
                {language === 'ar' ? 'الموعد المفضل للدرس' : 'Preferred Slot'}
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] text-[var(--text-muted)] mb-1">
                    {language === 'ar' ? 'التاريخ' : 'Date'}
                  </label>
                  <input
                    type="date"
                    required
                    value={date}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[var(--border)] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-[var(--text-muted)] mb-1">
                    {language === 'ar' ? 'من الساعة' : 'From'}
                  </label>
                  <input
                    type="time"
                    required
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[var(--border)] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-[var(--text-muted)] mb-1">
                    {language === 'ar' ? 'إلى الساعة' : 'To'}
                  </label>
                  <input
                    type="time"
                    required
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[var(--border)] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[var(--text-muted)] mb-1.5">
                {language === 'ar' ? 'ملاحظات وتفاصيل إضافية للمعلم' : 'Additional Notes'}
              </label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={language === 'ar' ? 'اكتب الموضوعات التي ترغب بالتركيز عليها خلال الدرس...' : 'Specify topics or areas of focus...'}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border)] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--border)]">
              <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
                {language === 'ar' ? 'إلغاء' : 'Cancel'}
              </Button>
              <Button type="submit" disabled={submitting} className="flex items-center gap-2">
                {submitting && <Loader2 size={16} className="animate-spin" />}
                <span>{language === 'ar' ? 'نشر الطلب الآن' : 'Post Request'}</span>
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

