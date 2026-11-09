import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../Contexts/LanguageContext';
import { 
  Plus, 
  Clock, 
  Calendar, 
  DollarSign, 
  Users, 
  BookOpen, 
  Loader2, 
  AlertCircle, 
  Trash2, 
  CheckCircle2, 
  XCircle,
  FileText
} from 'lucide-react';
import { Button } from '../ui/Button';
import { studentService } from '../../Services/api';
import { CreateOrderModal } from './CreateOrderModal';
import { StudentOrderApplicationsModal } from './StudentOrderApplicationsModal';

export const StudentOrdersTab: React.FC = () => {
  const { language } = useLanguage();

  const [orders, setOrders] = useState<any[]>([]);
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
      const res = await studentService.getOrders();
      const list = Array.isArray(res) ? res : (res?.data || []);
      setOrders(list);
    } catch (err: any) {
      setError(err.message || 'Error loading orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleDeleteOrder = async (orderId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const confirmed = window.confirm(
      language === 'ar'
        ? 'هل أنت متأكد من رغبتك في إلغاء هذا الطلب؟'
        : 'Are you sure you want to cancel this request?'
    );
    if (!confirmed) return;

    setDeletingId(orderId);
    try {
      await studentService.deleteOrder(orderId);
      setOrders(prev => prev.filter(o => o.id !== orderId));
    } catch (err: any) {
      alert(err.message || 'Failed to delete order');
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
    if (s === 'confirmed' || s === 'completed' || s === 'assigned') {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-green-50 text-green-700 border border-green-200">
          <CheckCircle2 size={12} />
          {language === 'ar' ? 'مؤكد' : 'Confirmed'}
        </span>
      );
    }
    if (s === 'cancelled') {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-red-50 text-red-700 border border-red-200">
          <XCircle size={12} />
          {language === 'ar' ? 'ملغي' : 'Cancelled'}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
        <Clock size={12} />
        {language === 'ar' ? 'قيد الانتظار' : 'Pending'}
      </span>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-[var(--text-main)]">
            {language === 'ar' ? 'طلبات الدروس الخاصة' : 'Special Lesson Requests'}
          </h2>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            {language === 'ar'
              ? 'أدر طلباتك وتلقى العروض التنافسية من نخبة المعلمين المعتمدين'
              : 'Manage requests and receive competitive offers from verified teachers'}
          </p>
        </div>

        <Button
          onClick={() => setIsCreateOpen(true)}
          className="flex items-center gap-2 rounded-xl px-5 py-2.5 shadow-sm self-start sm:self-auto"
        >
          <Plus size={18} />
          <span>{language === 'ar' ? 'طلب درس خاص جديد' : 'New Request'}</span>
        </Button>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-[var(--border)]">
        {[
          { key: 'all', labelAr: 'جميع الطلبات', labelEn: 'All Requests' },
          { key: 'pending', labelAr: 'قيد الانتظار', labelEn: 'Pending' },
          { key: 'confirmed', labelAr: 'المؤكدة', labelEn: 'Confirmed' },
          { key: 'cancelled', labelAr: 'الملغاة', labelEn: 'Cancelled' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key as any)}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              filter === tab.key
                ? 'bg-primary text-white shadow-sm'
                : 'bg-white text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-gray-100 border border-[var(--border)]'
            }`}
          >
            {language === 'ar' ? tab.labelAr : tab.labelEn}
          </button>
        ))}
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 text-red-700 text-sm flex items-center gap-2 border border-red-200">
          <AlertCircle size={18} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="p-16 flex justify-center items-center">
          <Loader2 className="animate-spin h-8 w-8 text-primary" />
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-3xl border border-[var(--border)] p-8">
          <div className="h-16 w-16 mx-auto rounded-2xl bg-primary-pale text-primary flex items-center justify-center mb-4">
            <FileText size={32} />
          </div>
          <h3 className="font-bold text-lg text-[var(--text-main)] mb-1">
            {language === 'ar' ? 'لا توجد طلبات في هذا القسم' : 'No requests found'}
          </h3>
          <p className="text-xs text-[var(--text-muted)] max-w-md mx-auto mb-6">
            {language === 'ar'
              ? 'يمكنك الآن نشر طلب درس خاص وتحديد المادة والموعد والميزانية المناسبة لك.'
              : 'You can post a custom lesson request with your preferred subject, budget, and slot.'}
          </p>
          <Button onClick={() => setIsCreateOpen(true)} className="rounded-xl text-xs px-5">
            {language === 'ar' ? 'إنشاء طلب جديد الآن' : 'Create Request Now'}
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredOrders.map((order) => {
            const subject = order.subject || {};
            const subjectName = language === 'ar' ? (subject.name_ar || subject.name) : (subject.name_en || subject.name);
            const appsCount = order.applications_count ?? (order.applications ? order.applications.length : 0);
            const slots = order.available_slots || order.availableSlots || [];
            const firstSlot = slots[0];
            const isPending = (order.status || 'pending').toLowerCase() === 'pending';

            return (
              <div
                key={order.id}
                className="relative overflow-hidden bg-white rounded-3xl border border-[var(--border)] p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between gap-5"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="h-11 w-11 rounded-2xl bg-[var(--light-bg)] text-primary flex items-center justify-center shrink-0">
                        <BookOpen size={22} />
                      </div>
                      <div>
                        <h3 className="font-bold text-base text-[var(--text-main)]">
                          {subjectName || (language === 'ar' ? 'طلب درس خاص' : 'Special Lesson')}
                        </h3>
                        <span className="text-xs text-[var(--text-muted)]">
                          #{order.id} • {new Date(order.created_at || Date.now()).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    {getStatusBadge(order.status)}
                  </div>

                  {order.notes && (
                    <p className="text-xs text-[var(--text-muted)] bg-[var(--light-bg)] p-3 rounded-xl mb-4 line-clamp-2">
                      {order.notes}
                    </p>
                  )}

                  <div className="grid grid-cols-2 gap-3 text-xs text-[var(--text-muted)] pt-2 border-t border-[var(--border)]">
                    <div className="flex items-center gap-2">
                      <Calendar size={14} className="text-primary" />
                      <span>{firstSlot?.date || (language === 'ar' ? 'موعد مرن' : 'Flexible Date')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock size={14} className="text-primary" />
                      <span>{firstSlot?.start_time ? `${firstSlot.start_time} - ${firstSlot.end_time}` : (language === 'ar' ? 'ساعة واحدة' : '1 Hour')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <DollarSign size={14} className="text-primary" />
                      <span>
                        {order.min_price || order.max_price
                          ? `${order.min_price || 0} - ${order.max_price || 0} ${language === 'ar' ? 'ر.س' : 'SAR'}`
                          : (language === 'ar' ? 'حسب عروض المعلمين' : 'Per offers')}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users size={14} className="text-primary" />
                      <span>
                        {order.type === 'group'
                          ? (language === 'ar' ? 'درس جماعي' : 'Group Lesson')
                          : (language === 'ar' ? 'درس فردي' : 'Single Lesson')}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-[var(--border)]">
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-primary-pale text-primary">
                      {appsCount} {language === 'ar' ? 'عروض مقدمة' : 'Offers'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {isPending && (
                      <button
                        disabled={deletingId === order.id}
                        onClick={(e) => handleDeleteOrder(order.id, e)}
                        className="p-2 rounded-xl text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        title={language === 'ar' ? 'إلغاء الطلب' : 'Cancel Request'}
                      >
                        {deletingId === order.id ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <Trash2 size={16} />
                        )}
                      </button>
                    )}

                    <Button
                      variant="outline"
                      className="text-xs h-9 px-4 rounded-xl font-bold"
                      onClick={() => setSelectedOrderForApps(order)}
                    >
                      {language === 'ar' ? 'استعراض العروض' : 'View Offers'}
                    </Button>
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

