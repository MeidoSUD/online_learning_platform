import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useLanguage } from '../../Contexts/LanguageContext';
import { Button } from './Button';

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
}

export const Pagination: React.FC<PaginationProps> = ({
    currentPage,
    totalPages,
    onPageChange,
}) => {
    const { t, direction } = useLanguage();

    if (totalPages <= 1) return null;

    const handlePrev = () => {
        if (currentPage > 1) {
            onPageChange(currentPage - 1);
        }
    };

    const handleNext = () => {
        if (currentPage < totalPages) {
            onPageChange(currentPage + 1);
        }
    };

    const isRtl = direction === 'rtl';

    return (
        <div className="flex items-center justify-between px-6 py-3 border-t border-slate-200 bg-white">
            <div className="flex items-center text-sm text-slate-500">
                {t.page} <span className="font-medium mx-1 text-slate-900">{currentPage}</span> {t.of} <span className="font-medium mx-1 text-slate-900">{totalPages}</span>
            </div>
            <div className="flex items-center gap-2">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePrev}
                    disabled={currentPage === 1}
                    className="flex items-center gap-1 h-8"
                >
                    {isRtl ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
                    {t.previous}
                </Button>
                
                <Button
                    variant="outline"
                    size="sm"
                    onClick={handleNext}
                    disabled={currentPage === totalPages}
                    className="flex items-center gap-1 h-8"
                >
                    {t.next}
                    {isRtl ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
                </Button>
            </div>
        </div>
    );
};
