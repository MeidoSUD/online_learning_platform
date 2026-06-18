import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../Contexts/LanguageContext';
import { Users, BookOpen, DollarSign, CheckSquare, Loader2, TrendingUp, UserCheck, Calendar, Activity, Wallet } from 'lucide-react';
import { adminService } from '../../Services/api';
import { AdminDashboardData, RevenueAnalytics } from '../../Utils/types';

export const AdminOverviewTab: React.FC = () => {
    const { t, language } = useLanguage();
    const [data, setData] = useState<AdminDashboardData | null>(null);
    const [analytics, setAnalytics] = useState<RevenueAnalytics | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                // Fetch dashboard data first
                try {
                    const dashboardRes = await adminService.getDashboardData();
                    setData(dashboardRes.data || dashboardRes);
                } catch (dashboardErr) {
                    console.error("Main dashboard fetch failed, trying fallback stats", dashboardErr);
                    const stats = await adminService.getStats();
                    setData({
                        summary: {
                            total_users: stats.users || 0,
                            total_teachers: stats.teachers || 0,
                            active_teachers: stats.teachers || 0,
                            unverified_teachers: 0,
                            total_students: (stats.users || 0) - (stats.teachers || 0),
                            inactive_users: 0,
                            total_bookings: stats.bookings || 0,
                            total_revenue: stats.revenue || 0,
                            teachers_wallet_total: stats.revenue || 0
                        },
                        bookings: { total: stats.bookings || 0, confirmed: stats.bookings || 0, pending_payment: 0, cancelled: 0, by_status: {} },
                        payments: { total: 0, successful: 0, total_amount: stats.revenue || 0, by_status: {} },
                        users_by_role: { admin: 1, teacher: stats.teachers || 0, student: (stats.users || 0) - (stats.teachers || 0) },
                        monthly_metrics: { new_users_this_month: 0, new_bookings_this_month: 0 },
                        recent_activity: [],
                        wallet_info: { total_teachers_wallet: stats.revenue || 0, average_per_teacher: 0 }
                    });
                }

                // Fetch analytics independently
                try {
                    const analyticsRes = await adminService.getRevenueAnalytics();
                    setAnalytics(analyticsRes.data || analyticsRes);
                } catch (analyticsErr) {
                    console.warn("Revenue analytics unavailable (possibly 404)", analyticsErr);
                    setAnalytics(null);
                }
            } catch (e: any) {
                console.error("Fatal error in fetchDashboardData", e);
            } finally {
                setLoading(false);
            }
        };
        fetchDashboardData();
    }, []);

    if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-primary" /></div>;

    const summary = data?.summary;
    const statsCards = [
        { title: t.totalUsers, value: summary?.total_users || 0, icon: Users, color: 'bg-blue-500' },
        { title: t.activeTeachers, value: summary?.active_teachers || 0, icon: UserCheck, color: 'bg-green-500' },
        { title: t.totalBookings, value: analytics?.total_bookings || summary?.total_bookings || 0, icon: BookOpen, color: 'bg-purple-500' },
        { title: t.revenue, value: `${(analytics?.total_platform_revenue || summary?.total_revenue || 0).toLocaleString()} ${t.sar}`, icon: DollarSign, color: 'bg-orange-500' },
    ];

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-slate-900">{t.overview}</h2>
                <div className="text-sm text-slate-500 bg-white px-4 py-2 rounded-lg border border-slate-200">
                    {t.lastUpdated || 'Last Updated'}: {new Date().toLocaleTimeString()}
                </div>
            </div>

            {/* Top Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {statsCards.map((card, idx) => (
                    <div key={idx} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm transition-all hover:shadow-md">
                        <div className="flex items-center justify-between mb-4">
                            <div className={`p-3 rounded-xl ${card.color} text-white`}>
                                <card.icon size={24} />
                            </div>
                            {(idx === 0 || idx === 3) && (
                                <span className="text-green-500 text-xs font-bold flex items-center gap-1">
                                    <TrendingUp size={14} /> +{idx === 0 ? data?.monthly_metrics?.new_users_this_month : '5%'}
                                </span>
                            )}
                        </div>
                        <h3 className="text-slate-500 text-sm font-medium mb-1">{card.title}</h3>
                        <p className="text-2xl font-bold text-slate-900">{card.value}</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* User Distribution */}
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm lg:col-span-1">
                    <h3 className="font-bold text-slate-900 mb-6 flex items-center gap-2">
                        <Users size={20} className="text-primary" />
                        {t.userDistribution}
                    </h3>
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-slate-600">{t.admin}</span>
                            <span className="font-bold">{data?.users_by_role?.admin || 0}</span>
                        </div>
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                            <div className="bg-purple-500 h-full" style={{ width: `${(data?.users_by_role?.admin || 0) / (data?.summary?.total_users || 1) * 100}%` }}></div>
                        </div>

                        <div className="flex items-center justify-between">
                            <span className="text-sm text-slate-600">{t.teacher}</span>
                            <span className="font-bold">{data?.users_by_role?.teacher || 0}</span>
                        </div>
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                            <div className="bg-green-500 h-full" style={{ width: `${(data?.users_by_role?.teacher || 0) / (data?.summary?.total_users || 1) * 100}%` }}></div>
                        </div>

                        <div className="flex items-center justify-between">
                            <span className="text-sm text-slate-600">{t.student}</span>
                            <span className="font-bold">{data?.users_by_role?.student || 0}</span>
                        </div>
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                            <div className="bg-blue-500 h-full" style={{ width: `${(data?.users_by_role?.student || 0) / (data?.summary?.total_users || 1) * 100}%` }}></div>
                        </div>

                        <div className="pt-4 border-t border-slate-50 mt-4">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-slate-500">{t.inactiveUsers || 'Inactive Users'}</span>
                                <span className="font-bold text-red-500">{data?.summary?.inactive_users || 0}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Recent Activity */}
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm lg:col-span-2">
                    <h3 className="font-bold text-slate-900 mb-6 flex items-center justify-between">
                        <span className="flex items-center gap-2">
                            <Activity size={20} className="text-primary" />
                            {t.recentActivity}
                        </span>
                        <span className="text-xs font-normal text-slate-400">{t.lastUpdated}: {new Date().toLocaleTimeString()}</span>
                    </h3>
                    <div className="space-y-1">
                        {data?.recent_activity && data.recent_activity.length > 0 ? (
                            data.recent_activity.map((activity, idx) => {
                                const userName = activity.user_name || activity.teacher_name || activity.student_name || t.na;
                                return (
                                    <div key={activity.id || idx} className="flex items-center gap-4 p-4 hover:bg-slate-50 rounded-xl transition-colors group">
                                        <div className={`h-12 w-12 rounded-full flex items-center justify-center shrink-0 ${activity.type === 'booking' ? 'bg-blue-50 text-blue-600' : 'bg-green-50 text-green-600'
                                            }`}>
                                            {activity.type === 'booking' ? <Calendar size={20} /> : <Users size={20} />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between mb-1">
                                                <p className="text-sm font-bold text-slate-900 truncate">{userName}</p>
                                                <span className="text-xs font-bold text-primary">{Number(activity.amount) > 0 ? `+${activity.amount} ${t.sar}` : ''}</span>
                                            </div>
                                            <p className="text-xs text-slate-500 truncate flex items-center gap-2">
                                                <span className="capitalize">{activity.user_role === 'student' ? t.student : t.teacher}</span>
                                                <span className="h-1 w-1 bg-slate-300 rounded-full"></span>
                                                <span className={`px-1.5 py-0.5 rounded-md text-[10px] uppercase font-bold ${activity.status === 'confirmed' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                                                    }`}>
                                                    {activity.status}
                                                </span>
                                            </p>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <span className="text-[10px] text-slate-400">
                                                {new Date(activity.created_at).toLocaleTimeString(language === 'ar' ? 'ar-SA' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="text-center py-12 text-slate-400">
                                <Activity className="mx-auto mb-2 opacity-20" size={40} />
                                <p>{t.noResults}</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Wallets & Finances Overview */}
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-1">
                        <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                            <Wallet size={20} className="text-orange-500" />
                            {t.walletInfo || 'Wallet Summary'}
                        </h3>
                        <p className="text-sm text-slate-500 leading-relaxed mb-4">
                            Total balance managed across all teacher wallets in the platform.
                        </p>
                        <div className="bg-orange-50 p-4 rounded-xl border border-orange-100">
                            <p className="text-xs text-orange-600 font-bold uppercase mb-1">{t.totalRevenue || 'Total Teachers Wallet'}</p>
                            <p className="text-2xl font-black text-orange-700">{data?.summary?.teachers_wallet_total?.toLocaleString() || '0'} {t.sar}</p>
                        </div>
                    </div>

                    <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                            <p className="text-xs text-slate-500 font-bold uppercase mb-2">{t.monthlyMetrics || 'Monthly Metrics'}</p>
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm text-slate-600">New Users</span>
                                <span className="font-bold text-primary">+{data?.monthly_metrics?.new_users_this_month || 0}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-slate-600">New Bookings</span>
                                <span className="font-bold text-secondary">+{data?.monthly_metrics?.new_bookings_this_month || 0}</span>
                            </div>
                        </div>
                        <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                            <p className="text-xs text-slate-500 font-bold uppercase mb-2">System Health</p>
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm text-slate-600">Verified Rate</span>
                                <span className="font-bold text-green-600">
                                    {Math.round((data?.summary?.active_teachers || 0) / (data?.summary?.total_teachers || 1) * 100)}%
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-slate-600">Avg. Wallet</span>
                                <span className="font-bold">{data?.wallet_info?.average_per_teacher?.toLocaleString() || '0'} {t.sar}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
