
import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../Contexts/LanguageContext';
import { Download, Award, Loader2 } from 'lucide-react';
import { studentService, Certificate } from '../../Services/api';
import { Button } from '../ui/Button';

export const MyCertificates: React.FC = () => {
    const { t } = useLanguage();
    const [certificates, setCertificates] = useState<Certificate[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCerts = async () => {
            try {
                const data = await studentService.getCertificates();
                setCertificates(Array.isArray(data) ? data : []);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        fetchCerts();
    }, []);

    const handleDownload = (id: number) => {
        studentService.downloadCertificate(id);
    };

    if (loading) return <div className="flex justify-center p-10"><Loader2 className="animate-spin text-primary" /></div>;

    return (
        <div className="space-y-6 animate-fade-in">
            <h2 className="text-2xl font-bold text-slate-900">{t.myCertificates}</h2>
            
            {certificates.length === 0 ? (
                <div className="text-center py-16 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                    <Award className="mx-auto h-16 w-16 text-slate-300 mb-4" />
                    <h3 className="text-lg font-medium text-slate-900">No Certificates Yet</h3>
                    <p className="text-slate-500 mt-2">Complete courses to earn certificates.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {certificates.map(cert => (
                        <div key={cert.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-10">
                                <Award size={100} />
                            </div>
                            <div className="relative z-10">
                                <div className="h-12 w-12 bg-yellow-100 rounded-full flex items-center justify-center text-yellow-600 mb-4">
                                    <Award size={24} />
                                </div>
                                <h3 className="font-bold text-lg text-slate-900 mb-2">{cert.course_name}</h3>
                                <p className="text-sm text-slate-500 mb-4">Issued on: {new Date(cert.issue_date).toLocaleDateString()}</p>
                                
                                {cert.grade && (
                                    <div className="inline-block px-2 py-1 bg-slate-100 rounded text-xs font-semibold text-slate-600 mb-4">
                                        Grade: {cert.grade}
                                    </div>
                                )}

                                <Button className="w-full mt-2" onClick={() => handleDownload(cert.id)}>
                                    <Download size={16} className="mr-2" /> Download
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
