import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../Contexts/LanguageContext';
import { Calendar, Loader2, Filter, X, FileSpreadsheet, FileText, Eye, User, BookOpen, Clock, DollarSign, CheckCircle, AlertTriangle } from 'lucide-react';
import { adminService, AdminBooking } from '../../Services/api';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Pagination } from '../ui/Pagination';

export const BookingsTab: React.FC = () => {
    const { t, language } = useLanguage();
    const [bookings, setBookings] = useState<AdminBooking[]>([]);
    const [loading, setLoading] = useState(true);
    const [exportLoading, setExportLoading] = useState<'xlsx' | 'pdf' | null>(null);

    // Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [filterDate, setFilterDate] = useState('');
    const [filterStatus, setFilterStatus] = useState('');

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 10;

    // Details Modal
    const [selectedBookingId, setSelectedBookingId] = useState<number | null>(null);
    const [bookingDetails, setBookingDetails] = useState<any | null>(null);
    const [loadingDetails, setLoadingDetails] = useState(false);

    useEffect(() => {
        fetchBookings();
    }, []);

    const fetchBookings = async () => {
        setLoading(true);
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

    const handleViewDetails = async (id: number) => {
        setSelectedBookingId(id);
        setLoadingDetails(true);
        setBookingDetails(null);
        try {
            const data = await adminService.getBookingDetails(id);
            setBookingDetails(data?.data ?? data);
        } catch (e) {
            console.error('Failed to load booking details', e);
        } finally {
            setLoadingDetails(false);
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'confirmed':
                return t.confirmed || (language === 'ar' ? 'مؤكدة' : 'Confirmed');
            case 'pending':
            case 'pending_payment':
                return language === 'ar' ? 'قيد الانتظار' : 'Pending';
            case 'in_progress':
                return language === 'ar' ? 'قيد التنفيذ' : 'In Progress';
            case 'completed':
                return t.completed || (language === 'ar' ? 'مكتملة' : 'Completed');
            case 'cancelled':
                return t.cancelled || (language === 'ar' ? 'ملغية' : 'Cancelled');
            case 'refunded':
                return language === 'ar' ? 'مسترجعة' : 'Refunded';
            default:
                return status || t.pending;
        }
    };

    const getStatusBadge = (status: string) => {
        const label = getStatusLabel(status);
        switch (status) {
            case 'confirmed':
                return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800">{label}</span>;
            case 'pending':
            case 'pending_payment':
                return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800">{label}</span>;
            case 'in_progress':
                return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800">{label}</span>;
            case 'completed':
                return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-teal-100 text-teal-800">{label}</span>;
            case 'cancelled':
                return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800">{label}</span>;
            case 'refunded':
                return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-800">{label}</span>;
            default:
                return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-800">{label}</span>;
        }
    };

    const filteredBookings = bookings.filter(booking => {
        // Search query across student name, teacher name, and booking reference
        const query = searchQuery.trim().toLowerCase();
        const matchSearch = !query || (
            (booking.teacher_name && booking.teacher_name.toLowerCase().includes(query)) ||
            (booking.student_name && booking.student_name.toLowerCase().includes(query)) ||
            (booking.reference && booking.reference.toLowerCase().includes(query)) ||
            String(booking.id).includes(query)
        );

        // Date match (supports YYYY-MM-DD comparisons)
        let matchDate = true;
        if (filterDate) {
            if (booking.created_at) {
                const bDate = booking.created_at.substring(0, 10);
                matchDate = bDate === filterDate;
            } else {
                matchDate = false;
            }
        }

        // Status match (normalize pending and pending_payment)
        let matchStatus = true;
        if (filterStatus) {
            if (filterStatus === 'pending' || filterStatus === 'pending_payment') {
                matchStatus = booking.status === 'pending' || booking.status === 'pending_payment';
            } else {
                matchStatus = booking.status === filterStatus;
            }
        }

        return matchSearch && matchDate && matchStatus;
    });

    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, filterDate, filterStatus]);

    const totalPages = Math.max(1, Math.ceil(filteredBookings.length / ITEMS_PER_PAGE));
    const paginatedBookings = filteredBookings.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    const clearFilters = () => {
        setSearchQuery('');
        setFilterDate('');
        setFilterStatus('');
    };

    const exportBookings = async (format: 'xlsx' | 'pdf') => {
        setExportLoading(format);
        try {
            const blob = await adminService.exportBookings(format, filterStatus);
            const url = URL.createObjectURL(blob);
            if (format === 'pdf') {
                window.open(url, '_blank')?.print();
            } else {
                const link = document.createElement('a');
                link.href = url;
                link.download = 'bookings-export.xlsx';
                link.click();
            }
            setTimeout(() => URL.revokeObjectURL(url), 60000);
        } catch (e) {
            console.error(e);
        } finally {
            setExportLoading(null);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center p-12">
                <Loader2 className="animate-spin text-primary" size={32} />
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <h2 className="text-2xl font-bold text-[var(--text-main)]">{t.allBookings}</h2>
                <div className="flex gap-2">
                    <button
                        onClick={() => exportBookings('xlsx')}
                        disabled={!!exportLoading}
                        className="px-3 py-2 border rounded-lg flex items-center gap-2 hover:bg-[var(--light-bg)] transition-colors"
                    >
                        <FileSpreadsheet size={16} /> XLSX
                    </button>
                    <button
                        onClick={() => exportBookings('pdf')}
                        disabled={!!exportLoading}
                        className="px-3 py-2 border rounded-lg flex items-center gap-2 hover:bg-[var(--light-bg)] transition-colors"
                    >
                        <FileText size={16} /> PDF
                    </button>
                </div>
            </div>

            {/* Filters Bar */}
            <div className="bg-white p-4 rounded-[var(--radius-md)] border border-[var(--border)] shadow-[var(--shadow-sm)] flex flex-col md:flex-row gap-4 items-end">
                <div className="w-full md:w-1/3">
                    <label className="text-xs font-bold text-[var(--text-muted)] mb-1 block">
                        {language === 'ar' ? 'البحث عن الطالب، المعلم، أو المرجع' : 'Search Student, Teacher, or Reference'}
                    </label>
                    <input
                        type="text"
                        className="w-full p-2.5 rounded-lg border border-[var(--border)] text-sm focus:outline-none focus:border-primary"
                        placeholder={language === 'ar' ? 'اسم الطالب، المعلم، أو رقم المرجع...' : 'Search by name or reference...'}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="w-full md:w-1/4">
                    <label className="text-xs font-bold text-[var(--text-muted)] mb-1 block">{t.date}</label>
                    <input
                        type="date"
                        className="w-full p-2.5 rounded-lg border border-[var(--border)] text-sm focus:outline-none focus:border-primary"
                        value={filterDate}
                        onChange={(e) => setFilterDate(e.target.value)}
                    />
                </div>
                <div className="w-full md:w-1/4">
                    <label className="text-xs font-bold text-[var(--text-muted)] mb-1 block">{t.status}</label>
                    <select
                        className="w-full p-2.5 rounded-lg border border-[var(--border)] text-sm focus:outline-none focus:border-primary bg-white"
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                    >
                        <option value="">{t.allStatus || (language === 'ar' ? 'كل الحالات' : 'All Statuses')}</option>
                        <option value="pending_payment">{language === 'ar' ? 'قيد الانتظار' : 'Pending'}</option>
                        <option value="confirmed">{t.confirmed || (language === 'ar' ? 'مؤكدة' : 'Confirmed')}</option>
                        <option value="in_progress">{language === 'ar' ? 'قيد التنفيذ' : 'In Progress'}</option>
                        <option value="completed">{t.completed || (language === 'ar' ? 'مكتملة' : 'Completed')}</option>
                        <option value="cancelled">{t.cancelled || (language === 'ar' ? 'ملغية' : 'Cancelled')}</option>
                        <option value="refunded">{language === 'ar' ? 'مسترجعة' : 'Refunded'}</option>
                    </select>
                </div>
                <button
                    onClick={clearFilters}
                    className="p-2.5 text-[var(--text-muted)] hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"
                    title={language === 'ar' ? 'إعادة ضبط الفلاتر' : 'Clear Filters'}
                >
                    <X size={20} />
                </button>
            </div>

            {/* Bookings Table */}
            <div className="bg-white rounded-[var(--radius-md)] border border-[var(--border)] shadow-[var(--shadow-sm)] overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-[var(--light-bg)] border-b border-[var(--border)]">
                        <tr>
                            <th className="px-6 py-4 font-bold text-navy">{t.reference}</th>
                            <th className="px-6 py-4 font-bold text-navy">{t.student}</th>
                            <th className="px-6 py-4 font-bold text-navy">{t.teacher}</th>
                            <th className="px-6 py-4 font-bold text-navy">{t.payoutAmount || (language === 'ar' ? 'المبلغ' : 'Amount')}</th>
                            <th className="px-6 py-4 font-bold text-navy">{t.status}</th>
                            <th className="px-6 py-4 font-bold text-navy">{t.date}</th>
                            <th className="px-6 py-4 font-bold text-navy text-center">{language === 'ar' ? 'التفاصيل' : 'Details'}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border)]">
                        {paginatedBookings.map(booking => (
                            <tr
                                key={booking.id}
                                className="hover:bg-[var(--light-bg)] transition-colors cursor-pointer"
                                onClick={() => handleViewDetails(booking.id)}
                            >
                                <td className="px-6 py-4 font-mono font-medium text-primary">
                                    {booking.reference || `#${booking.id}`}
                                </td>
                                <td className="px-6 py-4 font-medium">{booking.student_name || t.na}</td>
                                <td className="px-6 py-4">{booking.teacher_name || t.na}</td>
                                <td className="px-6 py-4 font-bold text-[var(--text-main)]">
                                    {Number(booking.amount || 0).toFixed(2)} {t.sar || 'ر.س'}
                                </td>
                                <td className="px-6 py-4">
                                    {getStatusBadge(booking.status)}
                                </td>
                                <td className="px-6 py-4 text-[var(--text-muted)]">
                                    {booking.created_at ? new Date(booking.created_at).toLocaleDateString() : t.na}
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleViewDetails(booking.id);
                                        }}
                                        className="p-1.5 text-primary hover:bg-primary/10 rounded-md transition-colors"
                                        title={language === 'ar' ? 'عرض تفاصيل الحجز' : 'View Booking Details'}
                                    >
                                        <Eye size={18} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {paginatedBookings.length === 0 && (
                            <tr>
                                <td colSpan={7} className="p-8 text-center text-[var(--text-muted)]">
                                    {t.noBookingsFound || (language === 'ar' ? 'لا توجد حجوزات مطابقة' : 'No bookings found')}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                />
            </div>

            {/* Booking Details Modal */}
            <Modal
                isOpen={!!selectedBookingId}
                onClose={() => {
                    setSelectedBookingId(null);
                    setBookingDetails(null);
                }}
                title={language === 'ar' ? 'تفاصيل الحجز' : 'Booking Details'}
            >
                {loadingDetails ? (
                    <div className="flex flex-col items-center justify-center p-12 gap-3">
                        <Loader2 className="animate-spin text-primary" size={36} />
                        <span className="text-sm text-[var(--text-muted)]">
                            {language === 'ar' ? 'جاري تحميل تفاصيل الحجز...' : 'Loading booking details...'}
                        </span>
                    </div>
                ) : bookingDetails ? (
                    <div className="space-y-6 max-h-[75vh] overflow-y-auto p-1 text-sm">
                        {/* Header Banner */}
                        <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-[var(--light-bg)] rounded-xl border border-[var(--border)]">
                            <div>
                                <span className="text-xs text-[var(--text-muted)] block">
                                    {language === 'ar' ? 'رقم المرجع' : 'Booking Reference'}
                                </span>
                                <span className="text-lg font-mono font-bold text-navy">
                                    {bookingDetails.booking_reference || bookingDetails.reference || `#${bookingDetails.id}`}
                                </span>
                            </div>
                            <div>
                                {getStatusBadge(bookingDetails.status)}
                            </div>
                        </div>

                        {/* Student & Teacher Info */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Student Box */}
                            <div className="p-4 bg-white rounded-xl border border-[var(--border)] space-y-2">
                                <div className="flex items-center gap-2 text-primary font-bold pb-2 border-b border-[var(--border)]">
                                    <User size={18} />
                                    <span>{language === 'ar' ? 'بيانات الطالب' : 'Student Info'}</span>
                                </div>
                                <div className="text-xs space-y-1">
                                    <p>
                                        <span className="text-[var(--text-muted)]">{language === 'ar' ? 'الاسم:' : 'Name:'} </span>
                                        <span className="font-semibold text-navy">
                                            {bookingDetails.student ? trimName(bookingDetails.student.first_name, bookingDetails.student.last_name) : (bookingDetails.student_name || t.na)}
                                        </span>
                                    </p>
                                    {bookingDetails.student?.email && (
                                        <p>
                                            <span className="text-[var(--text-muted)]">{language === 'ar' ? 'البريد:' : 'Email:'} </span>
                                            <span className="font-mono text-navy">{bookingDetails.student.email}</span>
                                        </p>
                                    )}
                                    {bookingDetails.student?.phone_number && (
                                        <p>
                                            <span className="text-[var(--text-muted)]">{language === 'ar' ? 'الهاتف:' : 'Phone:'} </span>
                                            <span className="font-mono text-navy" dir="ltr">{bookingDetails.student.phone_number}</span>
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Teacher Box */}
                            <div className="p-4 bg-white rounded-xl border border-[var(--border)] space-y-2">
                                <div className="flex items-center gap-2 text-secondary font-bold pb-2 border-b border-[var(--border)]">
                                    <User size={18} />
                                    <span>{language === 'ar' ? 'بيانات المعلم' : 'Teacher Info'}</span>
                                </div>
                                <div className="text-xs space-y-1">
                                    <p>
                                        <span className="text-[var(--text-muted)]">{language === 'ar' ? 'الاسم:' : 'Name:'} </span>
                                        <span className="font-semibold text-navy">
                                            {bookingDetails.teacher ? trimName(bookingDetails.teacher.first_name, bookingDetails.teacher.last_name) : (bookingDetails.teacher_name || t.na)}
                                        </span>
                                    </p>
                                    {bookingDetails.teacher?.email && (
                                        <p>
                                            <span className="text-[var(--text-muted)]">{language === 'ar' ? 'البريد:' : 'Email:'} </span>
                                            <span className="font-mono text-navy">{bookingDetails.teacher.email}</span>
                                        </p>
                                    )}
                                    {bookingDetails.teacher?.phone_number && (
                                        <p>
                                            <span className="text-[var(--text-muted)]">{language === 'ar' ? 'الهاتف:' : 'Phone:'} </span>
                                            <span className="font-mono text-navy" dir="ltr">{bookingDetails.teacher.phone_number}</span>
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Financial and Booking Specs */}
                        <div className="p-4 bg-white rounded-xl border border-[var(--border)] space-y-3">
                            <div className="flex items-center gap-2 text-navy font-bold pb-2 border-b border-[var(--border)]">
                                <DollarSign size={18} />
                                <span>{language === 'ar' ? 'التفاصيل المالية والتعليمية' : 'Payment & Education Details'}</span>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                                <div className="p-2.5 bg-[var(--light-bg)] rounded-lg">
                                    <span className="text-[var(--text-muted)] block mb-1">
                                        {language === 'ar' ? 'المبلغ الإجمالي' : 'Total Amount'}
                                    </span>
                                    <span className="text-base font-bold text-primary">
                                        {Number(bookingDetails.total_amount || bookingDetails.amount || 0).toFixed(2)} {bookingDetails.currency || 'SAR'}
                                    </span>
                                </div>
                                <div className="p-2.5 bg-[var(--light-bg)] rounded-lg">
                                    <span className="text-[var(--text-muted)] block mb-1">
                                        {language === 'ar' ? 'عدد الجلسات' : 'Sessions Count'}
                                    </span>
                                    <span className="text-base font-bold text-navy">
                                        {bookingDetails.sessions_count || 1}
                                    </span>
                                </div>
                                <div className="p-2.5 bg-[var(--light-bg)] rounded-lg">
                                    <span className="text-[var(--text-muted)] block mb-1">
                                        {language === 'ar' ? 'الجلسات المكتملة' : 'Completed Sessions'}
                                    </span>
                                    <span className="text-base font-bold text-navy">
                                        {bookingDetails.sessions_completed || 0}
                                    </span>
                                </div>
                                <div className="p-2.5 bg-[var(--light-bg)] rounded-lg">
                                    <span className="text-[var(--text-muted)] block mb-1">
                                        {language === 'ar' ? 'نوع الجلسة' : 'Session Type'}
                                    </span>
                                    <span className="text-base font-bold text-navy capitalize">
                                        {bookingDetails.session_type || 'Individual'}
                                    </span>
                                </div>
                            </div>

                            {/* Subject / Course Info */}
                            {(bookingDetails.subject || bookingDetails.course) && (
                                <div className="p-3 bg-[var(--light-bg)] rounded-lg flex items-center gap-2 text-xs">
                                    <BookOpen size={16} className="text-primary" />
                                    <span className="text-[var(--text-muted)]">
                                        {bookingDetails.subject ? (language === 'ar' ? 'المادة:' : 'Subject:') : (language === 'ar' ? 'الدورة:' : 'Course:')}
                                    </span>
                                    <span className="font-semibold text-navy">
                                        {bookingDetails.subject
                                            ? (language === 'ar' ? bookingDetails.subject.name_ar : bookingDetails.subject.name_en)
                                            : (bookingDetails.course ? (language === 'ar' ? bookingDetails.course.title_ar : bookingDetails.course.title_en) : '')}
                                    </span>
                                </div>
                            )}

                            {/* Booking Date */}
                            <div className="flex justify-between items-center text-xs text-[var(--text-muted)] pt-1">
                                <span>{language === 'ar' ? 'تاريخ الإنشاء:' : 'Created At:'}</span>
                                <span>{bookingDetails.created_at ? new Date(bookingDetails.created_at).toLocaleString() : t.na}</span>
                            </div>
                        </div>

                        {/* Sessions List */}
                        {Array.isArray(bookingDetails.sessions) && bookingDetails.sessions.length > 0 && (
                            <div className="space-y-2">
                                <h4 className="font-bold text-navy text-xs flex items-center gap-1.5">
                                    <Clock size={16} />
                                    <span>{language === 'ar' ? 'الجلسات المرتبطة بهذا الحجز' : 'Associated Sessions'}</span>
                                </h4>
                                <div className="space-y-2 max-h-48 overflow-y-auto">
                                    {bookingDetails.sessions.map((sess: any) => (
                                        <div key={sess.id} className="p-3 bg-[var(--light-bg)] rounded-lg flex justify-between items-center text-xs border border-[var(--border)]">
                                            <div className="flex items-center gap-2">
                                                <span className="font-mono font-bold text-primary">#{sess.session_number || sess.id}</span>
                                                <span>{sess.session_date}</span>
                                                <span className="text-[var(--text-muted)]">({sess.start_time?.substring(0, 5)} - {sess.end_time?.substring(0, 5)})</span>
                                            </div>
                                            <div>
                                                {getStatusBadge(sess.status)}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="pt-2 flex justify-end">
                            <Button variant="outline" onClick={() => setSelectedBookingId(null)}>
                                {t.close || (language === 'ar' ? 'إغلاق' : 'Close')}
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="p-8 text-center text-[var(--text-muted)]">
                        {language === 'ar' ? 'تعذر تحميل التفاصيل' : 'Could not load details'}
                    </div>
                )}
            </Modal>
        </div>
    );
};

function trimName(first?: string, last?: string) {
    return [first, last].filter(Boolean).join(' ') || 'N/A';
}
