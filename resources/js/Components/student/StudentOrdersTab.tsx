import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../Contexts/LanguageContext';
import { 
  Plus, 
  Clock, 
  BookOpen, 
  GraduationCap,
  Star,
  ChevronLeft,
  ChevronRight,
  AlertCircle, 
  Trash2, 
  FileText
} from 'lucide-react';
import { Button } from '../ui/Button';
import { studentService, getStorageUrl } from '../../Services/api';
import { CreateOrderModal } from './CreateOrderModal';
import { StudentOrderApplicationsModal } from './StudentOrderApplicationsModal';

const DEFAULT_EDUCATION_LEVELS: Record<number, { ar: string; en: string }> = {
  1: { ar: 'الابتدائية', en: 'Primary' },
  2: { ar: 'المتوسطة', en: 'Intermediate' },
  3: { ar: 'الثانوية', en: 'Secondary' },
  4: { ar: 'الجامعة', en: 'University' },
  5: { ar: 'خريج/ة', en: 'Graduate' },
  6: { ar: 'موظف', en: 'Employee' },
  7: { ar: 'متعلم', en: 'Learner' },
};

const DEFAULT_CLASSES: Record<number, { ar: string; en: string; levelId: number }> = {
  1: { ar: 'الصف الأول الابتدائي', en: 'Grade 1', levelId: 1 },
  2: { ar: 'الصف الثاني الابتدائي', en: 'Grade 2', levelId: 1 },
  3: { ar: 'الصف الثالث الابتدائي', en: 'Grade 3', levelId: 1 },
  4: { ar: 'الصف الرابع الابتدائي', en: 'Grade 4', levelId: 1 },
  5: { ar: 'الصف الخامس الابتدائي', en: 'Grade 5', levelId: 1 },
  6: { ar: 'الصف السادس الابتدائي', en: 'Grade 6', levelId: 1 },
  7: { ar: 'الصف الأول المتوسط', en: 'Grade 7', levelId: 2 },
  8: { ar: 'الصف الثاني المتوسط', en: 'Grade 8', levelId: 2 },
  9: { ar: 'الصف الثالث المتوسط', en: 'Grade 9', levelId: 2 },
  10: { ar: 'الصف الأول الثانوي', en: 'Grade 10', levelId: 3 },
  11: { ar: 'الصف الثاني الثانوي', en: 'Grade 11', levelId: 3 },
  12: { ar: 'الصف الثالث الثانوي', en: 'Grade 12', levelId: 3 },
  13: { ar: 'السنة الأولى الجامعية', en: 'Year 1', levelId: 4 },
  14: { ar: 'السنة الثانية الجامعية', en: 'Year 2', levelId: 4 },
  15: { ar: 'السنة الثالثة الجامعية', en: 'Year 3', levelId: 4 },
  16: { ar: 'السنة الرابعة الجامعية', en: 'Year 4', levelId: 4 },
};

export const StudentOrdersTab: React.FC = () => {
  const { language } = useLanguage();
  const isAr = language === 'ar';

  const [orders, setOrders] = useState<any[]>([]);
  const [educationLevels, setEducationLevels] = useState<any[]>([]);
  const [allSubjects, setAllSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'confirmed' | 'cancelled'>('all');

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedOrderForApps, setSelectedOrderForApps] = useState<any | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const [ordersRes, levelsRes, subsRes] = await Promise.all([
        studentService.getOrders().catch(() => []),
        studentService.getEducationLevels().catch(() => []),
        studentService.getSubjects().catch(() => []),
      ]);

      const list = Array.isArray(ordersRes) ? ordersRes : (ordersRes?.data || []);
      setOrders(list);

      const rawLevels = Array.isArray(levelsRes) ? levelsRes : (levelsRes?.education_levels || levelsRes?.data || []);
      setEducationLevels(rawLevels);

      const rawSubs = Array.isArray(subsRes) ? subsRes : (subsRes?.subject || subsRes?.subjects || subsRes?.data || []);
      setAllSubjects(Array.isArray(rawSubs) ? rawSubs : []);
    } catch (err: any) {
      setError(err.message || (isAr ? 'فشل تحميل الطلبات' : 'Error loading orders'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const resolveOrderMeta = (order: any) => {
    const classId = Number(order.class_id || order.subject?.class_id || 0);
    const levelId = Number(order.education_level_id || order.subject?.education_level_id || 0);
    const subjectId = Number(order.subject_id || order.subject?.id || 0);

    let subjectName = '';
    if (order.subject) {
      subjectName = isAr
        ? (order.subject.name_ar || order.subject.name || order.subject.title)
        : (order.subject.name_en || order.subject.name || order.subject.title);
    }
    if (!subjectName && subjectId) {
      const foundSub = allSubjects.find((s) => Number(s.id) === subjectId);
      if (foundSub) {
        subjectName = isAr ? (foundSub.name_ar || foundSub.name) : (foundSub.name_en || foundSub.name);
      }
    }
    if (!subjectName) {
      for (const lvl of educationLevels) {
        if (Array.isArray(lvl.classes)) {
          for (const cls of lvl.classes) {
            if (Array.isArray(cls.subjects)) {
              const s = cls.subjects.find((sub: any) => Number(sub.id) === subjectId);
              if (s) {
                subjectName = isAr ? (s.name_ar || s.name) : (s.name_en || s.name);
                break;
              }
            }
          }
        }
        if (subjectName) break;
      }
    }
    if (!subjectName) {
      subjectName = isAr ? 'طلب درس خاص' : 'Special Lesson';
    }

    let gradeName = '';
    if (order.class) {
      gradeName = isAr
        ? (order.class.name_ar || order.class.name)
        : (order.class.name_en || order.class.name);
    } else if (order.grade_level) {
      gradeName = typeof order.grade_level === 'object'
        ? (isAr ? order.grade_level.name_ar : order.grade_level.name_en)
        : String(order.grade_level);
    }
    if (!gradeName && classId) {
      for (const lvl of educationLevels) {
        if (Array.isArray(lvl.classes)) {
          const c = lvl.classes.find((cls: any) => Number(cls.id) === classId);
          if (c) {
            gradeName = isAr ? (c.name_ar || c.name) : (c.name_en || c.name);
            break;
          }
        }
      }
    }
    if (!gradeName && classId && DEFAULT_CLASSES[classId]) {
      gradeName = isAr ? DEFAULT_CLASSES[classId].ar : DEFAULT_CLASSES[classId].en;
    }
    if (!gradeName) {
      gradeName = isAr ? 'الصف الأول الابتدائي' : 'Grade 1';
    }

    let levelName = '';
    if (order.education_level) {
      levelName = isAr
        ? (order.education_level.name_ar || order.education_level.name)
        : (order.education_level.name_en || order.education_level.name);
    } else if (order.academic_level) {
      levelName = typeof order.academic_level === 'object'
        ? (isAr ? order.academic_level.name_ar : order.academic_level.name_en)
        : String(order.academic_level);
    }
    if (!levelName && levelId) {
      const lvl = educationLevels.find((l) => Number(l.id) === levelId);
      if (lvl) {
        levelName = isAr ? (lvl.name_ar || lvl.name) : (lvl.name_en || lvl.name);
      }
    }
    if (!levelName && classId) {
      for (const lvl of educationLevels) {
        if (Array.isArray(lvl.classes) && lvl.classes.some((c: any) => Number(c.id) === classId)) {
          levelName = isAr ? (lvl.name_ar || lvl.name) : (lvl.name_en || lvl.name);
          break;
        }
      }
    }
    if (!levelName && levelId && DEFAULT_EDUCATION_LEVELS[levelId]) {
      levelName = isAr ? DEFAULT_EDUCATION_LEVELS[levelId].ar : DEFAULT_EDUCATION_LEVELS[levelId].en;
    }
    if (!levelName && classId && DEFAULT_CLASSES[classId]) {
      const defLevelId = DEFAULT_CLASSES[classId].levelId;
      if (DEFAULT_EDUCATION_LEVELS[defLevelId]) {
        levelName = isAr ? DEFAULT_EDUCATION_LEVELS[defLevelId].ar : DEFAULT_EDUCATION_LEVELS[defLevelId].en;
      }
    }
    if (!levelName) {
      levelName = isAr ? 'الابتدائية' : 'Primary';
    }

    return { subjectName, gradeName, levelName };
  };

  const handleDeleteOrder = async (orderId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const confirmed = window.confirm(
      isAr
        ? 'هل أنت متأكد من رغبتك في إلغاء هذا الطلب؟'
        : 'Are you sure you want to cancel this request?'
    );
    if (!confirmed) return;

    setDeletingId(orderId);
    try {
      await studentService.deleteOrder(orderId);
      setOrders(prev => prev.filter(o => o.id !== orderId));
    } catch (err: any) {
      alert(err.message || (isAr ? 'فشل إلغاء الطلب' : 'Failed to delete order'));
    } finally {
      setDeletingId(null);
    }
  };

  const filteredOrders = orders.filter((order) => {
    const status = (order.status || 'pending').toLowerCase();
    if (filter === 'all') return true;
    if (filter === 'pending') return status === 'pending';
    if (filter === 'confirmed') return status === 'confirmed' || status === 'assigned' || status === 'completed';
    if (filter === 'cancelled') return status === 'cancelled';
    return true;
  });

  const getStatusBadge = (status: string) => {
    const s = (status || 'pending').toLowerCase();
    if (s === 'confirmed' || s === 'assigned') {
      return (
        <span className="px-2.5 py-1 rounded-[10px] text-[11px] font-bold bg-[#E8F5E9] text-[#5B9F48]">
          {isAr ? 'مؤكد' : 'Confirmed'}
        </span>
      );
    }
    if (s === 'completed') {
      return (
        <span className="px-2.5 py-1 rounded-[10px] text-[11px] font-bold bg-[#F1F5F9] text-[#64748B]">
          {isAr ? 'مكتمل' : 'Completed'}
        </span>
      );
    }
    if (s === 'cancelled') {
      return (
        <span className="px-2.5 py-1 rounded-[10px] text-[11px] font-bold bg-[#FEE2E2] text-[#EF4444]">
          {isAr ? 'ملغي' : 'Cancelled'}
        </span>
      );
    }
    return (
      <span className="px-2.5 py-1 rounded-[10px] text-[11px] font-bold bg-[#FFF7ED] text-[#EA580C]">
        {isAr ? 'قيد المراجعة' : 'Under Review'}
      </span>
    );
  };

  const renderMiddleBanner = (order: any, status: string) => {
    const teacher = order.teacher || {};
    const teacherName = teacher.name || (teacher.first_name ? `${teacher.first_name} ${teacher.last_name || ''}`.trim() : (isAr ? 'المعلم' : 'Teacher'));
    const teacherPhoto = teacher.profile_image || teacher.profile_photo || teacher.avatar || '';
    const teacherSubject = teacher.specialization || (order.subject ? (isAr ? (order.subject.name_ar || order.subject.name) : (order.subject.name_en || order.subject.name)) : '');
    const ratingRaw = teacher.rating || 5.0;
    const ratingStr = typeof ratingRaw === 'number' ? ratingRaw.toFixed(1) : String(ratingRaw);

    if (status === 'pending') {
      return (
        <div className="w-full bg-[#FFFBEB] rounded-[10px] py-2.5 px-3 text-center">
          <span className="text-[12px] font-semibold text-[#D97706]">
            {isAr ? 'يتم البحث عن معلم متاح في الموعد المحدد' : 'Searching for an available teacher at the specified time'}
          </span>
        </div>
      );
    }

    if (status === 'confirmed' || status === 'assigned' || status === 'completed') {
      return (
        <div className="w-full bg-[#F0FDF4] rounded-[10px] p-2.5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#E2E8F0] overflow-hidden shrink-0 flex items-center justify-center">
            {teacherPhoto ? (
              <img src={getStorageUrl(teacherPhoto)} alt={teacherName} className="w-full h-full object-cover" />
            ) : (
              <span className="font-bold text-sm text-[#0D4A5F]">{teacherName.charAt(0).toUpperCase()}</span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-[13px] font-bold text-[#0D4A5F] truncate">
              {teacherName}
            </h4>
            <div className="flex items-center gap-2 mt-0.5">
              {teacherSubject && (
                <div className="flex items-center gap-1 text-[11px] text-[#64748B]">
                  <BookOpen size={12} className="shrink-0" />
                  <span className="truncate">{teacherSubject}</span>
                </div>
              )}
              <div className="flex items-center gap-0.5 text-[11px] font-bold text-[#0D4A5F]">
                <Star size={12} className="fill-[#FFB800] text-[#FFB800] shrink-0" />
                <span>{ratingStr}</span>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (status === 'cancelled') {
      return (
        <div className="w-full bg-[#FEF2F2] rounded-[10px] py-2.5 px-3 text-center">
          <span className="text-[12px] font-semibold text-[#EF4444]">
            {isAr ? 'لم يتوفر معلم قبل موعد الطلب' : 'No teacher was available before appointment'}
          </span>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-[#0D4A5F]">
            {isAr ? 'الطلبات الخاصة' : 'Special Requests'}
          </h2>
          <p className="text-xs text-[#64748B] mt-1">
            {isAr
              ? 'أدر طلباتك وتلقى العروض التنافسية من نخبة المعلمين المعتمدين'
              : 'Manage requests and receive competitive offers from verified teachers'}
          </p>
        </div>

        <Button
          onClick={() => setIsCreateOpen(true)}
          className="flex items-center gap-2 rounded-2xl px-5 py-2.5 bg-[#5B9F48] hover:bg-[#4d863d] text-white shadow-sm self-start sm:self-auto font-bold text-sm"
        >
          <Plus size={18} />
          <span>{isAr ? 'طلب جديد' : 'New Request'}</span>
        </Button>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {[
          { key: 'all', labelAr: 'الكل', labelEn: 'All' },
          { key: 'pending', labelAr: 'قيد المراجعة', labelEn: 'Under Review' },
          { key: 'confirmed', labelAr: 'مؤكد', labelEn: 'Confirmed' },
          { key: 'cancelled', labelAr: 'ملغي', labelEn: 'Cancelled' },
        ].map((tab) => {
          const isSelected = filter === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key as any)}
              className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all shadow-sm ${
                isSelected
                  ? 'bg-[#0D4A5F] text-white'
                  : 'bg-white text-[#0D4A5F] hover:bg-gray-50 border border-[#F1F5F9]'
              }`}
            >
              {isAr ? tab.labelAr : tab.labelEn}
            </button>
          );
        })}
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-red-50 text-[#EF4444] text-sm flex items-center justify-between gap-2 border border-red-200">
          <div className="flex items-center gap-2">
            <AlertCircle size={18} className="shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={fetchOrders}
            className="px-3 py-1 bg-red-100 hover:bg-red-200 text-[#EF4444] rounded-lg text-xs font-bold transition-colors"
          >
            {isAr ? 'إعادة المحاولة' : 'Retry'}
          </button>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((n) => (
            <div
              key={n}
              className="bg-white rounded-2xl border border-[#F1F5F9] p-4 shadow-sm animate-pulse space-y-3"
            >
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <div className="h-4 w-32 bg-gray-200 rounded" />
                  <div className="h-3 w-24 bg-gray-100 rounded" />
                </div>
                <div className="h-6 w-20 bg-gray-200 rounded-[10px]" />
              </div>
              <div className="h-10 w-full bg-gray-100 rounded-[10px]" />
              <div className="flex items-center justify-between pt-2 border-t border-[#F1F5F9]">
                <div className="h-4 w-20 bg-gray-200 rounded" />
                <div className="h-4 w-14 bg-gray-100 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="py-20 text-center flex flex-col items-center justify-center">
          <div className="w-28 h-28 rounded-[32px] bg-[#DCE5EA]/50 flex items-center justify-center mb-5 text-[#0D4A5F]">
            <FileText size={48} />
          </div>
          <h3 className="font-bold text-lg text-[#0D4A5F] mb-1.5">
            {isAr ? 'لا توجد طلبات بعد' : 'No orders yet'}
          </h3>
          <p className="text-xs text-[#64748B] max-w-sm mx-auto mb-6">
            {isAr
              ? 'لم تقم بإرسال أي طلب حتى الآن'
              : "You haven't submitted any orders yet"}
          </p>
          <Button
            onClick={() => setIsCreateOpen(true)}
            className="rounded-2xl text-xs px-6 py-2.5 bg-[#5B9F48] hover:bg-[#4d863d] text-white font-bold shadow-sm"
          >
            {isAr ? 'طلب جديد' : 'New Request'}
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredOrders.map((order) => {
            const { subjectName, gradeName, levelName } = resolveOrderMeta(order);

            const slots = order.available_slots || order.availableSlots || [];
            const firstSlot = slots[0];
            const slotDate = firstSlot?.date?.toString() || '';
            const slotTime = firstSlot?.start_time ? (firstSlot?.end_time ? `${firstSlot.start_time} - ${firstSlot.end_time}` : firstSlot.start_time) : '';
            const dateTimeStr = slotDate && slotTime ? `${slotDate} • ${slotTime}` : (slotDate || slotTime);

            const status = (order.status || 'pending').toLowerCase();
            const isPending = status === 'pending';

            const priceRaw = order.price || order.max_price || order.min_price || 0;
            const priceVal = parseFloat(priceRaw) || 0;
            const priceStr = priceVal > 0 ? (priceVal % 1 === 0 ? priceVal.toFixed(0) : priceVal.toFixed(1)) : '0';

            const appsCount = order.applications_count ?? (order.applications ? order.applications.length : 0);
            const cardTitle = gradeName ? `${subjectName} • ${gradeName}` : subjectName;

            return (
              <div
                key={order.id}
                onClick={() => setSelectedOrderForApps({ ...order, resolvedSubjectName: subjectName, resolvedGradeName: gradeName, resolvedLevelName: levelName })}
                className="bg-white rounded-2xl border border-[#F1F5F9] p-4 shadow-sm hover:shadow-md transition-all flex flex-col justify-between gap-3.5 cursor-pointer group"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2.5">
                    <div className="min-w-0">
                      <h3 className="font-bold text-base text-[#0D4A5F] truncate group-hover:text-[#5B9F48] transition-colors">
                        {cardTitle}
                      </h3>
                      
                      <div className="flex items-center gap-1.5 flex-wrap mt-1.5">
                        {levelName && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-bold bg-[#EFF6F4] text-[#0D4A5F] border border-[#5B9F48]/20">
                            <GraduationCap size={13} className="text-[#5B9F48] shrink-0" />
                            <span>{levelName}</span>
                          </span>
                        )}
                        {gradeName && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-bold bg-gray-100 text-[#0D4A5F] border border-gray-200">
                            <BookOpen size={13} className="text-[#0D4A5F] shrink-0" />
                            <span>{gradeName}</span>
                          </span>
                        )}
                        {dateTimeStr && (
                          <span className="inline-flex items-center gap-1 text-[11px] text-[#64748B]">
                            <Clock size={13} className="shrink-0" />
                            <span>{dateTimeStr}</span>
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {getStatusBadge(status)}
                      <div className="text-[#64748B]">
                        {isAr ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
                      </div>
                    </div>
                  </div>

                  {renderMiddleBanner(order, status)}

                  {order.notes && (
                    <p className="text-xs text-[#64748B] bg-[#EFF6F4]/60 p-2.5 rounded-xl mt-2.5 line-clamp-2">
                      {order.notes}
                    </p>
                  )}
                </div>

                <div className="pt-3 border-t border-[#F1F5F9] flex flex-col gap-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-baseline gap-1">
                      <span className="font-bold text-[15px] text-[#0D4A5F]">{priceStr}</span>
                      <span className="text-[11px] text-[#0D4A5F]">
                        {isAr ? 'ر.س /ساعة' : 'SAR /hr'}
                      </span>
                    </div>
                    <span className="text-[12px] text-[#94A3B8]">
                      {isAr ? 'الإجمالي' : 'Total'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-2">
                      {appsCount > 0 && (
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#5B9F48]/10 text-[#5B9F48]">
                          {appsCount} {isAr ? 'عروض مقدمة' : 'Offers'}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {isPending && (
                        <button
                          disabled={deletingId === order.id}
                          onClick={(e) => handleDeleteOrder(order.id, e)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-[#EF4444] hover:bg-red-50 transition-colors"
                          title={isAr ? 'إلغاء الطلب' : 'Cancel Request'}
                        >
                          <Trash2 size={16} />
                        </button>
                      )}

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedOrderForApps({ ...order, resolvedSubjectName: subjectName, resolvedGradeName: gradeName, resolvedLevelName: levelName });
                        }}
                        className="text-xs font-bold text-[#0D4A5F] hover:text-[#5B9F48] transition-colors py-1 px-2.5 rounded-lg hover:bg-gray-50 border border-[#F1F5F9]"
                      >
                        {isAr ? 'استعراض العروض' : 'View Offers'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <CreateOrderModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={fetchOrders}
      />

      {selectedOrderForApps && (
        <StudentOrderApplicationsModal
          orderId={selectedOrderForApps.id}
          orderData={selectedOrderForApps}
          isOpen={true}
          onClose={() => setSelectedOrderForApps(null)}
          onAccepted={fetchOrders}
        />
      )}
    </div>
  );
};

export default StudentOrdersTab;
