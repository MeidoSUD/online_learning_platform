
import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../Contexts/LanguageContext';
import { Plus, Clock, User, Trash2, Calendar, Loader2, Save, Video, Lock, CheckCircle, AlertCircle, X, Check } from 'lucide-react';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { teacherService, UserData, AvailableTime, Session } from '../../Services/api';
import { SessionRoomModal } from './SessionRoomModal';

interface ScheduleTabProps {
    user?: UserData;
}

export const ScheduleTab: React.FC<ScheduleTabProps> = ({ user }) => {
  const { t, language } = useLanguage();

  if (user && !user.verified) {
      return (
          <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-slate-200 animate-fade-in">
              <div className="h-16 w-16 bg-amber-100 rounded-full flex items-center justify-center mb-4 text-amber-600">
                  <Lock size={32} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Verification Required</h3>
              <p className="text-slate-500 max-w-md text-center">
                  You must verify your account and select a service before managing your schedule.
              </p>
          </div>
      );
  }

  const [activeView, setActiveView] = useState<'sessions' | 'availability'>('sessions');
  const [loading, setLoading] = useState(false);
  const [sessionActionLoading, setSessionActionLoading] = useState<number | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  
  // Availability State
  const [availability, setAvailability] = useState<AvailableTime[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState(1);
  const [selectedTime, setSelectedTime] = useState('');
  const [saving, setSaving] = useState(false);

  // Sessions State
  const [sessions, setSessions] = useState<Session[]>([]);
  const [agoraData, setAgoraData] = useState<any>(null);

  useEffect(() => {
    if (activeView === 'availability') {
        fetchAvailability();
    } else {
        fetchSessions();
    }
  }, [activeView]);

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

  const fetchSessions = async () => {
      setLoading(true);
      try {
          const data = await teacherService.getTeacherSessions();
          setSessions(Array.isArray(data) ? data : []);
      } catch (e) {
          console.error(e);
      } finally {
          setLoading(false);
      }
  };

  const handleStartClass = async (sessionId: number) => {
      setSessionActionLoading(sessionId);
      try {
          const response = await teacherService.startSession(sessionId);
          if (response.success && response.data?.agora) {
              setAgoraData({
                  ...response.data.agora,
                  session_id: sessionId,
                  role: 'host'
              });
          } else {
              alert(response.message || "Failed to start session");
          }
      } catch (e: any) {
          alert(e.message || "Failed to start session");
      } finally {
          setSessionActionLoading(null);
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

  const isSessionStartedOrLeft = (session: Session) => {
      const now = new Date();
      // Parsing "2025-12-24" + "20:00:00"
      const sessionDate = new Date(`${session.session_date}T${session.start_time}`);
      
      const justDateNow = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const justDateSession = new Date(sessionDate.getFullYear(), sessionDate.getMonth(), sessionDate.getDate());
      
      if (justDateSession < justDateNow) return 'left';

      // 15 minutes rule: current time must be >= session start time - 15 mins
      const startAllowedTime = new Date(sessionDate.getTime() - (15 * 60 * 1000));
      
      if (now < startAllowedTime) return 'upcoming';
      if (session.status === 'completed' || session.status === 'finished') return 'completed';
      
      return 'ready';
  };

  const days = [
      { id: 1, name: 'Sunday' }, { id: 2, name: 'Monday' }, { id: 3, name: 'Tuesday' },
      { id: 4, name: 'Wednesday' }, { id: 5, name: 'Thursday' }, { id: 6, name: 'Friday' },
      { id: 7, name: 'Saturday' },
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
        <div className="flex bg-slate-100 p-1 rounded-xl shadow-inner border border-slate-200/50">
            <button 
                onClick={() => setActiveView('sessions')}
                className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeView === 'sessions' ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
                {language === 'ar' ? 'جلساتي' : 'My Sessions'}
            </button>
            <button 
                onClick={() => setActiveView('availability')}
                className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeView === 'availability' ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
                {language === 'ar' ? 'إعدادات التوفر' : 'Availability Settings'}
            </button>
        </div>
        
        {activeView === 'availability' && (
            <Button onClick={() => setIsModalOpen(true)} className="shadow-lg shadow-primary/20">
                <Plus size={18} className="mr-2" /> {language === 'ar' ? 'إضافة موعد' : 'Add Time Slot'}
            </Button>
        )}
      </div>

      {loading && sessions.length === 0 && availability.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-20 text-slate-400">
            <Loader2 className="animate-spin text-primary h-10 w-10 mb-4" />
            <p className="font-medium">Syncing Schedule...</p>
          </div>
      ) : activeView === 'availability' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {days.map(day => {
                  const slots = getTimesForDay(day.id);
                  return (
                      <div key={day.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                          <div className="bg-slate-50/80 px-5 py-4 border-b border-slate-100 flex justify-between items-center">
                              <span className="font-bold text-slate-800 text-lg">{day.name}</span>
                              <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-200 px-2 py-0.5 rounded text-slate-500">{slots.length} Slots</span>
                          </div>
                          <div className="p-4 space-y-3 flex-1">
                              {slots.length === 0 ? (
                                  <div className="text-center py-10 text-slate-400 text-sm italic">
                                      <Calendar className="mx-auto h-8 w-8 opacity-20 mb-2" />
                                      No slots added
                                  </div>
                              ) : (
                                  slots.map((slot: any) => {
                                      const isAvailable = slot.is_available ?? !slot.session;
                                      const isConfirming = confirmDeleteId === slot.id;

                                      return (
                                      <div 
                                          key={slot.id} 
                                          className={`flex justify-between items-center p-3 rounded-xl border-2 transition-all group ${
                                              isAvailable 
                                                ? 'bg-green-50/50 border-green-100 shadow-sm' 
                                                : 'bg-red-50/50 border-red-100 grayscale-[0.3]'
                                          }`}
                                      >
                                          <div className="flex items-center gap-3">
                                              <div className={`h-8 w-8 rounded-full flex items-center justify-center ${isAvailable ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                                  <Clock size={16} />
                                              </div>
                                              <span className={`font-bold text-sm ${isAvailable ? 'text-green-800' : 'text-red-800'}`}>{slot.time}</span>
                                          </div>
                                          
                                          {isAvailable ? (
                                              <div className="flex items-center">
                                                  {isConfirming ? (
                                                      <div className="flex gap-1 animate-fade-in items-center">
                                                          <span className="text-[9px] font-bold text-red-600 uppercase mr-1">{language === 'ar' ? 'حذف؟' : 'Del?'}</span>
                                                          <button onClick={() => handleDeleteSlot(slot.id)} className="h-7 w-7 bg-red-500 text-white rounded-md flex items-center justify-center hover:bg-red-600 shadow-sm"><Check size={14}/></button>
                                                          <button onClick={() => setConfirmDeleteId(null)} className="h-7 w-7 bg-slate-200 text-slate-600 rounded-md flex items-center justify-center hover:bg-slate-300"><X size={14}/></button>
                                                      </div>
                                                  ) : (
                                                      <button 
                                                          onClick={() => setConfirmDeleteId(slot.id)} 
                                                          className="text-slate-300 hover:text-red-500 transition-colors p-1.5 rounded-lg hover:bg-red-50"
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
      ) : (
          <div className="space-y-4">
              {sessions.length === 0 ? (
                  <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200 text-slate-500">
                      <Calendar className="mx-auto h-16 w-16 text-slate-300 mb-4" />
                      <p className="text-lg font-medium">No scheduled sessions found.</p>
                      <p className="text-sm opacity-70">New bookings will appear here automatically.</p>
                  </div>
              ) : (
                  sessions.map(session => {
                      const sessionState = isSessionStartedOrLeft(session);
                      const isPast = sessionState === 'left';
                      const isUpcoming = sessionState === 'upcoming';
                      const isReady = sessionState === 'ready';

                      return (
                      <div key={session.id} className={`bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6 transition-opacity ${isPast ? 'opacity-50 grayscale' : ''}`}>
                          <div className="flex items-center gap-4 w-full md:w-auto">
                              <div className={`h-16 w-16 rounded-2xl flex flex-col items-center justify-center font-bold border ${isPast ? 'bg-slate-50 border-slate-200 text-slate-400' : 'bg-blue-50 border-blue-100 text-primary'}`}>
                                  <span className="text-xl">{new Date(session.session_date).getDate()}</span>
                                  <span className="text-[10px] uppercase">{new Date(session.session_date).toLocaleString('default', { month: 'short' })}</span>
                              </div>
                              <div>
                                  <div className="flex items-center gap-2 mb-1">
                                      <h4 className="text-lg font-bold text-slate-900 leading-none">
                                          {session.subject ? (language === 'ar' ? session.subject.name_ar : session.subject.name_en) : 'Private Session'}
                                      </h4>
                                      {isPast && <span className="bg-slate-200 text-slate-500 px-2 py-0.5 rounded text-[10px] font-bold uppercase">Past</span>}
                                  </div>
                                  <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
                                      <span className="flex items-center gap-1.5"><Clock size={14} className="text-slate-400" /> {session.start_time} - {session.end_time}</span>
                                      <span className="flex items-center gap-1.5"><User size={14} className="text-slate-400" /> {session.student?.name || 'Student'}</span>
                                  </div>
                              </div>
                          </div>
                          
                          <div className="flex flex-col md:items-end gap-2 w-full md:w-auto">
                              {isUpcoming ? (
                                  <div className="flex flex-col items-end">
                                      <Button disabled className="bg-slate-200 text-slate-400 cursor-not-allowed border-0">
                                          Start Class
                                      </Button>
                                      <span className="text-[10px] text-amber-600 font-bold mt-1 flex items-center gap-1">
                                          <AlertCircle size={10} /> Allowed 15m before start
                                      </span>
                                  </div>
                              ) : isReady && session.status !== 'completed' && session.status !== 'finished' ? (
                                  <Button 
                                    className="bg-green-600 hover:bg-green-700 shadow-lg shadow-green-200" 
                                    isLoading={sessionActionLoading === session.id}
                                    onClick={() => handleStartClass(session.id)}
                                  >
                                      <Video size={18} className="mr-2" /> Start Class
                                  </Button>
                              ) : null}

                              <div className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 ${
                                  session.status === 'live' ? 'bg-red-100 text-red-700 animate-pulse' : 
                                  session.status === 'completed' || session.status === 'finished' ? 'bg-slate-100 text-slate-600' : 'bg-green-50 text-green-700'
                              }`}>
                                  {session.status === 'live' ? <AlertCircle size={14} /> : <CheckCircle size={14} />}
                                  <span className="capitalize">{session.status.replace(/_/g, ' ')}</span>
                              </div>
                          </div>
                      </div>
                  )})
              )}
          </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add Time Slot">
          <div className="space-y-4">
              <Select label="Day of Week" options={days.map(d => ({ value: String(d.id), label: d.name }))} value={selectedDay} onChange={(e) => setSelectedDay(Number(e.target.value))} />
              <Input label="Start Time" type="time" value={selectedTime} onChange={(e) => setSelectedTime(e.target.value)} />
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-100 text-xs text-blue-700 flex gap-2">
                  <AlertCircle size={16} className="shrink-0" />
                  <p>Slots are created for 1 hour duration. Ensure this doesn't overlap with existing slots.</p>
              </div>
              <Button className="w-full h-12 shadow-lg shadow-primary/20" onClick={handleAddSlot} isLoading={saving}><Save size={18} className="mr-2" /> Save Slot</Button>
          </div>
      </Modal>

      <SessionRoomModal 
        isOpen={!!agoraData} 
        onClose={() => { setAgoraData(null); fetchSessions(); }} 
        agora={agoraData} 
      />
    </div>
  );
};
