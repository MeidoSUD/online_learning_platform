import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../Contexts/LanguageContext';
import { adminService } from '../../Services/api';
import { CreditCard, Power, Loader2, AlertCircle } from 'lucide-react';

export const AdminWithdrawalMethodsTab: React.FC = () => {
    const { t } = useLanguage();
    const [methods, setMethods] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchMethods();
    }, []);

    const fetchMethods = async () => {
        try {
            setIsLoading(true);
            const data = await adminService.getWithdrawalMethods();
            setMethods(data);
        } catch (err: any) {
            setError(err.message || 'حدث خطأ أثناء جلب البيانات');
        } finally {
            setIsLoading(false);
        }
    };

    const handleToggle = async (id: number) => {
        try {
            const res = await adminService.toggleWithdrawalMethod(id);
            setMethods(methods.map(m => m.id === id ? res.data : m));
        } catch (err: any) {
            alert(err.message || 'حدث خطأ');
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-12">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-[var(--shadow-sm)] border border-[var(--border)] overflow-hidden">
                <div className="p-6 border-b border-[var(--border)]">
                    <h2 className="text-lg font-bold text-navy flex items-center gap-2">
                        <CreditCard className="w-5 h-5 text-primary" />
                        إدارة طرق السحب
                    </h2>
                </div>
                <div className="p-6">
                    {error && (
                        <div className="mb-4 p-4 bg-red-50 text-red-600 rounded-lg flex items-center gap-2">
                            <AlertCircle className="w-5 h-5" />
                            {error}
                        </div>
                    )}
                    
                    <div className="space-y-4">
                        {methods.map((method) => (
                            <div key={method.id} className="flex items-center justify-between p-4 bg-[var(--light-bg)] rounded-xl border border-[var(--border)]">
                                <div>
                                    <h4 className="font-bold text-navy">{method.name_ar}</h4>
                                    <span className="text-sm text-slate-500">{method.name_en}</span>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${method.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                        {method.is_active ? 'مفعل' : 'معطل'}
                                    </span>
                                    
                                    <button
                                        onClick={() => handleToggle(method.id)}
                                        className={`p-2 rounded-lg transition-colors flex items-center gap-2 ${
                                            method.is_active 
                                            ? 'bg-red-50 text-red-600 hover:bg-red-100' 
                                            : 'bg-green-50 text-green-600 hover:bg-green-100'
                                        }`}
                                    >
                                        <Power className="w-5 h-5" />
                                        <span>{method.is_active ? 'تعطيل' : 'تفعيل'}</span>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
