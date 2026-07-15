import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../Contexts/LanguageContext';
import { useToast } from '../../Contexts/ToastContext';
import { adminService, ApiAnalyticsStats, ApiStatistic } from '../../Services/api';
import { Pagination } from '../ui/Pagination';
import {
  Loader2, Activity, BarChart3, Smartphone, Users, Clock, Zap, Target, Globe, Hash,
  Search, ChevronDown, RefreshCw
} from 'lucide-react';

export const ApiAnalyticsTab: React.FC = () => {
  const { t, language, direction } = useLanguage();
  const { showToast } = useToast();

  const [stats, setStats] = useState<ApiAnalyticsStats | null>(null);
  const [loading, setLoading] = useState(true);

  const [records, setRecords] = useState<ApiStatistic[]>([]);
  const [recordsLoading, setRecordsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [methodFilter, setMethodFilter] = useState<string>('all');
  const [filterOpen, setFilterOpen] = useState(false);

  useEffect(() => {
    fetchStats();
    fetchRecords();
  }, []);

  useEffect(() => {
    fetchRecords();
  }, [currentPage, methodFilter]);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await adminService.getApiAnalytics();
      setStats(res.data);
    } catch {
      showToast(
        language === 'ar' ? 'فشل تحميل إحصائيات API' : 'Failed to load API analytics',
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchRecords = async () => {
    setRecordsLoading(true);
    try {
      const params: Record<string, string | number> = { page: currentPage, per_page: 25 };
      if (methodFilter !== 'all') params.method = methodFilter;
      if (searchTerm.trim()) params.search = searchTerm.trim();

      const res = await adminService.getApiAnalyticsRecords(params);
      const data = res.data ?? [];
      setRecords(Array.isArray(data) ? data : []);
      setTotalPages(res.meta?.last_page ?? 1);
    } catch {
      showToast(
        language === 'ar' ? 'فشل تحميل سجلات API' : 'Failed to load API records',
        'error'
      );
    } finally {
      setRecordsLoading(false);
    }
  };

  const handleSearch = () => {
    setCurrentPage(1);
    fetchRecords();
  };

  const formatMs = (val: number | null | undefined) =>
    val !== null && val !== undefined ? `${val.toFixed(2)} ${t.ms}` : '—';

  const formatNumber = (val: number | undefined) =>
    val !== undefined ? val.toLocaleString() : '0';

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

  const statusBadge = (code: number | null | undefined) => {
    if (code === null || code === undefined) return null;
    if (code >= 200 && code < 300) return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700">{code}</span>;
    if (code >= 400 && code < 500) return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700">{code}</span>;
    if (code >= 500) return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700">{code}</span>;
    return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">{code}</span>;
  };

  const summaryCards = stats
    ? [
        { label: t.totalRequests, value: formatNumber(stats.total_requests), icon: Hash, color: 'text-blue-600', bg: 'bg-blue-50' },
        { label: t.todayRequests, value: formatNumber(stats.today_requests), icon: Activity, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        { label: t.thisWeek, value: formatNumber(stats.this_week_requests), icon: BarChart3, color: 'text-violet-600', bg: 'bg-violet-50' },
        { label: t.thisMonth, value: formatNumber(stats.this_month_requests), icon: BarChart3, color: 'text-orange-600', bg: 'bg-orange-50' },
        { label: t.successful, value: formatNumber(stats.successful_requests), icon: Activity, color: 'text-green-600', bg: 'bg-green-50' },
        { label: t.failed, value: formatNumber(stats.failed_requests), icon: Activity, color: 'text-red-600', bg: 'bg-red-50' },
        { label: t.avgResponseTime, value: formatMs(stats.average_response_time_ms), icon: Clock, color: 'text-cyan-600', bg: 'bg-cyan-50' },
        { label: t.authenticated, value: formatNumber(stats.authenticated_count), icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-50' },
        { label: t.guest, value: formatNumber(stats.guest_count), icon: Users, color: 'text-slate-600', bg: 'bg-slate-50' },
      ]
    : [];

  const platformData = stats
    ? [
        { label: 'Android', value: stats.android_usage, color: 'bg-emerald-500' },
        { label: 'iOS', value: stats.ios_usage, color: 'bg-blue-500' },
        { label: t.web, value: stats.web_usage, color: 'bg-violet-500' },
        { label: language === 'ar' ? 'أخرى' : 'Other', value: stats.other_platform_usage, color: 'bg-slate-400' },
      ]
    : [];

  const methods = ['all', 'GET', 'POST', 'PUT', 'DELETE', 'PATCH'];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{t.apiAnalytics}</h1>
          <p className="text-sm text-slate-500 mt-1">{t.apiAnalyticsDesc}</p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      ) : !stats ? (
        <div className="text-center py-20 text-slate-400">
          <Activity size={48} className="mx-auto mb-4 opacity-30" />
          <p>{language === 'ar' ? 'لا توجد بيانات' : t.noData}</p>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {summaryCards.map((card, i) => (
              <div key={i} className="bg-white rounded-xl border border-slate-200 p-4 flex items-start gap-3">
                <div className={`p-2.5 rounded-lg ${card.bg}`}>
                  <card.icon size={20} className={card.color} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-slate-500 truncate">{card.label}</p>
                  <p className="text-lg font-bold text-slate-900 mt-0.5">{card.value}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Platform Usage */}
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <div className="flex items-center gap-2 mb-4">
                <Smartphone size={18} className="text-slate-500" />
                <h3 className="font-semibold text-slate-800">{t.platformUsage}</h3>
              </div>
              <div className="space-y-3">
                {platformData.map((p) => {
                  const maxVal = Math.max(...platformData.map(x => x.value), 1);
                  const pct = (p.value / maxVal) * 100;
                  return (
                    <div key={p.label}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-slate-600">{p.label}</span>
                        <span className="font-semibold text-slate-800">{formatNumber(p.value)}</span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${p.color}`}
                          style={{ width: `${Math.max(pct, 4)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Endpoint Rankings */}
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <div className="flex items-center gap-2 mb-4">
                <Target size={18} className="text-slate-500" />
                <h3 className="font-semibold text-slate-800">{t.rankings}</h3>
              </div>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-green-50">
                    <Zap size={16} className="text-green-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-slate-500">{t.mostUsed}</p>
                    <p className="text-sm font-semibold text-slate-800 truncate">
                      {stats.most_popular_endpoint?.endpoint ?? '—'}
                    </p>
                    <p className="text-xs text-slate-400">
                      {formatNumber(stats.most_popular_endpoint?.hits)} {t.hits}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-red-50">
                    <Globe size={16} className="text-red-500" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-slate-500">{t.leastUsed}</p>
                    <p className="text-sm font-semibold text-slate-800 truncate">
                      {stats.least_popular_endpoint?.endpoint ?? '—'}
                    </p>
                    <p className="text-xs text-slate-400">
                      {formatNumber(stats.least_popular_endpoint?.hits)} {t.hits}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-cyan-50">
                    <Clock size={16} className="text-cyan-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-slate-500">{t.fastestEndpoint}</p>
                    <p className="text-sm font-semibold text-slate-800 truncate">
                      {stats.fastest_endpoint?.endpoint ?? '—'}
                    </p>
                    <p className="text-xs text-slate-400">
                      {formatMs(stats.fastest_endpoint?.min_response_time)}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-orange-50">
                    <Clock size={16} className="text-orange-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-slate-500">{t.slowestEndpoint}</p>
                    <p className="text-sm font-semibold text-slate-800 truncate">
                      {stats.slowest_endpoint?.endpoint ?? '—'}
                    </p>
                    <p className="text-xs text-slate-400">
                      {formatMs(stats.slowest_endpoint?.max_response_time)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Error Breakdown */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <p className="text-xs font-medium text-slate-500">{t.clientErrors}</p>
              <p className="text-xl font-bold text-amber-600 mt-1">{formatNumber(stats.client_errors)}</p>
              <div className="w-full h-1.5 bg-slate-100 rounded-full mt-2 overflow-hidden">
                <div
                  className="h-full rounded-full bg-amber-500"
                  style={{ width: `${stats.total_requests > 0 ? (stats.client_errors / stats.total_requests) * 100 : 0}%` }}
                />
              </div>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <p className="text-xs font-medium text-slate-500">{t.serverErrors}</p>
              <p className="text-xl font-bold text-red-600 mt-1">{formatNumber(stats.server_errors)}</p>
              <div className="w-full h-1.5 bg-slate-100 rounded-full mt-2 overflow-hidden">
                <div
                  className="h-full rounded-full bg-red-500"
                  style={{ width: `${stats.total_requests > 0 ? (stats.server_errors / stats.total_requests) * 100 : 0}%` }}
                />
              </div>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <p className="text-xs font-medium text-slate-500">{t.highestMemoryUsage}</p>
              <p className="text-xl font-bold text-slate-800 mt-1">
                {stats.highest_memory_usage_kb
                  ? `${(stats.highest_memory_usage_kb.max_memory_usage / 1024).toFixed(1)} MB`
                  : '—'}
              </p>
              <p className="text-xs text-slate-400 truncate mt-1">
                {stats.highest_memory_usage_kb?.endpoint ?? ''}
              </p>
            </div>
          </div>
        </>
      )}

      {/* Records Table */}
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
                placeholder={language === 'ar' ? 'بحث في النقاط...' : 'Search endpoints...'}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div className="relative">
              <button
                onClick={() => setFilterOpen(!filterOpen)}
                className="flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg text-sm bg-white hover:bg-slate-50 w-full sm:w-auto"
              >
                {methodFilter === 'all'
                  ? (language === 'ar' ? 'كل الطرق' : 'All Methods')
                  : methodFilter}
                <ChevronDown size={16} />
              </button>
              {filterOpen && (
                <div className={`absolute z-20 mt-1 w-40 bg-white border border-slate-200 rounded-lg shadow-lg ${direction === 'rtl' ? 'left-0' : 'right-0'}`}>
                  {methods.map(m => (
                    <button
                      key={m}
                      onClick={() => { setMethodFilter(m); setFilterOpen(false); setCurrentPage(1); }}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-50 ${methodFilter === m ? 'bg-slate-50 font-medium' : ''}`}
                    >
                      {m === 'all' ? (language === 'ar' ? 'الكل' : 'All') : m}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button
              onClick={() => { setCurrentPage(1); fetchRecords(); }}
              className="flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg text-sm bg-white hover:bg-slate-50"
            >
              <RefreshCw size={16} />
            </button>
          </div>
        </div>

        {recordsLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : records.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <BarChart3 size={48} className="mx-auto mb-4 opacity-30" />
            <p>{language === 'ar' ? 'لا توجد سجلات' : 'No records found'}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="text-right pr-4 py-3">{language === 'ar' ? 'النقطة' : 'Endpoint'}</th>
                  <th className="text-right px-4 py-3">{language === 'ar' ? 'الطريقة' : 'Method'}</th>
                  <th className="text-right px-4 py-3 hidden md:table-cell">{language === 'ar' ? 'الوحدة' : 'Module'}</th>
                  <th className="text-right px-4 py-3">{language === 'ar' ? 'التاريخ' : 'Date'}</th>
                  <th className="text-right px-4 py-3">{t.hits}</th>
                  <th className="text-right px-4 py-3 hidden lg:table-cell">{t.avgResponseTime}</th>
                  <th className="text-right px-4 py-3">{language === 'ar' ? 'الحالة' : 'Status'}</th>
                  <th className="text-right pr-4 py-3 hidden sm:table-cell">{language === 'ar' ? 'آخر مرة' : 'Last Hit'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {records.map(rec => (
                  <tr key={rec.id} className="hover:bg-slate-50 transition-colors text-sm">
                    <td className="pr-4 py-3 font-medium text-slate-900 max-w-[200px] truncate" title={rec.endpoint}>
                      {rec.endpoint}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded text-xs font-bold ${
                        rec.method === 'GET' ? 'bg-green-50 text-green-700' :
                        rec.method === 'POST' ? 'bg-blue-50 text-blue-700' :
                        rec.method === 'PUT' || rec.method === 'PATCH' ? 'bg-orange-50 text-orange-700' :
                        rec.method === 'DELETE' ? 'bg-red-50 text-red-700' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                        {rec.method}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600 hidden md:table-cell">
                      {rec.module ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-slate-600 whitespace-nowrap text-xs">
                      {rec.date}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-semibold text-slate-900">{formatNumber(rec.hits)}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-600 hidden lg:table-cell whitespace-nowrap">
                      {rec.average_response_time !== null && rec.average_response_time !== undefined
                        ? `${rec.average_response_time.toFixed(2)} ${t.ms}`
                        : '—'}
                    </td>
                    <td className="px-4 py-3">
                      {statusBadge(rec.last_status_code)}
                    </td>
                    <td className="pr-4 py-3 text-slate-400 text-xs hidden sm:table-cell whitespace-nowrap">
                      {rec.last_hit_at ? formatDate(rec.last_hit_at) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
      </div>
    </div>
  );
};
