
import React, { useState } from 'react';
import { useLanguage } from '../../Contexts/LanguageContext';
import { AlertCircle, Plus, ChevronDown } from 'lucide-react';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Dispute } from '../../Utils/types';

const MOCK_DISPUTES: Dispute[] = [
  { id: '1', caseNumber: 'CASE-2025-001', teacherName: 'Ahmed Ali', date: '2025-11-10', status: 'open', reason: 'Teacher missed session', description: 'The teacher did not show up for the scheduled class at 10 AM.' },
  { id: '2', caseNumber: 'CASE-2025-002', teacherName: 'Sarah Smith', date: '2025-10-25', status: 'resolved', reason: 'Technical issues', description: 'Connection was lost multiple times.' },
];

export const DisputesTab: React.FC = () => {
  const { t, language } = useLanguage();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [disputes, setDisputes] = useState<Dispute[]>(MOCK_DISPUTES);
  const [form, setForm] = useState({ bookingId: '', reason: '', description: '' });

  const handleSubmit = () => {
      const newDispute: Dispute = {
          id: Date.now().toString(),
          caseNumber: `CASE-${new Date().getFullYear()}-${Math.floor(Math.random()*1000)}`,
          teacherName: 'Selected Teacher', // Mock
          date: new Date().toISOString().split('T')[0],
          status: 'open',
          reason: form.reason,
          description: form.description
      };
      setDisputes([newDispute, ...disputes]);
      setIsModalOpen(false);
      setForm({ bookingId: '', reason: '', description: '' });
      alert("Dispute submitted successfully.");
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-900">{t.disputes}</h2>
        <Button onClick={() => setIsModalOpen(true)} className="shadow-lg shadow-red-500/20 bg-red-600 hover:bg-red-700 focus:ring-red-600">
          <Plus size={18} className="mr-2" /> {t.openDispute}
        </Button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                        <th className="px-6 py-4 font-bold text-slate-700">{t.caseNumber}</th>
                        <th className="px-6 py-4 font-bold text-slate-700">{t.teacher}</th>
                        <th className="px-6 py-4 font-bold text-slate-700">{t.reason}</th>
                        <th className="px-6 py-4 font-bold text-slate-700">{t.date}</th>
                        <th className="px-6 py-4 font-bold text-slate-700">{t.status}</th>
                        <th className="px-6 py-4 text-right">Action</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {disputes.map(dispute => (
                        <tr key={dispute.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-4 font-mono text-slate-500">{dispute.caseNumber}</td>
                            <td className="px-6 py-4 font-medium text-slate-900">{dispute.teacherName}</td>
                            <td className="px-6 py-4 text-slate-600">{dispute.reason}</td>
                            <td className="px-6 py-4 text-slate-500">{dispute.date}</td>
                            <td className="px-6 py-4">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide ${
                                    dispute.status === 'open' ? 'bg-red-100 text-red-700' :
                                    dispute.status === 'resolved' ? 'bg-green-100 text-green-700' :
                                    'bg-slate-100 text-slate-700'
                                }`}>
                                    {dispute.status}
                                </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                                <button className="text-primary hover:underline text-xs font-medium">View Details</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
      </div>

      {/* Open Dispute Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={t.openDispute}>
          <div className="space-y-4">
              <div className="p-4 bg-yellow-50 text-yellow-800 text-sm rounded-lg flex gap-2">
                  <AlertCircle size={20} className="flex-shrink-0" />
                  <p>Please try to resolve the issue directly with the teacher before opening a dispute.</p>
              </div>

              <Select 
                  label={t.bookingRef}
                  options={[
                      { value: '', label: 'Select Booking' },
                      { value: '1', label: 'Math with Ahmed Ali (Nov 20)' },
                      { value: '2', label: 'English with Sarah (Nov 22)' },
                  ]}
                  value={form.bookingId}
                  onChange={(e) => setForm({...form, bookingId: e.target.value})}
              />

              <Select 
                  label={t.reason}
                  options={[
                      { value: '', label: 'Select Reason' },
                      { value: 'missed', label: 'Teacher missed session' },
                      { value: 'late', label: 'Teacher was late' },
                      { value: 'quality', label: 'Poor quality' },
                      { value: 'technical', label: 'Technical issues' },
                      { value: 'other', label: 'Other' },
                  ]}
                  value={form.reason}
                  onChange={(e) => setForm({...form, reason: e.target.value})}
              />

              <div className="mb-4 w-full">
                  <label className="block text-sm font-medium text-slate-700 mb-1">{t.description}</label>
                  <textarea 
                      className="w-full rounded-lg border border-slate-200 p-3 h-32 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                      placeholder={t.phDisputeDesc}
                      value={form.description}
                      onChange={(e) => setForm({...form, description: e.target.value})}
                  />
              </div>

              <Button className="w-full bg-red-600 hover:bg-red-700" onClick={handleSubmit}>
                  {t.submitDispute}
              </Button>
          </div>
      </Modal>
    </div>
  );
};
