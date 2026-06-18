
import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../Contexts/LanguageContext';
import { Plus, Trash2, Clock, Calendar, BookOpen, Loader2, Upload, AlertCircle, Edit, Check, X, Layers } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Modal } from '../ui/Modal';
import { Select } from '../ui/Select';
import { teacherService, referenceService, Course, CourseCategory, getStorageUrl, UserData, fetchWithProgress } from '../../Services/api';
import { useToast } from '../../Contexts/ToastContext';

interface TeacherCoursesTabProps {
    user?: UserData;
}

export const TeacherCoursesTab: React.FC<TeacherCoursesTabProps> = ({ user }) => {
    const { t, language } = useLanguage();
    const { showToast } = useToast();
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [categories, setCategories] = useState<CourseCategory[]>([]);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
    const [uploadProgress, setUploadProgress] = useState<number | null>(null);

    // Editing state
    const [editingId, setEditingId] = useState<number | null>(null);

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: '',
        duration_hours: '',
        category_id: '',
        course_type: 'single',
        status: 'published'
    });

    // Cover Image State
    const [coverImage, setCoverImage] = useState<File | null>(null);

    // Slots Builder State
    const [slots, setSlots] = useState<{ day: string, time: string }[]>([]);
    const [currentSlot, setCurrentSlot] = useState({ day: 'Sunday', time: '' });

    // Map day names to numbers (1 = Sunday)
    const dayMap: Record<string, number> = {
        'Sunday': 1, 'Monday': 2, 'Tuesday': 3, 'Wednesday': 4,
        'Thursday': 5, 'Friday': 6, 'Saturday': 7
    };
    const reverseDayMap: Record<number, string> = {
        1: 'Sunday', 2: 'Monday', 3: 'Tuesday', 4: 'Wednesday',
        5: 'Thursday', 6: 'Friday', 7: 'Saturday'
    };

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [coursesData, catsData] = await Promise.all([
                teacherService.getCourses(),
                referenceService.getCategories().catch(() => [])
            ]);
            setCourses(coursesData);
            setCategories(catsData);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setFormData({ name: '', description: '', price: '', duration_hours: '', category_id: '', course_type: 'single', status: 'published' });
        setCoverImage(null);
        setSlots([]);
        setEditingId(null);
        setError(null);
    };

    const handleEdit = (course: Course) => {
        setEditingId(course.id);
        setFormData({
            name: course.name,
            description: course.description || '',
            price: String(course.price),
            duration_hours: String(course.duration_hours || ''),
            category_id: String(course.category_id),
            course_type: course.course_type,
            status: course.status
        });

        // Parse slots if available
        const loadedSlots: { day: string, time: string }[] = [];
        if (course.slots && Array.isArray(course.slots)) {
            course.slots.forEach(s => {
                loadedSlots.push({ day: s.day, time: s.time });
            });
        }
        setSlots(loadedSlots);
        setModalOpen(true);
    };

    const handleAddSlot = () => {
        if (!currentSlot.time) return;
        setSlots([...slots, currentSlot]);
        setCurrentSlot({ ...currentSlot, time: '' });
    };

    const handleRemoveSlot = (idx: number) => {
        setSlots(slots.filter((_, i) => i !== idx));
    };

    const handleSubmit = async () => {
        setError(null);
        if (!formData.name || !formData.price || !formData.category_id) {
            showToast("Please fill all required fields", 'warning');
            return;
        }

        setSubmitting(true);
        try {
            // Group slots by Day Number
            const groupedSlots: { day: number, times: string[] }[] = [];
            const dayGroups: Record<number, string[]> = {};

            slots.forEach(slot => {
                const dayNum = dayMap[slot.day];
                if (!dayGroups[dayNum]) dayGroups[dayNum] = [];
                dayGroups[dayNum].push(slot.time);
            });

            Object.entries(dayGroups).forEach(([day, times]) => {
                groupedSlots.push({ day: Number(day), times });
            });

            if (editingId) {
                // Update using JSON
                const payload = {
                    ...formData,
                    available_slots: groupedSlots,
                    price: Number(formData.price),
                    service_id: user?.profile?.service || 4
                };
                await teacherService.updateCourse(editingId, payload);
            } else {
                // Create using Multipart
                const payload = new FormData();
                payload.append('name', formData.name);
                payload.append('description', formData.description);
                payload.append('price', formData.price);
                payload.append('duration_hours', formData.duration_hours);
                payload.append('category_id', formData.category_id);
                payload.append('course_type', formData.course_type);
                payload.append('status', formData.status);

                if (coverImage) payload.append('cover_image', coverImage);

                groupedSlots.forEach((group, index) => {
                    payload.append(`available_slots[${index}][day]`, String(group.day));
                    group.times.forEach((time, tIdx) => {
                        payload.append(`available_slots[${index}][times][${tIdx}]`, time);
                    });
                });

                await fetchWithProgress('/teacher/courses', {
                    method: 'POST',
                    body: payload,
                    onProgress: (pct) => setUploadProgress(pct)
                });
            }

            showToast(editingId ? "Course updated!" : "Course created!", 'success');
            setModalOpen(false);
            resetForm();
            await loadData();
        } catch (e: any) {
            console.error(e);
            setError(e.message || "Operation failed. Check your inputs.");
        } finally {
            setSubmitting(false);
            setUploadProgress(null);
        }
    };

    const handleDelete = async (id: number) => {
        // Fix: Use 'setLoading' instead of undefined 'setIsLoading'
        setLoading(true);
        try {
            const response = await teacherService.deleteCourse(id);
            if (response && response.success === false) {
                showToast(response.message || "Failed to delete course", 'error');
            } else {
                setConfirmDeleteId(null);
            }
        } catch (e: any) {
            showToast(e.message || "Failed to delete", 'error');
        } finally {
            setLoading(false);
        }
    };

    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    if (loading && courses.length === 0) return <div className="flex justify-center p-10"><Loader2 className="animate-spin text-primary" /></div>;

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-slate-900">{t.courses}</h2>
                <Button onClick={() => { resetForm(); setModalOpen(true); }}>
                    <Plus size={18} className="mr-2" /> Add New Course
                </Button>
            </div>

            {courses.length === 0 ? (
                <div className="text-center py-16 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                    <BookOpen className="mx-auto h-12 w-12 text-slate-300 mb-4" />
                    <p className="text-slate-500">You haven't created any courses yet.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {courses.map(course => {
                        const isConfirming = confirmDeleteId === course.id;

                        return (
                            <div key={course.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow flex flex-col">
                                <div className="h-32 bg-slate-100 flex items-center justify-center text-slate-300 overflow-hidden relative">
                                    {course.cover_image ? (
                                        <img src={getStorageUrl(course.cover_image)} alt={course.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <BookOpen size={40} />
                                    )}
                                    <div className="absolute top-2 right-2 flex gap-2">
                                        <button onClick={() => handleEdit(course)} className="p-2 bg-white/90 backdrop-blur-sm rounded-full text-blue-600 hover:bg-blue-600 hover:text-white transition-all shadow-sm">
                                            <Edit size={16} />
                                        </button>
                                    </div>
                                </div>
                                <div className="p-5 flex-1 flex flex-col">
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="font-bold text-lg text-slate-900 line-clamp-1">{course.name}</h3>
                                        <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${course.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
                                            {course.status}
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-400 mb-3 flex items-center gap-1">
                                        <Layers size={10} /> {language === 'ar' ? (course.category?.name_ar || 'تصنيف') : (course.category?.name_en || 'Category')}
                                    </p>
                                    <p className="text-sm text-slate-500 mb-4 line-clamp-2">{course.description}</p>

                                    <div className="mt-auto">
                                        <div className="flex items-center gap-4 text-xs text-slate-400 mb-4">
                                            <span className="flex items-center gap-1"><Clock size={14} /> {course.duration_hours} Hrs</span>
                                            <span className="flex items-center gap-1"><Calendar size={14} /> {course.created_at.split('T')[0]}</span>
                                        </div>

                                        <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                                            <span className="text-lg font-bold text-primary">{course.price} <span className="text-xs font-normal text-slate-400">{t.sar}</span></span>

                                            <div className="flex items-center">
                                                {isConfirming ? (
                                                    <div className="flex gap-1 animate-fade-in items-center">
                                                        <span className="text-[9px] font-bold text-red-600 uppercase mr-1">{language === 'ar' ? 'حذف؟' : 'Del?'}</span>
                                                        <button onClick={() => handleDelete(course.id)} className="h-8 w-8 bg-red-500 text-white rounded-lg flex items-center justify-center hover:bg-red-600 shadow-sm"><Check size={14} /></button>
                                                        <button onClick={() => setConfirmDeleteId(null)} className="h-8 w-8 bg-slate-100 text-slate-500 rounded-lg flex items-center justify-center hover:bg-slate-200 transition-colors" title="No"><X size={14} /></button>
                                                    </div>
                                                ) : (
                                                    <button onClick={() => setConfirmDeleteId(course.id)} className="text-slate-300 hover:text-red-500 transition-colors p-2 rounded-full hover:bg-red-50">
                                                        <Trash2 size={18} />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}

            <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? "Update Course" : "Create New Course"}>
                <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
                    {error && (
                        <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg flex items-start gap-2 border border-red-200">
                            <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                            <span>{error}</span>
                        </div>
                    )}

                    <Input
                        label="Course Title"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g. Advanced Mathematics"
                    />

                    {!editingId && (
                        <div className="mb-4 w-full">
                            <label className="block text-sm font-medium text-slate-700 mb-1">Cover Image</label>
                            <div className="border border-slate-200 rounded-lg p-3 bg-slate-50 flex items-center justify-between">
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => setCoverImage(e.target.files?.[0] || null)}
                                    className="text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                                />
                                {coverImage && <span className="text-xs text-green-600 font-medium">{coverImage.name}</span>}
                            </div>
                        </div>
                    )}

                    <div className="mb-4 w-full">
                        <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                        <textarea
                            className="w-full rounded-lg border border-slate-200 p-3 h-24 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <Select
                            label="Category"
                            options={[{ value: '', label: '-- Select --' }, ...categories.map(c => ({ value: String(c.id), label: language === 'ar' ? c.name_ar : c.name_en }))]}
                            value={formData.category_id}
                            onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                        />
                        <Select
                            label="Course Type"
                            options={[{ value: 'single', label: 'Single' }, { value: 'package', label: 'Package' }, { value: 'subscription', label: 'Subscription' }]}
                            value={formData.course_type}
                            onChange={(e) => setFormData({ ...formData, course_type: e.target.value })}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label="Price (SAR)"
                            type="number"
                            value={formData.price}
                            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                        />
                        <Input
                            label="Total Hours"
                            type="number"
                            value={formData.duration_hours}
                            onChange={(e) => setFormData({ ...formData, duration_hours: e.target.value })}
                        />
                    </div>

                    <Select
                        label="Status"
                        options={[{ value: 'published', label: 'Published' }, { value: 'draft', label: 'Draft' }]}
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    />

                    {/* Schedule Builder */}
                    <div className="border border-slate-200 rounded-xl p-4 bg-slate-50">
                        <h4 className="font-bold text-sm text-slate-700 mb-3">Course Schedule Slots</h4>
                        <div className="flex gap-2 mb-3">
                            <div className="flex-1">
                                <Select
                                    label=""
                                    options={days.map(d => ({ value: d, label: d }))}
                                    value={currentSlot.day}
                                    onChange={(e) => setCurrentSlot({ ...currentSlot, day: e.target.value })}
                                    className="mb-0"
                                />
                            </div>
                            <div className="flex-1">
                                <Input
                                    label=""
                                    type="time"
                                    value={currentSlot.time}
                                    onChange={(e) => setCurrentSlot({ ...currentSlot, time: e.target.value })}
                                    className="mb-0"
                                />
                            </div>
                            <Button size="sm" onClick={handleAddSlot} disabled={!currentSlot.time}>Add</Button>
                        </div>

                        <div className="space-y-2">
                            {slots.map((s, idx) => (
                                <div key={idx} className="flex justify-between items-center bg-white p-2 rounded border border-slate-200 text-sm">
                                    <span className="font-medium text-slate-700">{s.day} at {s.time}</span>
                                    <button onClick={() => handleRemoveSlot(idx)} className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-50 transition-colors">
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            ))}
                            {slots.length === 0 && <p className="text-xs text-slate-400 italic">No slots added yet.</p>}
                        </div>
                    </div>

                    {uploadProgress !== null && (
                        <div className="w-full bg-slate-100 rounded-full h-2 mb-4 overflow-hidden">
                            <div
                                className="bg-primary h-full transition-all duration-300"
                                style={{ width: `${uploadProgress}%` }}
                            ></div>
                            <p className="text-[10px] text-slate-500 mt-1 text-center font-bold">Uploading: {uploadProgress}%</p>
                        </div>
                    )}

                    <div className="pt-2">
                        <Button className="w-full h-12" onClick={handleSubmit} isLoading={submitting}>
                            {editingId ? "Update Course" : (uploadProgress !== null ? "Uploading..." : "Create Course")}
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};
