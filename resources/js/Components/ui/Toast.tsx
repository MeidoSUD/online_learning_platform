import React, { useEffect } from 'react';
import { CheckCircle, XCircle, AlertCircle, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning';

interface ToastProps {
    message: string;
    type: ToastType;
    onClose: () => void;
    duration?: number;
}

export const Toast: React.FC<ToastProps> = ({ message, type, onClose, duration = 3000 }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, duration);
        return () => clearTimeout(timer);
    }, [onClose, duration]);

    const icons = {
        success: <CheckCircle className="h-5 w-5 text-primary" />,
        error: <XCircle className="h-5 w-5 text-red-500" />,
        warning: <AlertCircle className="h-5 w-5 text-amber-500" />
    };

    const bgColors = {
        success: 'bg-primary-pale border-primary/30',
        error: 'bg-red-50 border-red-100',
        warning: 'bg-amber-50 border-amber-100'
    };

    return (
        <div className={`fixed bottom-4 right-4 z-50 flex items-center gap-3 p-4 rounded-[var(--radius-sm)] border shadow-[var(--shadow-lg)] animate-in slide-in-from-right-full transition-all duration-300 ${bgColors[type]}`}>
            {icons[type]}
            <p className="text-sm font-medium text-[var(--text-main)]">{message}</p>
            <button
                onClick={onClose}
                className="ml-2 text-[var(--text-muted)] hover:text-[var(--text-muted)] transition-colors"
            >
                <X className="h-4 w-4" />
            </button>
        </div>
    );
};
