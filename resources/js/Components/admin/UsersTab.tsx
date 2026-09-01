import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../Contexts/LanguageContext';
import {
    Search, MoreVertical, Shield, User, GraduationCap, Loader2,
    Trash2, Ban, Eye, Key, CheckCircle, X, Plus, Filter,
    UserPlus, Edit, CheckSquare, Square, Mail, Phone, Globe, FileSpreadsheet, FileText
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { Pagination } from '../ui/Pagination';
import { adminService, AdminUser } from '../../Services/api';
import { useToast } from '../../Contexts/ToastContext';
import { UserProfileModal } from './UserProfileModal';

export const UsersTab: React.FC = () => {
    const { t, direction, language } = useLanguage();
    const { showToast } = useToast();
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState<string>('all');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [verifiedFilter, setVerifiedFilter] = useState<string>('all');
    const [totalPages, setTotalPages] = useState(1);
    const [pageSize, setPageSize] = useState(25);
    
    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 25;

    // UI State
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
    const [openMenuId, setOpenMenuId] = useState<number | null>(null);
    const [formLoading, setFormLoading] = useState(false);
    const [exportLoading, setExportLoading] = useState<'xlsx' | 'pdf' | null>(null);

    // Form State
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        email: '',
        phone_number: '',
        password: '',
        role_id: 4, // Student default
        gender: 'male',
        nationality: ''
    });

    const [tempPassword, setTempPassword] = useState('');
    const [profileModalUserId, setProfileModalUserId] = useState<number | null>(null);

    useEffect(() => {
        fetchUsers();
    }, [roleFilter, statusFilter, verifiedFilter, searchTerm, currentPage]);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const filters: any = { page: currentPage, per_page: ITEMS_PER_PAGE };
            if (roleFilter !== 'all') filters.role_id = roleFilter;
            if (statusFilter !== 'all') filters.is_active = statusFilter === 'active' ? 'true' : 'false';
            if (verifiedFilter !== 'all') filters.verified = verifiedFilter === 'verified' ? 'true' : 'false';
            if (searchTerm.trim()) filters.search = searchTerm.trim();

            const result = await adminService.getUsers(filters);
            const items = Array.isArray(result?.items) ? result.items : Array.isArray(result) ? result : [];
            setUsers(items);
            setPageSize(Number(result?.perPage ?? ITEMS_PER_PAGE));
            setTotalPages(Number(result?.lastPage ?? 1));
        } catch (e) {
            console.error(e);
            showToast(t.error, 'error');
        } finally {
            setLoading(false);
        }
    };

    const exportUsers = async (format: 'xlsx' | 'pdf') => {
        setExportLoading(format);
        try {
            const filters: Record<string, string> = { format };
            if (roleFilter !== 'all') filters.role_id = roleFilter;
            if (statusFilter !== 'all') filters.is_active = statusFilter === 'active' ? 'true' : 'false';
            if (verifiedFilter !== 'all') filters.verified = verifiedFilter === 'verified' ? 'true' : 'false';
            if (searchTerm.trim()) filters.search = searchTerm.trim();

            const blob = await adminService.exportUsers(filters);
            const url = URL.createObjectURL(blob);
            if (format === 'pdf') {
                const printWindow = window.open(url, '_blank');
                if (!printWindow) throw new Error('Popup blocked');
                printWindow.onload = () => printWindow.print();
            } else {
                const link = document.createElement('a');
                link.href = url;
                link.download = 'users-export.xlsx';
                link.click();
            }
            setTimeout(() => URL.revokeObjectURL(url), 60000);
        } catch (e: any) {
            showToast(e.message || t.error, 'error');
        } finally {
            setExportLoading(null);
        }
    };

    const resetForm = () => {
        setFormData({
            first_name: '',
            last_name: '',
            email: '',
            phone_number: '',
            password: '',
            role_id: 4,
            gender: 'male',
            nationality: ''
        });
        setIsEditing(false);
        setFormLoading(false);
    };

    const handleOpenCreate = () => {
        resetForm();
        setIsFormModalOpen(true);
    };

    const handleOpenEdit = (user: AdminUser) => {
        setFormData({
            first_name: user.first_name || '',
            last_name: user.last_name || '',
            email: user.email || '',
            phone_number: user.phone_number || '',
            password: '', // Don't show password
            role_id: user.role_id,
            gender: user.gender || 'male',
            nationality: user.nationality || ''
        });
        setSelectedUser(user);
        setIsEditing(true);
        setIsFormModalOpen(true);
        setOpenMenuId(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormLoading(true);
        try {
            if (isEditing && selectedUser) {
                const updateData = { ...formData };
                if (!updateData.password) delete (updateData as any).password;
                await adminService.updateUser(selectedUser.id, updateData);
                // Update local lists and the currently viewed user so UI reflects server change immediately
                setUsers(prev => prev.map(u => u.id === selectedUser.id ? { ...u, ...updateData } : u));
                setSelectedUser(prev => prev ? { ...prev, ...updateData } : prev);
                showToast(t.userUpdatedSuccess, 'success');
            } else {
                await adminService.createUser(formData);
                showToast(t.userCreatedSuccess, 'success');
            }
            setIsFormModalOpen(false);
            fetchUsers();
        } catch (e: any) {
            showToast(t.error, 'error');
        } finally {
            setFormLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm(t.confirmAction)) return;
        try {
            await adminService.deleteUser(id);
            showToast(t.userDeletedSuccess, 'success');
            setUsers(users.filter(u => u.id !== id));
            setOpenMenuId(null);
            if (selectedUser?.id === id) setSelectedUser(null);
        } catch (e: any) { showToast(t.error, 'error'); }
    };

    const handleToggleStatus = async (user: AdminUser) => {
        try {
            if (user.is_active) {
                await adminService.suspendUser(user.id);
            } else {
                await adminService.activateUser(user.id);
            }
            const newStatus = !user.is_active;
            setUsers(users.map(u => u.id === user.id ? { ...u, is_active: newStatus } : u));
            if (selectedUser?.id === user.id) setSelectedUser(prev => prev ? { ...prev, is_active: newStatus } : prev);
            setOpenMenuId(null);
            showToast(t.updatedSuccessfully, 'success');
        } catch (e: any) { showToast(t.error, 'error'); }
    };

    const handleToggleVerification = async (user: AdminUser) => {
        try {
            const newStatus = !user.verified;
            await adminService.verifyUser(user.id, newStatus);
            setUsers(users.map(u => u.id === user.id ? { ...u, verified: newStatus } : u));
            if (selectedUser?.id === user.id) setSelectedUser(prev => prev ? { ...prev, verified: newStatus } : prev);
            setOpenMenuId(null);
            showToast(t.updatedSuccessfully, 'success');
        } catch (e: any) { showToast(t.error, 'error'); }
    };

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedUser) return;
        try {
            await adminService.resetUserPassword(selectedUser.id, { new_password: tempPassword });
            showToast(t.success, 'success');
            setIsPasswordModalOpen(false);
            setTempPassword('');
        } catch (e: any) { showToast(t.error, 'error'); }
    };

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, roleFilter, statusFilter, verifiedFilter]);

    const paginatedUsers = users;

    const getRoleIcon = (roleId: number) => {
        switch (roleId) {
            case 1: return <Shield size={16} className="text-[var(--accent)]" />;
            case 3: return <User size={16} className="text-secondary" />;
            default: return <GraduationCap size={16} className="text-primary" />;
        }
    };

    if (loading && users.length === 0) return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-primary" /></div>;

    return (
        <div className="space-y-6 animate-fade-in" onClick={() => setOpenMenuId(null)}>
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-[var(--text-main)]">{t.users}</h2>
                <div className="flex flex-wrap gap-2">
                    <Button variant="outline" onClick={() => exportUsers('xlsx')} disabled={!!exportLoading} className="flex items-center gap-2">
                        {exportLoading === 'xlsx' ? <Loader2 className="animate-spin" size={18} /> : <FileSpreadsheet size={18} />}
                        Export XLSX
                    </Button>
                    <Button variant="outline" onClick={() => exportUsers('pdf')} disabled={!!exportLoading} className="flex items-center gap-2">
                        {exportLoading === 'pdf' ? <Loader2 className="animate-spin" size={18} /> : <FileText size={18} />}
                        Export PDF
                    </Button>
                    <Button onClick={handleOpenCreate} className="flex items-center gap-2">
                        <UserPlus size={20} /> {t.createUser}
                    </Button>
                </div>
            </div>

            <div className="bg-white p-4 rounded-[var(--radius-md)] border border-[var(--border)] shadow-[var(--shadow-sm)]">
                <div className="flex flex-col md:flex-row gap-4 mb-6">
                    <div className="relative flex-1">
                        <Search className={`absolute top-1/2 -translate-y-1/2 text-[var(--text-muted)] ${direction === 'rtl' ? 'right-3' : 'left-3'}`} size={20} />
                        <input
                            type="text"
                            placeholder={t.searchPlaceholder}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className={`w-full pl-10 pr-4 py-2 rounded-lg border border-[var(--border)] focus:outline-none focus:border-primary ${direction === 'rtl' ? 'pr-10 pl-4' : ''}`}
                        />
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                            <Filter size={18} className="text-[var(--text-muted)]" />
                            <select
                                value={roleFilter}
                                onChange={(e) => setRoleFilter(e.target.value)}
                                className="bg-[var(--light-bg)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
                            >
                                <option value="all">{t.allRoles || 'All Roles'}</option>
                                <option value="1">{t.admin}</option>
                                <option value="3">{t.teacher}</option>
                                <option value="4">{t.student}</option>
                            </select>
                        </div>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="bg-[var(--light-bg)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
                        >
                            <option value="all">{t.allStatus}</option>
                            <option value="active">{t.activeStatus}</option>
                            <option value="inactive">{t.inactiveStatus}</option>
                        </select>
                        <select
                            value={verifiedFilter}
                            onChange={(e) => setVerifiedFilter(e.target.value)}
                            className="bg-[var(--light-bg)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
                        >
                            <option value="all">{t.verifiedStatus + " / " + t.unverifiedStatus}</option>
                            <option value="verified">{t.verifiedStatus}</option>
                            <option value="unverified">{t.unverifiedStatus}</option>
                        </select>
                    </div>
                </div>

                <div className="overflow-x-auto min-h-[400px]">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-[var(--light-bg)] border-b border-[var(--border)]">
                            <tr>
                                <th className="px-6 py-3 font-semibold text-navy">{t.name}</th>
                                <th className="px-6 py-3 font-semibold text-navy">{t.phone}</th>
                                <th className="px-6 py-3 font-semibold text-navy">{t.role}</th>
                                <th className="px-6 py-3 font-semibold text-navy">{t.verifiedStatus}</th>
                                <th className="px-6 py-3 font-semibold text-navy">{t.status}</th>
                                <th className="px-6 py-3 font-semibold text-navy text-right">{t.actions}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border)]">
                            {paginatedUsers.length === 0 && !loading ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-8 text-center text-[var(--text-muted)]">{t.noResults}</td>
                                </tr>
                            ) : (
                                paginatedUsers.map(user => (
                                    <tr key={user.id} className="hover:bg-[var(--light-bg)] cursor-pointer" onClick={() => setProfileModalUserId(user.id)}>
                                        <td className="px-6 py-4">
                                            <div>
                                                <div className="font-bold text-[var(--text-main)]">{user.first_name} {user.last_name}</div>
                                                <div className="text-xs text-[var(--text-muted)]">{user.email}</div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-medium text-[var(--text-main)]" dir="ltr">
                                                {user.phone_number || '—'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 capitalize bg-[var(--light-bg)] px-3 py-1 rounded-full w-fit text-xs font-medium">
                                                {getRoleIcon(user.role_id)}
                                                {user.role_id === 1 ? t.admin : user.role_id === 3 ? t.teacher : t.student}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {user.role_id === 3 ? (
                                                <span className={`flex items-center gap-1 text-[10px] font-bold uppercase ${user.verified ? 'text-primary' : 'text-amber-600'}`}>
                                                    {user.verified ? <CheckCircle size={12} /> : <X size={12} />}
                                                    {user.verified ? t.verifiedStatus : t.unverifiedStatus}
                                                </span>
                                            ) : (
                                                <span className="text-[var(--text-muted)]">--</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${user.is_active ? 'bg-primary-pale text-primary' : 'bg-red-100 text-red-700'
                                                }`}>
                                                {user.is_active ? t.activeStatus : t.inactiveStatus}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right relative">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); setOpenMenuId(openMenuId === user.id ? null : user.id); }}
                                                className="text-[var(--text-muted)] hover:text-[var(--text-muted)] p-2 rounded-full hover:bg-[var(--light-bg)]"
                                            >
                                                <MoreVertical size={18} />
                                            </button>

                                            {openMenuId === user.id && (
                                                <div className={`absolute z-20 w-48 bg-white rounded-[var(--radius-md)] shadow-[var(--shadow-lg)] ring-1 ring-black ring-opacity-5 py-1 ${direction === 'rtl' ? 'left-8' : 'right-8'} top-8`}>
                                                    <button onClick={(e) => { e.stopPropagation(); setProfileModalUserId(user.id); setOpenMenuId(null); }} className="w-full text-left px-4 py-2 text-sm hover:bg-[var(--light-bg)] flex items-center gap-2 text-navy">
                                                        <Eye size={16} /> {t.viewDetails}
                                                    </button>

                                                    <button onClick={(e) => { e.stopPropagation(); handleOpenEdit(user); }} className="w-full text-left px-4 py-2 text-sm hover:bg-[var(--light-bg)] flex items-center gap-2 text-secondary">
                                                        <Edit size={16} /> {t.edit}
                                                    </button>

                                                    {user.role_id === 3 && (
                                                        <button onClick={(e) => { e.stopPropagation(); handleToggleVerification(user); }} className={`w-full text-left px-4 py-2 text-sm hover:bg-[var(--light-bg)] flex items-center gap-2 ${user.verified ? 'text-amber-600' : 'text-primary'}`}>
                                                            {user.verified ? <Square size={16} /> : <CheckSquare size={16} />}
                                                            {user.verified ? t.unverifyTeacher : t.verifyTeacher}
                                                        </button>
                                                    )}

                                                    <button onClick={(e) => { e.stopPropagation(); handleToggleStatus(user); }} className={`w-full text-left px-4 py-2 text-sm hover:bg-[var(--light-bg)] flex items-center gap-2 ${user.is_active ? 'text-orange-600' : 'text-primary'}`}>
                                                        {user.is_active ? <Ban size={16} /> : <CheckCircle size={16} />}
                                                        {user.is_active ? t.deactivate : t.activate}
                                                    </button>

                                                    <button onClick={(e) => { e.stopPropagation(); setSelectedUser(user); setIsPasswordModalOpen(true); setOpenMenuId(null); }} className="w-full text-left px-4 py-2 text-sm hover:bg-[var(--light-bg)] flex items-center gap-2 text-[var(--text-muted)]">
                                                        <Key size={16} /> {t.resetPassword}
                                                    </button>

                                                    <div className="border-t border-[var(--border)] my-1"></div>
                                                    <button onClick={(e) => { e.stopPropagation(); handleDelete(user.id); }} className="w-full text-left px-4 py-2 text-sm hover:bg-[var(--light-bg)] flex items-center gap-2 text-red-600">
                                                        <Trash2 size={16} /> {t.delete}
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                    {loading && <div className="flex justify-center p-8"><Loader2 className="animate-spin text-primary/30" /></div>}
                </div>

                <div className="flex items-center justify-between px-6 py-3 border-t border-[var(--border)] bg-white text-sm text-[var(--text-muted)]">
                    <span>
                        {t.page} <span className="font-medium mx-1 text-navy">{currentPage}</span> {t.of} <span className="font-medium mx-1 text-navy">{totalPages}</span>
                    </span>
                    <span>
                        {pageSize} {t.perPage || 'per page'}
                    </span>
                </div>

                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                />
            </div>

            {/* Create/Edit Modal */}
            <Modal isOpen={isFormModalOpen} onClose={() => setIsFormModalOpen(false)} title={isEditing ? t.editUser : t.createUser}>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-[var(--text-muted)] uppercase">{t.firstName}</label>
                            <input
                                required
                                type="text"
                                value={formData.first_name}
                                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                                className="w-full p-2.5 rounded-[var(--radius-md)] border border-[var(--border)] focus:outline-none focus:border-primary text-sm"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-[var(--text-muted)] uppercase">{t.lastName}</label>
                            <input
                                required
                                type="text"
                                value={formData.last_name}
                                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                                className="w-full p-2.5 rounded-[var(--radius-md)] border border-[var(--border)] focus:outline-none focus:border-primary text-sm"
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-[var(--text-muted)] uppercase">{t.email}</label>
                        <input
                            required
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className="w-full p-2.5 rounded-[var(--radius-md)] border border-[var(--border)] focus:outline-none focus:border-primary text-sm"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-[var(--text-muted)] uppercase">{t.phone}</label>
                            <input
                                required
                                type="tel"
                                value={formData.phone_number}
                                onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                                className="w-full p-2.5 rounded-[var(--radius-md)] border border-[var(--border)] focus:outline-none focus:border-primary text-sm"
                                dir="ltr"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-[var(--text-muted)] uppercase">{t.role}</label>
                            <select
                                value={formData.role_id}
                                onChange={(e) => setFormData({ ...formData, role_id: Number(e.target.value) })}
                                className="w-full p-2.5 rounded-[var(--radius-md)] border border-[var(--border)] focus:outline-none focus:border-primary text-sm"
                            >
                                <option value="4">{t.student}</option>
                                <option value="3">{t.teacher}</option>
                                <option value="1">{t.admin}</option>
                            </select>
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-[var(--text-muted)] uppercase">{isEditing ? `${t.password} (${t.optional || 'Optional'})` : t.password}</label>
                        <input
                            required={!isEditing}
                            type="password"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            placeholder={isEditing ? "Leave blank to keep current" : ""}
                            className="w-full p-2.5 rounded-[var(--radius-md)] border border-[var(--border)] focus:outline-none focus:border-primary text-sm"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-[var(--text-muted)] uppercase">{t.gender}</label>
                            <select
                                value={formData.gender}
                                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                                className="w-full p-2.5 rounded-[var(--radius-md)] border border-[var(--border)] focus:outline-none focus:border-primary text-sm"
                            >
                                <option value="male">{t.genderMale}</option>
                                <option value="female">{t.genderFemale}</option>
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-[var(--text-muted)] uppercase">{t.nationality}</label>
                            <input
                                type="text"
                                value={formData.nationality}
                                onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
                                className="w-full p-2.5 rounded-[var(--radius-md)] border border-[var(--border)] focus:outline-none focus:border-primary text-sm"
                            />
                        </div>
                    </div>

                    <div className="flex gap-2 pt-4">
                        <Button variant="outline" className="flex-1" type="button" onClick={() => setIsFormModalOpen(false)}>{t.cancel}</Button>
                        <Button className="flex-1" type="submit" disabled={formLoading}>
                            {formLoading ? <Loader2 className="animate-spin h-5 w-5 mx-auto" /> : isEditing ? t.save : t.create}
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Password Reset Modal */}
            <Modal isOpen={isPasswordModalOpen} onClose={() => setIsPasswordModalOpen(false)} title={t.resetPassword}>
                <form onSubmit={handleResetPassword} className="space-y-4">
                    <p className="text-sm text-[var(--text-muted)]">{t.resetPasswordTo}</p>
                    <input
                        required
                        type="text"
                        value={tempPassword}
                        onChange={(e) => setTempPassword(e.target.value)}
                        placeholder="Enter temporary password"
                        className="w-full p-2.5 rounded-[var(--radius-md)] border border-[var(--border)] focus:outline-none focus:border-primary text-sm"
                    />
                    <div className="flex gap-2">
                        <Button variant="outline" className="flex-1" type="button" onClick={() => setIsPasswordModalOpen(false)}>{t.cancel}</Button>
                        <Button className="flex-1" type="submit">{t.confirm}</Button>
                    </div>
                </form>
            </Modal>

            {/* User Details Modal */}
            <Modal isOpen={!!selectedUser && !isFormModalOpen && !isPasswordModalOpen} onClose={() => setSelectedUser(null)} title={t.details}>
                {selectedUser && (
                    <div className="space-y-6">
                        <div className="flex flex-col items-center">
                            <div className="h-20 w-20 rounded-full bg-[var(--light-bg)] mb-3 flex items-center justify-center text-3xl font-bold text-[var(--text-muted)]">
                                {selectedUser.first_name?.charAt(0)}
                            </div>
                            <h3 className="text-xl font-bold text-[var(--text-main)]">{selectedUser.first_name} {selectedUser.last_name}</h3>
                            <div className="flex items-center gap-1 text-[var(--text-muted)] text-sm">
                                <Mail size={14} />
                                {selectedUser.email}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-3 bg-[var(--light-bg)] rounded-[var(--radius-md)] border border-[var(--border)]">
                                <span className="block text-[10px] font-bold text-[var(--text-muted)] uppercase mb-1">{t.phone}</span>
                                <span className="font-semibold text-navy flex items-center gap-2" dir="ltr">
                                    <Phone size={14} className="text-[var(--text-muted)]" />
                                    {selectedUser.phone_number}
                                </span>
                            </div>
                            <div className="p-3 bg-[var(--light-bg)] rounded-[var(--radius-md)] border border-[var(--border)]">
                                <span className="block text-[10px] font-bold text-[var(--text-muted)] uppercase mb-1">{t.role}</span>
                                <span className="font-semibold text-navy flex items-center gap-2">
                                    {getRoleIcon(selectedUser.role_id)}
                                    {selectedUser.role_id === 1 ? t.admin : selectedUser.role_id === 3 ? t.teacher : t.student}
                                </span>
                            </div>
                            <div className="p-3 bg-[var(--light-bg)] rounded-[var(--radius-md)] border border-[var(--border)]">
                                <span className="block text-[10px] font-bold text-[var(--text-muted)] uppercase mb-1">{t.gender}</span>
                                <span className="font-semibold text-navy capitalize">
                                    {selectedUser.gender === 'male' ? t.genderMale : t.genderFemale}
                                </span>
                            </div>
                            <div className="p-3 bg-[var(--light-bg)] rounded-[var(--radius-md)] border border-[var(--border)]">
                                <span className="block text-[10px] font-bold text-[var(--text-muted)] uppercase mb-1">{t.nationality}</span>
                                <span className="font-semibold text-navy flex items-center gap-2">
                                    <Globe size={14} className="text-[var(--text-muted)]" />
                                    {selectedUser.nationality  }
                                </span>
                            </div>
                            <div className="p-3 bg-[var(--light-bg)] rounded-[var(--radius-md)] border border-[var(--border)]">
                                <span className="block text-[10px] font-bold text-[var(--text-muted)] uppercase mb-1">{t.status}</span>
                                <span className={`font-bold ${selectedUser.is_active ? 'text-primary' : 'text-red-600'}`}>
                                    {selectedUser.is_active ? t.activeStatus : t.inactiveStatus}
                                </span>
                            </div>
                            <div className="p-3 bg-[var(--light-bg)] rounded-[var(--radius-md)] border border-[var(--border)]">
                                <span className="block text-[10px] font-bold text-[var(--text-muted)] uppercase mb-1">{t.signUp}</span>
                                <span className="font-semibold text-navy">
                                    {new Date(selectedUser.created_at).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US')}
                                </span>
                            </div>
                        </div>

                        {selectedUser.role_id === 3 && (
                            <div className={`p-4 rounded-[var(--radius-md)] border flex items-center justify-between ${selectedUser.verified ? 'bg-primary-pale border-green-100' : 'bg-amber-50 border-amber-100'}`}>
                                <div>
                                    <span className="block text-[10px] font-bold text-[var(--text-muted)] uppercase mb-1">{t.verifiedStatus}</span>
                                    <span className={`font-bold ${selectedUser.verified ? 'text-primary' : 'text-amber-700'}`}>
                                        {selectedUser.verified ? t.verifiedStatus : t.unverifiedStatus}
                                    </span>
                                </div>
                                <Button
                                    size="sm"
                                    variant={selectedUser.verified ? 'outline' : 'primary'}
                                    onClick={() => handleToggleVerification(selectedUser)}
                                    className={selectedUser.verified ? 'border-amber-200 text-amber-600 hover:bg-amber-100' : ''}
                                >
                                    {selectedUser.verified ? t.unverifyTeacher : t.verifyTeacher}
                                </Button>
                            </div>
                        )}

                        <div className="flex gap-2">
                            <Button variant="outline" className="flex-1" onClick={() => handleOpenEdit(selectedUser)}>
                                <Edit size={16} className="mr-2" /> {t.edit}
                            </Button>
                            <Button variant="outline" className="flex-1 text-red-600 border-red-200 hover:bg-red-50" onClick={() => handleDelete(selectedUser.id)}>
                                <Trash2 size={16} className="mr-2" /> {t.delete}
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>

            <UserProfileModal
                isOpen={!!profileModalUserId}
                onClose={() => setProfileModalUserId(null)}
                userId={profileModalUserId || 0}
            />
        </div>
    );
};
