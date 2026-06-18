
import React from 'react';
import { useLanguage } from '../../Contexts/LanguageContext';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Tag } from 'lucide-react';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  price: number;
}

export const BookingModal: React.FC<BookingModalProps> = ({ isOpen, onClose, title, price }) => {
  const { t } = useLanguage();

  const handleConfirm = () => {
    // In a real app, this would trigger an API call.
    alert('Booking confirmed! (This is a mock confirmation)');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t.confirmBooking}>
      <div className="space-y-4">
        <p className="text-slate-600">You are about to book the following course:</p>
        <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
            <h3 className="font-bold text-slate-900">{title}</h3>
            <div className="flex items-center gap-2 mt-2">
                <Tag size={16} className="text-primary" />
                <span className="font-semibold text-primary">{price} {t.sar}</span>
            </div>
        </div>
        <div className="pt-4 flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>{t.cancel}</Button>
          <Button onClick={handleConfirm}>{t.pay} {price} {t.sar}</Button>
        </div>
      </div>
    </Modal>
  );
};
