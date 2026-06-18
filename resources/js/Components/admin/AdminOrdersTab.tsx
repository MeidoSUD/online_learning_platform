import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../Contexts/LanguageContext';
import { Search, Filter, Loader2, ShoppingBag, User, Calendar, MessageSquare, ChevronRight, CheckCircle, XCircle, Star, Briefcase, ExternalLink } from 'lucide-react';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { adminService, getStorageUrl } from '../../Services/api';
import { AdminOrder, TeacherApplication } from '../../Utils/types';
import { useToast } from '../../Contexts/ToastContext';

export const AdminOrdersTab: React.FC = () => {
    const { t, direction, language } = useLanguage();
    const { showToast } = useToast();
    const [orders, setOrders] = useState<AdminOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<string>('all');

    const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null);
    const [applications, setApplications] = useState<TeacherApplication[]>([]);
    const [appsLoading, setAppsLoading] = useState(false);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const data = await adminService.getOrders();
            setOrders(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const fetchApplications = async (orderId: number) => {
        setAppsLoading(true);
        try {
            const response = await adminService.getOrderApplications(orderId);
            setApplications(response.applications || []);
        } catch (e) {
            console.error(e);
            showToast(t.error, 'error');
        } finally {
            setAppsLoading(false);
        }
    };

    const handleViewDetails = (order: AdminOrder) => {
        setSelectedOrder(order);
        setIsDetailsModalOpen(true);
        fetchApplications(order.id);
    };

    const handleAssignTeacher = async (teacherId: number) => {
        if (!selectedOrder) return;
        setActionLoading(true);
        try {
            await adminService.assignTeacher(selectedOrder.id, { 
                teacher_id: teacherId,
                reason: "Assigned by Admin" 
            });
            showToast(t.success, 'success');
            setIsAssignModalOpen(false);
            setIsDetailsModalOpen(false);
            fetchOrders();
        } catch (e: any) {
            showToast(e.message || t.error, 'error');
        } finally {
            setActionLoading(false);
        }
    };

    const handleUpdateStatus = async (status: string) => {
        if (!selectedOrder) return;
        setActionLoading(true);
        try {
            await adminService.updateOrderStatus(selectedOrder.id, { status });
            showToast(t.success, 'success');
            setIsDetailsModalOpen(false);
            fetchOrders();
        } catch (e: any) {
            showToast(e.message || t.error, 'error');
        } finally {
            setActionLoading(false);
        }
    };

    const filteredOrders = orders.filter(order => {
        const studentName = `${order.student.first_name} ${order.student.last_name}`.toLowerCase();
        const term = searchTerm.toLowerCase();
        const matchesSearch = studentName.includes(term) || String(order.id).includes(term);
        const matchesStatus = filterStatus === 'all' || order.status === filterStatus;
        return matchesSearch && matchesStatus;
    });

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'pending': return 'bg-amber-100 text-amber-700';
            case 'confirmed': return 'bg-blue-100 text-blue-700';
            case 'in_progress': return 'bg-indigo-100 text-indigo-700';
            case 'completed': return 'bg-green-100 text-green-700';
            case 'cancelled': return 'bg-red-100 text-red-700';
            default: return 'bg-slate-100 text-slate-700';
        }
    };

    if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-primary" /></div>;

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-slate-900">{t.ordersManagement}</h2>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex flex-col md:flex-row gap-4 mb-6">
                    <div className="relative flex-1">
                        <Search className={`absolute top-1/2 -translate-y-1/2 text-slate-400 ${direction === 'rtl' ? 'right-3' : 'left-3'}`} size={20} />
                        <input
                            type="text"
                            placeholder={t.searchPlaceholder}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className={`w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:border-primary ${direction === 'rtl' ? 'pr-10 pl-4' : ''}`}
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <Filter size={20} className="text-slate-400" />
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
                        >
                            <option value="all">{t.allStatus}</option>
                            <option value="pending">{t.pending}</option>
                            <option value="confirmed">{t.confirmed}</option>
                            <option value="in_progress">In Progress</option>
                            <option value="completed">{t.completed}</option>
                            <option value="cancelled">{t.cancelled}</option>
                        </select>
                    </div>
                </div>

                <div className="overflow-x-auto min-h-[400px]">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-3 font-semibold text-slate-700">Order ID</th>
                                <th className="px-6 py-3 font-semibold text-slate-700">{t.student}</th>
                                <th className="px-6 py-3 font-semibold text-slate-700">{t.subject}</th>
                                <th className="px-6 py-3 font-semibold text-slate-700">Apps</th>
                                <th className="px-6 py-3 font-semibold text-slate-700">{t.status}</th>
                                <th className="px-6 py-3 font-semibold text-slate-700 text-right">{t.actions}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredOrders.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                                        No orders found
                                    </td>
                                </tr>
                            ) : (
                                filteredOrders.map(order => (
                                    <tr key={order.id} className="hover:bg-slate-50">
                                        <td className="px-6 py-4 font-mono font-bold text-primary">
                                            #{order.id}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-slate-900">{order.student.first_name} {order.student.last_name}</div>
                                            <div className="text-xs text-slate-500">{order.student.phone_number}</div>
                                        </td>
                                        <td className="px-6 py-4 text-slate-600">
                                            {language === 'ar' ? order.subject.name_ar : order.subject.name_en}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-1.5">
                                                <span className="h-2 w-2 rounded-full bg-primary"></span>
                                                <span className="font-medium">{order.application_count}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${getStatusStyle(order.status)}`}>
                                                {order.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <Button variant="outline" size="sm" onClick={() => handleViewDetails(order)} className="text-xs py-1 h-8">
                                                {t.details} <ChevronRight size={14} className={direction === 'rtl' ? 'rotate-180' : ''} />
                                            </Button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Details Modal */}
            <Modal isOpen={isDetailsModalOpen} onClose={() => setIsDetailsModalOpen(false)} title={`Order Details #${selectedOrder?.id}`}>
                {selectedOrder && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 bg-slate-50 rounded-xl space-y-2">
                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t.student} Info</h4>
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                        <User size={20} />
                                    </div>
                                    <div>
                                        <p className="font-bold text-slate-900">{selectedOrder.student.first_name} {selectedOrder.student.last_name}</p>
                                        <p className="text-xs text-slate-500">{selectedOrder.student.email}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="p-4 bg-slate-50 rounded-xl space-y-2">
                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Service Request</h4>
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-600">
                                        <Briefcase size={20} />
                                    </div>
                                    <div>
                                        <p className="font-bold text-slate-900">{language === 'ar' ? selectedOrder.subject.name_ar : selectedOrder.subject.name_en}</p>
                                        <p className="text-xs text-slate-500">{selectedOrder.min_price} - {selectedOrder.max_price} SAR</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {selectedOrder.notes && (
                            <div className="p-4 border border-slate-100 rounded-xl">
                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Student Notes</h4>
                                <p className="text-sm text-slate-600 italic">"{selectedOrder.notes}"</p>
                            </div>
                        )}

                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <h4 className="font-bold text-slate-900">Teacher Applications ({applications.length})</h4>
                                {appsLoading && <Loader2 className="animate-spin text-primary" size={16} />}
                            </div>

                            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                {applications.length === 0 ? (
                                    <div className="p-8 text-center bg-slate-50 rounded-xl text-slate-400 text-sm">
                                        No applications yet.
                                    </div>
                                ) : (
                                    applications.map(app => (
                                        <div key={app.id} className="p-4 border border-slate-100 rounded-xl hover:bg-slate-50 transition-colors">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-12 w-12 rounded-full bg-slate-200 overflow-hidden border border-slate-100">
                                                        <img src={getStorageUrl(app.teacher.profile_photo)} alt="" className="h-full w-full object-cover" />
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-bold text-slate-900">{app.teacher.first_name} {app.teacher.last_name}</span>
                                                            <div className="flex items-center text-amber-500 text-[10px] font-bold bg-amber-50 px-1.5 py-0.5 rounded">
                                                                <Star size={10} className="fill-amber-500 mr-1" /> {app.teacher.rating}
                                                            </div>
                                                        </div>
                                                        <p className="text-[10px] text-slate-400">{app.teacher.experience_years} years experience</p>
                                                    </div>
                                                </div>
                                                {selectedOrder.status === 'pending' && (
                                                    <Button size="sm" onClick={() => handleAssignTeacher(app.teacher.id)} disabled={actionLoading}>
                                                        Assign
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        <div className="flex gap-2 pt-4 border-t border-slate-100">
                            {selectedOrder.status === 'pending' && (
                                <button
                                    onClick={() => handleUpdateStatus('cancelled')}
                                    className="flex-1 py-2.5 px-4 bg-red-50 text-red-600 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-red-100 transition-all text-sm"
                                >
                                    <XCircle size={18} /> Cancel Order
                                </button>
                            )}
                            {selectedOrder.status === 'confirmed' && (
                                <button
                                    onClick={() => handleUpdateStatus('in_progress')}
                                    className="flex-1 py-2.5 px-4 bg-indigo-50 text-indigo-600 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-indigo-100 transition-all text-sm"
                                >
                                    <CheckCircle size={18} /> Mark In-Progress
                                </button>
                            )}
                            {selectedOrder.status === 'in_progress' && (
                                <button
                                    onClick={() => handleUpdateStatus('completed')}
                                    className="flex-1 py-2.5 px-4 bg-green-50 text-green-600 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-green-100 transition-all text-sm"
                                >
                                    <CheckCircle size={18} /> Mark Completed
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default AdminOrdersTab;
