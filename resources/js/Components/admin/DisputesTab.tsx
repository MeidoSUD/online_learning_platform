
import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../Contexts/LanguageContext';
import { AlertCircle, Loader2 } from 'lucide-react';
import { adminService, AdminDispute } from '../../Services/api';

export const AdminDisputesTab: React.FC = () => {
    const { t } = useLanguage();
    const [disputes, setDisputes] = useState<AdminDispute[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetch = async () => {
            try {
                const data = await adminService.getDisputes();
                setDisputes(Array.isArray(data) ? data : []);
            } catch (e) { console.error(e); }
            finally { setLoading(false); }
        };
        fetch();
    }, []);

    if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-primary" /></div>;

    return (
        <div className="space-y-6 animate-fade-in">
            <h2 className="text-2xl font-bold text-[var(--text-main)]">{t.disputes}</h2>
            <div className="bg-white rounded-[var(--radius-md)] border border-[var(--border)] shadow-[var(--shadow-sm)] overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-[var(--light-bg)] border-b border-[var(--border)]">
                        <tr>
                            <th className="px-6 py-4 font-bold text-navy">{t.reference}</th>
                            <th className="px-6 py-4 font-bold text-navy">{t.reason}</th>
                            <th className="px-6 py-4 font-bold text-navy">{t.parties}</th>
                            <th className="px-6 py-4 font-bold text-navy">{t.status}</th>
                            <th className="px-6 py-4 font-bold text-navy text-right">{t.actions}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border)]">
                        {disputes.map(dispute => (
                            <tr key={dispute.id} className="hover:bg-[var(--light-bg)]">
                                <td className="px-6 py-4 font-mono text-[var(--text-muted)]">{dispute.booking_reference}</td>
                                <td className="px-6 py-4">
                                    <div className="font-medium text-[var(--text-main)]">{dispute.reason}</div>
                                    <div className="text-xs text-[var(--text-muted)] line-clamp-1">{dispute.description}</div>
                                </td>
                                <td className="px-6 py-4 text-xs text-[var(--text-muted)]">
                                    <div>{t.raisedBy}: {dispute.raised_by}</div>
                                    <div>{t.againstUser}: {dispute.against}</div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-bold uppercase">{dispute.status}</span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button className="text-primary hover:underline text-xs font-bold">{t.resolve}</button>
                                </td>
                            </tr>
                        ))}
                        {disputes.length === 0 && (
                            <tr><td colSpan={5} className="p-8 text-center text-[var(--text-muted)]">{t.noDisputesFound}</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
