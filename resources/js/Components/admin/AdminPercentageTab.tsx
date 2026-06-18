import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../Contexts/LanguageContext';
import { Percent, TrendingUp, History, Calculator, Calendar as CalendarIcon, Info, Loader2, ArrowRight, Save, Plus, DollarSign, BookOpen, Users, BarChart3 } from 'lucide-react';
import { Button } from '../ui/Button';
import { adminService } from '../../Services/api';
import { PlatformPercentage, RevenueAnalytics } from '../../Utils/types';
import { useToast } from '../../Contexts/ToastContext';

export const AdminPercentageTab: React.FC = () => {
    const { t, language, direction } = useLanguage();
    const { showToast } = useToast();
    const [activePercentage, setActivePercentage] = useState<PlatformPercentage | null>(null);
    const [history, setHistory] = useState<PlatformPercentage[]>([]);
    const [analytics, setAnalytics] = useState<RevenueAnalytics | null>(null);
    const [loading, setLoading] = useState(true);
    const [formLoading, setFormLoading] = useState(false);

    // Calculator State
    const [teacherRate, setTeacherRate] = useState<number>(100);
    const [studentPrice, setStudentPrice] = useState<number>(0);
    const [revenue, setRevenue] = useState<number>(0);

    // Form State
    const [newPercentage, setNewPercentage] = useState<string>('');
    const [effectiveDate, setEffectiveDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [description, setDescription] = useState<string>('');

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        if (activePercentage) {
            calculateImpact(teacherRate, Number(activePercentage.value));
        }
    }, [teacherRate, activePercentage]);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch Active Percentage
            try {
                const activeRes = await adminService.getActivePercentage();
                setActivePercentage(activeRes.data);
            } catch (activeErr: any) {
                console.warn("Active percentage not found or not configured", activeErr);
                // Default to null, will handle in UI
                setActivePercentage(null);
            }

            // Fetch History
            try {
                const historyRes = await adminService.getPercentageHistory();
                setHistory(historyRes);
            } catch (historyErr) {
                console.warn("Percentage history unavailable", historyErr);
                setHistory([]);
            }

            // Fetch Analytics
            try {
                const analyticsRes = await adminService.getRevenueAnalytics();
                setAnalytics(analyticsRes.data || analyticsRes);
            } catch (analyticsErr) {
                console.warn("Revenue analytics unavailable (possibly 404)", analyticsErr);
                setAnalytics(null);
            }
        } catch (e) {
            console.error("Error in AdminPercentageTab fetchData", e);
        } finally {
            setLoading(false);
        }
    };

    const calculateImpact = (rate: number, pct: number) => {
        const rev = rate * (pct / 100);
        setRevenue(rev);
        setStudentPrice(rate + rev);
    };

    const handleUpdatePercentage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newPercentage) return;
        setFormLoading(true);
        try {
            await adminService.updatePercentage({
                value: Number(newPercentage),
                effective_date: effectiveDate,
                description: description
            });
            showToast(t.success, 'success');
            setNewPercentage('');
            setDescription('');
            fetchData();
        } catch (e: any) {
            showToast(e.message || t.error, 'error');
        } finally {
            setFormLoading(false);
        }
    };

    if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-primary" /></div>;

    return (
        <div className="space-y-6 animate-fade-in max-w-6xl mx-auto">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-slate-900">{t.revenueManagement}</h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Current Status Card */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-gradient-to-br from-primary to-blue-600 rounded-3xl p-8 text-white shadow-xl shadow-primary/20 relative overflow-hidden">
                        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                            <div>
                                <p className="text-blue-100 font-medium mb-1">{language === 'ar' ? 'عمولة المنصة الحالية' : 'Current Platform Commission'}</p>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-6xl font-black tracking-tight">{activePercentage?.value || '0.00'}%</span>
                                    <span className="text-blue-100 text-sm">{language === 'ar' ? 'لكل حجز' : 'per booking'}</span>
                                </div>
                                <div className="flex items-center gap-2 mt-4 bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-full text-xs">
                                    <CalendarIcon size={14} />
                                    {activePercentage ? `${language === 'ar' ? 'نشط منذ:' : 'Active since:'} ${activePercentage.effective_date}` : (language === 'ar' ? 'لم يتم العثور على إعداد نشط' : 'No active configuration found')}
                                </div>
                            </div>
                            <div className="hidden md:block opacity-20 pointer-events-none">
                                <Percent size={120} strokeWidth={3} />
                            </div>
                        </div>
                    </div>

                    {/* Analytics Overview Section */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {[
                            { label: language === 'ar' ? 'إجمالي الإيرادات' : 'Total Revenue', value: `${analytics?.total_platform_revenue?.toLocaleString() || 0} ${language === 'ar' ? 'ريال' : 'SAR'}`, icon: DollarSign, color: 'text-green-600', bg: 'bg-green-50' },
                            { label: language === 'ar' ? 'إجمالي الحجوزات' : 'Total Bookings', value: analytics?.total_bookings || 0, icon: BookOpen, color: 'text-blue-600', bg: 'bg-blue-50' },
                            { label: language === 'ar' ? 'مدفوعات الطلاب' : 'Student Spent', value: `${analytics?.total_student_spent?.toLocaleString() || 0} ${language === 'ar' ? 'ريال' : 'SAR'}`, icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                            { label: language === 'ar' ? 'هامش المنصة' : 'Platform Margin', value: `${analytics?.average_percentage || activePercentage?.value || 0}%`, icon: BarChart3, color: 'text-orange-600', bg: 'bg-orange-50' },
                        ].map((stat, i) => (
                            <div key={i} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 transition-all hover:shadow-md">
                                <div className={`p-3 rounded-xl ${stat.bg} ${stat.color}`}>
                                    <stat.icon size={24} />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{stat.label}</p>
                                    <p className="text-xl font-black text-slate-900">{stat.value}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Calculator Section */}
                    <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                                <Calculator size={20} />
                            </div>
                            <h3 className="font-bold text-slate-900">{language === 'ar' ? 'حاسبة الأسعار' : 'Pricing Calculator'}</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                            <div className="space-y-4">
                                <div>
                                    <label className="text-sm font-semibold text-slate-600 mb-2 block">{language === 'ar' ? 'سعر ساعة المعلم (ريال)' : 'Teacher Hourly Rate (SAR)'}</label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            value={teacherRate}
                                            onChange={(e) => setTeacherRate(Number(e.target.value))}
                                            className={`w-full bg-slate-50 border border-slate-100 rounded-2xl ${language === 'ar' ? 'pr-6 pl-14' : 'px-6'} py-4 text-2xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/20`}
                                        />
                                        <div className={`absolute ${language === 'ar' ? 'left-4' : 'right-4'} top-1/2 -translate-y-1/2 text-slate-400 font-bold`}>{language === 'ar' ? 'ريال' : 'SAR'}</div>
                                    </div>
                                </div>
                                <p className="text-xs text-slate-400 flex items-center gap-1.5 px-1">
                                    <Info size={12} /> {activePercentage 
                                        ? (language === 'ar' ? `هذا يحسب المبلغ الذي يدفعه الطالب بناءً على النسبة الحالية ${activePercentage.value}%.` : `This calculates how much the student pays based on the current ${activePercentage.value}% rate.`)
                                        : (language === 'ar' ? "لا توجد نسبة معدة. قم بتعيين استراتيجية نسبة لرؤية حسابات التأثير." : "No rate configured. Set a percentage strategy to see impact calculations.")}
                                </p>
                            </div>

                            <div className="space-y-4 p-6 bg-slate-50 rounded-2xl border border-slate-100">
                                <div className="flex justify-between items-center pb-3 border-b border-slate-200">
                                    <span className="text-sm text-slate-500">{language === 'ar' ? 'يحصل المعلم' : 'Teacher Gets'}</span>
                                    <span className="font-bold text-slate-900">{teacherRate} {language === 'ar' ? 'ريال' : 'SAR'}</span>
                                </div>
                                <div className="flex justify-between items-center pb-3 border-b border-slate-200">
                                    <span className="text-sm text-slate-500 font-medium">{language === 'ar' ? `إيرادات المنصة (${activePercentage?.value || '0.00'}%)` : `Platform Revenue (${activePercentage?.value || '0.00'}%)`}</span>
                                    <span className="font-bold text-primary">+{revenue.toFixed(2)} {language === 'ar' ? 'ريال' : 'SAR'}</span>
                                </div>
                                <div className="flex justify-between items-center pt-2">
                                    <span className="font-bold text-slate-900">{language === 'ar' ? 'يدفع الطالب' : 'Student Pays'}</span>
                                    <span className="text-2xl font-black text-slate-900">{studentPrice.toFixed(2)} {language === 'ar' ? 'ريال' : 'SAR'}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* History Section */}
                    <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm overflow-hidden">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-slate-50 text-slate-600 rounded-lg">
                                <History size={20} />
                            </div>
                            <h3 className="font-bold text-slate-900">{language === 'ar' ? 'سجل النسب' : 'Percentage History'}</h3>
                        </div>

                        <div className="space-y-4">
                            {history.length === 0 ? (
                                <p className="text-center py-8 text-slate-400">{language === 'ar' ? 'لا تتوفر بيانات تاريخية.' : 'No historical data available.'}</p>
                            ) : (
                                history.map((item, idx) => (
                                    <div key={item.id} className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${item.is_active ? 'border-primary/20 bg-primary/5 shadow-sm' : 'border-slate-100'}`}>
                                        <div className="flex items-center gap-4">
                                            <div className={`h-12 w-12 rounded-xl flex items-center justify-center font-bold text-lg ${item.is_active ? 'bg-primary text-white' : 'bg-slate-100 text-slate-400'}`}>
                                                {item.value}%
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-900">{item.description || (language === 'ar' ? 'استراتيجية عامة' : 'General Strategy')}</p>
                                                <p className="text-xs text-slate-500">{language === 'ar' ? 'تاريخ السريان:' : 'Effective:'} {item.effective_date}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            {item.is_active && (
                                                <span className="px-3 py-1 bg-primary text-white text-[10px] font-bold rounded-full uppercase tracking-wider">{language === 'ar' ? 'نشط' : 'Active'}</span>
                                            )}
                                            {!item.is_active && new Date(item.effective_date) > new Date() && (
                                                <span className="px-3 py-1 bg-amber-100 text-amber-700 text-[10px] font-bold rounded-full uppercase tracking-wider">{language === 'ar' ? 'مجدول' : 'Scheduled'}</span>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Update Form Sidebar */}
                <div className="space-y-6">
                    <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm sticky top-6">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-primary/5 text-primary rounded-lg">
                                <TrendingUp size={20} />
                            </div>
                            <h3 className="font-bold text-slate-900">{language === 'ar' ? 'تحديث النسبة' : 'Update Rate'}</h3>
                        </div>

                        <form onSubmit={handleUpdatePercentage} className="space-y-5">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-500 uppercase px-1">{language === 'ar' ? 'النسبة الجديدة' : 'New Percentage'}</label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        required
                                        min="0"
                                        max="100"
                                        step="0.01"
                                        value={newPercentage}
                                        onChange={(e) => setNewPercentage(e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 font-bold focus:outline-none focus:ring-2 focus:ring-primary/20"
                                        placeholder="0.00"
                                    />
                                    <div className={`absolute ${language === 'ar' ? 'left-4' : 'right-4'} top-1/2 -translate-y-1/2 text-slate-400`}>%</div>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-500 uppercase px-1">{language === 'ar' ? 'تاريخ السريان' : 'Effective Date'}</label>
                                <input
                                    type="date"
                                    required
                                    value={effectiveDate}
                                    onChange={(e) => setEffectiveDate(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 font-medium focus:outline-none focus:ring-2 focus:ring-primary/20"
                                />
                                <p className="text-[10px] text-slate-400 px-1">{language === 'ar' ? 'سيبدأ تفعيل التغييرات المجدولة الساعة 00:00 في هذا التاريخ.' : 'Scheduled changes will activate at 00:00 on this date.'}</p>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-500 uppercase px-1">{language === 'ar' ? 'الوصف / السبب' : 'Description / Reason'}</label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 min-h-[100px]"
                                    placeholder={language === 'ar' ? 'مثلًا عرض الربع الثاني، زيادة قياسية...' : 'e.g. Q2 Promotion, Standard increase...'}
                                />
                            </div>

                            <Button className="w-full py-4 rounded-xl flex items-center justify-center gap-2" disabled={formLoading}>
                                {formLoading ? <Loader2 className="animate-spin" size={20} /> : (
                                    <>
                                        <Save size={20} />
                                        {language === 'ar' ? 'تحديث الاستراتيجية' : 'Update Strategy'}
                                    </>
                                )}
                            </Button>
                        </form>
                    </div>

                    <div className="p-6 bg-amber-50 rounded-3xl border border-amber-100">
                        <div className="flex items-start gap-4">
                            <div className="p-2 bg-amber-100 text-amber-600 rounded-xl">
                                <Info size={20} />
                            </div>
                            <div className="space-y-1">
                                <h4 className="font-bold text-amber-900 text-sm">{language === 'ar' ? 'تذكير بالسياسة' : 'Policy Reminder'}</h4>
                                <p className="text-xs text-amber-700 leading-relaxed">
                                    {language === 'ar' ? 'تنطبق التغييرات فقط على الطلبات الجديدة المنشأة في أو بعد تاريخ السريان. تحتفظ الطلبات الحالية بالنسبة التي كانت نشطة وقت إنشائها.' : 'Changes only apply to new orders created on or after the effective date. Existing orders maintain the percentage that was active at the time of their creation.'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminPercentageTab;
