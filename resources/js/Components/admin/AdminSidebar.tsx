import React, { useState } from 'react';
import { useLanguage } from '../../Contexts/LanguageContext';
import { LayoutDashboard, Users, Layers, DollarSign, CheckSquare, AlertCircle, LogOut, Globe, Calendar, BookOpen, Settings, Package, ShoppingBag, Percent, Cog, ChevronDown, ChevronRight, Video, Monitor, FileText } from 'lucide-react';
import { Logo } from '../Logo';

interface AdminSidebarProps {
    activeTab: string;
    setActiveTab: (tab: string) => void;
    onLogout: () => void;
    isOpen: boolean;
    setIsOpen: (val: boolean) => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({ activeTab, setActiveTab, onLogout, isOpen, setIsOpen }) => {
    const { t, language, setLanguage, direction } = useLanguage();
    const [openGroups, setOpenGroups] = useState<string[]>(['overview', 'users_group', 'bookings_group', 'education_group', 'financials_group', 'system_group']);

    const toggleGroup = (groupId: string) => {
        setOpenGroups(prev => 
            prev.includes(groupId) ? prev.filter(id => id !== groupId) : [...prev, groupId]
        );
    };

    const menuGroups = [
        {
            id: 'overview',
            label: t.dashboard,
            icon: LayoutDashboard,
            isAction: true
        },
        {
            id: 'users_group',
            label: language === 'ar' ? 'المستخدمين والأدوار' : 'Users & Roles',
            icon: Users,
            children: [
                { id: 'users', label: t.users, icon: Users },
                { id: 'verifications', label: t.verifications, icon: CheckSquare },
            ]
        },
        {
            id: 'bookings_group',
            label: language === 'ar' ? 'الحجوزات والجلسات' : 'Bookings & Sessions',
            icon: Calendar,
            children: [
                { id: 'bookings', label: t.bookings, icon: Calendar },
                { id: 'sessions', label: language === 'ar' ? 'الجلسات' : 'Sessions', icon: Video },
            ]
        },
        {
            id: 'education_group',
            label: language === 'ar' ? 'التعليم والدورات' : 'Education & Courses',
            icon: BookOpen,
            children: [
                { id: 'services', label: t.servicesManagement, icon: Package },
                { id: 'education', label: t.academicStructure, icon: Layers },
                { id: 'courses', label: t.courses, icon: BookOpen },
            ]
        },
        {
            id: 'financials_group',
            label: language === 'ar' ? 'المالية والطلبات' : 'Financials & Orders',
            icon: DollarSign,
            children: [
                { id: 'orders', label: t.ordersManagement, icon: ShoppingBag },
                { id: 'payouts', label: t.payoutRequests, icon: DollarSign },
                { id: 'percentage', label: t.revenueManagement, icon: Percent },
                { id: 'disputes', label: t.disputes, icon: AlertCircle },
            ]
        },
        {
            id: 'system_group',
            label: language === 'ar' ? 'النظام والإعدادات' : 'System & Settings',
            icon: Settings,
            children: [
                { id: 'ads', label: t.adsManagement, icon: Monitor },
                { id: 'terms', label: language === 'ar' ? 'الشروط والأحكام' : 'Terms & Conditions', icon: FileText },
                { id: 'appConfig', label: language === 'ar' ? 'إعدادات التطبيق' : 'App Config', icon: Cog },
                { id: 'settings', label: language === 'ar' ? 'الإعدادات' : 'Settings', icon: Settings },
            ]
        }
    ];

    return (
        <>
            {/* Mobile Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/30 z-40 lg:hidden"
                    onClick={() => setIsOpen(false)}
                ></div>
            )}

            <div className={`
            fixed lg:static inset-y-0 z-50 w-64 bg-white border-r border-slate-200 shadow-lg lg:shadow-none transform transition-transform duration-300 ease-in-out flex flex-col h-screen
            ${isOpen ? 'translate-x-0' : (direction === 'rtl' ? 'translate-x-full' : '-translate-x-full')}
            lg:translate-x-0
            ${direction === 'rtl' ? 'right-0 border-l border-r-0' : 'left-0'}
        `}>
                <div className="p-6 flex justify-center border-b border-slate-100 flex-shrink-0">
                    <Logo className="scale-75" />
                </div>

                <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1 custom-scrollbar">
                    {menuGroups.map(group => {
                        if (group.isAction) {
                            return (
                                <button
                                    key={group.id}
                                    onClick={() => { setActiveTab(group.id); setIsOpen(false); }}
                                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all mb-2 ${activeTab === group.id
                                        ? 'bg-primary text-white shadow-md shadow-primary/20'
                                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                                        }`}
                                >
                                    <group.icon size={18} />
                                    {group.label}
                                </button>
                            );
                        }

                        const isOpenGroup = openGroups.includes(group.id);
                        const hasActiveChild = group.children?.some(child => child.id === activeTab);

                        return (
                            <div key={group.id} className="mb-2">
                                <button
                                    onClick={() => toggleGroup(group.id)}
                                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                                        hasActiveChild ? 'text-primary bg-primary/5' : 'text-slate-700 hover:bg-slate-50'
                                    }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <group.icon size={18} className={hasActiveChild ? 'text-primary' : 'text-slate-500'} />
                                        <span>{group.label}</span>
                                    </div>
                                    {isOpenGroup ? (
                                        <ChevronDown size={16} className="text-slate-400" />
                                    ) : (
                                        <ChevronRight size={16} className={`text-slate-400 ${direction === 'rtl' ? 'rotate-180' : ''}`} />
                                    )}
                                </button>

                                {isOpenGroup && group.children && (
                                    <div className="mt-1 space-y-1">
                                        {group.children.map(child => (
                                            <button
                                                key={child.id}
                                                onClick={() => { setActiveTab(child.id); setIsOpen(false); }}
                                                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                                                    direction === 'rtl' ? 'pr-11' : 'pl-11'
                                                } ${activeTab === child.id
                                                    ? 'bg-primary text-white shadow-md shadow-primary/20'
                                                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                                                    }`}
                                            >
                                                <child.icon size={16} className={activeTab === child.id ? 'text-white' : 'text-slate-400'} />
                                                {child.label}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                <div className="p-4 border-t border-slate-100 space-y-2 flex-shrink-0">
                    <button
                        onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
                        className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition-all"
                    >
                        <Globe size={18} />
                        {language === 'en' ? 'العربية' : 'English'}
                    </button>
                    <button
                        onClick={onLogout}
                        className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-all"
                    >
                        <LogOut size={18} />
                        {t.logout}
                    </button>
                </div>
            </div>
            <style>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #cbd5e1;
                    border-radius: 4px;
                }
                .custom-scrollbar:hover::-webkit-scrollbar-thumb {
                    background: #94a3b8;
                }
            `}</style>
        </>
    );
};
