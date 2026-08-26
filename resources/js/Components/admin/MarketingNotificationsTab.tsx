import React, { FormEvent, useEffect, useState } from 'react';
import { Loader2, RefreshCw, Search, Send, Smartphone, Bell, Users } from 'lucide-react';
import { adminService } from '../../Services/api';
import { useLanguage } from '../../Contexts/LanguageContext';
import { useToast } from '../../Contexts/ToastContext';
import { Modal } from '../ui/Modal';

type Channel = 'push' | 'sms' | 'both';
type TargetType = 'all' | 'teachers' | 'students' | 'single_user';
type SearchUser = { id: number; name: string; email?: string; phone_number?: string };
type Campaign = {
  id: number; title: string; channel: Channel; target_type: TargetType; status: string;
  total_targeted: number; total_sent: number; scheduled_at?: string | null; updated_at: string;
  target_user?: { first_name: string; last_name: string } | null;
};

export const MarketingNotificationsTab: React.FC = () => {
  const { language, direction } = useLanguage();
  const { showToast } = useToast();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [channel, setChannel] = useState<Channel>('push');
  const [targetType, setTargetType] = useState<TargetType>('all');
  const [scheduledAt, setScheduledAt] = useState('');
  const [search, setSearch] = useState('');
  const [users, setUsers] = useState<SearchUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<SearchUser | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [targetCount, setTargetCount] = useState(0);

  const copy = language === 'ar' ? {
    heading: 'الإشعارات التسويقية', intro: 'أنشئ رسائل موجهة وتابع حالة تسليمها.', title: 'عنوان الإشعار', body: 'محتوى الإشعار',
    channel: 'قناة الإرسال', target: 'الجمهور المستهدف', push: 'إشعار فوري', sms: 'رسالة نصية', both: 'كلاهما',
    all: 'جميع المستخدمين', teachers: 'المعلمون فقط', students: 'الطلاب فقط', single: 'مستخدم محدد', search: 'ابحث بالاسم أو البريد أو الجوال',
    schedule: 'جدولة الإرسال (اختياري)', send: 'مراجعة وإرسال', history: 'سجل الحملات', sent: 'تم الإرسال', pending: 'قيد الانتظار', failed: 'فشل',
    confirm: 'تأكيد الإرسال', confirmation: 'هل أنت متأكد من إرسال هذا الإشعار إلى', users: 'مستخدم؟', cancel: 'إلغاء', confirmSend: 'إرسال الآن', noCampaigns: 'لا توجد حملات بعد.', smsCount: 'حرفًا (الحد المقترح للرسالة النصية: 160)', date: 'تاريخ الإرسال', status: 'الحالة',
  } : {
    heading: 'Marketing Notifications', intro: 'Create targeted messages and track their delivery.', title: 'Notification title', body: 'Notification content',
    channel: 'Delivery channel', target: 'Target audience', push: 'Push notification', sms: 'SMS', both: 'Both',
    all: 'All users', teachers: 'Teachers only', students: 'Students only', single: 'Specific user', search: 'Search by name, email, or phone',
    schedule: 'Schedule delivery (optional)', send: 'Review & send', history: 'Campaign history', sent: 'Sent', pending: 'Pending', failed: 'Failed',
    confirm: 'Confirm delivery', confirmation: 'Are you sure you want to send this notification to', users: 'users?', cancel: 'Cancel', confirmSend: 'Send now', noCampaigns: 'No campaigns yet.', smsCount: 'characters (recommended SMS limit: 160)', date: 'Sent at', status: 'Status',
  };

  const loadCampaigns = async () => {
    setLoading(true);
    try {
      const response = await adminService.getMarketingNotifications();
      const data = response.data;
      setCampaigns(Array.isArray(data) ? data : (data?.data ?? []));
    } catch {
      showToast(language === 'ar' ? 'تعذر تحميل سجل الحملات' : 'Could not load campaign history', 'error');
    } finally { setLoading(false); }
  };

  useEffect(() => { loadCampaigns(); }, []);
  useEffect(() => {
    if (targetType !== 'single_user' || search.trim().length < 2) { setUsers([]); return; }
    const timeout = window.setTimeout(async () => {
      try { const response = await adminService.searchMarketingUsers(search.trim()); setUsers(response.data ?? []); }
      catch { setUsers([]); }
    }, 300);
    return () => window.clearTimeout(timeout);
  }, [search, targetType]);

  const prepareSubmission = async (event: FormEvent) => {
    event.preventDefault();
    if (targetType === 'single_user' && !selectedUser) {
      showToast(language === 'ar' ? 'اختر مستخدمًا أولاً' : 'Select a user first', 'error'); return;
    }
    try {
      const response = await adminService.getMarketingAudienceCount(targetType, selectedUser?.id);
      setTargetCount(response.data?.total_targeted ?? 0);
      setConfirming(true);
    } catch (error: any) { showToast(error.message || 'Unable to calculate audience', 'error'); }
  };

  const submit = async () => {
    setSubmitting(true);
    try {
      await adminService.sendMarketingNotification({ title, body, channel, target_type: targetType, target_user_id: selectedUser?.id, scheduled_at: scheduledAt || null });
      showToast(scheduledAt ? (language === 'ar' ? 'تمت جدولة الحملة بنجاح' : 'Campaign scheduled successfully') : (language === 'ar' ? 'تمت إضافة الحملة إلى قائمة الإرسال' : 'Campaign queued successfully'), 'success');
      setTitle(''); setBody(''); setScheduledAt(''); setSelectedUser(null); setSearch(''); setConfirming(false); loadCampaigns();
    } catch (error: any) { showToast(error.message || 'Unable to queue campaign', 'error'); }
    finally { setSubmitting(false); }
  };

  const targetLabel = (campaign: Campaign) => ({ all: copy.all, teachers: copy.teachers, students: copy.students, single_user: campaign.target_user ? `${campaign.target_user.first_name} ${campaign.target_user.last_name}` : copy.single }[campaign.target_type]);
  const statusClass = (status: string) => status === 'sent' ? 'bg-emerald-100 text-emerald-700' : status === 'failed' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700';
  const statusLabel = (status: string) => status === 'sent' ? copy.sent : status === 'failed' ? copy.failed : copy.pending;

  return <div className="space-y-6 animate-fade-in" dir={direction}>
    <div><h1 className="text-2xl font-bold text-[var(--text-main)]">{copy.heading}</h1><p className="text-sm text-[var(--text-muted)] mt-1">{copy.intro}</p></div>
    <form onSubmit={prepareSubmission} className="bg-white rounded-[var(--radius-md)] border border-[var(--border)] p-5 sm:p-6 space-y-5">
      <div className="grid md:grid-cols-2 gap-5"><label className="text-sm font-medium text-[var(--text-main)]">{copy.title}<input required maxLength={120} value={title} onChange={e => setTitle(e.target.value)} className="mt-2 w-full rounded-lg border border-[var(--border)] px-3 py-2.5 outline-none focus:border-primary" /></label>
        <label className="text-sm font-medium text-[var(--text-main)]">{copy.schedule}<input type="datetime-local" value={scheduledAt} min={new Date(Date.now() + 60000).toISOString().slice(0, 16)} onChange={e => setScheduledAt(e.target.value)} className="mt-2 w-full rounded-lg border border-[var(--border)] px-3 py-2.5 outline-none focus:border-primary" /></label></div>
      <label className="block text-sm font-medium text-[var(--text-main)]">{copy.body}<textarea required maxLength={1000} rows={4} value={body} onChange={e => setBody(e.target.value)} className="mt-2 w-full resize-y rounded-lg border border-[var(--border)] px-3 py-2.5 outline-none focus:border-primary" /><span className={`mt-1 block text-xs ${body.length > 160 && (channel === 'sms' || channel === 'both') ? 'text-orange-600' : 'text-[var(--text-muted)]'}`}>{body.length} {copy.smsCount}</span></label>
      <div className="grid md:grid-cols-2 gap-5"><fieldset><legend className="text-sm font-medium text-[var(--text-main)] mb-2">{copy.channel}</legend><div className="flex flex-wrap gap-2">{([['push', copy.push, Bell], ['sms', copy.sms, Smartphone], ['both', copy.both, Send]] as const).map(([value, label, Icon]) => <label key={value} className={`cursor-pointer rounded-lg border px-3 py-2 text-sm flex gap-2 items-center ${channel === value ? 'border-primary bg-primary-pale text-primary' : 'border-[var(--border)]'}`}><input className="sr-only" type="radio" checked={channel === value} onChange={() => setChannel(value)} /><Icon size={16}/>{label}</label>)}</div></fieldset>
        <label className="text-sm font-medium text-[var(--text-main)]">{copy.target}<select value={targetType} onChange={e => { setTargetType(e.target.value as TargetType); setSelectedUser(null); setSearch(''); }} className="mt-2 w-full rounded-lg border border-[var(--border)] px-3 py-2.5 outline-none focus:border-primary"><option value="all">{copy.all}</option><option value="teachers">{copy.teachers}</option><option value="students">{copy.students}</option><option value="single_user">{copy.single}</option></select></label></div>
      {targetType === 'single_user' && <div className="relative max-w-xl"><label className="text-sm font-medium text-[var(--text-main)]">{copy.search}<div className="relative mt-2"><Search className="absolute top-3 left-3 text-[var(--text-muted)]" size={17}/><input value={selectedUser ? selectedUser.name : search} onChange={e => { setSelectedUser(null); setSearch(e.target.value); }} className="w-full rounded-lg border border-[var(--border)] py-2.5 pl-10 pr-3 outline-none focus:border-primary" /></div></label>{users.length > 0 && !selectedUser && <div className="absolute z-20 mt-1 w-full rounded-lg border border-[var(--border)] bg-white shadow-lg">{users.map(user => <button type="button" key={user.id} onClick={() => { setSelectedUser(user); setUsers([]); }} className="block w-full px-3 py-2 text-left hover:bg-[var(--light-bg)]"><span className="block font-medium">{user.name}</span><span className="text-xs text-[var(--text-muted)]">{user.email || user.phone_number}</span></button>)}</div>}</div>}
      <div className="flex justify-end"><button disabled={submitting} className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 font-medium text-white disabled:opacity-60">{submitting ? <Loader2 size={18} className="animate-spin"/> : <Send size={18}/>} {copy.send}</button></div>
    </form>
    <section className="bg-white rounded-[var(--radius-md)] border border-[var(--border)] overflow-hidden"><div className="flex justify-between items-center p-5 border-b border-[var(--border)]"><h2 className="font-bold text-[var(--text-main)]">{copy.history}</h2><button onClick={loadCampaigns} className="p-2 text-primary"><RefreshCw size={18}/></button></div>{loading ? <div className="py-10 flex justify-center"><Loader2 className="animate-spin text-primary"/></div> : campaigns.length === 0 ? <p className="p-8 text-center text-[var(--text-muted)]">{copy.noCampaigns}</p> : <div className="overflow-x-auto"><table className="w-full text-sm"><thead className="bg-[var(--light-bg)] text-[var(--text-muted)]"><tr><th className="p-3 text-start">{copy.title}</th><th className="p-3 text-start">{copy.channel}</th><th className="p-3 text-start">{copy.target}</th><th className="p-3 text-start">{copy.sent}</th><th className="p-3 text-start">{copy.date}</th><th className="p-3 text-start">{copy.status}</th></tr></thead><tbody>{campaigns.map(c => <tr key={c.id} className="border-t border-[var(--border)]"><td className="p-3 font-medium">{c.title}</td><td className="p-3 uppercase">{c.channel}</td><td className="p-3">{targetLabel(c)}</td><td className="p-3">{c.total_sent}/{c.total_targeted}</td><td className="p-3 whitespace-nowrap">{new Date(c.scheduled_at || c.updated_at).toLocaleString(language === 'ar' ? 'ar-SA' : 'en-US')}</td><td className="p-3"><span className={`rounded-full px-2 py-1 text-xs font-medium ${statusClass(c.status)}`}>{statusLabel(c.status)}</span></td></tr>)}</tbody></table></div>}</section>
    <Modal isOpen={confirming} onClose={() => !submitting && setConfirming(false)} title={copy.confirm}><div className="space-y-5"><div className="flex items-center gap-3 text-[var(--text-main)]"><div className="rounded-full bg-primary-pale p-3 text-primary"><Users size={22}/></div><p>{copy.confirmation} <strong>{targetCount}</strong> {copy.users}</p></div><div className="flex justify-end gap-3"><button disabled={submitting} onClick={() => setConfirming(false)} className="rounded-lg border border-[var(--border)] px-4 py-2">{copy.cancel}</button><button disabled={submitting} onClick={submit} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-white">{submitting && <Loader2 size={16} className="animate-spin"/>}{copy.confirmSend}</button></div></div></Modal>
  </div>;
};
