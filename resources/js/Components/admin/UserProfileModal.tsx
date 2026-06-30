import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../Contexts/LanguageContext';
import {
    Loader2, X, Calendar, Video, CreditCard, Package, ShoppingBag,
    BookOpen, Wallet as WalletIcon, Star, HelpCircle, AlertCircle,
    User, Mail, Phone, Shield, GraduationCap, Globe, ChevronDown,
    CheckCircle, XCircle, Clock, DollarSign, ArrowUpRight, ArrowDownLeft
} from 'lucide-react';
import { adminService, UserFullProfile, AdminUser } from '../../Services/api';
import { getStorageUrl } from '../../Services/api';

interface UserProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    userId: number;
}

type ProfileTab = 'bookings' | 'sessions' | 'payments' | 'subscriptions' | 'orders' | 'courses' | 'wallet' | 'reviews' | 'tickets' | 'disputes';

export const UserProfileModal: React.FC<UserProfileModalProps> = ({ isOpen, onClose, userId }) => {
    const { t, direction, language } = useLanguage();
    const [profile, setProfile] = useState<UserFullProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<ProfileTab>('bookings');
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen && userId) {
            loadProfileData();
        }
    }, [isOpen, userId]);

    const loadProfileData = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await adminService.getUserFullProfile(userId);
            setProfile(data);
        } catch (e: any) {
            setError(e.message || 'Failed to load profile');
        } finally {
            setLoading(false);
        }
    };

    const user = profile?.user;

    const tabs: { id: ProfileTab; label: string; icon: React.ElementType; badge?: number }[] = [
        { id: 'bookings', label: t.bookings || 'Bookings', icon: Calendar, badge: (profile?.bookings_as_student?.length || 0) + (profile?.bookings_as_teacher?.length || 0) },
        { id: 'sessions', label: t.sessions || 'Sessions', icon: Video, badge: (profile?.sessions_as_student?.length || 0) + (profile?.sessions_as_teacher?.length || 0) },
        { id: 'payments', label: language === 'ar' ? 'المدفوعات' : 'Payments', icon: CreditCard, badge: profile?.payments?.length },
        { id: 'subscriptions', label: language === 'ar' ? 'الاشتراكات' : 'Subscriptions', icon: Package, badge: profile?.subscriptions?.length },
        { id: 'orders', label: language === 'ar' ? 'الطلبات' : 'Orders', icon: ShoppingBag, badge: profile?.orders?.length },
        { id: 'courses', label: t.courses || 'Courses', icon: BookOpen, badge: profile?.courses?.length },
        { id: 'wallet', label: t.wallet || 'Wallet', icon: WalletIcon },
        { id: 'reviews', label: language === 'ar' ? 'التقييمات' : 'Reviews', icon: Star, badge: (profile?.reviews_given?.length || 0) + (profile?.reviews_received?.length || 0) },
        { id: 'tickets', label: language === 'ar' ? 'الدعم' : 'Support', icon: HelpCircle, badge: profile?.support_tickets?.length },
        { id: 'disputes', label: t.disputes || 'Disputes', icon: AlertCircle, badge: profile?.disputes?.length },
    ];

    const getStatusBadge = (status: string) => {
        const colorMap: Record<string, string> = {
            active: 'bg-green-100 text-green-700',
            confirmed: 'bg-blue-100 text-blue-700',
            completed: 'bg-green-100 text-green-700',
            pending: 'bg-amber-100 text-amber-700',
            pending_payment: 'bg-amber-100 text-amber-700',
            cancelled: 'bg-red-100 text-red-700',
            failed: 'bg-red-100 text-red-700',
            refunded: 'bg-purple-100 text-purple-700',
            processing: 'bg-blue-100 text-blue-700',
            initiated: 'bg-blue-100 text-blue-700',
            scheduled: 'bg-blue-100 text-blue-700',
            live: 'bg-green-100 text-green-700',
            ended: 'bg-slate-100 text-slate-700',
        };
        return (
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${colorMap[status] || 'bg-slate-100 text-slate-600'}`}>
                {status}
            </span>
        );
    };

    const formatDate = (date: string) => {
        if (!date) return '-';
        return new Date(date).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US', {
            day: 'numeric', month: 'short', year: 'numeric'
        });
    };

    const formatDateTime = (date: string) => {
        if (!date) return '-';
        return new Date(date).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US', {
            day: 'numeric', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    };

    const getRoleBadge = (roleId: number) => {
        if (roleId === 1) return { label: t.admin || 'Admin', icon: Shield, color: 'text-purple-600 bg-purple-50' };
        if (roleId === 3) return { label: t.teacher || 'Teacher', icon: GraduationCap, color: 'text-blue-600 bg-blue-50' };
        return { label: t.student || 'Student', icon: User, color: 'text-green-600 bg-green-50' };
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-8 pb-8" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white rounded-2xl shadow-2xl w-[95%] max-w-6xl max-h-[90vh] flex flex-col overflow-hidden animate-scale-in">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-200 flex-shrink-0">
                    <h2 className="text-xl font-bold text-slate-900">
                        {language === 'ar' ? 'الملف الشخصي للمستخدم' : 'User Profile'}
                    </h2>
                    <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600">
                        <X size={20} />
                    </button>
                </div>

                {loading ? (
                    <div className="flex-1 flex items-center justify-center py-20">
                        <Loader2 className="animate-spin text-primary" size={36} />
                    </div>
                ) : error ? (
                    <div className="flex-1 flex items-center justify-center py-20">
                        <div className="text-center">
                            <XCircle size={48} className="mx-auto text-red-400 mb-3" />
                            <p className="text-red-600 font-medium">{error}</p>
                            <button onClick={loadProfileData} className="mt-3 text-sm text-primary hover:underline">
                                {language === 'ar' ? 'إعادة المحاولة' : 'Retry'}
                            </button>
                        </div>
                    </div>
                ) : !user ? (
                    <div className="flex-1 flex items-center justify-center py-20">
                        <p className="text-slate-400">{language === 'ar' ? 'لا توجد بيانات' : 'No data found'}</p>
                    </div>
                ) : (
                    <>
                        {/* User Info Bar */}
                        <div className="px-6 py-4 bg-gradient-to-r from-primary/5 to-transparent border-b border-slate-100 flex-shrink-0">
                            <div className="flex items-center gap-4">
                                <div className="h-14 w-14 rounded-full bg-slate-100 flex items-center justify-center text-2xl font-bold text-slate-400 flex-shrink-0">
                                    {user.first_name?.charAt(0)}{user.last_name?.charAt(0)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <h3 className="text-lg font-bold text-slate-900">{user.first_name} {user.last_name}</h3>
                                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${getRoleBadge(user.role_id).color}`}>
                                            {React.createElement(getRoleBadge(user.role_id).icon, { size: 12 })}
                                            {getRoleBadge(user.role_id).label}
                                        </span>
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${user.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                            {user.is_active ? t.activeStatus : t.inactiveStatus}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-4 mt-1 text-xs text-slate-500 flex-wrap">
                                        <span className="flex items-center gap-1"><Mail size={12} />{user.email}</span>
                                        <span className="flex items-center gap-1" dir="ltr"><Phone size={12} />{user.phone_number}</span>
                                        {user.gender && <span className="capitalize">{user.gender === 'male' ? t.genderMale : t.genderFemale}</span>}
                                        {user.nationality && <span className="flex items-center gap-1"><Globe size={12} />{user.nationality}</span>}
                                    </div>
                                </div>
                                <div className="text-xs text-slate-400 text-right flex-shrink-0 hidden sm:block">
                                    <div>{language === 'ar' ? 'تاريخ التسجيل' : 'Joined'}: {formatDate(user.created_at)}</div>
                                    <div>{t.id || 'ID'}: #{user.id}</div>
                                </div>
                            </div>
                        </div>

                        {/* Tab Navigation */}
                        <div className="flex-shrink-0 overflow-x-auto border-b border-slate-200 bg-slate-50/50">
                            <div className="flex gap-0 px-4 min-w-max">
                                {tabs.map(tab => {
                                    const Icon = tab.icon;
                                    const isActive = activeTab === tab.id;
                                    return (
                                        <button
                                            key={tab.id}
                                            onClick={() => setActiveTab(tab.id)}
                                            className={`flex items-center gap-1.5 px-3.5 py-3 text-xs font-medium border-b-2 transition-all whitespace-nowrap ${isActive
                                                ? 'border-primary text-primary bg-white'
                                                : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-white/50'
                                                }`}
                                        >
                                            <Icon size={15} />
                                            {tab.label}
                                            {tab.badge !== undefined && tab.badge > 0 && (
                                                <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold ${isActive ? 'bg-primary/10 text-primary' : 'bg-slate-200 text-slate-600'}`}>
                                                    {tab.badge}
                                                </span>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Tab Content */}
                        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
                            {activeTab === 'bookings' && (
                                <div className="space-y-4">
                                    {profile?.bookings_as_student?.length > 0 && (
                                        <div>
                                            <h4 className="text-sm font-bold text-slate-500 mb-2">{language === 'ar' ? 'حجوزات كطالب' : 'Bookings as Student'}</h4>
                                            <div className="overflow-x-auto rounded-xl border border-slate-200">
                                                <table className="w-full text-sm">
                                                    <thead className="bg-slate-50 text-xs text-slate-500 uppercase">
                                                        <tr>
                                                            <th className="px-4 py-2 text-left">{t.reference || 'Reference'}</th>
                                                            <th className="px-4 py-2 text-left">{t.teacher || 'Teacher'}</th>
                                                            <th className="px-4 py-2 text-left">{t.subject || 'Subject'}</th>
                                                            <th className="px-4 py-2 text-left">{language === 'ar' ? 'النوع' : 'Type'}</th>
                                                            <th className="px-4 py-2 text-left">{language === 'ar' ? 'المبلغ' : 'Amount'}</th>
                                                            <th className="px-4 py-2 text-left">{t.status || 'Status'}</th>
                                                            <th className="px-4 py-2 text-left">{t.date || 'Date'}</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-slate-100">
                                                        {(profile?.bookings_as_student || []).map((b: any) => (
                                                            <tr key={b.id} className="hover:bg-slate-50">
                                                                <td className="px-4 py-2.5 font-medium text-slate-700">{b.reference || `#${b.id}`}</td>
                                                                <td className="px-4 py-2.5">{b.teacher ? `${b.teacher.first_name} ${b.teacher.last_name}` : '-'}</td>
                                                                <td className="px-4 py-2.5">{b.subject?.name_en || b.subject?.name_ar || '-'}</td>
                                                                <td className="px-4 py-2.5 capitalize">{b.type || '-'}</td>
                                                                <td className="px-4 py-2.5">{b.amount || b.total_price || '-'}</td>
                                                                <td className="px-4 py-2.5">{getStatusBadge(b.status)}</td>
                                                                <td className="px-4 py-2.5 text-slate-500 text-xs">{formatDate(b.created_at)}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    )}
                                    {profile?.bookings_as_teacher?.length > 0 && (
                                        <div>
                                            <h4 className="text-sm font-bold text-slate-500 mb-2 mt-4">{language === 'ar' ? 'حجوزات كمعلم' : 'Bookings as Teacher'}</h4>
                                            <div className="overflow-x-auto rounded-xl border border-slate-200">
                                                <table className="w-full text-sm">
                                                    <thead className="bg-slate-50 text-xs text-slate-500 uppercase">
                                                        <tr>
                                                            <th className="px-4 py-2 text-left">{t.reference || 'Reference'}</th>
                                                            <th className="px-4 py-2 text-left">{t.student || 'Student'}</th>
                                                            <th className="px-4 py-2 text-left">{t.subject || 'Subject'}</th>
                                                            <th className="px-4 py-2 text-left">{language === 'ar' ? 'النوع' : 'Type'}</th>
                                                            <th className="px-4 py-2 text-left">{language === 'ar' ? 'المبلغ' : 'Amount'}</th>
                                                            <th className="px-4 py-2 text-left">{t.status || 'Status'}</th>
                                                            <th className="px-4 py-2 text-left">{t.date || 'Date'}</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-slate-100">
                                                        {(profile?.bookings_as_teacher || []).map((b: any) => (
                                                            <tr key={b.id} className="hover:bg-slate-50">
                                                                <td className="px-4 py-2.5 font-medium text-slate-700">{b.reference || `#${b.id}`}</td>
                                                                <td className="px-4 py-2.5">{b.student ? `${b.student.first_name} ${b.student.last_name}` : '-'}</td>
                                                                <td className="px-4 py-2.5">{b.subject?.name_en || b.subject?.name_ar || '-'}</td>
                                                                <td className="px-4 py-2.5 capitalize">{b.type || '-'}</td>
                                                                <td className="px-4 py-2.5">{b.amount || b.total_price || '-'}</td>
                                                                <td className="px-4 py-2.5">{getStatusBadge(b.status)}</td>
                                                                <td className="px-4 py-2.5 text-slate-500 text-xs">{formatDate(b.created_at)}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    )}
                                    {(!profile?.bookings_as_student?.length && !profile?.bookings_as_teacher?.length) && (
                                        <p className="text-center text-slate-400 py-8">{language === 'ar' ? 'لا توجد حجوزات' : 'No bookings found'}</p>
                                    )}
                                </div>
                            )}

                            {activeTab === 'sessions' && (
                                <div className="space-y-4">
                                    {profile?.sessions_as_student?.length > 0 && (
                                        <div>
                                            <h4 className="text-sm font-bold text-slate-500 mb-2">{language === 'ar' ? 'جلسات كطالب' : 'Sessions as Student'}</h4>
                                            <div className="overflow-x-auto rounded-xl border border-slate-200">
                                                <table className="w-full text-sm">
                                                    <thead className="bg-slate-50 text-xs text-slate-500 uppercase">
                                                        <tr>
                                                            <th className="px-4 py-2 text-left">#</th>
                                                            <th className="px-4 py-2 text-left">{t.teacher || 'Teacher'}</th>
                                                            <th className="px-4 py-2 text-left">{t.subject || 'Subject'}</th>
                                                            <th className="px-4 py-2 text-left">{t.date || 'Date'}</th>
                                                            <th className="px-4 py-2 text-left">{t.status || 'Status'}</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-slate-100">
                                                        {(profile?.sessions_as_student || []).map((s: any) => (
                                                            <tr key={s.id} className="hover:bg-slate-50">
                                                                <td className="px-4 py-2.5 font-medium text-slate-700">#{s.id}</td>
                                                                <td className="px-4 py-2.5">{s.teacher?.name || `${s.teacher?.first_name || ''} ${s.teacher?.last_name || ''}` || '-'}</td>
                                                                <td className="px-4 py-2.5">{s.subject?.name_en || s.subject?.name_ar || '-'}</td>
                                                                <td className="px-4 py-2.5 text-xs text-slate-500">{s.session_date ? formatDate(s.session_date) : '-'}</td>
                                                                <td className="px-4 py-2.5">{getStatusBadge(s.status)}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    )}
                                    {profile?.sessions_as_teacher?.length > 0 && (
                                        <div>
                                            <h4 className="text-sm font-bold text-slate-500 mb-2 mt-4">{language === 'ar' ? 'جلسات كمعلم' : 'Sessions as Teacher'}</h4>
                                            <div className="overflow-x-auto rounded-xl border border-slate-200">
                                                <table className="w-full text-sm">
                                                    <thead className="bg-slate-50 text-xs text-slate-500 uppercase">
                                                        <tr>
                                                            <th className="px-4 py-2 text-left">#</th>
                                                            <th className="px-4 py-2 text-left">{t.student || 'Student'}</th>
                                                            <th className="px-4 py-2 text-left">{t.subject || 'Subject'}</th>
                                                            <th className="px-4 py-2 text-left">{t.date || 'Date'}</th>
                                                            <th className="px-4 py-2 text-left">{t.status || 'Status'}</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-slate-100">
                                                        {(profile?.sessions_as_teacher || []).map((s: any) => (
                                                            <tr key={s.id} className="hover:bg-slate-50">
                                                                <td className="px-4 py-2.5 font-medium text-slate-700">#{s.id}</td>
                                                                <td className="px-4 py-2.5">{s.student?.name || `${s.student?.first_name || ''} ${s.student?.last_name || ''}` || '-'}</td>
                                                                <td className="px-4 py-2.5">{s.subject?.name_en || s.subject?.name_ar || '-'}</td>
                                                                <td className="px-4 py-2.5 text-xs text-slate-500">{s.session_date ? formatDate(s.session_date) : '-'}</td>
                                                                <td className="px-4 py-2.5">{getStatusBadge(s.status)}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    )}
                                    {(!profile?.sessions_as_student?.length && !profile?.sessions_as_teacher?.length) && (
                                        <p className="text-center text-slate-400 py-8">{language === 'ar' ? 'لا توجد جلسات' : 'No sessions found'}</p>
                                    )}
                                </div>
                            )}

                            {activeTab === 'payments' && (
                                <div>
                                    {(profile?.payments?.length || 0) > 0 ? (
                                        <div className="overflow-x-auto rounded-xl border border-slate-200">
                                            <table className="w-full text-sm">
                                                <thead className="bg-slate-50 text-xs text-slate-500 uppercase">
                                                    <tr>
                                                        <th className="px-4 py-2 text-left">#</th>
                                                        <th className="px-4 py-2 text-left">{language === 'ar' ? 'المبلغ' : 'Amount'}</th>
                                                        <th className="px-4 py-2 text-left">{language === 'ar' ? 'الطريقة' : 'Method'}</th>
                                                        <th className="px-4 py-2 text-left">{t.status || 'Status'}</th>
                                                        <th className="px-4 py-2 text-left">{language === 'ar' ? 'مرجع الحجز' : 'Booking Ref'}</th>
                                                        <th className="px-4 py-2 text-left">{t.date || 'Date'}</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100">
                                                    {(profile?.payments || []).map((p: any) => (
                                                        <tr key={p.id} className="hover:bg-slate-50">
                                                            <td className="px-4 py-2.5 font-mono text-xs text-slate-500">#{p.id}</td>
                                                            <td className="px-4 py-2.5 font-semibold text-slate-700">{p.amount} {p.currency || 'SAR'}</td>
                                                            <td className="px-4 py-2.5 text-xs">{p.payment_method || '-'}</td>
                                                            <td className="px-4 py-2.5">{getStatusBadge(p.status)}</td>
                                                            <td className="px-4 py-2.5 text-xs text-slate-500">{p.booking?.reference || '-'}</td>
                                                            <td className="px-4 py-2.5 text-xs text-slate-500">{formatDateTime(p.created_at)}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    ) : (
                                        <p className="text-center text-slate-400 py-8">{language === 'ar' ? 'لا توجد مدفوعات' : 'No payments found'}</p>
                                    )}
                                </div>
                            )}

                            {activeTab === 'subscriptions' && (
                                <div>
                                    {(profile?.subscriptions?.length || 0) > 0 ? (
                                        <div className="overflow-x-auto rounded-xl border border-slate-200">
                                            <table className="w-full text-sm">
                                                <thead className="bg-slate-50 text-xs text-slate-500 uppercase">
                                                    <tr>
                                                        <th className="px-4 py-2 text-left">{language === 'ar' ? 'الباقة' : 'Package'}</th>
                                                        <th className="px-4 py-2 text-left">{language === 'ar' ? 'المستخدمة' : 'Used'}/{language === 'ar' ? 'المجموع' : 'Total'}</th>
                                                        <th className="px-4 py-2 text-left">{t.status || 'Status'}</th>
                                                        <th className="px-4 py-2 text-left">{language === 'ar' ? 'تاريخ البداية' : 'Start Date'}</th>
                                                        <th className="px-4 py-2 text-left">{language === 'ar' ? 'تاريخ الانتهاء' : 'End Date'}</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100">
                                                    {(profile?.subscriptions || []).map((s: any) => (
                                                        <tr key={s.id} className="hover:bg-slate-50">
                                                            <td className="px-4 py-2.5 font-medium text-slate-700">
                                                                {s.package?.name_en || s.package?.name_ar || `#${s.package_id}`}
                                                            </td>
                                                            <td className="px-4 py-2.5">{s.used_sessions || 0}/{s.total_sessions || '-'}</td>
                                                            <td className="px-4 py-2.5">{getStatusBadge(s.status)}</td>
                                                            <td className="px-4 py-2.5 text-xs text-slate-500">{formatDate(s.start_date || s.created_at)}</td>
                                                            <td className="px-4 py-2.5 text-xs text-slate-500">{formatDate(s.end_date) || '-'}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    ) : (
                                        <p className="text-center text-slate-400 py-8">{language === 'ar' ? 'لا توجد اشتراكات' : 'No subscriptions found'}</p>
                                    )}
                                </div>
                            )}

                            {activeTab === 'orders' && (
                                <div>
                                    {(profile?.orders?.length || 0) > 0 ? (
                                        <div className="overflow-x-auto rounded-xl border border-slate-200">
                                            <table className="w-full text-sm">
                                                <thead className="bg-slate-50 text-xs text-slate-500 uppercase">
                                                    <tr>
                                                        <th className="px-4 py-2 text-left">#</th>
                                                        <th className="px-4 py-2 text-left">{t.subject || 'Subject'}</th>
                                                        <th className="px-4 py-2 text-left">{language === 'ar' ? 'السعر' : 'Price Range'}</th>
                                                        <th className="px-4 py-2 text-left">{t.status || 'Status'}</th>
                                                        <th className="px-4 py-2 text-left">{language === 'ar' ? 'الطلبات' : 'Applications'}</th>
                                                        <th className="px-4 py-2 text-left">{t.date || 'Date'}</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100">
                                                    {(profile?.orders || []).map((o: any) => (
                                                        <tr key={o.id} className="hover:bg-slate-50">
                                                            <td className="px-4 py-2.5 font-mono text-xs text-slate-500">#{o.id}</td>
                                                            <td className="px-4 py-2.5">{o.subject?.name_en || o.subject?.name_ar || '-'}</td>
                                                            <td className="px-4 py-2.5 text-xs">{o.min_price || '-'} - {o.max_price || '-'}</td>
                                                            <td className="px-4 py-2.5">{getStatusBadge(o.status)}</td>
                                                            <td className="px-4 py-2.5 text-xs">{o.applications?.length || 0}</td>
                                                            <td className="px-4 py-2.5 text-xs text-slate-500">{formatDate(o.created_at)}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    ) : (
                                        <p className="text-center text-slate-400 py-8">{language === 'ar' ? 'لا توجد طلبات' : 'No orders found'}</p>
                                    )}
                                </div>
                            )}

                            {activeTab === 'courses' && (
                                <div>
                                    {(profile?.courses?.length || 0) > 0 ? (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                            {(profile?.courses || []).map((c: any) => (
                                                <div key={c.id} className="p-4 rounded-xl border border-slate-200 hover:border-primary/30 hover:shadow-sm transition-all">
                                                    <div className="font-semibold text-slate-800 text-sm">{c.name}</div>
                                                    <div className="text-xs text-slate-500 mt-1">{c.category?.name_en || c.category?.name_ar || '-'}</div>
                                                    <div className="flex items-center justify-between mt-2">
                                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${c.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                                                            {c.status}
                                                        </span>
                                                        <span className="text-xs font-semibold text-slate-700">{c.price} {language === 'ar' ? 'ر.س' : 'SAR'}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-center text-slate-400 py-8">{language === 'ar' ? 'لا توجد دورات' : 'No courses found'}</p>
                                    )}
                                </div>
                            )}

                            {activeTab === 'wallet' && (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                        <div className="p-4 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
                                            <div className="text-xs text-slate-500 mb-1">{language === 'ar' ? 'الرصيد الحالي' : 'Current Balance'}</div>
                                            <div className="text-2xl font-bold text-primary">
                                                {profile?.wallet?.balance || 0} {language === 'ar' ? 'ر.س' : 'SAR'}
                                            </div>
                                        </div>
                                        <div className="p-4 rounded-xl bg-gradient-to-br from-amber-50 to-amber-50/50 border border-amber-200">
                                            <div className="text-xs text-slate-500 mb-1">{language === 'ar' ? 'إجمالي المدفوعات' : 'Total Payments'}</div>
                                            <div className="text-2xl font-bold text-amber-700">{profile?.payments?.length || 0}</div>
                                        </div>
                                        <div className="p-4 rounded-xl bg-gradient-to-br from-green-50 to-green-50/50 border border-green-200">
                                            <div className="text-xs text-slate-500 mb-1">{language === 'ar' ? 'إجمالي السحوبات' : 'Total Payouts'}</div>
                                            <div className="text-2xl font-bold text-green-700">{profile?.payouts?.length || 0}</div>
                                        </div>
                                    </div>

                                    {(profile?.wallet_transactions?.length || 0) > 0 ? (
                                        <div>
                                            <h4 className="text-sm font-bold text-slate-500 mb-2">{language === 'ar' ? 'معاملات المحفظة' : 'Wallet Transactions'}</h4>
                                            <div className="overflow-x-auto rounded-xl border border-slate-200">
                                                <table className="w-full text-sm">
                                                    <thead className="bg-slate-50 text-xs text-slate-500 uppercase">
                                                        <tr>
                                                            <th className="px-4 py-2 text-left">{language === 'ar' ? 'النوع' : 'Type'}</th>
                                                            <th className="px-4 py-2 text-left">{language === 'ar' ? 'المبلغ' : 'Amount'}</th>
                                                            <th className="px-4 py-2 text-left">{language === 'ar' ? 'الرصيد قبل' : 'Balance Before'}</th>
                                                            <th className="px-4 py-2 text-left">{language === 'ar' ? 'الرصيد بعد' : 'Balance After'}</th>
                                                            <th className="px-4 py-2 text-left">{language === 'ar' ? 'الوصف' : 'Description'}</th>
                                                            <th className="px-4 py-2 text-left">{t.date || 'Date'}</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-slate-100">
                                                        {(profile?.wallet_transactions || []).map((t: any) => (
                                                            <tr key={t.id} className="hover:bg-slate-50">
                                                                <td className="px-4 py-2.5">
                                                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${t.type === 'credit' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                                        {t.type === 'credit' ? <ArrowUpRight size={10} /> : <ArrowDownLeft size={10} />}
                                                                        {t.type === 'credit' ? t.credit || t.debit || 'Credit' : t.debit || 'Debit'}
                                                                    </span>
                                                                </td>
                                                                <td className="px-4 py-2.5 font-semibold">{t.amount}</td>
                                                                <td className="px-4 py-2.5 text-xs">{t.balance_before || '-'}</td>
                                                                <td className="px-4 py-2.5 text-xs">{t.balance_after || '-'}</td>
                                                                <td className="px-4 py-2.5 text-xs text-slate-500 max-w-[200px] truncate">{t.description || '-'}</td>
                                                                <td className="px-4 py-2.5 text-xs text-slate-500">{formatDateTime(t.created_at)}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    ) : (
                                        <p className="text-center text-slate-400 py-4">{language === 'ar' ? 'لا توجد معاملات' : 'No transactions'}</p>
                                    )}

                                    {(profile?.payouts?.length || 0) > 0 && (
                                        <div>
                                            <h4 className="text-sm font-bold text-slate-500 mb-2">{language === 'ar' ? 'السحوبات' : 'Payouts'}</h4>
                                            <div className="overflow-x-auto rounded-xl border border-slate-200">
                                                <table className="w-full text-sm">
                                                    <thead className="bg-slate-50 text-xs text-slate-500 uppercase">
                                                        <tr>
                                                            <th className="px-4 py-2 text-left">{language === 'ar' ? 'المبلغ' : 'Amount'}</th>
                                                            <th className="px-4 py-2 text-left">{t.status || 'Status'}</th>
                                                            <th className="px-4 py-2 text-left">{language === 'ar' ? 'تاريخ الطلب' : 'Requested'}</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-slate-100">
                                                        {(profile?.payouts || []).map((p: any) => (
                                                            <tr key={p.id} className="hover:bg-slate-50">
                                                                <td className="px-4 py-2.5 font-semibold">{p.amount} {language === 'ar' ? 'ر.س' : 'SAR'}</td>
                                                                <td className="px-4 py-2.5">{getStatusBadge(p.status)}</td>
                                                                <td className="px-4 py-2.5 text-xs text-slate-500">{formatDate(p.requested_at || p.created_at)}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeTab === 'reviews' && (
                                <div className="space-y-4">
                                    {(profile?.reviews_given?.length || 0) > 0 && (
                                        <div>
                                            <h4 className="text-sm font-bold text-slate-500 mb-2">{language === 'ar' ? 'التقييمات المُرسلة' : 'Reviews Given'}</h4>
                                            <div className="space-y-2">
                                                {(profile?.reviews_given || []).map((r: any) => (
                                                    <div key={r.id} className="p-3 rounded-xl border border-slate-200 flex items-start gap-3">
                                                        <div className="flex items-center gap-1 text-amber-500 flex-shrink-0">
                                                            <Star size={14} fill="currentColor" />
                                                            <span className="text-sm font-bold">{r.rating}</span>
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="text-sm text-slate-700">{r.comment || '-'}</div>
                                                            <div className="text-xs text-slate-400 mt-1">
                                                                {language === 'ar' ? 'إلى' : 'To'}: {r.reviewedUser ? `${r.reviewedUser.first_name} ${r.reviewedUser.last_name}` : r.course?.name || '-'}
                                                            </div>
                                                        </div>
                                                        <div className="text-xs text-slate-400 flex-shrink-0">{formatDate(r.created_at)}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    {(profile?.reviews_received?.length || 0) > 0 && (
                                        <div>
                                            <h4 className="text-sm font-bold text-slate-500 mb-2 mt-4">{language === 'ar' ? 'التقييمات المستلمة' : 'Reviews Received'}</h4>
                                            <div className="space-y-2">
                                                {(profile?.reviews_received || []).map((r: any) => (
                                                    <div key={r.id} className="p-3 rounded-xl border border-slate-200 flex items-start gap-3">
                                                        <div className="flex items-center gap-1 text-amber-500 flex-shrink-0">
                                                            <Star size={14} fill="currentColor" />
                                                            <span className="text-sm font-bold">{r.rating}</span>
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="text-sm text-slate-700">{r.comment || '-'}</div>
                                                            <div className="text-xs text-slate-400 mt-1">
                                                                {language === 'ar' ? 'من' : 'From'}: {r.reviewer ? `${r.reviewer.first_name} ${r.reviewer.last_name}` : '-'}
                                                            </div>
                                                        </div>
                                                        <div className="text-xs text-slate-400 flex-shrink-0">{formatDate(r.created_at)}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    {(!profile?.reviews_given?.length && !profile?.reviews_received?.length) && (
                                        <p className="text-center text-slate-400 py-8">{language === 'ar' ? 'لا توجد تقييمات' : 'No reviews found'}</p>
                                    )}
                                </div>
                            )}

                            {activeTab === 'tickets' && (
                                <div>
                                    {(profile?.support_tickets?.length || 0) > 0 ? (
                                        <div className="space-y-2">
                                            {(profile?.support_tickets || []).map((t: any) => (
                                                <div key={t.id} className="p-4 rounded-xl border border-slate-200 hover:border-primary/30 transition-all">
                                                    <div className="flex items-center justify-between mb-1">
                                                        <span className="font-semibold text-slate-800 text-sm">{t.subject}</span>
                                                        {getStatusBadge(t.status)}
                                                    </div>
                                                    <p className="text-xs text-slate-500 line-clamp-2">{t.body}</p>
                                                    <div className="text-[10px] text-slate-400 mt-1">{formatDateTime(t.created_at)}</div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-center text-slate-400 py-8">{language === 'ar' ? 'لا توجد تذاكر دعم' : 'No support tickets found'}</p>
                                    )}
                                </div>
                            )}

                            {activeTab === 'disputes' && (
                                <div>
                                    {(profile?.disputes?.length || 0) > 0 ? (
                                        <div className="overflow-x-auto rounded-xl border border-slate-200">
                                            <table className="w-full text-sm">
                                                <thead className="bg-slate-50 text-xs text-slate-500 uppercase">
                                                    <tr>
                                                        <th className="px-4 py-2 text-left">{t.reason || 'Reason'}</th>
                                                        <th className="px-4 py-2 text-left">{t.status || 'Status'}</th>
                                                        <th className="px-4 py-2 text-left">{language === 'ar' ? 'مرجع الحجز' : 'Booking Ref'}</th>
                                                        <th className="px-4 py-2 text-left">{t.date || 'Date'}</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100">
                                                    {(profile?.disputes || []).map((d: any) => (
                                                        <tr key={d.id} className="hover:bg-slate-50">
                                                            <td className="px-4 py-2.5 text-sm">{d.reason}</td>
                                                            <td className="px-4 py-2.5">{getStatusBadge(d.status)}</td>
                                                            <td className="px-4 py-2.5 text-xs text-slate-500">{d.booking?.reference || '-'}</td>
                                                            <td className="px-4 py-2.5 text-xs text-slate-500">{formatDate(d.created_at)}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    ) : (
                                        <p className="text-center text-slate-400 py-8">{language === 'ar' ? 'لا توجد نزاعات' : 'No disputes found'}</p>
                                    )}
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};
