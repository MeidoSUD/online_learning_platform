
import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../Contexts/LanguageContext';
import { Calendar, Loader2, Filter, X, FileSpreadsheet, FileText } from 'lucide-react';
import { adminService, AdminBooking } from '../../Services/api';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { Pagination } from '../ui/Pagination';

export const BookingsTab: React.FC = () => {
    const { t } = useLanguage();
    const [bookings, setBookings] = useState<AdminBooking[]>([]);
    const [loading, setLoading] = useState(true);
    const [exportLoading, setExportLoading] = useState<'xlsx' | 'pdf' | null>(null);

    // Filters
    const [filterTeacher, setFilterTeacher] = useState('');
    const [filterDate, setFilterDate] = useState('');
    const [filterStatus, setFilterStatus] = useState('');

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 10;

    useEffect(() => {
        const fetch = async () => {
            try {
                const response = await adminService.getBookings(1, 1000);
                const data = response?.data?.data ?? response?.data ?? response;
                setBookings(Array.isArray(data) ? data : []);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        fetch();
    }, []);

    const filteredBookings = bookings.filter(booking => {
        const matchTeacher = !filterTeacher || (booking.teacher_name && booking.teacher_name.toLowerCase().includes(filterTeacher.toLowerCase()));
        const matchDate = !filterDate || (booking.created_at && booking.created_at.startsWith(filterDate));
        const matchStatus = !filterStatus || booking.status === filterStatus;
        return matchTeacher && matchDate && matchStatus;
    });

    useEffect(() => {
        setCurrentPage(1);
    }, [filterTeacher, filterDate, filterStatus]);

    const totalPages = Math.ceil(filteredBookings.length / ITEMS_PER_PAGE);
    const paginatedBookings = filteredBookings.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    const clearFilters = () => {
        setFilterTeacher('');
        setFilterDate('');
        setFilterStatus('');
    };

    const exportBookings = async (format: 'xlsx' | 'pdf') => {
        setExportLoading(format);
        try { const blob = await adminService.exportBookings(format, filterStatus); const url = URL.createObjectURL(blob); if (format === 'pdf') window.open(url, '_blank')?.print(); else { const link = document.createElement('a'); link.href = url; link.download = 'bookings-export.xlsx'; link.click(); } setTimeout(() => URL.revokeObjectURL(url), 60000); }
        catch (e) { console.error(e); } finally { setExportLoading(null); }
    };

    if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-primary" /></div>;

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <h2 className="text-2xl font-bold text-[var(--text-main)]">{t.allBookings}</h2>
                <div className="flex gap-2"><button onClick={() => exportBookings('xlsx')} disabled={!!exportLoading} className="px-3 py-2 border rounded-lg flex items-center gap-2"><FileSpreadsheet size={16} /> XLSX</button><button onClick={() => exportBookings('pdf')} disabled={!!exportLoading} className="px-3 py-2 border rounded-lg flex items-center gap-2"><FileText size={16} /> PDF</button></div>
            </div>

            {/* Filters Bar */}
            <div className="bg-white p-4 rounded-[var(--radius-md)] border border-[var(--border)] shadow-[var(--shadow-sm)] flex flex-col md:flex-row gap-4 items-end">
                <div className="w-full md:w-1/3">
                    <label className="text-xs font-bold text-[var(--text-muted)] mb-1 block">{t.teacherName}</label>
                    <input
                        type="text"
                        className="w-full p-2 rounded-lg border border-[var(--border)] text-sm focus:outline-none focus:border-primary"
                        placeholder={t.phSearchCourses}
                        value={filterTeacher}
                        onChange={(e) => setFilterTeacher(e.target.value)}
                    />
                </div>
                <div className="w-full md:w-1/4">
                    <label className="text-xs font-bold text-[var(--text-muted)] mb-1 block">{t.date}</label>
                    <input
                        type="date"
                        className="w-full p-2 rounded-lg border border-[var(--border)] text-sm focus:outline-none focus:border-primary"
                        value={filterDate}
                        onChange={(e) => setFilterDate(e.target.value)}
                    />
                </div>
                <div className="w-full md:w-1/4">
                    <label className="text-xs font-bold text-[var(--text-muted)] mb-1 block">{t.status}</label>
                    <select
                        className="w-full p-2 rounded-lg border border-[var(--border)] text-sm focus:outline-none focus:border-primary bg-white"
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                    >
                        <option value="">{t.allStatus}</option>
                        <option value="confirmed">{t.confirmed}</option>
                        <option value="pending">{t.pending}</option>
                        <option value="completed">{t.completed}</option>
                        <option value="cancelled">{t.cancelled}</option>
                    </select>
                </div>
                <button
                    onClick={clearFilters}
                    className="p-2 text-[var(--text-muted)] hover:text-red-500 transition-colors"
                    title="Clear Filters"
                >
                    <X size={20} />
                </button>
            </div>

            <div className="bg-white rounded-[var(--radius-md)] border border-[var(--border)] shadow-[var(--shadow-sm)] overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-[var(--light-bg)] border-b border-[var(--border)]">
                        <tr>
                            <th className="px-6 py-4 font-bold text-navy">{t.reference}</th>
                            <th className="px-6 py-4 font-bold text-navy">{t.student}</th>
                            <th className="px-6 py-4 font-bold text-navy">{t.teacher}</th>
                            <th className="px-6 py-4 font-bold text-navy">{t.payoutAmount}</th>
                            <th className="px-6 py-4 font-bold text-navy">{t.status}</th>
                            <th className="px-6 py-4 font-bold text-navy">{t.date}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border)]">
                        {paginatedBookings.map(booking => (
                            <tr key={booking.id} className="hover:bg-[var(--light-bg)]">
                                <td className="px-6 py-4 font-mono text-[var(--text-muted)]">{booking.reference || `#${booking.id}`}</td>
                                <td className="px-6 py-4">{booking.student_name || t.na}</td>
                                <td className="px-6 py-4">{booking.teacher_name || t.na}</td>
                                <td className="px-6 py-4 font-bold text-[var(--text-main)]">{booking.amount} {t.sar}</td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${booking.status === 'confirmed' ? 'bg-primary-pale text-primary' :
                                            booking.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                                                'bg-[var(--light-bg)] text-[var(--text-muted)]'
                                        }`}>
                                        {booking.status === 'confirmed' ? t.confirmed : booking.status === 'cancelled' ? t.cancelled : booking.status === 'completed' ? t.completed : t.pending}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-[var(--text-muted)]">{new Date(booking.created_at).toLocaleDateString()}</td>
                            </tr>
                        ))}
                        {paginatedBookings.length === 0 && (
                            <tr><td colSpan={6} className="p-8 text-center text-[var(--text-muted)]">{t.noBookingsFound}</td></tr>
                        )}
                    </tbody>
                </table>
                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                />
            </div>
        </div>
    );
};
