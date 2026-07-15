import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../Contexts/LanguageContext';
import { useToast } from '../../Contexts/ToastContext';
import { adminService, ActivityRecord, ActivityRecordStats, ActivityRecordGroupedStats } from '../../Services/api';
import { Modal } from '../ui/Modal';
import { Pagination } from '../ui/Pagination';
import { Button } from '../ui/Button';
import {
  Loader2, Search, Eye, RefreshCw, ChevronDown, Activity,
  User, BookOpen, Globe, Layers, Hash, Calendar, BarChart3,
  Users, Clock, Target, List, PieChart
} from 'lucide-react';

type ActiveSubTab = 'records' | 'grouped';

export const ActivityRecordsTab: React.FC = () => {
  const { language, direction } = useLanguage();
  const { showToast } = useToast();

  const [activeSubTab, setActiveSubTab] = useState<ActiveSubTab>('records');

  const [stats, setStats] = useState<ActivityRecordStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [records, setRecords] = useState<ActivityRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedRecord, setSelectedRecord] = useState<ActivityRecord | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);

  const [groupedStats, setGroupedStats] = useState<ActivityRecordGroupedStats | null>(null);
  const [groupedLoading, setGroupedLoading] = useState(false);

  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    fetchStats();
    fetchRecords();
  }, []);

  useEffect(() => {
    fetchRecords();
  }, [currentPage]);

  useEffect(() => {
    if (activeSubTab === 'grouped') {
      fetchGroupedStats();
    }
  }, [activeSubTab]);

  const fetchStats = async () => {
    setStatsLoading(true);
    try {
      const res = await adminService.getActivityRecordsStats();
      setStats(res.data ?? null);
    } catch {
      showToast(language === 'ar' ? 'فشل تحميل الإحصائيات' : 'Failed to load stats', 'error');
    } finally {
      setStatsLoading(false);
    }
  };

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = {
        page: currentPage,
        per_page: ITEMS_PER_PAGE,
      };
      if (categoryFilter !== 'all') params.category = categoryFilter;
      if (searchTerm.trim()) params.search = searchTerm.trim();

      const res = await adminService.getActivityRecords(params);
      const data = res.data ?? [];
      setRecords(Array.isArray(data) ? data : []);
      setTotalPages(res.meta?.last_page ?? 1);
    } catch (e) {
      showToast(language === 'ar' ? 'فشل تحميل سجلات النشاطات' : 'Failed to load activity records', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchGroupedStats = async () => {
    setGroupedLoading(true);
    try {
      const res = await adminService.getActivityRecordsGroupedStats();
      setGroupedStats(res.data ?? null);
    } catch {
      showToast(language === 'ar' ? 'فشل تحميل إحصائيات التجميع' : 'Failed to load grouped stats', 'error');
    } finally {
      setGroupedLoading(false);
    }
  };

  const handleSearch = () => {
    setCurrentPage(1);
    fetchRecords();
  };

  const formatNumber = (val: number | undefined | null) =>
    val !== undefined && val !== null ? val.toLocaleString() : '0';

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleString(language === 'ar' ? 'ar-SA' : 'en-US', {
        year: 'numeric', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  const localizedName = (item: { name_en: string; name_ar: string } | undefined) => {
    if (!item) return '—';
    return language === 'ar' ? item.name_ar : item.name_en;
  };

  const categories = [...new Set(records.map(r => r.category).filter(Boolean))];

  const summaryCards = stats
    ? [
        { label: language === 'ar' ? 'الإجمالي' : 'Total', value: formatNumber(stats.total), icon: BarChart3, color: 'text-blue-600', bg: 'bg-blue-50' },
        { label: language === 'ar' ? 'اليوم' : 'Today', value: formatNumber(stats.today), icon: Activity, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        { label: language === 'ar' ? 'هذا الأسبوع' : 'This Week', value: formatNumber(stats.this_week), icon: BarChart3, color: 'text-violet-600', bg: 'bg-violet-50' },
        { label: language === 'ar' ? 'هذا الشهر' : 'This Month', value: formatNumber(stats.this_month), icon: Clock, color: 'text-orange-600', bg: 'bg-orange-50' },
        { label: language === 'ar' ? 'المستخدمين' : 'Users', value: formatNumber(stats.unique_users), icon: Users, color: 'text-cyan-600', bg: 'bg-cyan-50' },
        { label: language === 'ar' ? 'المعلمين' : 'Teachers', value: formatNumber(stats.unique_teachers), icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-50' },
      ]
    : [];

  const groupedLabels: Record<string, string> = {
    users: language === 'ar' ? 'المستخدمين' : 'Users',
    services: language === 'ar' ? 'الخدمات' : 'Services',
    subjects: language === 'ar' ? 'المواد' : 'Subjects',
    teachers: language === 'ar' ? 'المعلمين' : 'Teachers',
    languages: language === 'ar' ? 'اللغات' : 'Languages',
    courses: language === 'ar' ? 'الدورات' : 'Courses',
    session_types: language === 'ar' ? 'أنواع الجلسات' : 'Session Types',
  };

  const groupedIcons: Record<string, React.ReactNode> = {
    users: <Users size={16} />,
    services: <Layers size={16} />,
    subjects: <BookOpen size={16} />,
    teachers: <User size={16} />,
    languages: <Globe size={16} />,
    courses: <BookOpen size={16} />,
    session_types: <Hash size={16} />,
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {language === 'ar' ? 'سجلات النشاطات' : 'Activity Records'}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {language === 'ar' ? 'عرض جميع الأحداث والإجراءات في النظام' : 'View all events and actions in the system'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => { setCurrentPage(1); fetchRecords(); fetchStats(); }}>
            <RefreshCw size={16} />
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {statsLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 text-primary animate-spin" />
        </div>
      ) : summaryCards.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {summaryCards.map((card, i) => (
            <div key={i} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-slate-500">{card.label}</span>
                <div className={`p-2 rounded-lg ${card.bg}`}>
                  <card.icon size={16} className={card.color} />
                </div>
              </div>
              <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Sub Tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
        <button
          onClick={() => setActiveSubTab('records')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeSubTab === 'records' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <List size={16} />
          {language === 'ar' ? 'السجلات' : 'Records'}
        </button>
        <button
          onClick={() => setActiveSubTab('grouped')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeSubTab === 'grouped' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <PieChart size={16} />
          {language === 'ar' ? 'إحصائيات' : 'Statistics'}
        </button>
      </div>

      {activeSubTab === 'records' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-100">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSearch()}
                  placeholder={language === 'ar' ? 'بحث في العنوان...' : 'Search title...'}
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              {categories.length > 0 && (
                <div className="relative">
                  <button
                    onClick={() => setFilterOpen(!filterOpen)}
                    className="flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg text-sm bg-white hover:bg-slate-50"
                  >
                    {categoryFilter === 'all'
                      ? (language === 'ar' ? 'كل التصنيفات' : 'All Categories')
                      : categoryFilter}
                    <ChevronDown size={16} />
                  </button>
                  {filterOpen && (
                    <div className={`absolute z-20 mt-1 w-44 bg-white border border-slate-200 rounded-lg shadow-lg ${direction === 'rtl' ? 'left-0' : 'right-0'}`}>
                      <button
                        onClick={() => { setCategoryFilter('all'); setFilterOpen(false); setCurrentPage(1); }}
                        className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-50 ${categoryFilter === 'all' ? 'bg-slate-50 font-medium' : ''}`}
                      >
                        {language === 'ar' ? 'الكل' : 'All'}
                      </button>
                      {categories.map(cat => (
                        <button
                          key={cat}
                          onClick={() => { setCategoryFilter(cat!); setFilterOpen(false); setCurrentPage(1); }}
                          className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-50 ${categoryFilter === cat ? 'bg-slate-50 font-medium' : ''}`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
              <Button size="sm" onClick={handleSearch}>
                <Search size={16} />
                {language === 'ar' ? 'بحث' : 'Search'}
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
          ) : records.length === 0 ? (
            <div className="text-center py-20 text-slate-400">
              <Activity size={48} className="mx-auto mb-4 opacity-30" />
              <p>{language === 'ar' ? 'لا توجد سجلات نشاطات' : 'No activity records found'}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    <th className="text-right pr-4 py-3">ID</th>
                    <th className="text-right px-4 py-3">{language === 'ar' ? 'العنوان' : 'Title'}</th>
                    <th className="text-right px-4 py-3 hidden md:table-cell">{language === 'ar' ? 'التصنيف' : 'Category'}</th>
                    <th className="text-right px-4 py-3 hidden lg:table-cell">{language === 'ar' ? 'المستخدم' : 'User'}</th>
                    <th className="text-right px-4 py-3 hidden lg:table-cell">{language === 'ar' ? 'المعلم' : 'Teacher'}</th>
                    <th className="text-right px-4 py-3 hidden xl:table-cell">{language === 'ar' ? 'الخدمة' : 'Service'}</th>
                    <th className="text-right px-4 py-3 w-36">{language === 'ar' ? 'التاريخ' : 'Date'}</th>
                    <th className="text-right pr-4 py-3 w-16">{language === 'ar' ? 'عرض' : 'View'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {records.map(record => (
                    <tr key={record.id} className="hover:bg-slate-50 transition-colors text-sm">
                      <td className="pr-4 py-3 text-slate-400 font-mono text-xs">#{record.id}</td>
                      <td className="px-4 py-3 font-medium text-slate-900 max-w-[200px] truncate">{record.title}</td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        {record.category ? (
                          <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700">{record.category}</span>
                        ) : <span className="text-slate-400">—</span>}
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        {record.user ? <span className="text-slate-700">{record.user.first_name} {record.user.last_name}</span> : <span className="text-slate-400">—</span>}
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        {record.teacher ? <span className="text-slate-700">{record.teacher.first_name} {record.teacher.last_name}</span> : <span className="text-slate-400">—</span>}
                      </td>
                      <td className="px-4 py-3 hidden xl:table-cell text-slate-600 max-w-[120px] truncate">
                        {localizedName(record.service ?? undefined) as string}
                      </td>
                      <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">{formatDate(record.created_at)}</td>
                      <td className="pr-4 py-3">
                        <button onClick={() => setSelectedRecord(record)} className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors" title={language === 'ar' ? 'عرض التفاصيل' : 'View details'}>
                          <Eye size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
        </div>
      )}

      {activeSubTab === 'grouped' && (
        <div className="space-y-4">
          {groupedLoading ? (
            <div className="flex items-center justify-center py-20 bg-white rounded-xl border border-slate-200">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
          ) : !groupedStats ? (
            <div className="text-center py-20 text-slate-400 bg-white rounded-xl border border-slate-200">
              <PieChart size={48} className="mx-auto mb-4 opacity-30" />
              <p>{language === 'ar' ? 'لا توجد بيانات' : 'No data available'}</p>
            </div>
          ) : (
            Object.entries(groupedLabels).map(([key, label]) => {
              const data = key === 'users' ? groupedStats.users
                : key === 'services' ? groupedStats.services
                : key === 'subjects' ? groupedStats.subjects
                : key === 'teachers' ? groupedStats.teachers
                : key === 'languages' ? groupedStats.languages
                : key === 'courses' ? groupedStats.courses
                : groupedStats.session_types;

              if (data.length === 0) return null;

              return (
                <div key={key} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                  <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50">
                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                      {groupedIcons[key]}
                      {label}
                      <span className="text-xs font-normal text-slate-400">({data.length})</span>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                          <th className="text-right px-4 py-2 w-10">#</th>
                          <th className="text-right px-4 py-2">{language === 'ar' ? 'الاسم' : 'Name'}</th>
                          <th className="text-right px-4 py-2 w-28">{language === 'ar' ? 'عدد السجلات' : 'Count'}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {data.map((item, i) => (
                          <tr key={item.id ?? i} className="hover:bg-slate-50 transition-colors text-sm">
                            <td className="px-4 py-2 text-slate-400 font-mono text-xs">{i + 1}</td>
                            <td className="px-4 py-2 font-medium text-slate-900">
                              {item.name_ar && language === 'ar' ? item.name_ar : item.name}
                            </td>
                            <td className="px-4 py-2">
                              <span className="inline-flex items-center justify-center min-w-[28px] h-6 px-2 rounded-full bg-primary/10 text-primary text-xs font-bold">
                                {item.total}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {selectedRecord && (
        <Modal
          isOpen={!!selectedRecord}
          onClose={() => setSelectedRecord(null)}
          title={language === 'ar' ? 'تفاصيل سجل النشاط' : 'Activity Record Details'}
        >
          <div className="space-y-4 text-sm">
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                <Activity size={12} />
                {selectedRecord.title}
              </span>
              <span className="text-xs text-slate-400">#{selectedRecord.id}</span>
            </div>
            {selectedRecord.category && (
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">{language === 'ar' ? 'التصنيف' : 'Category'}</label>
                <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700">{selectedRecord.category}</span>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              {selectedRecord.user && <div><label className="block text-xs font-medium text-slate-500 mb-1"><User size={12} className="inline mr-1" />{language === 'ar' ? 'المستخدم' : 'User'}</label><p className="text-slate-800">{selectedRecord.user.first_name} {selectedRecord.user.last_name}</p></div>}
              {selectedRecord.teacher && <div><label className="block text-xs font-medium text-slate-500 mb-1"><User size={12} className="inline mr-1" />{language === 'ar' ? 'المعلم' : 'Teacher'}</label><p className="text-slate-800">{selectedRecord.teacher.first_name} {selectedRecord.teacher.last_name}</p></div>}
              {selectedRecord.booking && <div><label className="block text-xs font-medium text-slate-500 mb-1"><Hash size={12} className="inline mr-1" />{language === 'ar' ? 'الحجز' : 'Booking'}</label><p className="text-slate-800 font-mono text-xs">{selectedRecord.booking.booking_reference}</p></div>}
              {selectedRecord.service && <div><label className="block text-xs font-medium text-slate-500 mb-1"><Layers size={12} className="inline mr-1" />{language === 'ar' ? 'الخدمة' : 'Service'}</label><p className="text-slate-800">{localizedName(selectedRecord.service)}</p></div>}
              {selectedRecord.subject && <div><label className="block text-xs font-medium text-slate-500 mb-1"><BookOpen size={12} className="inline mr-1" />{language === 'ar' ? 'المادة' : 'Subject'}</label><p className="text-slate-800">{localizedName(selectedRecord.subject)}</p></div>}
              {selectedRecord.language && <div><label className="block text-xs font-medium text-slate-500 mb-1"><Globe size={12} className="inline mr-1" />{language === 'ar' ? 'اللغة' : 'Language'}</label><p className="text-slate-800">{localizedName(selectedRecord.language)}</p></div>}
              {selectedRecord.course && <div><label className="block text-xs font-medium text-slate-500 mb-1"><BookOpen size={12} className="inline mr-1" />{language === 'ar' ? 'الدورة' : 'Course'}</label><p className="text-slate-800">{localizedName(selectedRecord.course)}</p></div>}
              {selectedRecord.session_type && <div><label className="block text-xs font-medium text-slate-500 mb-1">{language === 'ar' ? 'نوع الجلسة' : 'Session Type'}</label><p className="text-slate-800">{selectedRecord.session_type}</p></div>}
              {selectedRecord.sessions_count !== null && <div><label className="block text-xs font-medium text-slate-500 mb-1">{language === 'ar' ? 'عدد الجلسات' : 'Sessions Count'}</label><p className="text-slate-800">{selectedRecord.sessions_count}</p></div>}
            </div>
            {selectedRecord.data && Object.keys(selectedRecord.data).length > 0 && (
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">{language === 'ar' ? 'البيانات' : 'Data'}</label>
                <pre className="whitespace-pre-wrap text-xs bg-slate-50 border border-slate-200 rounded-lg p-3 max-h-48 overflow-y-auto text-slate-700">{JSON.stringify(selectedRecord.data, null, 2)}</pre>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100">
              <div><label className="block text-xs font-medium text-slate-500 mb-1"><Calendar size={12} className="inline mr-1" />{language === 'ar' ? 'تم الإنشاء' : 'Created'}</label><p className="text-xs text-slate-600">{formatDate(selectedRecord.created_at)}</p></div>
              <div><label className="block text-xs font-medium text-slate-500 mb-1"><Calendar size={12} className="inline mr-1" />{language === 'ar' ? 'آخر تحديث' : 'Updated'}</label><p className="text-xs text-slate-600">{formatDate(selectedRecord.updated_at)}</p></div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
