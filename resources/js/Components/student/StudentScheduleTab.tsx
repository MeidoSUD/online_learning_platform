
import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../Contexts/LanguageContext';
import { ChevronLeft, ChevronRight, Clock, MapPin, Video, Calendar as CalendarIcon, Loader2, AlertCircle, RefreshCw, ExternalLink } from 'lucide-react';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { studentService, Session } from '../../Services/api';
import { SessionRoomModal } from '../dashboard/SessionRoomModal';

export const StudentScheduleTab: React.FC<{ onViewList?: () => void }> = ({ onViewList }) => {
  const { t, direction, language } = useLanguage();
  const [currentDate, setCurrentDate] = useState(new Date()); 
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(null);
  const [sessionDetails, setSessionDetails] = useState<Session | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  // Agora/Join State
  const [joining, setJoining] = useState(false);
  const [waitingForTeacher, setWaitingForTeacher] = useState(false);
  const [agoraData, setAgoraData] = useState<any>(null);

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    setLoading(true);
    try {
        const data = await studentService.getSessions();
        setSessions(data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleSessionClick = async (sessionId: number) => {
      setSelectedSessionId(sessionId);
      setDetailsLoading(true);
      setWaitingForTeacher(false);
      try {
          const response = await studentService.getSessionDetails(sessionId);
          // Access nested data object from user's provided structure
          const details = response.data || response;
          setSessionDetails(details);
      } catch (e) {
          console.error("Failed to load session details", e);
      } finally {
          setDetailsLoading(false);
      }
  };

  const handleJoinSession = async (sessionId: number) => {
      setJoining(true);
      setWaitingForTeacher(false);
      try {
          const response = await studentService.joinSession(sessionId);
          
          if (response.success && response.data?.agora) {
              setAgoraData({
                  ...response.data.agora,
                  session_id: sessionId,
                  role: 'participant'
              });
              setSelectedSessionId(null); 
          } else if (response.data?.session_status === 'waiting_for_teacher') {
              setWaitingForTeacher(true);
          } else if (response.data?.meeting?.join_url) {
              // Extract Agora data from join_url if structured data is missing
              const url = new URL(response.data.meeting.join_url);
              setAgoraData({
                  channel: url.searchParams.get('channel') || 'session',
                  token: url.searchParams.get('token') || '',
                  uid: url.searchParams.get('uid') || '0',
                  role: 'participant'
              });
              setSelectedSessionId(null);
          } else {
              alert(response.message || "Cannot join session at this time.");
          }
      } catch (e: any) {
          alert(e.message || "Failed to join session.");
      } finally {
          setJoining(false);
      }
  };

  const handleCloseModal = () => {
      setSelectedSessionId(null);
      setSessionDetails(null);
      setWaitingForTeacher(false);
  }

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();

  const handlePrevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const handleNextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  const getSessionsForDay = (day: number) => {
    const targetDateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return sessions.filter(s => s.session_date?.split('T')[0] === targetDateStr);
  };

  const renderCalendarDays = () => {
    const days = [];
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<div key={`empty-${i}`} className="h-24 bg-slate-50/50 border border-slate-100"></div>);
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const daySessions = getSessionsForDay(d);
      const isToday = new Date().getDate() === d && new Date().getMonth() === currentDate.getMonth();
      
      days.push(
        <div key={d} className={`h-24 border border-slate-100 p-2 transition-colors hover:bg-slate-50 ${isToday ? 'bg-blue-50/30' : 'bg-white'}`}>
          <span className={`text-sm font-medium ${isToday ? 'text-primary bg-blue-100 w-6 h-6 flex items-center justify-center rounded-full' : 'text-slate-700'}`}>{d}</span>
          <div className="mt-1 space-y-1 overflow-y-auto max-h-[calc(100%-24px)] scrollbar-hide">
            {daySessions.map(s => (
              <button 
                key={s.id} onClick={() => handleSessionClick(s.id)}
                className={`w-full text-left text-[10px] px-1.5 py-1 rounded truncate font-medium ${s.status === 'live' ? 'bg-red-100 text-red-700 animate-pulse' : s.status === 'scheduled' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'}`}
              >
                {s.start_time.slice(0,5)} - {s.subject ? (direction === 'rtl' ? s.subject.name_ar : s.subject.name_en) : 'Session'}
              </button>
            ))}
          </div>
        </div>
      );
    }
    return days;
  };

  if (loading && sessions.length === 0) return <div className="flex justify-center p-20"><Loader2 className="animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h2 className="text-2xl font-bold text-slate-900">{t.mySchedule}</h2>
        <div className="flex gap-2">
            <div className="flex items-center bg-white rounded-lg border border-slate-200 p-1 shadow-sm">
                <button onClick={handlePrevMonth} className="p-2 hover:bg-slate-100 rounded-md"><ChevronLeft size={20} className={direction === 'rtl' ? 'rotate-180' : ''} /></button>
                <span className="px-4 font-semibold text-slate-900 min-w-[140px] text-center">{currentDate.toLocaleString('en-US', { month: 'long', year: 'numeric' })}</span>
                <button onClick={handleNextMonth} className="p-2 hover:bg-slate-100 rounded-md"><ChevronRight size={20} className={direction === 'rtl' ? 'rotate-180' : ''} /></button>
            </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="grid grid-cols-7 bg-slate-50 border-b border-slate-200 text-center py-3">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="text-xs font-bold text-slate-500 uppercase tracking-wider">{day}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 bg-slate-200 gap-px">{renderCalendarDays()}</div>
      </div>

      <Modal isOpen={!!selectedSessionId} onClose={handleCloseModal} title="Session Details">
        {detailsLoading ? (
            <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-primary" /></div>
        ) : sessionDetails ? (
            <div className="space-y-6">
                <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                        {sessionDetails.teacher?.name?.charAt(0) || 'T'}
                    </div>
                    <div>
                        <h4 className="font-bold text-slate-900 text-lg">{sessionDetails.teacher?.name || 'Teacher'}</h4>
                        <p className="text-slate-500 text-sm">
                            {sessionDetails.subject ? (direction === 'rtl' ? sessionDetails.subject.name_ar : sessionDetails.subject.name_en) : 'Subject'}
                        </p>
                        {sessionDetails.booking?.reference && (
                            <p className="text-[10px] text-slate-400 mt-1 uppercase font-mono">{sessionDetails.booking.reference}</p>
                        )}
                    </div>
                </div>

                {waitingForTeacher && (
                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 flex items-start gap-3 animate-fade-in">
                        <AlertCircle className="shrink-0 mt-0.5" size={20} />
                        <div>
                            <p className="font-bold">Teacher hasn't started yet</p>
                            <p className="text-sm opacity-90">Please wait for your teacher to initiate the session. We will notify you once the room is live.</p>
                            <button onClick={() => handleJoinSession(sessionDetails.id)} className="mt-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-900 bg-amber-200/50 px-3 py-1.5 rounded-lg hover:bg-amber-200">
                                <RefreshCw size={14} className={joining ? 'animate-spin' : ''} /> Check Again
                            </button>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 rounded-lg border border-slate-100">
                        <p className="text-xs text-slate-400 mb-1">{t.date}</p>
                        <div className="flex items-center gap-2 font-medium"><CalendarIcon size={16} className="text-primary" />{new Date(sessionDetails.session_date).toLocaleDateString()}</div>
                    </div>
                    <div className="p-3 rounded-lg border border-slate-100">
                        <p className="text-xs text-slate-400 mb-1">{t.time}</p>
                        <div className="flex items-center gap-2 font-medium"><Clock size={16} className="text-primary" />{sessionDetails.start_time} - {sessionDetails.end_time}</div>
                    </div>
                </div>
                
                <div className="pt-2">
                    <Button 
                        className="w-full h-12 shadow-lg shadow-primary/20" 
                        onClick={() => handleJoinSession(sessionDetails.id)} 
                        isLoading={joining}
                        disabled={sessionDetails.status === 'completed'}
                    >
                        <Video size={18} className="mr-2" /> {language === 'ar' ? 'انضمام للجلسة' : 'Join Session'}
                    </Button>
                </div>
            </div>
        ) : null}
      </Modal>

      <SessionRoomModal 
        isOpen={!!agoraData} 
        onClose={() => { setAgoraData(null); fetchSessions(); }} 
        agora={agoraData} 
      />
    </div>
  );
};
