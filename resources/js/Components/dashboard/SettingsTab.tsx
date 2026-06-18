
import React, { useState } from 'react';
import { useLanguage } from '../../Contexts/LanguageContext';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { authService } from '../../Services/api';
import { Lock, Save, AlertCircle, CheckCircle } from 'lucide-react';

export const SettingsTab: React.FC = () => {
    const { t, language } = useLanguage();
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    
    const [form, setForm] = useState({
        current_password: '',
        new_password: '',
        new_password_confirmation: ''
    });

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);

        if (form.new_password !== form.new_password_confirmation) {
            setMessage({ type: 'error', text: language === 'ar' ? 'كلمات المرور غير متطابقة' : 'Passwords do not match' });
            return;
        }

        setLoading(true);
        try {
            // 1. Confirm current password
            await authService.confirmPassword({ password: form.current_password });
            
            // 2. Change password
            await authService.changePassword({
                new_password: form.new_password,
                new_password_confirmation: form.new_password_confirmation
            });

            setMessage({ type: 'success', text: language === 'ar' ? 'تم تغيير كلمة المرور بنجاح' : 'Password updated successfully' });
            setForm({ current_password: '', new_password: '', new_password_confirmation: '' });
        } catch (err: any) {
            setMessage({ type: 'error', text: err.message || (language === 'ar' ? 'فشل تغيير كلمة المرور' : 'Failed to update password') });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-8 animate-fade-in">
            <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                <Lock className="text-primary" /> {t.settings}
            </h2>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <h3 className="text-lg font-bold text-slate-900 mb-4">{language === 'ar' ? 'تغيير كلمة المرور' : 'Change Password'}</h3>
                
                {message && (
                    <div className={`p-4 mb-6 rounded-lg flex items-center gap-2 ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                        {message.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                        {message.text}
                    </div>
                )}

                <form onSubmit={handleChangePassword} className="space-y-4">
                    <Input 
                        label={language === 'ar' ? 'كلمة المرور الحالية' : 'Current Password'}
                        type="password"
                        value={form.current_password}
                        onChange={(e) => setForm({ ...form, current_password: e.target.value })}
                        required
                    />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input 
                            label={language === 'ar' ? 'كلمة المرور الجديدة' : 'New Password'}
                            type="password"
                            value={form.new_password}
                            onChange={(e) => setForm({ ...form, new_password: e.target.value })}
                            required
                        />
                        <Input 
                            label={t.confirmPassword}
                            type="password"
                            value={form.new_password_confirmation}
                            onChange={(e) => setForm({ ...form, new_password_confirmation: e.target.value })}
                            required
                        />
                    </div>
                    <div className="flex justify-end pt-2">
                        <Button type="submit" isLoading={loading}>
                            <Save size={18} className="mr-2" /> {language === 'ar' ? 'حفظ التغييرات' : 'Save Changes'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};
