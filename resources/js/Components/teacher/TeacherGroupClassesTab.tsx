import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../Contexts/LanguageContext';
import {
  Users,
  Plus,
  Calendar,
  Clock,
  DollarSign,
  Trash2,
  Video,
  Loader2,
  CheckCircle,
  AlertCircle,
  X,
  BookOpen,
  ArrowRight,
  ArrowLeft
} from 'lucide-react';
import { Button } from '../ui/Button';
import { teacherService, UserData } from '../../Services/api';
import { SessionRoomModal } from '../dashboard/SessionRoomModal';

interface TeacherGroupClassesTabProps {
  user: UserData;
}

export const TeacherGroupClassesTab: React.FC<TeacherGroupClassesTabProps> = ({ user }) => {
  const { t, language, direction } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState<any[]>([]);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<any | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [formTitle, setFormTitle] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formPrice, setFormPrice] = useState('');
  const [formMaxStudents, setFormMaxStudents] = useState('10');
  const [formLessons, setFormLessons] = useState<{ date: string; start: string; end: string }[]>([
    { date: '', start: '18:00', end: '19:00' }
  ]);

  const [agoraPayload, setAgoraPayload] = useState<any | null>(null);
  const [isRoomOpen, setIsRoomOpen] = useState(false);

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    setLoading(true);
    try {
      const res = await teacherService.getGroupClasses();
      setClasses(Array.isArray(res) ? res : []);
    } catch {
      setClasses([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddLessonField = () => {
    setFormLessons(prev => [...prev, { date: '', start: '18:00', end: '19:00' }]);
  };

  const handleRemoveLessonField = (index: number) => {
    setFormLessons(prev => prev.filter((_, i) => i !== index));
  };

  const handleLessonChange = (index: number, field: 'date' | 'start' | 'end', val: string) => {
    setFormLessons(prev => {
      const next = [...prev];
      next[index][field] = val;
      return next;
    });
  };

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formPrice) {
      setFormError(language === 'ar' ? 'يرجى إدخال اسم الحصة وسعر المقعد' : 'Please provide title and price');
      return;
    }

    setSubmitting(true);
    setFormError(null);
    try {
      const newClassRes = await teacherService.createGroupClass({
        title: formTitle,
        description: formDesc,
        price_per_student: Number(formPrice),
        max_students: Number(formMaxStudents) || 10,
      });

      const classData = newClassRes.data || newClassRes;
      if (classData.id && formLessons.some(l => l.date)) {
        const validLessons = formLessons.filter(l => l.date).map(l => ({
          lesson_date: l.date,
          start_time: l.start,
          end_time: l.end,
          title: formTitle,
        }));
        await teacherService.addGroupClassLessons(classData.id, { lessons: validLessons });
      }

      setIsCreateOpen(false);
      setFormTitle('');
      setFormDesc('');
      setFormPrice('');
      setFormLessons([{ date: '', start: '18:00', end: '19:00' }]);
      fetchClasses();
    } catch (err: any) {
      setFormError(err.message || (language === 'ar' ? 'فشل إنشاء الحصة' : 'Failed to create group class'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteClass = async (id: number) => {
    if (!confirm(language === 'ar' ? 'هل أنت متأكد من حذف هذه الحصة الجماعية؟' : 'Delete this group class?')) return;
    try {
      await teacherService.deleteGroupClass(id);
      setClasses(prev => prev.filter(c => c.id !== id));
      if (selectedClass?.id === id) setSelectedClass(null);
    } catch {}
  };

  const handleStartVirtualSession = (groupClass: any, lesson?: any) => {
    setAgoraPayload({
      app_id: '3a77d1a600964e9bb4aae8b0dd59f157',
      channel: `group_session_${groupClass.id}_${lesson?.id || 1}`,
      token: undefined,
      uid: user.id || 1,
      role: 'teacher',
      session_id: groupClass.id,
    });
    setIsRoomOpen(true);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="animate-spin h-8 w-8 text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            <Users size={22} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-main)]">
              {language === 'ar' ? 'مركز الحصص الجماعية للمعلم' : 'Teacher Group Classes Hub'}
            </h1>
            <p className="text-xs text-[var(--text-muted)]">
              {language === 'ar' ? 'إنشاء الفصول الجماعية، إدارة المقاعد، وبدء البث المباشر للفصل' : 'Create collaborative classes, manage seats, and host live sessions'}
            </p>
          </div>
        </div>

        <Button
          onClick={() => setIsCreateOpen(true)}
          className="rounded-xl font-bold text-xs bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
        >
          <Plus size={16} className="mr-1.5 inline" />
          {language === 'ar' ? 'إنشاء حصة جماعية جديدة' : 'Create Group Class'}
        </Button>
      </div>

      {classes.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-100 shadow-sm space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
            <Users size={32} />
          </div>
          <h3 className="font-bold text-slate-800 text-lg">
            {language === 'ar' ? 'لم تقم بإنشاء أي حصص جماعية بعد' : 'No Group Classes Created Yet'}
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {language === 'ar'
              ? 'تتيح لك الحصص الجماعية تدريس عدة طلاب في وقت واحد ومضاعفة دخلك التعليمي في الساعة الواحدة.'
              : 'Group classes allow you to tutor multiple students simultaneously and maximize your earnings.'}
          </p>
          <Button onClick={() => setIsCreateOpen(true)} className="rounded-xl font-bold text-xs bg-indigo-600 hover:bg-indigo-700 text-white">
            {language === 'ar' ? 'إنشاء أول حصة جماعية' : 'Create First Group Class'}
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {classes.map((cls) => {
            const lessons = cls.lessons || [];
            return (
              <div
                key={cls.id}
                className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700">
                      {cls.title}
                    </span>
                    <button
                      onClick={() => handleDeleteClass(cls.id)}
                      className="p-1 text-slate-300 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>

                  <p className="text-xs text-slate-500 mb-4 line-clamp-2">{cls.description || (language === 'ar' ? 'حصة جماعية تفاعلية' : 'Interactive group class')}</p>

                  <div className="grid grid-cols-3 gap-2 text-center p-3 rounded-2xl bg-slate-50 mb-4 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block">{language === 'ar' ? 'سعر المقعد' : 'Seat Price'}</span>
                      <span className="font-extrabold text-indigo-700">{Number(cls.price_per_student || cls.price || 0).toFixed(0)} {t.sar}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">{language === 'ar' ? 'أقصى طلاب' : 'Max Seats'}</span>
                      <span className="font-extrabold text-slate-800">{cls.max_students || 10}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">{language === 'ar' ? 'الدروس' : 'Lessons'}</span>
                      <span className="font-extrabold text-slate-800">{lessons.length}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-slate-400">
                    {language === 'ar' ? 'الفصل الافتراضي Agora' : 'Agora Virtual Room'}
                  </span>
                  <Button
                    onClick={() => handleStartVirtualSession(cls)}
                    className="rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white h-9 px-4"
                  >
                    <Video size={14} className="mr-1.5 inline" />
                    {language === 'ar' ? 'بدء البث المباشر' : 'Start Live Session'}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {isCreateOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-scale-in">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="font-bold text-slate-900 text-base">
                {language === 'ar' ? 'إنشاء حصة جماعية جديدة' : 'Create New Group Class'}
              </h3>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateClass} className="p-6 space-y-4 overflow-y-auto flex-1">
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-xs flex items-center gap-2">
                  <AlertCircle size={15} />
                  <span>{formError}</span>
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  {language === 'ar' ? 'عنوان الحصة الجماعية *' : 'Group Class Title *'}
                </label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder={language === 'ar' ? 'مثال: مراجعة نهائية في التفاضل والتكامل' : 'e.g., Final Calculus Review'}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  {language === 'ar' ? 'وصف الحصة وأهدافها' : 'Description & Objectives'}
                </label>
                <textarea
                  rows={2}
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  placeholder={language === 'ar' ? 'وضح ما سيتم شرحه خلال الجلسات الجماعية...' : 'Describe what students will learn...'}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">
                    {language === 'ar' ? 'سعر المقعد للطالب (ريال) *' : 'Price Per Seat (SAR) *'}
                  </label>
                  <input
                    type="number"
                    required
                    value={formPrice}
                    onChange={(e) => setFormPrice(e.target.value)}
                    placeholder="50"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">
                    {language === 'ar' ? 'الحد الأقصى للطلاب' : 'Max Students'}
                  </label>
                  <input
                    type="number"
                    value={formMaxStudents}
                    onChange={(e) => setFormMaxStudents(e.target.value)}
                    placeholder="10"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700">
                    {language === 'ar' ? 'جدول مواعيد الدروس:' : 'Lesson Schedule:'}
                  </label>
                  <button
                    type="button"
                    onClick={handleAddLessonField}
                    className="text-xs text-indigo-600 font-bold hover:underline"
                  >
                    + {language === 'ar' ? 'إضافة موعد درس' : 'Add Lesson'}
                  </button>
                </div>

                {formLessons.map((lesson, idx) => (
                  <div key={idx} className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-xl">
                    <input
                      type="date"
                      value={lesson.date}
                      onChange={(e) => handleLessonChange(idx, 'date', e.target.value)}
                      className="flex-1 px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs bg-white"
                    />
                    <input
                      type="time"
                      value={lesson.start}
                      onChange={(e) => handleLessonChange(idx, 'start', e.target.value)}
                      className="w-24 px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs bg-white"
                    />
                    <input
                      type="time"
                      value={lesson.end}
                      onChange={(e) => handleLessonChange(idx, 'end', e.target.value)}
                      className="w-24 px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs bg-white"
                    />
                    {formLessons.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveLessonField(idx)}
                        className="p-1 text-slate-400 hover:text-red-500"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div className="pt-4 flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateOpen(false)}
                  className="flex-1 rounded-xl text-xs"
                >
                  {language === 'ar' ? 'إلغاء' : 'Cancel'}
                </Button>
                <Button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  {submitting ? <Loader2 className="animate-spin h-4 w-4" /> : (language === 'ar' ? 'إنشاء الحصة' : 'Create Class')}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {agoraPayload && (
        <SessionRoomModal
          isOpen={isRoomOpen}
          onClose={() => {
            setIsRoomOpen(false);
            setAgoraPayload(null);
          }}
          agora={agoraPayload}
        />
      )}
    </div>
  );
};

