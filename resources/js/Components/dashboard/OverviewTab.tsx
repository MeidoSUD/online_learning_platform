
import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../Contexts/LanguageContext';
import { DollarSign, Users, BookOpen, ArrowUpRight, Video, Calendar, Clock, Loader2, CheckCircle } from 'lucide-react';
import { Button } from '../ui/Button';
import { UserData, teacherService, Session } from '../../Services/api';

interface OverviewTabProps {
  user: UserData;
  onNavigate?: (tab: string) => void;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({ user, onNavigate }) => {
  const { t, language } = useLanguage();
  const [loading, setLoading] = useState(true);
  
  // Real Stats State
  const [balance, setBalance] = useState<number>(0);
  const [finishedSessionsCount, setFinishedSessionsCount] = useState<number>(0);
  const [upcomingSessions, setUpcomingSessions] = useState<Session[]>([]);
  const [totalStudents, setTotalStudents] = useState<number>(0);
  const [subjectsCount, setSubjectsCount] = useState<number>(0);

  useEffect(() => {
    const fetchDashboardData = async () => {
        setLoading(true);
        try {
            // 1. Fetch Wallet for Balance
            const walletData = await teacherService.getWallet().catch(() => null);
            setBalance(Number(walletData?.balance || user.current_balance || 0));

            // 2. Fetch Sessions for count and upcoming list
            const sessionsData = await teacherService.getTeacherSessions().catch(() => []);
            if (Array.isArray(sessionsData)) {
                // Filter finished sessions
                const finished = sessionsData.filter(s => s.status === 'completed' || s.status === 'finished').length;
                setFinishedSessionsCount(finished);

                // Filter upcoming (scheduled/confirmed) and sort by date
                const upcoming = sessionsData
                    .filter(s => s.status === 'scheduled' || s.status === 'confirmed')
                    .sort((a, b) => new Date(a.session_date).getTime() - new Date(b.session_date).getTime())
                    .slice(0, 5); // Take top 5
                setUpcomingSessions(upcoming);
                
                // Derive Students count (Unique student IDs from sessions)
                const uniqueStudents = new Set(sessionsData.map(s => s.student?.id).filter(Boolean));
                // Fallback to profile total_students if available
                const profileStudents = user.profile?.total_students || 0;
                setTotalStudents(Math.max(uniqueStudents.size, profileStudents));
            }

            // 3. Fetch Subjects count
            const subjectsData = await teacherService.getSubjects().catch(() => []);
            // Check nested array logic for subjects count
            if (Array.isArray(subjectsData)) {
                setSubjectsCount(subjectsData.length);
            }

        } catch (e) {
            console.error("Overview Data Fetch Failed:", e);
        } finally {
            setLoading(false);
        }
    };

    fetchDashboardData();
  }, [user]);

  if (loading) {
      return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-primary h-8 w-8" /></div>;
  }

  const stats = [
    { 
        label: language === 'ar' ? 'الرصيد الحالي' : 'Current Balance', 
        value: balance.toFixed(2), 
        currency: t.sar, 
        icon: DollarSign, 
        color: "bg-blue-500", 
        action: () => onNavigate && onNavigate('wallet') 
    },
    { 
        label: language === 'ar' ? 'الطلاب' : 'Total Students', 
        value: String(totalStudents), 
        icon: Users, 
        color: "bg-purple-500" 
    },
    { 
        label: language === 'ar' ? 'الدروس المكتملة' : 'Finished Lessons', 
        value: String(finishedSessionsCount), 
        icon: CheckCircle, 
        color: "bg-green-500" 
    },
    { 
        label: language === 'ar' ? 'المواد النشطة' : 'Active Subjects', 
        value: String(subjectsCount), 
        icon: BookOpen, 
        color: "bg-orange-500",
        action: () => onNavigate && onNavigate('private-lessons')
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome Section with Actions */}
      <div className="bg-gradient-to-r from-primary to-blue-600 rounded-2xl p-6 md:p-10 text-white shadow-lg shadow-blue-200">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">{t.welcomeBack} {user.first_name}!</h1>
            <p className="text-blue-100 opacity-90">
                {language === 'ar' 
                    ? `لديك ${upcomingSessions.length} دروس قادمة.` 
                    : `You have ${upcomingSessions.length} upcoming lessons scheduled.`}
            </p>
          </div>
          <div className="flex gap-3">
              <Button 
                variant="ghost" 
                className="bg-white/20 hover:bg-white/30 text-white border-0 backdrop-blur-sm"
                onClick={() => onNavigate && onNavigate('schedule')}
              >
                <Calendar size={18} className="mr-2" /> {language === 'ar' ? 'إضافة موعد' : 'Add Session'}
              </Button>
              <Button 
                className="bg-white text-primary hover:bg-slate-100 border-0"
                onClick={() => onNavigate && onNavigate('wallet')}
              >
                {t.requestPayout} <ArrowUpRight size={18} className="ml-2" />
              </Button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <div 
            key={idx} 
            className={`bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all ${stat.action ? 'cursor-pointer group' : ''}`}
            onClick={stat.action}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-slate-500 text-sm font-medium mb-1 flex items-center gap-1">
                    {stat.label}
                    {stat.action && <ArrowUpRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity text-primary" />}
                </p>
                <h3 className="text-2xl font-bold text-slate-900">
                  {stat.value} <span className="text-sm font-normal text-slate-400">{stat.currency}</span>
                </h3>
              </div>
              <div className={`p-3 rounded-xl ${stat.color} text-white shadow-lg shadow-${stat.color.replace('bg-', '')}/30`}>
                <stat.icon size={20} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Upcoming Lessons Column */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-slate-900">{t.upcomingLessons}</h3>
              <button 
                onClick={() => onNavigate && onNavigate('schedule')}
                className="text-sm text-primary hover:underline font-medium"
              >
                {t.viewAll}
              </button>
          </div>
          
          <div className="space-y-4">
             {upcomingSessions.length === 0 ? (
                 <div className="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-500">
                     <p>{language === 'ar' ? 'لا توجد دروس قادمة' : 'No upcoming lessons.'}</p>
                     <Button variant="outline" size="sm" className="mt-2" onClick={() => onNavigate && onNavigate('schedule')}>
                        {language === 'ar' ? 'إدارة الجدول' : 'Manage Schedule'}
                     </Button>
                 </div>
             ) : (
                 upcomingSessions.map((session) => (
                   <div key={session.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors gap-4">
                     <div className="flex items-center gap-4">
                       <div className="h-12 w-12 rounded-xl bg-white text-primary flex flex-col items-center justify-center font-bold shadow-sm border border-slate-100">
                         <span className="text-lg leading-none">{new Date(session.session_date).getDate()}</span>
                         <span className="text-[10px] uppercase">{new Date(session.session_date).toLocaleString('default', { month: 'short' })}</span>
                       </div>
                       <div>
                         <h4 className="font-semibold text-slate-900">
                             {session.subject ? (language === 'ar' ? session.subject.name_ar : session.subject.name_en) : 'Session'}
                         </h4>
                         <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                             <span className="flex items-center gap-1"><Clock size={12} /> {session.start_time}</span>
                             <span className="flex items-center gap-1"><Video size={12} /> Online</span>
                             {session.student && <span className="flex items-center gap-1 text-primary bg-primary/5 px-1.5 rounded">Student: {session.student.name || `#${session.student.id}`}</span>}
                         </div>
                       </div>
                     </div>
                     <Button size="sm" onClick={() => onNavigate && onNavigate('schedule')}>
                         {language === 'ar' ? 'بدء' : 'Start'}
                     </Button>
                   </div>
                 ))
             )}
          </div>
        </div>

        {/* Quick Actions Column */}
        <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                <h3 className="text-lg font-bold text-slate-900 mb-4">{language === 'ar' ? 'إجراءات سريعة' : 'Quick Actions'}</h3>
                <div className="space-y-3">
                    <button 
                        onClick={() => onNavigate && onNavigate('private-lessons')}
                        className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-primary/5 hover:text-primary transition-colors text-sm font-medium text-slate-700"
                    >
                        <span className="flex items-center gap-2"><BookOpen size={18} /> {language === 'ar' ? 'إدارة المواد' : 'Manage Subjects'}</span>
                        <ArrowUpRight size={16} />
                    </button>
                    <button 
                        onClick={() => onNavigate && onNavigate('schedule')}
                        className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-primary/5 hover:text-primary transition-colors text-sm font-medium text-slate-700"
                    >
                        <span className="flex items-center gap-2"><Calendar size={18} /> {language === 'ar' ? 'الجدول الزمني' : 'Schedule'}</span>
                        <ArrowUpRight size={16} />
                    </button>
                    <button 
                        onClick={() => onNavigate && onNavigate('wallet')}
                        className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-primary/5 hover:text-primary transition-colors text-sm font-medium text-slate-700"
                    >
                        <span className="flex items-center gap-2"><DollarSign size={18} /> {t.requestPayout}</span>
                        <ArrowUpRight size={16} />
                    </button>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};
