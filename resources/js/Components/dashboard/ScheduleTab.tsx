
import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../Contexts/LanguageContext';
import { Plus, Clock, Trash2, Calendar, Loader2, Save, Lock, AlertCircle, X, Check } from 'lucide-react';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { teacherService, UserData, AvailableTime } from '../../Services/api';

interface ScheduleTabProps {
    user?: UserData;
}

export const ScheduleTab: React.FC<ScheduleTabProps> = ({ user }) => {
  const { t, language } = useLanguage();

  if (user && !user.verified) {
      return (
          <div className="flex flex-col items-center justify-center py-16 bg-white rounded-[var(--radius-md)] border border-[var(--border)] animate-fade-in">
              <div className="h-16 w-16 bg-amber-100 rounded-full flex items-center justify-center mb-4 text-amber-600">
                  <Lock size={32} />
              </div>
              <h3 className="text-xl font-bold text-[var(--text-main)] mb-2">Verification Required</h3>
              <p className="text-[var(--text-muted)] max-w-md text-center">
                  You must verify your account and select a service before managing your schedule.
              </p>
          </div>
      );
  }

  const [loading, setLoading] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  
  const [availability, setAvailability] = useState<AvailableTime[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState(1);
  const [selectedTime, setSelectedTime] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchAvailability();
  }, []);

  const fetchAvailability = async () => {
    setLoading(true);
    try {
        const data = await teacherService.getAvailability();
        setAvailability(Array.isArray(data) ? data : []);
    } catch (e) {
        console.error(e);
    } finally {
        setLoading(false);
    }
  };

  const handleAddSlot = async () => {
      if (!selectedTime || !user) return;
      setSaving(true);
      try {
          const payload = {
              teacher_id: user.id,
              available_times: [{ day: Number(selectedDay), times: [selectedTime] }]
          };
          await teacherService.saveAvailability(payload);
          await fetchAvailability();
          setIsModalOpen(false);
          setSelectedTime('');
      } catch (e: any) {
          alert(e.message || "Failed to add slot");
      } finally {
          setSaving(false);
      }
  };

  const handleDeleteSlot = async (slotId: number) => {
      setLoading(true);
      try {
          await teacherService.deleteAvailability(slotId);
          await fetchAvailability();
          setConfirmDeleteId(null);
          alert(language === 'ar' ? "تم حذف الموعد" : "Slot deleted successfully");
      } catch (e: any) { 
          alert(e.message || "Failed to delete slot");
      } finally {
          setLoading(false);
      }
  };

  const formatTime = (time: string) => {
      if (!time) return '';
      const trimmed = String(time).trim();
      if (trimmed.includes('ص') || trimmed.includes('م') || /am|pm/i.test(trimmed)) {
          return trimmed;
      }
      const match = trimmed.match(/^(\d{1,2}):(\d{2})/);
      if (!match) return trimmed;
      const hour = parseInt(match[1], 10);
      const minute = match[2];
      const isPM = hour >= 12;
      const hour12 = hour % 12 || 12;
      const period = language === 'ar' ? (isPM ? 'م' : 'ص') : (isPM ? 'PM' : 'AM');
      return `${hour12}:${minute} ${period}`;
  };

  const days = [
      { id: 1, name: language === 'ar' ? 'السبت' : 'Saturday' },
      { id: 2, name: language === 'ar' ? 'الأحد' : 'Sunday' },
      { id: 3, name: language === 'ar' ? 'الاثنين' : 'Monday' },
      { id: 4, name: language === 'ar' ? 'الثلاثاء' : 'Tuesday' },
      { id: 5, name: language === 'ar' ? 'الأربعاء' : 'Wednesday' },
      { id: 6, name: language === 'ar' ? 'الخميس' : 'Thursday' },
      { id: 7, name: language === 'ar' ? 'الجمعة' : 'Friday' },
  ];

  const getTimesForDay = (dayId: number) => {
      const dayData = availability.find(a => Number(a.day) === dayId);
      if (!dayData) return [];
      if (dayData.time_slots && Array.isArray(dayData.time_slots)) return dayData.time_slots;
      return [];
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-[var(--text-main)]">
            {language === 'ar' ? 'الجدول الدراسي' : 'Study Schedule'}
          </h2>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            {language === 'ar' ? 'إدارة المواعيد المتاحة والأوقات المحجوزة' : 'Manage your available and booked time slots'}
          </p>
        </div>

        <Button onClick={() => setIsModalOpen(true)} className="shadow-[var(--shadow-lg)]">
          <Plus size={18} className="mr-2" /> {language === 'ar' ? 'إضافة موعد' : 'Add Time Slot'}
        </Button>
      </div>

      {loading && availability.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-20 text-[var(--text-muted)]">
            <Loader2 className="animate-spin text-primary h-10 w-10 mb-4" />
            <p className="font-medium">{language === 'ar' ? 'جاري تحميل الجدول...' : 'Loading Schedule...'}</p>
          </div>
      ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {days.map(day => {
                  const slots = getTimesForDay(day.id);
                  return (
                      <div key={day.id} className="bg-white rounded-[var(--radius-md)] border border-[var(--border)] shadow-[var(--shadow-sm)] overflow-hidden flex flex-col">
                          <div className="bg-[var(--light-bg)] px-5 py-4 border-b border-[var(--border)] flex justify-between items-center">
                              <span className="font-bold text-[var(--text-main)] text-lg">{day.name}</span>
                              <span className="text-[10px] font-bold uppercase tracking-wider bg-[var(--border)] px-2 py-0.5 rounded text-[var(--text-muted)]">{slots.length} Slots</span>
                          </div>
                          <div className="p-4 space-y-3 flex-1">
                              {slots.length === 0 ? (
                                  <div className="text-center py-10 text-[var(--text-muted)] text-sm italic">
                                      <Calendar className="mx-auto h-8 w-8 opacity-20 mb-2" />
                                      No slots added
                                  </div>
                              ) : (
                                  slots.map((slot: any) => {
                                      const isBooked = Boolean(slot.is_booked === true || slot.is_booked === 1 || slot.session || slot.is_available === false || slot.is_available === 0);
                                      const isAvailable = !isBooked;
                                      const isConfirming = confirmDeleteId === slot.id;

                                      return (
                                      <div 
                                          key={slot.id} 
                                          className={`flex justify-between items-center p-3 rounded-[var(--radius-md)] border-2 transition-all group ${
                                              isAvailable 
                                                ? 'bg-primary-pale border-green-100 shadow-[var(--shadow-sm)]' 
                                                : 'bg-red-50/50 border-red-100 grayscale-[0.3]'
                                          }`}
                                      >
                                          <div className="flex items-center gap-3">
                                              <div className={`h-8 w-8 rounded-full flex items-center justify-center ${isAvailable ? 'bg-primary-pale text-primary' : 'bg-red-100 text-red-600'}`}>
                                                  <Clock size={16} />
                                              </div>
                                              <div className="flex items-center gap-2">
                                                  <span className={`font-bold text-sm ${isAvailable ? 'text-green-800' : 'text-red-800'}`}>{formatTime(slot.time)}</span>
                                                  {!isAvailable && (
                                                      <span className="text-xs font-semibold text-red-600 bg-red-100/70 px-2 py-0.5 rounded-md">
                                                          {language === 'ar' ? 'محجوز' : 'Booked'}
                                                      </span>
                                                  )}
                                              </div>
                                          </div>
                                          
                                          {isAvailable ? (
                                              <div className="flex items-center">
                                                  {isConfirming ? (
                                                      <div className="flex gap-1 animate-fade-in items-center">
                                                          <span className="text-[9px] font-bold text-red-600 uppercase mr-1">{language === 'ar' ? 'حذف؟' : 'Del?'}</span>
                                                          <button onClick={() => handleDeleteSlot(slot.id)} className="h-7 w-7 bg-red-500 text-white rounded-md flex items-center justify-center hover:bg-red-600 shadow-[var(--shadow-sm)]"><Check size={14}/></button>
                                                          <button onClick={() => setConfirmDeleteId(null)} className="h-7 w-7 bg-[var(--border)] text-[var(--text-muted)] rounded-md flex items-center justify-center hover:bg-[var(--border)]"><X size={14}/></button>
                                                      </div>
                                                  ) : (
                                                      <button 
                                                          onClick={() => setConfirmDeleteId(slot.id)} 
                                                          className="text-[var(--text-muted)] hover:text-red-500 transition-colors p-1.5 rounded-lg hover:bg-red-50"
                                                      >
                                                          <Trash2 size={18} />
                                                      </button>
                                                  )}
                                              </div>
                                          ) : (
                                              <div className="text-red-400 opacity-60" title="Booked - Locked">
                                                  <Lock size={16} />
                                              </div>
                                          )}
                                      </div>
                                  )})
                              )}
                          </div>
                      </div>
                  );
              })}
          </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={language === 'ar' ? 'إضافة موعد' : 'Add Time Slot'}>
          <div className="space-y-4">
              <Select label={language === 'ar' ? 'اليوم' : 'Day of Week'} options={days.map(d => ({ value: String(d.id), label: d.name }))} value={selectedDay} onChange={(e) => setSelectedDay(Number(e.target.value))} />
              <Input label={language === 'ar' ? 'وقت البدء' : 'Start Time'} type="time" value={selectedTime} onChange={(e) => setSelectedTime(e.target.value)} />
              <div className="p-3 bg-secondary-pale rounded-lg border border-secondary/30 text-xs text-secondary flex gap-2">
                  <AlertCircle size={16} className="shrink-0" />
                  <p>{language === 'ar' ? 'يتم إنشاء المواعيد بمدة ساعة واحدة. يرجى التأكد من عدم تداخلها مع مواعيد سابقة.' : 'Slots are created for 1 hour duration. Ensure this does not overlap with existing slots.'}</p>
              </div>
              <Button className="w-full h-12 shadow-[var(--shadow-lg)]" onClick={handleAddSlot} isLoading={saving}><Save size={18} className="mr-2" /> {language === 'ar' ? 'حفظ الموعد' : 'Save Slot'}</Button>
          </div>
      </Modal>
    </div>
  );
};
