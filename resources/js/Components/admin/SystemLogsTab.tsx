import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../Contexts/LanguageContext';
import { useToast } from '../../Contexts/ToastContext';
import { adminService, SystemLogEntry } from '../../Services/api';
import { Modal } from '../ui/Modal';
import { Pagination } from '../ui/Pagination';
import { Button } from '../ui/Button';
import {
  Loader2, AlertTriangle, AlertCircle, Info, Search,
  Trash2, Eye, X, RefreshCw, ChevronDown, Terminal
} from 'lucide-react';

const levelConfig: Record<string, { bg: string; text: string; dot: string; icon: React.ReactNode }> = {
  error:    { bg: 'bg-red-50',   text: 'text-red-700',   dot: 'bg-red-500',   icon: <X size={14} /> },
  warning:  { bg: 'bg-yellow-50', text: 'text-yellow-700', dot: 'bg-yellow-500', icon: <AlertTriangle size={14} /> },
  info:     { bg: 'bg-blue-50',  text: 'text-blue-700',  dot: 'bg-blue-500',  icon: <Info size={14} /> },
  debug:    { bg: 'bg-slate-50', text: 'text-slate-600', dot: 'bg-slate-400', icon: <Terminal size={14} /> },
};

export const SystemLogsTab: React.FC = () => {
  const { t, language, direction } = useLanguage();
  const { showToast } = useToast();

  const [logs, setLogs] = useState<SystemLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedLog, setSelectedLog] = useState<SystemLogEntry | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);

  useEffect(() => {
    fetchLogs();
  }, [currentPage, levelFilter]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = {
        page: currentPage,
        per_page: 25,
      };
      if (levelFilter !== 'all') params.level = levelFilter;
      if (searchTerm.trim()) params.search = searchTerm.trim();

      const res = await adminService.getSystemLogs(params);
      const data = res.data ?? [];
      setLogs(Array.isArray(data) ? data : []);
      setTotalPages(res.meta?.last_page ?? 1);
    } catch (e) {
      showToast(language === 'ar' ? 'فشل تحميل سجلات النظام' : 'Failed to load system logs', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setCurrentPage(1);
    fetchLogs();
  };

  const handleClear = async () => {
    if (!window.confirm(language === 'ar'
      ? 'هل أنت متأكد من حذف جميع السجلات؟'
      : 'Are you sure you want to delete all logs?')) return;
    try {
      await adminService.clearSystemLogs();
      showToast(language === 'ar' ? 'تم مسح جميع السجلات' : 'All logs cleared', 'success');
      setLogs([]);
      setCurrentPage(1);
    } catch (e) {
      showToast(language === 'ar' ? 'فشل مسح السجلات' : 'Failed to clear logs', 'error');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm(language === 'ar'
      ? 'هل أنت متأكد من حذف هذا السجل؟'
      : 'Are you sure you want to delete this log?')) return;
    try {
      await adminService.deleteSystemLog(id);
      showToast(language === 'ar' ? 'تم حذف السجل' : 'Log deleted', 'success');
      setLogs(prev => prev.filter(l => l.id !== id));
    } catch (e) {
      showToast(language === 'ar' ? 'فشل حذف السجل' : 'Failed to delete log', 'error');
    }
  };

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

  const getLevelStyle = (level: string) => levelConfig[level] ?? levelConfig.info;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {language === 'ar' ? 'سجلات النظام' : 'System Logs'}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {language === 'ar' ? 'مراقبة الأخطاء وأحداث النظام' : 'Monitor errors and system events'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => { setCurrentPage(1); fetchLogs(); }}>
            <RefreshCw size={16} />
          </Button>
          <Button variant="outline" size="sm" onClick={handleClear} className="text-red-600 border-red-200 hover:bg-red-50">
            <Trash2 size={16} />
            {language === 'ar' ? 'مسح الكل' : 'Clear All'}
          </Button>
        </div>
      </div>

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
                placeholder={language === 'ar' ? 'بحث في العنوان أو الرسالة...' : 'Search title or message...'}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div className="relative">
              <button
                onClick={() => setFilterOpen(!filterOpen)}
                className="flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg text-sm bg-white hover:bg-slate-50"
              >
                {levelFilter === 'all'
                  ? (language === 'ar' ? 'كل المستويات' : 'All Levels')
                  : levelFilter}
                <ChevronDown size={16} />
              </button>
              {filterOpen && (
                <div className={`absolute z-20 mt-1 w-40 bg-white border border-slate-200 rounded-lg shadow-lg ${direction === 'rtl' ? 'left-0' : 'right-0'}`}>
                  {['all', 'error', 'warning', 'info', 'debug'].map(l => (
                    <button
                      key={l}
                      onClick={() => { setLevelFilter(l); setFilterOpen(false); setCurrentPage(1); }}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-50 ${levelFilter === l ? 'bg-slate-50 font-medium' : ''}`}
                    >
                      {l === 'all' ? (language === 'ar' ? 'الكل' : 'All') : l}
                    </button>
                  ))}
                </div>
              )}
            </div>
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
        ) : logs.length === 0 ? (
          <div className="text-center py-20 text-slate-400">
            <Terminal size={48} className="mx-auto mb-4 opacity-30" />
            <p>{language === 'ar' ? 'لا توجد سجلات' : 'No logs found'}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="text-right pr-4 py-3 w-20">{language === 'ar' ? 'المستوى' : 'Level'}</th>
                  <th className="text-right px-4 py-3">{language === 'ar' ? 'العنوان' : 'Title'}</th>
                  <th className="text-right px-4 py-3 hidden md:table-cell">{language === 'ar' ? 'الرسالة' : 'Message'}</th>
                  <th className="text-right px-4 py-3 w-24">{language === 'ar' ? 'التكرار' : 'Count'}</th>
                  <th className="text-right px-4 py-3 w-40 hidden lg:table-cell">{language === 'ar' ? 'آخر مرة' : 'Last seen'}</th>
                  <th className="text-right pr-4 py-3 w-20">{language === 'ar' ? 'إجراء' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.map(log => {
                  const style = getLevelStyle(log.level);
                  return (
                    <tr key={log.id} className="hover:bg-slate-50 transition-colors text-sm">
                      <td className="pr-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${style.bg} ${style.text}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
                          {log.level}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-900 max-w-[200px] truncate">
                        {log.title}
                      </td>
                      <td className="px-4 py-3 text-slate-600 max-w-[300px] truncate hidden md:table-cell">
                        {log.message}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center justify-center min-w-[28px] h-7 px-2 rounded-full bg-slate-100 text-xs font-bold text-slate-700">
                          {log.occurrences}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-500 text-xs hidden lg:table-cell">
                        {formatDate(log.last_occurred_at)}
                      </td>
                      <td className="pr-4 py-3">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setSelectedLog(log)}
                            className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors"
                            title={language === 'ar' ? 'عرض التفاصيل' : 'View details'}
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(log.id)}
                            className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-colors"
                            title={language === 'ar' ? 'حذف' : 'Delete'}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
      </div>

      {selectedLog && (
        <Modal
          isOpen={!!selectedLog}
          onClose={() => setSelectedLog(null)}
          title={language === 'ar' ? 'تفاصيل السجل' : 'Log Details'}
        >
          <div className="space-y-4 text-sm">
            <div className="flex items-center gap-3">
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${getLevelStyle(selectedLog.level).bg} ${getLevelStyle(selectedLog.level).text}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${getLevelStyle(selectedLog.level).dot}`} />
                {selectedLog.level}
              </span>
              <span className="text-xs text-slate-400">#{selectedLog.id}</span>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">{language === 'ar' ? 'العنوان' : 'Title'}</label>
              <p className="font-semibold text-slate-900">{selectedLog.title}</p>
            </div>

            {selectedLog.type && (
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">{language === 'ar' ? 'النوع' : 'Type'}</label>
                <p className="font-mono text-xs text-slate-700 bg-slate-100 px-2 py-1 rounded">{selectedLog.type}</p>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">{language === 'ar' ? 'الرسالة' : 'Message'}</label>
              <pre className="whitespace-pre-wrap text-xs bg-slate-50 border border-slate-200 rounded-lg p-3 max-h-40 overflow-y-auto text-slate-800">
                {selectedLog.message}
              </pre>
            </div>

            {(selectedLog.file || selectedLog.line) && (
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">{language === 'ar' ? 'الملف' : 'File'}</label>
                <p className="font-mono text-xs text-slate-700">
                  {selectedLog.file}:{selectedLog.line}
                </p>
              </div>
            )}

            {selectedLog.url && (
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">URL</label>
                <p className="font-mono text-xs text-slate-700 break-all">{selectedLog.method} {selectedLog.url}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              {selectedLog.ip && (
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">IP</label>
                  <p className="text-xs text-slate-700">{selectedLog.ip}</p>
                </div>
              )}
              {selectedLog.user_id && (
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">User ID</label>
                  <p className="text-xs text-slate-700">{selectedLog.user_id}</p>
                </div>
              )}
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">{language === 'ar' ? 'التكرار' : 'Occurrences'}</label>
                <p className="text-xs text-slate-700">{selectedLog.occurrences}</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">{language === 'ar' ? 'آخر مرة' : 'Last occurred'}</label>
                <p className="text-xs text-slate-700">{formatDate(selectedLog.last_occurred_at)}</p>
              </div>
            </div>

            {selectedLog.trace && (
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Stack Trace</label>
                <pre className="whitespace-pre-wrap text-xs bg-slate-900 text-green-400 rounded-lg p-3 max-h-60 overflow-y-auto font-mono leading-relaxed">
                  {selectedLog.trace}
                </pre>
              </div>
            )}

            {selectedLog.context && Object.keys(selectedLog.context).length > 0 && (
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">{language === 'ar' ? 'السياق' : 'Context'}</label>
                <pre className="whitespace-pre-wrap text-xs bg-slate-50 border border-slate-200 rounded-lg p-3 max-h-40 overflow-y-auto text-slate-700">
                  {JSON.stringify(selectedLog.context, null, 2)}
                </pre>
              </div>
            )}

            <div className="text-xs text-slate-400 pt-2 border-t border-slate-100">
              {language === 'ar' ? 'تم الإنشاء: ' : 'Created: '}{formatDate(selectedLog.created_at)}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
