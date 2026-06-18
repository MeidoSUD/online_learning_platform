import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../Contexts/LanguageContext';
import { CheckCircle, XCircle, FileText, ExternalLink, Loader2, Eye, Printer, Download } from 'lucide-react';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { Pagination } from '../ui/Pagination';
import { adminService, AdminTeacher, getStorageUrl, Service } from '../../Services/api';
import { useToast } from '../../Contexts/ToastContext';

export const VerificationsTab: React.FC = () => {
    const { t, language } = useLanguage();
    const { showToast } = useToast();
    const [teachers, setTeachers] = useState<AdminTeacher[]>([]);
    const [services, setServices] = useState<Service[]>([]);
    const [loading, setLoading] = useState(true);
    const [verifyingId, setVerifyingId] = useState<number | null>(null);

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 10;

    // Details Modal State
    const [selectedTeacher, setSelectedTeacher] = useState<AdminTeacher | null>(null);
    const [detailsLoading, setDetailsLoading] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Using adminService.getServices for admin context
            const [teachersData, servicesData] = await Promise.all([
                adminService.getTeachers(),
                adminService.getServices()
            ]);
            setTeachers(Array.isArray(teachersData) ? teachersData : []);
            setServices(Array.isArray(servicesData) ? servicesData : []);
        } catch (e) {
            console.error(e);
            showToast(t.error, 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleViewDetails = async (teacher: AdminTeacher) => {
        setSelectedTeacher(teacher); // Show basic info immediately
        setDetailsLoading(true);
        try {
            // Fetch full details if needed
            const fullDetails = await adminService.getTeacherDetails(teacher.id);
            const teacherData = fullDetails.data || fullDetails;
            setSelectedTeacher(teacherData);
        } catch (e) {
            console.error("Failed to load full teacher details", e);
            showToast(t.error, 'error');
        } finally {
            setDetailsLoading(false);
        }
    };

    const handleVerify = async (userId: number) => {
        // INSTANT ACTION - NO CONFIRMATION
        if (verifyingId === userId) return;

        setVerifyingId(userId);
        console.log(`[VerificationsTab] Verify Button Clicked for:`, userId);

        try {
            const response = await adminService.verifyUser(userId, true);
            console.log("[VerificationsTab] Verification API Success:", response);

            // Optimistic Update
            setTeachers(prev => prev.map(t => t.id === userId ? { ...t, verified: true } : t));

            if (selectedTeacher?.id === userId) {
                setSelectedTeacher(prev => prev ? { ...prev, verified: true } : null);
            }

            // Re-fetch to ensure sync with server
            fetchData();
            showToast(t.updatedSuccessfully, 'success');
        } catch (e: any) {
            console.error("[VerificationsTab] Verification Failed:", e);
            showToast(e.message || t.error, 'error');
        } finally {
            setVerifyingId(null);
        }
    };

    const handleReject = async (userId: number) => {
        if (!confirm(t.confirmAction)) return;
        try {
            await adminService.rejectUser(userId);
            showToast(t.confirmRejection, 'success');
            fetchData();
            if (selectedTeacher?.id === userId) setSelectedTeacher(null);
        } catch (e: any) {
            console.error(e);
            showToast(e.message || t.rejectCourse, 'error');
        }
    }

    const handlePrint = () => {
        window.print();
    };

    const getTeacherServiceNames = (teacher: AdminTeacher): string => {
        if (teacher.services && teacher.services.length > 0) {
            return teacher.services
                .map(s => language === 'ar' ? s.name_ar : s.name_en)
                .join(', ');
        }
        if (teacher.service_id) {
            const service = services.find(s => s.id === teacher.service_id);
            return service ? (language === 'ar' ? service.name_ar : service.name_en) : `#${teacher.service_id}`;
        }
        return t.na;
    };

    const totalPages = Math.ceil(teachers.length / ITEMS_PER_PAGE);
    const paginatedTeachers = teachers.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-primary" /></div>;

    return (
        <div className="space-y-6 animate-fade-in print:hidden">
            <h2 className="text-2xl font-bold text-slate-900">{t.verifications} / {t.teacherManagement}</h2>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th className="px-6 py-4 font-bold text-slate-700">{t.name}</th>
                            <th className="px-6 py-4 font-bold text-slate-700">{t.contact}</th>
                            <th className="px-6 py-4 font-bold text-slate-700">{t.requestedService}</th>
                            <th className="px-6 py-4 font-bold text-slate-700">{t.certificate}</th>
                            <th className="px-6 py-4 font-bold text-slate-700">{t.status}</th>
                            <th className="px-6 py-4 font-bold text-slate-700 text-right">{t.actions}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {paginatedTeachers.map(teacher => (
                            <tr key={teacher.id} className="hover:bg-slate-50 cursor-pointer" onClick={() => handleViewDetails(teacher)}>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 overflow-hidden">
                                            {teacher.profile_photo ? (
                                                <img src={getStorageUrl(teacher.profile_photo)} className="h-full w-full object-cover" alt="profile" />
                                            ) : (
                                                teacher.first_name.charAt(0)
                                            )}
                                        </div>
                                        <div>
                                            <div className="font-bold text-slate-900">{teacher.first_name} {teacher.last_name}</div>
                                            <div className="text-xs text-slate-500">ID: {teacher.id}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="text-sm text-slate-900">{teacher.email}</div>
                                    <div className="text-xs text-slate-500" dir="ltr">{teacher.phone_number}</div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs font-semibold">
                                        {getTeacherServiceNames(teacher)}
                                    </span>
                                </td>
                                <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                                    {teacher.certificate ? (
                                        <a
                                            href={getStorageUrl(teacher.certificate)}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium hover:bg-blue-100"
                                        >
                                            <FileText size={14} /> {t.view}
                                        </a>
                                    ) : (
                                        <span className="text-slate-400 text-xs italic">{t.noFile}</span>
                                    )}
                                </td>
                                <td className="px-6 py-4">
                                    {teacher.verified ? (
                                        <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold uppercase flex items-center w-fit gap-1">
                                            <CheckCircle size={12} /> {t.verified}
                                        </span>
                                    ) : (
                                        <span className="bg-amber-100 text-amber-700 px-2 py-1 rounded text-xs font-bold uppercase flex items-center w-fit gap-1">
                                            {t.pending}
                                        </span>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    {!teacher.verified && (
                                        <Button
                                            size="sm"
                                            isLoading={verifyingId === teacher.id}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                e.preventDefault();
                                                handleVerify(teacher.id);
                                            }}
                                            className="bg-green-600 hover:bg-green-700 h-8 text-xs px-3 shadow-sm z-10 relative"
                                        >
                                            {t.verifyTeacher}
                                        </Button>
                                    )}
                                    {teacher.verified && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                e.preventDefault();
                                                handleViewDetails(teacher);
                                            }}
                                            className="h-8 text-xs"
                                        >
                                            {t.details}
                                        </Button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                />
            </div>

            {/* Teacher Details Modal */}
            <Modal isOpen={!!selectedTeacher} onClose={() => setSelectedTeacher(null)} title={t.details}>
                {selectedTeacher && (
                    <div className="space-y-6">
                        {/* Print Header */}
                        <div className="hidden print:block text-center mb-8">
                            <h1 className="text-2xl font-bold">{t.teacherProfile}</h1>
                            <p>Ewan Platform</p>
                        </div>

                        <div className="flex items-center gap-4 border-b border-slate-100 pb-6">
                            <div className="h-20 w-20 rounded-full bg-slate-100 overflow-hidden border-2 border-slate-200">
                                {selectedTeacher.profile_photo ? (
                                    <img src={getStorageUrl(selectedTeacher.profile_photo)} className="h-full w-full object-cover" alt="profile" />
                                ) : (
                                    <span className="h-full w-full flex items-center justify-center text-2xl font-bold text-slate-300">
                                        {selectedTeacher.first_name.charAt(0)}
                                    </span>
                                )}
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-slate-900">{selectedTeacher.first_name} {selectedTeacher.last_name}</h3>
                                <p className="text-slate-500">{selectedTeacher.email}</p>
                                <div className="flex gap-2 mt-2">
                                    <span className={`text-xs px-2 py-1 rounded font-bold uppercase ${selectedTeacher.verified ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                                        {selectedTeacher.verified ? t.verified : t.unverified}
                                    </span>
                                    <span className={`text-xs px-2 py-1 rounded font-bold uppercase ${selectedTeacher.is_active ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'}`}>
                                        {selectedTeacher.is_active ? t.active : t.banned.replace('محظور', 'غير نشط')}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div className="p-3 bg-slate-50 rounded-lg">
                                <span className="block text-xs text-slate-400">{t.requestedService}</span>
                                <span className="font-medium text-slate-800">{getTeacherServiceNames(selectedTeacher)}</span>
                            </div>
                            <div className="p-3 bg-slate-50 rounded-lg">
                                <span className="block text-xs text-slate-400">{t.phone}</span>
                                <span className="font-medium text-slate-800" dir="ltr">{selectedTeacher.phone_number}</span>
                            </div>
                            <div className="p-3 bg-slate-50 rounded-lg">
                                <span className="block text-xs text-slate-400">{t.gender}</span>
                                <span className="font-medium text-slate-800 capitalize">{selectedTeacher.gender === 'male' ? t.genderMale : selectedTeacher.gender === 'female' ? t.genderFemale : t.na}</span>
                            </div>
                            <div className="p-3 bg-slate-50 rounded-lg">
                                <span className="block text-xs text-slate-400">ID</span>
                                <span className="font-medium text-slate-800">{selectedTeacher.id}</span>
                            </div>
                        </div>

                        {selectedTeacher.certificate && (
                            <div className="border border-slate-200 rounded-xl p-4">
                                <h4 className="font-bold text-slate-900 mb-2 flex items-center gap-2">
                                    <FileText size={18} /> {t.academicCertificate}
                                </h4>
                                <div className="bg-slate-100 rounded-lg p-2 flex justify-center mb-3">
                                    <img
                                        src={getStorageUrl(selectedTeacher.certificate)}
                                        alt="Certificate"
                                        className="max-h-60 object-contain"
                                    />
                                </div>
                                <Button
                                    variant="outline"
                                    className="w-full"
                                    onClick={() => {
                                        const link = document.createElement('a');
                                        link.href = getStorageUrl(selectedTeacher.certificate || '');
                                        link.download = `certificate_${selectedTeacher.id}`;
                                        link.target = "_blank";
                                        link.click();
                                    }}
                                >
                                    <Download size={16} className="mr-2" /> {t.downloadCertificate}
                                </Button>
                            </div>
                        )}

                        {!selectedTeacher.verified && (
                            <div className="flex gap-3">
                                <Button variant="outline" className="flex-1 text-red-600 border-red-200 hover:bg-red-50" onClick={() => handleReject(selectedTeacher.id)}>
                                    <XCircle size={18} className="mr-2" /> {t.reject}
                                </Button>
                                <Button
                                    className="flex-1 bg-green-600 hover:bg-green-700"
                                    onClick={() => handleVerify(selectedTeacher.id)}
                                    isLoading={verifyingId === selectedTeacher.id}
                                >
                                    <CheckCircle size={18} className="mr-2" /> {t.verifyTeacher}
                                </Button>
                            </div>
                        )}

                        <div className="pt-4 border-t border-slate-100 flex gap-3 print:hidden">
                            <Button variant="outline" onClick={handlePrint} className="flex-1">
                                <Printer size={18} className="mr-2" /> {t.printPdf}
                            </Button>
                            <Button variant="outline" onClick={() => setSelectedTeacher(null)} className="flex-1">
                                {t.close}
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};