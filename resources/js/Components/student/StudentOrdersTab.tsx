import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../Contexts/LanguageContext';
import {
  Plus,
  Clock,
  Calendar,
  BookOpen,
  GraduationCap,
  Layers,
  Laptop,
  Home,
  FileText,
  Trash2,
  ChevronRight,
  ChevronLeft,
  Loader2,
  AlertCircle,
  CheckCircle,
  Star,
  Check,
  X,
  User
} from 'lucide-react';
import { Button } from '../ui/Button';
import { studentService, getStorageUrl } from '../../Services/api';

export const StudentOrdersTab: React.FC = () => {
  const { t, language, direction } = useLanguage();
  const isAr = language === 'ar';

  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<any[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'pending' | 'confirmed' | 'cancelled'>('all');

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [educationLevels, setEducationLevels] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);

  const [selectedLevelId, setSelectedLevelId] = useState<number | ''>('');
  const [selectedClassId, setSelectedClassId] = useState<number | ''>('');
  const [selectedSubjectId, setSelectedSubjectId] = useState<number | ''>('');
  const [sessionType, setSessionType] = useState<'online' | 'in_house'>('online');
  const [sessionDate, setSessionDate] = useState('');
  const [sessionTime, setSessionTime] = useState('');
  const [sessionDescription, setSessionDescription] = useState('');

  const [loadingLevels, setLoadingLevels] = useState(false);
  const [loadingClasses, setLoadingClasses] = useState(false);
  const [loadingSubjects, setLoadingSubjects] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [selectedOrderForApps, setSelectedOrderForApps] = useState<any | null>(null);
  const [applications, setApplications] = useState<any[]>([]);
  const [appsLoading, setAppsLoading] = useState(false);
  const [acceptingId, setAcceptingId] = useState<number | null>(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await studentService.getOrders();
      setOrders(Array.isArray(res) ? res : []);
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreateModal = async () => {
    setIsCreateOpen(true);
    setFormError(null);
    setSuccessMessage(null);
    setSelectedLevelId('');
    setSelectedClassId('');
    setSelectedSubjectId('');
    setClasses([]);
    setSubjects([]);
    setSessionDescription('');
    setSessionType('online');

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const yyyy = tomorrow.getFullYear();
    const mm = String(tomorrow.getMonth() + 1).padStart(2, '0');
    const dd = String(tomorrow.getDate()).padStart(2, '0');
    setSessionDate(`${yyyy}-${mm}-${dd}`);
    setSessionTime('16:00');

    if (educationLevels.length === 0) {
      setLoadingLevels(true);
      try {
        const levels = await studentService.getEducationLevels();
        setEducationLevels(Array.isArray(levels) ? levels : []);
      } catch {
        setEducationLevels([]);
      } finally {
        setLoadingLevels(false);
      }
    }
  };

  const handleLevelChange = async (levelIdStr: string) => {
    const levelId = levelIdStr ? Number(levelIdStr) : '';
    setSelectedLevelId(levelId);
    setSelectedClassId('');
    setSelectedSubjectId('');
    setClasses([]);
    setSubjects([]);

    if (levelId) {
      setLoadingClasses(true);
      try {
        const classesData = await studentService.getClasses(Number(levelId));
        setClasses(Array.isArray(classesData) ? classesData : []);
      } catch {
        setClasses([]);
      } finally {
        setLoadingClasses(false);
      }
    }
  };

  const handleClassChange = async (classIdStr: string) => {
    const classId = classIdStr ? Number(classIdStr) : '';
    setSelectedClassId(classId);
    setSelectedSubjectId('');
    setSubjects([]);

    if (classId) {
      setLoadingSubjects(true);
      try {
        const subjectsData = await studentService.getReferenceSubjects(Number(classId));
        setSubjects(Array.isArray(subjectsData) ? subjectsData : []);
      } catch {
        setSubjects([]);
      } finally {
        setLoadingSubjects(false);
      }
    }
  };

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!selectedLevelId) {
      setFormError(isAr ? 'يرجى اختيار المرحلة التعليمية' : 'Please select education level');
      return;
    }
    if (!selectedClassId) {
      setFormError(isAr ? 'يرجى اختيار الصف الدراسي' : 'Please select grade/class');
      return;
    }
    if (!selectedSubjectId) {
      setFormError(isAr ? 'يرجى اختيار المادة الدراسية' : 'Please select subject');
      return;
    }
    if (!sessionDate) {
      setFormError(isAr ? 'يرجى تحديد التاريخ' : 'Please select date');
      return;
    }
    if (!sessionTime) {
      setFormError(isAr ? 'يرجى تحديد وقت البدء' : 'Please select start time');
      return;
    }
    if (!sessionDescription.trim()) {
      setFormError(isAr ? 'يرجى كتابة تفاصيل ووصف الحصة' : 'Please enter session details');
      return;
    }

    const [startH, startM] = sessionTime.split(':').map(Number);
    const endH = ((startH || 0) + 1) % 24;
    const endHStr = String(endH).padStart(2, '0');
    const endMStr = String(startM || 0).padStart(2, '0');
    const calculatedEndTime = `${endHStr}:${endMStr}`;

    const payload = {
      subject_id: Number(selectedSubjectId),
      class_id: Number(selectedClassId),
      education_level_id: Number(selectedLevelId),
      order_type: sessionType,
      notes: sessionDescription.trim(),
      availability_slots: [
        {
          date: sessionDate,
          start_time: sessionTime,
          end_time: calculatedEndTime
        }
      ]
    };

    setSubmitting(true);
    try {
      await studentService.createOrder(payload);
      setSuccessMessage(isAr ? 'تم إرسال الطلب بنجاح' : 'Request submitted successfully');
      setTimeout(() => {
        setIsCreateOpen(false);
        setSuccessMessage(null);
      }, 1200);
      fetchOrders();
    } catch (err: any) {
      setFormError(err.message || (isAr ? 'فشل إنشاء الطلب' : 'Failed to create request'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenApplications = async (order: any) => {
    setSelectedOrderForApps(order);
    setAppsLoading(true);
    try {
      const res = await studentService.getOrderApplications(order.id);
      setApplications(Array.isArray(res) ? res : (res?.data || []));
    } catch {
      setApplications([]);
    } finally {
      setAppsLoading(false);
    }
  };

  const handleAcceptApplication = async (appId: number) => {
    if (!selectedOrderForApps) return;
    if (!confirm(isAr ? 'هل أنت متأكد من قبول هذا العرض؟' : 'Are you sure you want to accept this proposal?')) return;

    setAcceptingId(appId);
    try {
      const slot = selectedOrderForApps.available_slots?.[0] || selectedOrderForApps.availableSlots?.[0];
      await studentService.acceptApplication(selectedOrderForApps.id, appId, {
        slot_id: slot?.id,
        payment_method: 'cash'
      });
      fetchOrders();
      setSelectedOrderForApps(null);
    } catch (err: any) {
      alert(err.message || (isAr ? 'فشل قبول العرض' : 'Failed to accept proposal'));
    } finally {
      setAcceptingId(null);
    }
  };

  const handleDeleteOrder = async (orderId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(isAr ? 'هل أنت متأكد من حذف هذا الطلب؟' : 'Are you sure you want to delete this request?')) return;
    try {
      await studentService.deleteOrder(orderId);
      setOrders(prev => prev.filter(o => o.id !== orderId));
      if (selectedOrderForApps?.id === orderId) setSelectedOrderForApps(null);
    } catch (err: any) {
      alert(err.message || (isAr ? 'فشل حذف الطلب' : 'Failed to delete order'));
    }
  };

  const filteredOrders = orders.filter(order => {
    const status = (order.status || 'pending').toLowerCase();
    if (selectedFilter === 'all') return true;
    if (selectedFilter === 'pending') return status === 'pending';
    if (selectedFilter === 'confirmed') return status === 'confirmed' || status === 'assigned' || status === 'completed';
    if (selectedFilter === 'cancelled') return status === 'cancelled';
    return true;
  });

  const getStatusBadge = (status: string) => {
    const s = (status || 'pending').toLowerCase();
    if (s === 'pending') {
      return (
        <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#FFF7ED] text-[#EA580C] border border-[#FFEDD5]">
          {isAr ? 'قيد المراجعة' : 'In Review'}
        </span>
      );
    }
    if (s === 'confirmed' || s === 'assigned') {
      return (
        <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#E8F5E9] text-[#059669] border border-[#C8E6C9]">
          {isAr ? 'مؤكد' : 'Confirmed'}
        </span>
      );
    }
    if (s === 'completed') {
      return (
        <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#F1F5F9] text-[#64748B] border border-[#E2E8F0]">
          {isAr ? 'مكتمل' : 'Completed'}
        </span>
      );
    }
    if (s === 'cancelled') {
      return (
        <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#FEE2E2] text-[#EF4444] border border-[#FECACA]">
          {isAr ? 'ملغي' : 'Cancelled'}
        </span>
      );
    }
    return (
      <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
        {status}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[420px]">
        <Loader2 className="animate-spin h-9 w-9 text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-16 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-inner">
            <GraduationCap size={26} />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
              {isAr ? 'الطلبات الخاصة' : 'Special Tutoring Requests'}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              {isAr ? 'متابعة وإدارة طلبات الدروس الخاصة ومراجعة عروض المعلمين' : 'Manage your private lesson requests and teacher bids'}
            </p>
          </div>
        </div>

        <Button
          onClick={handleOpenCreateModal}
          className="rounded-xl font-bold text-sm bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 px-5 py-2.5 flex items-center gap-2 justify-center"
        >
          <Plus size={18} />
          <span>{isAr ? 'طلب جديد' : 'New Request'}</span>
        </Button>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {[
          { id: 'all', label: isAr ? 'الكل' : 'All' },
          { id: 'pending', label: isAr ? 'قيد المراجعة' : 'Under Review' },
          { id: 'confirmed', label: isAr ? 'مؤكد' : 'Confirmed' },
          { id: 'cancelled', label: isAr ? 'ملغي' : 'Cancelled' },
        ].map((filter) => {
          const isSelected = selectedFilter === filter.id;
          return (
            <button
              key={filter.id}
              onClick={() => setSelectedFilter(filter.id as any)}
              className={`px-5 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap shadow-sm ${
                isSelected
                  ? 'bg-slate-900 text-white shadow-slate-900/10'
                  : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-100'
              }`}
            >
              {filter.label}
            </button>
          );
        })}
      </div>

      {filteredOrders.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-100 shadow-sm flex flex-col items-center justify-center min-h-[360px]">
          <div className="w-24 h-24 rounded-3xl bg-[#DCE5EA]/50 text-slate-700 flex items-center justify-center mb-5">
            <FileText size={44} />
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-1">
            {isAr ? 'لا توجد طلبات بعد' : 'No Orders Yet'}
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mb-6">
            {isAr ? 'لم تقم بإرسال أي طلب حتى الآن' : 'You have not submitted any custom tutoring requests yet'}
          </p>
          <Button
            onClick={handleOpenCreateModal}
            className="rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 shadow-sm"
          >
            <Plus size={15} className="mr-1.5 inline" />
            {isAr ? 'إنشاء طلب درس خاص جديد' : 'Create Custom Request'}
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredOrders.map((order) => {
            const subject = order.subject;
            const subjectName = isAr
              ? (subject?.name_ar || subject?.name || (isAr ? 'مادة دراسية' : 'Subject'))
              : (subject?.name_en || subject?.name || 'Subject');

            const levelName = isAr
              ? (order.education_level?.name_ar || order.educationLevel?.name_ar || '')
              : (order.education_level?.name_en || order.educationLevel?.name_en || '');

            const className = isAr
              ? (order.school_class?.name_ar || order.schoolClass?.name_ar || '')
              : (order.school_class?.name_en || order.schoolClass?.name_en || '');

            const academicGrade = className || levelName;
            const cardTitle = academicGrade ? `${subjectName} • ${academicGrade}` : subjectName;

            const slots = order.available_slots || order.availableSlots || [];
            const firstSlot = slots.length > 0 ? slots[0] : null;
            const slotDate = firstSlot?.date || '';
            const slotTime = firstSlot?.start_time || '';
            const dateTimeStr = slotDate && slotTime ? `${slotDate} • ${slotTime}` : (slotDate || slotTime);

            const status = (order.status || 'pending').toLowerCase();
            const appsCount = order.applications_count !== undefined ? order.applications_count : (order.applications?.length || 0);

            const acceptedApp = Array.isArray(order.applications)
              ? order.applications.find((a: any) => a.status === 'accepted')
              : null;
            const assignedTeacher = acceptedApp?.teacher || order.teacher || order.preferredTeacher;
            const teacherName = assignedTeacher ? `${assignedTeacher.first_name || ''} ${assignedTeacher.last_name || ''}`.trim() || assignedTeacher.name : '';
            const teacherSpec = assignedTeacher?.profile?.teacher_subjects?.[0]?.title || assignedTeacher?.profile?.specialization || (isAr ? 'معلم معتمد' : 'Certified Tutor');
            const teacherPhoto = assignedTeacher?.profile_photo_url || assignedTeacher?.profile_image || '';
            const teacherRating = assignedTeacher?.rating || '5.0';

            const priceVal = Number(order.max_price || order.min_price || acceptedApp?.proposed_price || 0);

            return (
              <div
                key={order.id}
                onClick={() => handleOpenApplications(order)}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all p-4 flex flex-col justify-between cursor-pointer group"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-bold text-slate-800 truncate">
                        {cardTitle}
                      </h3>
                      {dateTimeStr && (
                        <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-1">
                          <Clock size={13} className="text-slate-400" />
                          <span>{dateTimeStr}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {getStatusBadge(status)}
                      <span className="text-slate-300 group-hover:text-slate-600 transition-colors">
                        {direction === 'rtl' ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
                      </span>
                    </div>
                  </div>

                  {status === 'pending' && (
                    <div className="mb-3 space-y-2">
                      <div className="w-full py-2.5 px-3 rounded-xl bg-[#FFFBEB] text-[#D97706] text-xs font-semibold text-center">
                        {isAr ? 'يتم البحث عن معلم متاح في الموعد المحدد' : 'Searching for an available teacher for your schedule'}
                      </div>
                      {appsCount > 0 && (
                        <div className="flex items-center justify-between py-1.5 px-3 rounded-xl bg-emerald-50/70 border border-emerald-100 text-xs text-emerald-800 font-bold">
                          <span>
                            {isAr ? `يوجد ${appsCount} عروض مقدمة من المعلمين` : `${appsCount} teacher offers submitted`}
                          </span>
                          <span className="text-[11px] underline">
                            {isAr ? 'اضغط للعرض' : 'View'}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {(status === 'confirmed' || status === 'assigned' || status === 'completed') && (
                    <div className="mb-3 p-2.5 rounded-xl bg-[#F0FDF4] border border-emerald-100 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden flex items-center justify-center shrink-0">
                        {teacherPhoto ? (
                          <img src={getStorageUrl(teacherPhoto)} alt={teacherName} className="w-full h-full object-cover" />
                        ) : (
                          <User size={20} className="text-slate-500" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-bold text-slate-800 truncate">
                          {teacherName || (isAr ? 'معلم تم تعيينه' : 'Assigned Teacher')}
                        </h4>
                        <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                          <span className="flex items-center gap-1">
                            <BookOpen size={11} className="text-slate-400" />
                            {teacherSpec}
                          </span>
                          <span className="flex items-center gap-0.5 text-amber-500 font-bold">
                            <Star size={11} fill="currentColor" />
                            {teacherRating}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {status === 'cancelled' && (
                    <div className="mb-3 py-2.5 px-3 rounded-xl bg-[#FEF2F2] text-[#EF4444] text-xs font-semibold text-center">
                      {isAr ? 'لم يتوفر معلم قبل موعد الطلب' : 'No teacher available for this request'}
                    </div>
                  )}

                  {order.notes && (
                    <p className="text-xs text-slate-600 mb-3 line-clamp-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      {order.notes}
                    </p>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-baseline gap-1">
                    <span className="text-sm font-bold text-slate-900">
                      {priceVal > 0 ? priceVal : (isAr ? 'حسب الاتفاق' : 'Negotiable')}
                    </span>
                    {priceVal > 0 && (
                      <span className="text-[11px] text-slate-500">
                        {t.sar} {isAr ? '/ بالساعة' : '/ hr'}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400 font-medium">
                      {isAr ? 'الإجمالي' : 'Total'}
                    </span>
                    {status === 'pending' && (
                      <button
                        onClick={(e) => handleDeleteOrder(order.id, e)}
                        title={isAr ? 'حذف الطلب' : 'Delete Request'}
                        className="p-1.5 text-slate-300 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {isCreateOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center sm:p-4">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl max-w-xl w-full max-h-[92vh] overflow-hidden flex flex-col shadow-2xl animate-scale-in">
            <div className="p-5 border-b border-slate-100 flex flex-col items-center relative bg-white">
              <div className="w-10 h-1 bg-slate-200 rounded-full mb-3" />
              <div className="flex items-center gap-3 w-full">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <GraduationCap size={22} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-slate-900 text-base">
                    {isAr ? 'طلب عاجل' : 'Urgent Private Lesson Request'}
                  </h3>
                  <p className="text-xs text-slate-500 truncate">
                    {isAr ? 'حدد تفاصيل الدرس وسيتواصل معك المعلمون المناسبون' : 'Specify details and get offers from certified teachers'}
                  </p>
                </div>
                <button
                  onClick={() => setIsCreateOpen(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors"
                >
                  <X size={17} />
                </button>
              </div>
            </div>

            <form onSubmit={handleCreateOrder} className="p-6 overflow-y-auto space-y-5 flex-1">
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-xs flex items-center gap-2">
                  <AlertCircle size={16} className="shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {successMessage && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-xs flex items-center gap-2">
                  <CheckCircle size={16} className="shrink-0" />
                  <span>{successMessage}</span>
                </div>
              )}

              <div className="space-y-3">
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Layers size={16} className="text-emerald-600" />
                  <span>{isAr ? 'البيانات الأكاديمية' : 'Academic Details'}</span>
                </h4>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    {isAr ? 'المرحلة التعليمية' : 'Education Level'} *
                  </label>
                  <select
                    value={selectedLevelId}
                    onChange={(e) => handleLevelChange(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 bg-white"
                  >
                    <option value="">
                      {loadingLevels ? (isAr ? 'جاري التحميل...' : 'Loading...') : (isAr ? 'اختر مستواك التعليمي' : 'Select education level')}
                    </option>
                    {educationLevels.map((lvl) => (
                      <option key={lvl.id} value={lvl.id}>
                        {isAr ? lvl.name_ar : lvl.name_en}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    {isAr ? 'الصف الدراسي' : 'Grade / Class'} *
                  </label>
                  <select
                    value={selectedClassId}
                    onChange={(e) => handleClassChange(e.target.value)}
                    disabled={!selectedLevelId || loadingClasses}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 bg-white disabled:bg-slate-50 disabled:text-slate-400"
                  >
                    <option value="">
                      {!selectedLevelId
                        ? (isAr ? 'اختر المرحلة أولاً' : 'Select education level first')
                        : loadingClasses
                        ? (isAr ? 'جاري التحميل...' : 'Loading...')
                        : (isAr ? 'اختر الصف الدراسي' : 'Select grade')}
                    </option>
                    {classes.map((cls) => (
                      <option key={cls.id} value={cls.id}>
                        {isAr ? cls.name_ar : cls.name_en}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    {isAr ? 'المادة الدراسية' : 'Subject'} *
                  </label>
                  <select
                    value={selectedSubjectId}
                    onChange={(e) => setSelectedSubjectId(e.target.value ? Number(e.target.value) : '')}
                    disabled={!selectedClassId || loadingSubjects}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 bg-white disabled:bg-slate-50 disabled:text-slate-400"
                  >
                    <option value="">
                      {!selectedClassId
                        ? (isAr ? 'اختر الصف أولاً' : 'Select grade first')
                        : loadingSubjects
                        ? (isAr ? 'جاري التحميل...' : 'Loading...')
                        : (isAr ? 'اختر المادة الدراسية' : 'Select subject')}
                    </option>
                    {subjects.map((sub) => (
                      <option key={sub.id} value={sub.id}>
                        {isAr ? sub.name_ar : sub.name_en}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Calendar size={16} className="text-emerald-600" />
                  <span>{isAr ? 'التاريخ والوقت' : 'Date & Time'}</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      {isAr ? 'التاريخ' : 'Date'} *
                    </label>
                    <input
                      type="date"
                      required
                      value={sessionDate}
                      min={new Date().toISOString().split('T')[0]}
                      onChange={(e) => setSessionDate(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 bg-white"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      {isAr ? 'وقت البدء' : 'Start Time'} *
                    </label>
                    <input
                      type="time"
                      required
                      value={sessionTime}
                      onChange={(e) => setSessionTime(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 bg-white"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-sm font-bold text-slate-900">
                  {isAr ? 'نوع الحصة' : 'Session Type'} *
                </h4>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setSessionType('online')}
                    className={`p-3.5 rounded-2xl border text-center transition-all flex flex-col items-center justify-center gap-2 ${
                      sessionType === 'online'
                        ? 'border-emerald-600 bg-emerald-50/50 shadow-sm'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <Laptop size={24} className={sessionType === 'online' ? 'text-emerald-600' : 'text-slate-600'} />
                    <div>
                      <span className={`block text-xs font-bold ${sessionType === 'online' ? 'text-emerald-800' : 'text-slate-800'}`}>
                        {isAr ? 'أونلاين' : 'Online'}
                      </span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        {isAr ? 'حصة عن بُعد عبر المنصة' : 'Virtual video call'}
                      </span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSessionType('in_house')}
                    className={`p-3.5 rounded-2xl border text-center transition-all flex flex-col items-center justify-center gap-2 ${
                      sessionType === 'in_house'
                        ? 'border-emerald-600 bg-emerald-50/50 shadow-sm'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <Home size={24} className={sessionType === 'in_house' ? 'text-emerald-600' : 'text-slate-600'} />
                    <div>
                      <span className={`block text-xs font-bold ${sessionType === 'in_house' ? 'text-emerald-800' : 'text-slate-800'}`}>
                        {isAr ? 'حضوري' : 'In Person'}
                      </span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        {isAr ? 'حصة حضورية في الموقع' : 'In-person session'}
                      </span>
                    </div>
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <FileText size={16} className="text-emerald-600" />
                  <span>{isAr ? 'تفاصيل الحصة' : 'Session Details'} *</span>
                </h4>
                <textarea
                  required
                  rows={3}
                  value={sessionDescription}
                  onChange={(e) => setSessionDescription(e.target.value)}
                  placeholder={
                    isAr
                      ? 'اكتب ما تحتاجه في هذا الدرس، الصعوبات التي تواجهها، أو الموضوعات المحددة...'
                      : 'Describe what topics you need help with, any specific goals or difficulties...'
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 resize-none bg-white"
                />
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  disabled={submitting}
                  className="w-full h-12 rounded-xl font-bold text-sm bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <Loader2 className="animate-spin h-5 w-5 text-white" />
                  ) : (
                    <span>{isAr ? 'إرسال الطلب' : 'Send Request'}</span>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedOrderForApps && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full max-h-[85vh] overflow-hidden flex flex-col shadow-2xl animate-scale-in">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  {isAr ? 'عروض المعلمين المقدمة' : 'Teacher Applications'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {isAr
                    ? (selectedOrderForApps.subject?.name_ar || selectedOrderForApps.subject?.name || 'طلب الدرس')
                    : (selectedOrderForApps.subject?.name_en || selectedOrderForApps.subject?.name || 'Tutoring Request')}
                </p>
              </div>
              <button
                onClick={() => setSelectedOrderForApps(null)}
                className="w-8 h-8 rounded-full bg-slate-200/60 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors"
              >
                <X size={17} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-3 flex-1">
              {appsLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="animate-spin h-8 w-8 text-emerald-600" />
                </div>
              ) : applications.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-sm">
                  {isAr ? 'لم يتقدم أي معلم بعرض على هذا الطلب بعد.' : 'No teacher applications submitted yet.'}
                </div>
              ) : (
                applications.map((app) => {
                  const teacher = app.teacher || {};
                  const teacherName = `${teacher.first_name || ''} ${teacher.last_name || ''}`.trim() || teacher.name || (isAr ? 'معلم' : 'Tutor');
                  const teacherSpec = teacher.profile?.teacher_subjects?.[0]?.title || teacher.profile?.specialization || (isAr ? 'معلم معتمد' : 'Teacher');
                  const proposedPrice = app.proposed_price || app.price || 0;
                  const message = app.message || app.cover_letter;
                  const isAccepted = app.status === 'accepted';

                  return (
                    <div
                      key={app.id}
                      className="p-4 rounded-2xl border border-slate-100 shadow-sm bg-white space-y-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-11 h-11 rounded-full bg-slate-100 overflow-hidden flex items-center justify-center shrink-0">
                            {teacher.profile_photo_url || teacher.profile_image ? (
                              <img
                                src={getStorageUrl(teacher.profile_photo_url || teacher.profile_image)}
                                alt={teacherName}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <User size={22} className="text-slate-400" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-bold text-slate-900 text-sm truncate">
                              {teacherName}
                            </h4>
                            <p className="text-xs text-slate-400 truncate">
                              {teacherSpec}
                            </p>
                          </div>
                        </div>

                        <div className="text-end shrink-0">
                          <span className="text-sm font-extrabold text-emerald-700 block">
                            {Number(proposedPrice).toFixed(0)} {t.sar}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {isAr ? 'العرض المقدم' : 'Proposed Price'}
                          </span>
                        </div>
                      </div>

                      {message && (
                        <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-600 border border-slate-100">
                          {message}
                        </div>
                      )}

                      <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                            isAccepted
                              ? 'bg-emerald-50 text-emerald-700'
                              : app.status === 'rejected'
                              ? 'bg-red-50 text-red-600'
                              : 'bg-amber-50 text-amber-700'
                          }`}
                        >
                          {app.status === 'accepted'
                            ? (isAr ? 'تم القبول' : 'Accepted')
                            : app.status === 'rejected'
                            ? (isAr ? 'مرفوض' : 'Rejected')
                            : (isAr ? 'قيد الانتظار' : 'Pending')}
                        </span>

                        {selectedOrderForApps.status === 'pending' && app.status === 'pending' && (
                          <Button
                            size="sm"
                            disabled={acceptingId === app.id}
                            onClick={() => handleAcceptApplication(app.id)}
                            className="rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-1.5 flex items-center gap-1.5"
                          >
                            {acceptingId === app.id ? (
                              <Loader2 className="animate-spin h-3.5 w-3.5" />
                            ) : (
                              <>
                                <Check size={14} />
                                <span>{isAr ? 'قبول العرض' : 'Accept'}</span>
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};