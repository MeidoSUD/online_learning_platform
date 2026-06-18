import React, { useState, useEffect } from 'react';
import { adsService, Ad } from '../../Services/api';
import { useLanguage } from '../../Contexts/LanguageContext';
import { ChevronLeft, ChevronRight, X, ExternalLink, Loader2 } from 'lucide-react';

export const AdsBanner: React.FC = () => {
    const { t, direction } = useLanguage();
    const [ads, setAds] = useState<Ad[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isVisible, setIsVisible] = useState(true);

    // Default fallback ad if no data is retrieved
    const defaultAd: Ad = {
        id: 0,
        image_url: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&q=80&w=1200&h=400',
        description: t.welcomeBack,
        link_url: '#',
        cta_text: t.viewAll,
        platform: 'web',
    };

    useEffect(() => {
        const fetchAds = async () => {
            try {
                // Platform is always 'web' for this React app
                const data = await adsService.getAds('web');
                if (data && data.length > 0) {
                    setAds(data);
                } else {
                    setAds([defaultAd]);
                }
            } catch (error) {
                console.error('Failed to fetch ads:', error);
                setAds([defaultAd]);
            } finally {
                setLoading(false);
            }
        };

        fetchAds();
    }, []);

    // Auto-advance
    useEffect(() => {
        if (ads.length <= 1) return;

        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % ads.length);
        }, 5000);

        return () => clearInterval(interval);
    }, [ads]);

    if (!isVisible || (loading && ads.length === 0)) return null;

    const nextAd = () => setCurrentIndex((prev) => (prev + 1) % ads.length);
    const prevAd = () => setCurrentIndex((prev) => (prev - 1 + ads.length) % ads.length);

    const currentAd = ads[currentIndex] || defaultAd;

    return (
        <div className="relative group w-full mb-8 animate-fade-in">
            <div className="overflow-hidden rounded-2xl aspect-[3/1] md:aspect-[4/1] bg-slate-100 shadow-sm border border-slate-100">
                {loading ? (
                    <div className="w-full h-full flex items-center justify-center">
                        <Loader2 className="animate-spin text-primary/30" />
                    </div>
                ) : (
                    <div className="relative w-full h-full">
                        <img
                            src={currentAd.image_url}
                            alt={currentAd.description || 'Ad'}
                            className="w-full h-full object-cover transition-opacity duration-500 ease-in-out"
                        />

                        {/* Overlay Content */}
                        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/20 to-transparent flex flex-col justify-center px-8 md:px-12">
                            <div className="max-w-md space-y-2 md:space-y-4">
                                {currentAd.description && (
                                    <h3 className="text-white text-lg md:text-2xl font-bold leading-tight drop-shadow-md">
                                        {currentAd.description}
                                    </h3>
                                )}
                                {currentAd.link_url && (
                                    <a
                                        href={currentAd.link_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-2 bg-primary hover:bg-blue-600 text-white px-4 py-2 md:px-6 md:py-2.5 rounded-full text-xs md:text-sm font-bold transition-all transform hover:scale-105 shadow-lg"
                                    >
                                        {currentAd.cta_text || t.bookNow}
                                        <ExternalLink size={14} />
                                    </a>
                                )}
                            </div>
                        </div>

                        {/* Navigation Buttons */}
                        {ads.length > 1 && (
                            <>
                                <button
                                    onClick={(e) => { e.preventDefault(); prevAd(); }}
                                    className={`absolute top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/20 hover:bg-white/40 text-white backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100 ${direction === 'rtl' ? 'right-4' : 'left-4'}`}
                                >
                                    <ChevronLeft size={20} className={direction === 'rtl' ? 'rotate-180' : ''} />
                                </button>
                                <button
                                    onClick={(e) => { e.preventDefault(); nextAd(); }}
                                    className={`absolute top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/20 hover:bg-white/40 text-white backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100 ${direction === 'rtl' ? 'left-4' : 'right-4'}`}
                                >
                                    <ChevronRight size={20} className={direction === 'rtl' ? 'rotate-180' : ''} />
                                </button>

                                {/* Indicators */}
                                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
                                    {ads.map((_, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => setCurrentIndex(idx)}
                                            className={`h-1.5 rounded-full transition-all ${currentIndex === idx ? 'w-6 bg-primary' : 'w-1.5 bg-white/40 hover:bg-white/60'}`}
                                        />
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>

            {/* Dismiss Button */}
            <button
                onClick={() => setIsVisible(false)}
                className="absolute -top-2 -right-2 p-1.5 bg-white rounded-full shadow-md text-slate-400 hover:text-slate-600 border border-slate-100 transition-colors"
                title={t.close}
            >
                <X size={14} />
            </button>
        </div>
    );
};
