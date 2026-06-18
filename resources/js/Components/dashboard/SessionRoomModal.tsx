
import React from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Video, Mic, PhoneOff, Monitor, ShieldCheck } from 'lucide-react';
import { useLanguage } from '../../Contexts/LanguageContext';

interface SessionRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  agora: {
    channel: string;
    token: string;
    uid: string | number;
    role: string;
  } | null;
}

const AGORA_CONFIG = {
    APP_ID: "3a77d1a600964e9bb4aae8b0dd59f157",
    TOKENS_ENABLED: true
};

export const SessionRoomModal: React.FC<SessionRoomModalProps> = ({ isOpen, onClose, agora }) => {
  const { language } = useLanguage();

  if (!agora) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Live Session: ${agora.channel}`}>
      <div className="space-y-6">
        <div className="aspect-video bg-slate-900 rounded-2xl relative overflow-hidden flex items-center justify-center text-white border-4 border-primary">
            <Video size={60} className="opacity-20 animate-pulse" />
            <div className="absolute bottom-4 left-4 flex items-center gap-2">
                <div className="h-2 w-2 bg-red-500 rounded-full animate-ping"></div>
                <span className="text-xs font-bold uppercase tracking-wider">Live Connection</span>
            </div>
            <div className="absolute top-4 right-4 bg-green-500/20 backdrop-blur-md px-3 py-1 rounded-full text-[10px] border border-green-500/30 text-green-400 flex items-center gap-1">
                <ShieldCheck size={12} /> Secure
            </div>
        </div>

        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-[10px] font-mono space-y-2">
            <p className="text-slate-500 font-bold uppercase mb-2">Agora Session Details</p>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <span className="text-slate-400 block">App ID:</span>
                    <span className="text-slate-900">{AGORA_CONFIG.APP_ID.slice(0, 8)}...</span>
                </div>
                <div>
                    <span className="text-slate-400 block">Tokens:</span>
                    <span className="text-green-600 font-bold">Enabled</span>
                </div>
                <div>
                    <span className="text-slate-400 block">UID:</span>
                    <span className="text-slate-900">{agora.uid}</span>
                </div>
                <div>
                    <span className="text-slate-400 block">Role:</span>
                    <span className="text-primary font-bold uppercase">{agora.role}</span>
                </div>
            </div>
        </div>

        <div className="flex items-center justify-center gap-4 pt-2">
            <button className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-slate-200 transition-colors">
                <Mic size={20} />
            </button>
            <button className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-slate-200 transition-colors">
                <Video size={20} />
            </button>
            <button className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-slate-200 transition-colors">
                <Monitor size={20} />
            </button>
            <button 
                onClick={onClose}
                className="h-12 px-6 rounded-full bg-red-500 flex items-center justify-center text-white hover:bg-red-600 transition-colors gap-2 font-bold"
            >
                <PhoneOff size={20} />
                {language === 'ar' ? 'إنهاء' : 'Leave'}
            </button>
        </div>
      </div>
    </Modal>
  );
};
