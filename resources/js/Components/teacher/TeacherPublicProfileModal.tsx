import React from 'react';
import { UserData } from '../../Services/api';
import { TeacherPublicProfileScreen } from './TeacherPublicProfileScreen';
import { X } from 'lucide-react';

interface TeacherPublicProfileModalProps {
  user?: UserData | null;
  teacherId?: number;
  isOpen: boolean;
  onClose: () => void;
}

export const TeacherPublicProfileModal: React.FC<TeacherPublicProfileModalProps> = ({
  user,
  teacherId,
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in font-sans">
      <div className="relative w-full max-w-xl max-h-[92vh] overflow-y-auto bg-[#EFF6F4] rounded-3xl shadow-2xl border border-white/20">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 left-4 z-20 w-9 h-9 rounded-full bg-white/90 hover:bg-white text-[#0D4A5F] flex items-center justify-center shadow-md transition-all"
        >
          <X size={18} />
        </button>

        <TeacherPublicProfileScreen
          user={user}
          teacherId={teacherId}
          onBack={onClose}
          isModal={true}
        />
      </div>
    </div>
  );
};
