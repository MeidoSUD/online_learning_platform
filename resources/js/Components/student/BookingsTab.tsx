
import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../Contexts/LanguageContext';
import { Search, Filter, Calendar, Clock, User, Video, MapPin, Loader2 } from 'lucide-react';
import { Button } from '../ui/Button';
import { Booking, studentService } from '../../Services/api';

export const BookingsTab: React.FC<{ onViewCalendar?: () => void }> = ({ onViewCalendar }) => {
  const { t, direction, language } = useLanguage();
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'completed' | 'cancelled'>('all');
  const [search, setSearch] = useState('');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async () => {
      setLoading(true);
      try {
          const data = await studentService.getBookings();
          setBookings(Array.isArray(data) ? data : []);
      } catch(e) { console.error(e); }
      finally { setLoading(false); }
  }

  const getSubjectName = (booking: Booking): string => {
      // 1. Try teacher_subject (safe object check)
      if (booking.teacher_subject) {
          return language === 'ar' ? booking.teacher_subject.name_ar : booking.teacher_subject.name_en;
      }
      // 2. Try subject object
      if (typeof booking.subject === 'object' && booking.subject !== null) {
          const subj = booking.subject as any;
          return language === 'ar' ? (subj.name_ar || subj.name) : (subj.name_en || subj.name);
      }
      // 3. Try subject string (primitive check)
      if (typeof booking.subject === 'string') {
          return booking.subject;
      }
      return 'N/A';
  };

  const filteredBookings = bookings.filter(b => {
      const subjectName = getSubjectName(b);
      const teacherName = b.teacher ? `${b.teacher.first_name} ${b.teacher.last_name}` : (b.teacher_name || '');

      const matchesSearch = teacherName.toLowerCase().includes(search.toLowerCase()) || (subjectName && subjectName.toLowerCase().includes(search.toLowerCase()));
      if (!matchesSearch) return false;
      
      if (filter === 'all') return true;
      if (filter === 'upcoming') return ['confirmed', 'pending', 'pending_payment'].includes(b.status);
      if (filter === 'completed') return b.status === 'completed';
      if (filter === 'cancelled') return b.status === 'cancelled';
      return true;
  });

  const getStatusColor = (status: string) => {
      switch(status) {
          case 'confirmed': return 'bg-green-100 text-green-700';
          case 'pending': case 'pending_payment': return 'bg-yellow-100 text-yellow-700';
          case 'completed': return 'bg-blue-100 text-blue-700';
          case 'cancelled': return 'bg-red-100 text-red-700';
          default: return 'bg-slate-100 text-slate-700';
      }
  };

  if (loading) return <div className="flex justify-center p-10"><Loader2 className="animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h2 className="text-2xl font-bold text-slate-900">{t.myBookings}</h2>
        {onViewCalendar && (
            <Button variant="outline" onClick={onViewCalendar} className="self-end sm:self-auto">
                {t.viewCalendar}
            </Button>
        )}
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
         <div className="relative flex-1">
            <Search className={`absolute top-1/2 -translate-y-1/2 text-slate-400 ${direction === 'rtl' ? 'right-3' : 'left-3'}`} size={18} />
            <input 
                type="text" 
                placeholder={t.searchPlaceholder} 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={`w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:border-primary ${direction === 'rtl' ? 'pr-10 pl-4' : ''}`} 
            />
         </div>
         <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
            {[
                { id: 'all', label: 'All' },
                { id: 'upcoming', label: t.upcoming },
                { id: 'completed', label: t.completed },
                { id: 'cancelled', label: t.cancelled }
            ].map(f => (
                <button
                    key={f.id}
                    onClick={() => setFilter(f.id as any)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                        filter === f.id ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                    }`}
                >
                    {f.label}
                </button>
            ))}
         </div>
      </div>

      {/* Bookings List */}
      <div className="space-y-4">
        {filteredBookings.length === 0 ? (
            <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-500">
                No bookings found matching your criteria.
            </div>
        ) : (
            filteredBookings.map(booking => (
                <div key={booking.id} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex flex-col md:flex-row justify-between gap-4">
                        <div className="flex gap-4">
                            <div className="h-14 w-14 rounded-xl bg-slate-100 flex items-center justify-center text-xl font-bold text-slate-600">
                                {booking.teacher?.first_name?.charAt(0) || 'T'}
                            </div>
                            <div>
                                <h3 className="font-bold text-lg text-slate-900">{getSubjectName(booking)}</h3>
                                <div className="flex items-center gap-2 text-sm text-slate-500 mb-2">
                                    <User size={14} /> {booking.teacher?.first_name} {booking.teacher?.last_name}
                                </div>
                                <div className="flex flex-wrap gap-3 text-xs text-slate-500">
                                    <span className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded">
                                        <Calendar size={12} /> {booking.date || booking.created_at?.split('T')[0]}
                                    </span>
                                    {booking.time && (
                                        <span className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded"><Clock size={12} /> {booking.time}</span>
                                    )}
                                    <span className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded">
                                        {booking.type === 'online' ? <Video size={12} /> : <MapPin size={12} />} {booking.type}
                                    </span>
                                </div>
                            </div>
                        </div>
                        
                        <div className="flex flex-col justify-between items-end gap-3">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${getStatusColor(booking.status)}`}>
                                {booking.status.replace('_', ' ')}
                            </span>
                            <div className="flex items-center gap-3">
                                <span className="font-bold text-slate-900">
                                    {booking.total_price || booking.pricing?.total_amount} {t.sar}
                                </span>
                                <Button variant="outline" className="h-9 text-xs">
                                    {booking.status === 'completed' ? t.bookAgain : t.bookingDetails}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            ))
        )}
      </div>
    </div>
  );
};
