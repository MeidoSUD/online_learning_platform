
// =====================================================
// !! CRITICAL UPDATE - V5 (FINAL) !!
// This file contains fixes for:
// 1. Safe Property Access (`?.`) to prevent crashes from incomplete data.
// 2. Unified Profile Logic for both Student (nested) and Teacher (flat) data.
// 3. Correct Update Method for Laravel file uploads.
// 4. UI updates: Gender/Role display, hidden student bio, delete account.
// 5. Visual Confirmation: The "Edit Profile" button is GREEN.
// =====================================================

import React, { useEffect, useState, useRef } from 'react';
import { useLanguage } from '../../Contexts/LanguageContext';
import { User, Mail, Phone, Edit, Camera, Loader2, Trash2, Shield, GraduationCap } from 'lucide-react';
import { authService, profileService, UserData, getStorageUrl, tokenService } from '../../Services/api';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { COUNTRIES } from '../../Utils/constants';

export const ProfileTab: React.FC = () => {
  const { t, language } = useLanguage();
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({ first_name: '', last_name: '', phone_number: '', bio: '' });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchProfile = async () => {
    if (!loading) setLoading(true);
    try {
      const response = await authService.getProfile();
      const userData = response.user?.data || response.data || response;
      if (!userData?.id) throw new Error("Invalid user data from API");
      setUser(userData);
      // Initialize form with fetched data
      setEditForm({
        first_name: userData.first_name || '',
        last_name: userData.last_name || '',
        phone_number: userData.phone_number || '',
        bio: userData.bio || ''
      });
      setPreviewUrl(null);
      setSelectedFile(null);
    } catch (error) {
      console.error("Failed to load profile", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleUpdateProfile = async () => {
    if (!user) return;
    setUpdating(true);
    try {
      const formData = new FormData();
      formData.append('first_name', editForm.first_name);
      formData.append('last_name', editForm.last_name);
      formData.append('phone_number', editForm.phone_number);
      if (user.role_id === 3 && editForm.bio) {
        formData.append('bio', editForm.bio);
      }
      if (selectedFile) {
        formData.append('profile_photo', selectedFile); 
      }

      await profileService.updateProfile(formData);
      await fetchProfile(); // Refetch data to show updates
      setIsEditOpen(false);
    } catch(e) {
      console.error("Update profile failed:", e);
      // Error alert is handled by the API service
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!confirm(language === 'ar' ? "هل أنت متأكد؟ سيتم حذف حسابك نهائياً." : "Are you sure? This will permanently delete your account.")) return;
    try {
      await authService.deleteAccount();
      tokenService.removeToken();
      window.location.reload();
    } catch(e) {
      console.error(e);
      alert("Failed to delete account");
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="animate-spin h-8 w-8 text-primary" />
      </div>
    );
  }

  if (!user) return <div className="p-10 text-center text-error">Failed to load profile.</div>;

  const isTeacher = user.role_id === 3;
  const isStudent = user.role_id === 4;
  const country = COUNTRIES.find(c => c.label === user.nationality);
  const flag = country?.flag || '🏳️';
  // Use full URL if provided, otherwise construct it
  const rawImage = isTeacher ? user.profile_image : user.profile?.profile_photo;
  const imageUrl = rawImage?.startsWith('http') ? rawImage : getStorageUrl(rawImage);

  const getRoleName = () => {
      switch(user.role_id) {
          case 1: return t.admin;
          case 3: return t.teacher;
          case 4: return 'Student';
          default: return 'User';
      }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-primary to-blue-600"></div>
        <div className="px-8 pb-8">
          <div className="relative flex justify-between items-end -mt-12 mb-6">
            <div className="relative">
              <div className="h-24 w-24 rounded-full border-4 border-white bg-slate-100 shadow-md flex items-center justify-center text-3xl font-bold text-slate-400 overflow-hidden">
                {imageUrl ? (
                  <img src={imageUrl} alt="Profile" className="h-full w-full object-cover" />
                ) : (
                  user.first_name?.charAt(0)?.toUpperCase() || 'U'
                )}
              </div>
            </div>
            {/* VISUAL CONFIRMATION: Button is green */}
            <Button className="bg-green-600 hover:bg-green-700" onClick={() => setIsEditOpen(true)}>
              <Edit size={16} className="mr-2" /> {t.editProfile}
            </Button>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{user.first_name} {user.last_name}</h1>
            <div className="flex flex-wrap gap-x-6 gap-y-3 mt-3 text-sm text-slate-500">
              <div className="flex items-center gap-2"><Mail size={16} /> {user.email || 'N/A'}</div>
              <div className="flex items-center gap-2" dir="ltr"><Phone size={16} /> {user.phone_number || 'N/A'}</div>
              {user.nationality && <div className="flex items-center gap-2"><span className="text-lg">{flag}</span> {user.nationality}</div>}
              <div className="flex items-center gap-2">{user.gender === 'male' ? '♂️' : '♀️'} <span className="capitalize">{user.gender || 'N/A'}</span></div>
              <div className="flex items-center gap-2">{isTeacher ? <User size={16}/> : <GraduationCap size={16}/>} {getRoleName()}</div>
            </div>
          </div>
        </div>
      </div>
      {isTeacher && (
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 mb-4">{t.bio}</h3>
          <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">{user.bio || "No biography provided."}</p>
        </div>
      )}
      <div className="mt-8 pt-8 border-t border-slate-200 flex justify-center">
        <button onClick={handleDeleteAccount} className="flex items-center gap-2 text-red-500 hover:text-red-700 text-sm font-medium transition-colors">
          <Trash2 size={16} /> {language === 'ar' ? "حذف الحساب" : "Delete Account"}
        </button>
      </div>
      <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title={t.editProfile}>
        <div className="space-y-4">
          <div className="flex justify-center mb-6">
            <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
              <div className="h-24 w-24 rounded-full overflow-hidden border-2 border-slate-200 bg-slate-50 flex items-center justify-center">
                {previewUrl ? <img src={previewUrl} alt="Preview" className="h-full w-full object-cover" /> :
                 imageUrl ? <img src={imageUrl} alt="Current profile" className="h-full w-full object-cover" /> :
                 <User size={32} className="text-slate-300" />}
              </div>
              <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="text-white" size={24} />
              </div>
            </div>
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label={t.firstName} value={editForm.first_name} onChange={(e) => setEditForm({...editForm, first_name: e.target.value})} />
            <Input label={t.lastName} value={editForm.last_name} onChange={(e) => setEditForm({...editForm, last_name: e.target.value})} />
          </div>
          <Input label={t.phone} value={editForm.phone_number} onChange={(e) => setEditForm({...editForm, phone_number: e.target.value})} />
          {isTeacher && (
            <div className="mb-4 w-full">
              <label className="block text-sm font-medium text-slate-700 mb-1">{t.bio}</label>
              <textarea className="w-full rounded-lg border border-slate-200 p-3 h-24 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" value={editForm.bio} onChange={(e) => setEditForm({...editForm, bio: e.target.value})} />
            </div>
          )}
          <Button className="w-full" onClick={handleUpdateProfile} isLoading={updating}>{t.save}</Button>
        </div>
      </Modal>
    </div>
  );
};
