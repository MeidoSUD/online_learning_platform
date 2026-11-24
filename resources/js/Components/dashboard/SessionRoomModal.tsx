import React, { useEffect, useRef, useState, useCallback } from 'react';
import AgoraRTC, {
    IAgoraRTCClient,
    ICameraVideoTrack,
    IMicrophoneAudioTrack,
    ILocalVideoTrack,
    IRemoteVideoTrack,
} from 'agora-rtc-sdk-ng';
import {
    Mic,
    MicOff,
    Video,
    VideoOff,
    Monitor,
    MonitorOff,
    PhoneOff,
    ShieldCheck,
    Loader2,
    AlertTriangle,
    Radio,
    LogOut,
    X,
    Hand,
    Maximize2,
    Minimize2,
    User,
    ArrowLeftRight,
} from 'lucide-react';
import { useLanguage } from '../../Contexts/LanguageContext';
import { teacherService } from '../../Services/api';

interface SessionRoomModalProps {
    isOpen: boolean;
    onClose: () => void;
    agora: {
        app_id?: string;
        channel?: string;
        token?: string;
        uid?: string | number;
        role?: string;
        session_id?: number;
    } | null;
}

const AGORA_CONFIG = {
    APP_ID: "3a77d1a600964e9bb4aae8b0dd59f157"
};

type RemoteUserView = {
    uid: string | number;
    videoOn: boolean;
    videoTrack: IRemoteVideoTrack | null;
    audioTrack: any | null;
};

interface VideoPlayerProps {
    track: ICameraVideoTrack | IRemoteVideoTrack | ILocalVideoTrack | null | undefined;
    className?: string;
    mirror?: boolean;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ track, className = '', mirror = false }) => {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const el = containerRef.current;
        if (!el || !track) return;
        track.play(el, { mirror });
        return () => {
            track.stop();
        };
    }, [track, mirror]);

    return <div ref={containerRef} className={`w-full h-full overflow-hidden ${className}`} />;
};

export const SessionRoomModal: React.FC<SessionRoomModalProps> = ({ isOpen, onClose, agora }) => {
    const { language, direction } = useLanguage();
    const isAr = language === 'ar';

    const clientRef = useRef<IAgoraRTCClient | null>(null);
    const micTrackRef = useRef<IMicrophoneAudioTrack | null>(null);
    const cameraTrackRef = useRef<ICameraVideoTrack | null>(null);
    const screenTrackRef = useRef<ILocalVideoTrack | null>(null);
    const shouldCleanRef = useRef(false);

    const [connecting, setConnecting] = useState(false);
    const [joined, setJoined] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [remoteUsers, setRemoteUsers] = useState<Record<string, RemoteUserView>>({});
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);
    const [isScreenSharing, setIsScreenSharing] = useState(false);
    const [isHandRaised, setIsHandRaised] = useState(false);
    const [isEnding, setIsEnding] = useState(false);
    const [showEndConfirm, setShowEndConfirm] = useState(false);
    const [focusTarget, setFocusTarget] = useState<'remote' | 'local'>('remote');

    const isHost = (agora?.role || '').toLowerCase() === 'host';
    const appId = agora?.app_id || AGORA_CONFIG.APP_ID;
    const channel = agora?.channel || '';
    const token = agora?.token || null;
    const uid = agora?.uid ? String(agora.uid) : null;
    const sessionId = agora?.session_id;

    const cleanup = useCallback(async () => {
        shouldCleanRef.current = false;
        const client = clientRef.current;
        if (client) {
            client.removeAllListeners();
            try {
                await client.leave();
            } catch (_) {}
            clientRef.current = null;
        }
        if (screenTrackRef.current) {
            try {
                screenTrackRef.current.close();
            } catch (_) {}
            screenTrackRef.current = null;
        }
        if (cameraTrackRef.current) {
            try {
                cameraTrackRef.current.close();
            } catch (_) {}
            cameraTrackRef.current = null;
        }
        if (micTrackRef.current) {
            try {
                micTrackRef.current.close();
            } catch (_) {}
            micTrackRef.current = null;
        }
        setJoined(false);
        setRemoteUsers({});
        setIsMuted(false);
        setIsVideoOff(false);
        setIsScreenSharing(false);
        setIsHandRaised(false);
        setShowEndConfirm(false);
        setError(null);
    }, []);

    const initRoom = useCallback(async () => {
        if (!isOpen || !agora || !channel) return;
        setConnecting(true);
        setError(null);
        shouldCleanRef.current = true;

        try {
            const client: IAgoraRTCClient = AgoraRTC.createClient({
                mode: 'live',
                codec: 'vp8',
            });
            clientRef.current = client;

            client.on('user-published', async (user, mediaType) => {
                try {
                    await client.subscribe(user, mediaType);
                    if (mediaType === 'video') {
                        setRemoteUsers((prev) => ({
                            ...prev,
                            [String(user.uid)]: {
                                uid: user.uid,
                                videoTrack: user.videoTrack || null,
                                audioTrack: prev[String(user.uid)]?.audioTrack || null,
                                videoOn: true,
                            },
                        }));
                    } else if (mediaType === 'audio') {
                        user.audioTrack?.play();
                        setRemoteUsers((prev) => ({
                            ...prev,
                            [String(user.uid)]: {
                                uid: user.uid,
                                videoTrack: prev[String(user.uid)]?.videoTrack || null,
                                audioTrack: user.audioTrack || null,
                                videoOn: prev[String(user.uid)]?.videoOn ?? false,
                            },
                        }));
                    }
                } catch (subErr: any) {
                    console.error('Subscription error', subErr);
                }
            });

            client.on('user-unpublished', (user, mediaType) => {
                if (mediaType === 'video') {
                    setRemoteUsers((prev) => {
                        if (!prev[String(user.uid)]) return prev;
                        return {
                            ...prev,
                            [String(user.uid)]: {
                                ...prev[String(user.uid)],
                                videoOn: false,
                                videoTrack: null,
                            },
                        };
                    });
                }
            });

            client.on('user-left', (user) => {
                setRemoteUsers((prev) => {
                    const next = { ...prev };
                    delete next[String(user.uid)];
                    return next;
                });
            });

            client.on('connection-state-change', (curState, prevState) => {
                if (curState === 'DISCONNECTED' && prevState !== 'DISCONNECTED' && shouldCleanRef.current) {
                    setError(isAr ? 'انقطع الاتصال بالجلسة' : 'Connection to the session was lost');
                }
            });

            await client.setClientRole('host');

            let micTrack: IMicrophoneAudioTrack | null = null;
            let cameraTrack: ICameraVideoTrack | null = null;

            try {
                micTrack = await AgoraRTC.createMicrophoneAudioTrack();
                micTrackRef.current = micTrack;
            } catch (_) {}

            try {
                cameraTrack = await AgoraRTC.createCameraVideoTrack();
                cameraTrackRef.current = cameraTrack;
            } catch (_) {
                setIsVideoOff(true);
            }

            await client.join(appId, channel, token, uid);

            const tracksToPublish = [];
            if (micTrack) tracksToPublish.push(micTrack);
            if (cameraTrack) tracksToPublish.push(cameraTrack);

            if (tracksToPublish.length > 0) {
                await client.publish(tracksToPublish);
            }

            setJoined(true);
        } catch (e: any) {
            setError(
                e?.message ||
                (isAr
                    ? 'فشل الدخول إلى الجلسة، يرجى المحاولة مرة أخرى'
                    : 'Failed to enter the session. Please try again')
            );
        } finally {
            setConnecting(false);
        }
    }, [isOpen, agora, appId, channel, token, uid, isAr]);

    useEffect(() => {
        if (isOpen) {
            initRoom();
        } else {
            cleanup();
        }
        return () => {
            cleanup();
        };
    }, [isOpen, initRoom, cleanup]);

    const toggleMute = async () => {
        const client = clientRef.current;
        if (isMuted) {
            try {
                if (!micTrackRef.current) {
                    const newMic = await AgoraRTC.createMicrophoneAudioTrack();
                    micTrackRef.current = newMic;
                    if (client && joined) {
                        await client.publish(newMic);
                    }
                } else {
                    micTrackRef.current.setMuted(false);
                }
                setIsMuted(false);
            } catch (_) {
                setError(isAr ? 'تعذر تشغيل الميكروفون' : 'Could not enable microphone');
            }
        } else {
            if (micTrackRef.current) {
                micTrackRef.current.setMuted(true);
            }
            setIsMuted(true);
        }
    };

    const toggleVideo = async () => {
        const client = clientRef.current;
        if (isVideoOff) {
            try {
                if (!cameraTrackRef.current) {
                    const newCam = await AgoraRTC.createCameraVideoTrack();
                    cameraTrackRef.current = newCam;
                    if (client && joined) {
                        await client.publish(newCam);
                    }
                } else {
                    await cameraTrackRef.current.setEnabled(true);
                }
                setIsVideoOff(false);
            } catch (_) {
                setError(
                    isAr
                        ? 'الكاميرا قيد الاستخدام في نافذة أو تطبيق آخر، يرجى إغلاقها هناك ثم المحاولة'
                        : 'Camera is in use by another tab or app'
                );
            }
        } else {
            if (cameraTrackRef.current) {
                await cameraTrackRef.current.setEnabled(false);
            }
            setIsVideoOff(true);
        }
    };

    const toggleHandRaise = () => {
        setIsHandRaised((prev) => !prev);
    };

    const toggleScreenShare = async () => {
        const client = clientRef.current;
        if (!client) return;

        try {
            if (!isScreenSharing) {
                const screenTrack = await AgoraRTC.createScreenVideoTrack({ screenAV: false }, 'disable');
                screenTrackRef.current = screenTrack;

                screenTrack.on('track-ended', async () => {
                    await stopScreenShare();
                });

                if (cameraTrackRef.current) {
                    await client.unpublish(cameraTrackRef.current);
                }
                await client.publish(screenTrack);
                setIsScreenSharing(true);
                setIsVideoOff(false);
            } else {
                await stopScreenShare();
            }
        } catch (e: any) {
            setError(e?.message || (isAr ? 'فشلت مشاركة الشاشة' : 'Screen sharing failed'));
        }
    };

    const stopScreenShare = async () => {
        const client = clientRef.current;
        if (!client) return;

        try {
            if (screenTrackRef.current) {
                await client.unpublish(screenTrackRef.current);
                screenTrackRef.current.close();
                screenTrackRef.current = null;
            }
            if (cameraTrackRef.current) {
                await client.publish(cameraTrackRef.current);
            }
        } catch (_) {}
        setIsScreenSharing(false);
    };

    const handleLeave = useCallback(async () => {
        await cleanup();
        onClose();
    }, [cleanup, onClose]);

    const handleEndSession = async () => {
        if (!sessionId || isEnding) return;
        setIsEnding(true);
        try {
            await teacherService.endSession(sessionId);
        } catch (e: any) {
            console.error('Failed to end session:', e);
        } finally {
            setIsEnding(false);
            await handleLeave();
        }
    };

    const swapFocus = () => {
        setFocusTarget((prev) => (prev === 'remote' ? 'local' : 'remote'));
    };

    if (!isOpen || !agora) return null;

    const remoteList = Object.values(remoteUsers);
    const primaryRemoteUser = remoteList.length > 0 ? remoteList[0] : null;
    const isSingleRemote = remoteList.length === 1;
    const isFocusRemote = focusTarget === 'remote' && primaryRemoteUser != null;

    return (
        <div className="fixed inset-0 z-[100] bg-[#111111] flex flex-col select-none overflow-hidden" dir={direction}>
            {connecting && (
                <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center gap-4">
                    <div className="relative">
                        <Loader2 size={56} className="animate-spin text-primary" />
                        <Radio size={20} className="absolute inset-0 m-auto text-primary animate-pulse" />
                    </div>
                    <p className="text-white font-bold text-base">
                        {isAr ? 'جارٍ الاتصال بالغرفة وتجهيز البث...' : 'Connecting to the room...'}
                    </p>
                    <span className="text-white/50 text-xs">
                        {isAr ? 'مطابق لبيئة تطبيق الأندرويد' : 'Synchronizing with Android platform'}
                    </span>
                </div>
            )}

            {error && !connecting && (
                <div className="absolute top-16 inset-x-4 z-50 mx-auto max-w-lg bg-red-600/90 backdrop-blur-md border border-red-400 text-white text-sm font-semibold rounded-2xl px-4 py-3 flex items-start gap-3 shadow-2xl animate-fade-in">
                    <AlertTriangle size={20} className="shrink-0 mt-0.5 text-amber-300" />
                    <span className="flex-1">{error}</span>
                    <button onClick={() => setError(null)} className="shrink-0 text-white/80 hover:text-white transition-colors">
                        <X size={18} />
                    </button>
                </div>
            )}

            <div className="relative z-30 flex items-center justify-between px-4 sm:px-6 py-3 bg-gradient-to-b from-black/80 via-black/40 to-transparent">
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleLeave}
                        className="w-10 h-10 rounded-full bg-black/50 hover:bg-black/80 text-white border border-white/10 flex items-center justify-center transition-all shadow-lg active:scale-95"
                        title={isAr ? 'رجوع' : 'Back'}
                    >
                        <X size={20} />
                    </button>

                    <div className="flex items-center gap-2.5 bg-black/60 backdrop-blur-md rounded-2xl px-3.5 py-2 border border-white/10 shadow-lg">
                        <span className="relative flex h-3 w-3">
                            {joined ? (
                                <>
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
                                </>
                            ) : (
                                <span className="inline-flex rounded-full h-3 w-3 bg-amber-400 animate-pulse" />
                            )}
                        </span>
                        <div className="flex flex-col">
                            <span className="text-white font-bold text-xs sm:text-sm tracking-wide" dir="ltr">
                                {channel || 'Meeting Room'}
                            </span>
                            <span className="text-[10px] text-white/60">
                                {joined ? (isAr ? 'متصل الآن' : 'Live') : (isAr ? 'جارٍ الاتصال' : 'Connecting')}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <div className="hidden sm:flex items-center gap-1.5 bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-full text-[11px] border border-white/10 text-emerald-400">
                        <ShieldCheck size={13} />
                        <span>{isAr ? 'مشفّر ومؤمن' : 'Secured'}</span>
                    </div>

                    <span className={`px-3 py-1.5 rounded-full text-[11px] font-bold tracking-wide border shadow-md ${
                        isHost
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                            : 'bg-primary/20 text-primary border-primary/40'
                    }`}>
                        {isHost ? (isAr ? 'معلم / مضيف' : 'Teacher / Host') : (isAr ? 'طالب' : 'Student')}
                    </span>
                </div>
            </div>

            <div className="relative flex-1 w-full h-full overflow-hidden bg-[#0d0d0d]">
                {remoteList.length <= 1 ? (
                    <div className="relative w-full h-full">
                        <div className="absolute inset-0 bg-slate-950 flex items-center justify-center overflow-hidden">
                            {isFocusRemote ? (
                                primaryRemoteUser?.videoOn && primaryRemoteUser.videoTrack ? (
                                    <VideoPlayer track={primaryRemoteUser.videoTrack} />
                                ) : (
                                    <div className="flex flex-col items-center justify-center gap-3 text-white/60">
                                        <div className="w-24 h-24 rounded-full bg-white/10 flex items-center justify-center text-white/80 border border-white/10 shadow-inner">
                                            <User size={48} />
                                        </div>
                                        <span className="text-sm font-semibold">
                                            {isAr ? 'الكاميرا متوقفة - الصوت يعمل' : 'Camera off - Audio active'}
                                        </span>
                                        <span className="text-xs text-white/40" dir="ltr">
                                            {String(primaryRemoteUser?.uid)}
                                        </span>
                                    </div>
                                )
                            ) : (
                                (!isVideoOff || isScreenSharing) && (cameraTrackRef.current || screenTrackRef.current) ? (
                                    <VideoPlayer
                                        track={isScreenSharing ? screenTrackRef.current : cameraTrackRef.current}
                                        mirror={!isScreenSharing}
                                    />
                                ) : (
                                    <div className="flex flex-col items-center justify-center gap-3 text-white/60">
                                        <div className="w-24 h-24 rounded-full bg-white/10 flex items-center justify-center text-white/80 border border-white/10 shadow-inner">
                                            <VideoOff size={44} />
                                        </div>
                                        <span className="text-sm font-semibold">
                                            {isAr ? 'كاميرتك متوقفة' : 'Your camera is off'}
                                        </span>
                                    </div>
                                )
                            )}

                            <div className="absolute bottom-28 left-4 z-20 flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 text-white text-xs font-semibold shadow-lg">
                                <span>
                                    {isFocusRemote
                                        ? (isHost ? (isAr ? 'الطالب' : 'Student') : (isAr ? 'المعلم' : 'Teacher'))
                                        : (isAr ? 'أنت' : 'You')}
                                </span>
                                {!isFocusRemote && isMuted && (
                                    <MicOff size={13} className="text-red-400" />
                                )}
                            </div>
                        </div>


                        {isSingleRemote && (
                            <div
                                onClick={swapFocus}
                                className="absolute top-4 right-4 z-20 w-32 h-44 sm:w-44 sm:h-60 rounded-2xl overflow-hidden border-2 border-white/20 shadow-2xl bg-black cursor-pointer group hover:scale-[1.02] transition-transform"
                                title={isAr ? 'انقر للتبديل' : 'Click to swap'}
                            >
                                {isFocusRemote ? (
                                    (!isVideoOff || isScreenSharing) && (cameraTrackRef.current || screenTrackRef.current) ? (
                                        <VideoPlayer
                                            track={isScreenSharing ? screenTrackRef.current : cameraTrackRef.current}
                                            mirror={!isScreenSharing}
                                        />
                                    ) : (
                                        <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-white/50 bg-slate-900">
                                            <VideoOff size={24} />
                                            <span className="text-[10px] font-bold">
                                                {isAr ? 'متوقفة' : 'Off'}
                                            </span>
                                        </div>
                                    )
                                ) : (
                                    primaryRemoteUser?.videoOn && primaryRemoteUser.videoTrack ? (
                                        <VideoPlayer track={primaryRemoteUser.videoTrack} />
                                    ) : (
                                        <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-white/50 bg-slate-900">
                                            <User size={24} />
                                            <span className="text-[10px] font-bold">
                                                {isAr ? 'صوت فقط' : 'Audio only'}
                                            </span>
                                        </div>
                                    )
                                )}

                                <div className="absolute top-2 right-2 bg-black/60 rounded-full p-1 text-white/80 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <ArrowLeftRight size={13} />
                                </div>

                                <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-sm px-2 py-0.5 rounded-md text-[10px] font-bold text-white/90">
                                    {isFocusRemote ? (isAr ? 'أنت' : 'You') : (isAr ? 'الطرف الآخر' : 'Remote')}
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="w-full h-full p-4 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div className="relative bg-black rounded-2xl overflow-hidden border border-white/10 min-h-[220px] shadow-lg">
                            {(!isVideoOff || isScreenSharing) && (cameraTrackRef.current || screenTrackRef.current) ? (
                                <VideoPlayer
                                    track={isScreenSharing ? screenTrackRef.current : cameraTrackRef.current}
                                    mirror={!isScreenSharing}
                                />
                            ) : (
                                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-white/50">
                                    <VideoOff size={32} />
                                    <span className="text-xs font-bold">{isAr ? 'كاميرتك متوقفة' : 'Camera off'}</span>
                                </div>
                            )}
                            <span className="absolute bottom-2 left-2 text-white text-[11px] font-bold bg-black/60 px-2 py-0.5 rounded-lg border border-white/10">
                                {isAr ? 'أنت' : 'You'}
                            </span>
                        </div>

                        {remoteList.map((user) => (
                            <div key={String(user.uid)} className="relative bg-slate-900 rounded-2xl overflow-hidden border border-white/10 min-h-[220px] shadow-lg">
                                {user.videoOn && user.videoTrack ? (
                                    <VideoPlayer track={user.videoTrack} />
                                ) : (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-white/50">
                                        <User size={32} />
                                        <span className="text-xs font-bold">{isAr ? 'الصوت فقط' : 'Audio only'}</span>
                                    </div>
                                )}
                                <span className="absolute bottom-2 left-2 text-white text-[11px] font-bold bg-black/60 px-2 py-0.5 rounded-lg border border-white/10" dir="ltr">
                                    {String(user.uid)}
                                </span>
                            </div>
                        ))}
                    </div>
                )}

                {isHandRaised && (
                    <div className="absolute top-4 left-4 z-20 flex items-center gap-2 bg-amber-500 text-black font-extrabold text-xs px-3 py-1.5 rounded-full shadow-2xl animate-bounce">
                        <Hand size={14} className="fill-black" />
                        <span>{isAr ? 'يدك مرفوعة' : 'Hand raised'}</span>
                    </div>
                )}
            </div>

            <div className="relative z-30 pb-6 pt-3 px-4 flex justify-center bg-gradient-to-t from-black/90 via-black/50 to-transparent">
                <div className="flex items-center gap-2 sm:gap-4 bg-black/70 backdrop-blur-xl rounded-[36px] border border-white/15 px-4 sm:px-6 py-3 shadow-[0_10px_35px_rgba(0,0,0,0.8)]">
                    <button
                        onClick={toggleMute}
                        className={`flex flex-col items-center gap-1 min-w-[56px] p-2 rounded-2xl transition-all active:scale-95 ${
                            isMuted ? 'text-red-400' : 'text-white hover:text-white/80'
                        }`}
                        title={isAr ? (isMuted ? 'إلغاء كتم الصوت' : 'كتم الصوت') : (isMuted ? 'Unmute' : 'Mute')}
                    >
                        <span className={`h-11 w-11 rounded-full flex items-center justify-center transition-all ${
                            isMuted
                                ? 'bg-red-500/20 text-red-400 border border-red-500/40 shadow-[0_0_12px_rgba(239,68,68,0.3)]'
                                : 'bg-white/10 hover:bg-white/20 text-white'
                        }`}>
                            {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
                        </span>
                        <span className="text-[10px] font-bold">
                            {isMuted ? (isAr ? 'إلغاء الكتم' : 'Unmute') : (isAr ? 'كتم الصوت' : 'Mute')}
                        </span>
                    </button>

                    <button
                        onClick={toggleVideo}
                        className={`flex flex-col items-center gap-1 min-w-[56px] p-2 rounded-2xl transition-all active:scale-95 ${
                            isVideoOff ? 'text-red-400' : 'text-white hover:text-white/80'
                        }`}
                        title={isAr ? (isVideoOff ? 'تشغيل الكاميرا' : 'إيقاف الكاميرا') : (isVideoOff ? 'Start Camera' : 'Stop Camera')}
                    >
                        <span className={`h-11 w-11 rounded-full flex items-center justify-center transition-all ${
                            isVideoOff
                                ? 'bg-red-500/20 text-red-400 border border-red-500/40 shadow-[0_0_12px_rgba(239,68,68,0.3)]'
                                : 'bg-white/10 hover:bg-white/20 text-white'
                        }`}>
                            {isVideoOff ? <VideoOff size={20} /> : <Video size={20} />}
                        </span>
                        <span className="text-[10px] font-bold">
                            {isVideoOff ? (isAr ? 'تشغيل' : 'Start') : (isAr ? 'الكاميرا' : 'Camera')}
                        </span>
                    </button>

                    {!isHost && (
                        <button
                            onClick={toggleHandRaise}
                            className={`flex flex-col items-center gap-1 min-w-[56px] p-2 rounded-2xl transition-all active:scale-95 ${
                                isHandRaised ? 'text-amber-400' : 'text-white hover:text-white/80'
                            }`}
                            title={isAr ? 'رفع اليد' : 'Raise Hand'}
                        >
                            <span className={`h-11 w-11 rounded-full flex items-center justify-center transition-all ${
                                isHandRaised
                                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/50 shadow-[0_0_12px_rgba(245,158,11,0.3)]'
                                    : 'bg-white/10 hover:bg-white/20 text-white'
                            }`}>
                                <Hand size={20} className={isHandRaised ? 'fill-amber-400' : ''} />
                            </span>
                            <span className="text-[10px] font-bold">
                                {isAr ? 'رفع اليد' : 'Hand'}
                            </span>
                        </button>
                    )}

                    {isHost && (
                        <button
                            onClick={toggleScreenShare}
                            className={`flex flex-col items-center gap-1 min-w-[56px] p-2 rounded-2xl transition-all active:scale-95 ${
                                isScreenSharing ? 'text-emerald-400' : 'text-white hover:text-white/80'
                            }`}
                            title={isAr ? (isScreenSharing ? 'إيقاف المشاركة' : 'مشاركة الشاشة') : (isScreenSharing ? 'Stop Share' : 'Share Screen')}
                        >
                            <span className={`h-11 w-11 rounded-full flex items-center justify-center transition-all ${
                                isScreenSharing
                                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                                    : 'bg-white/10 hover:bg-white/20 text-white'
                            }`}>
                                {isScreenSharing ? <Monitor size={20} /> : <MonitorOff size={20} />}
                            </span>
                            <span className="text-[10px] font-bold">
                                {isScreenSharing ? (isAr ? 'مشاركة' : 'Sharing') : (isAr ? 'الشاشة' : 'Screen')}
                            </span>
                        </button>
                    )}

                    {isSingleRemote && (
                        <button
                            onClick={swapFocus}
                            className="flex flex-col items-center gap-1 min-w-[56px] p-2 rounded-2xl text-white hover:text-white/80 transition-all active:scale-95"
                            title={isAr ? 'تبديل العرض' : 'Swap View'}
                        >
                            <span className="h-11 w-11 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white">
                                <ArrowLeftRight size={20} />
                            </span>
                            <span className="text-[10px] font-bold">
                                {isAr ? 'تبديل' : 'Swap'}
                            </span>
                        </button>
                    )}

                    <div className="w-[1px] h-8 bg-white/15 mx-1" />

                    <button
                        onClick={handleLeave}
                        className="flex flex-col items-center gap-1 min-w-[56px] p-2 rounded-2xl text-white hover:text-red-200 transition-all active:scale-95"
                        title={isAr ? 'مغادرة الغرفة' : 'Leave Room'}
                    >
                        <span className="h-11 w-11 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center text-white shadow-[0_4px_16px_rgba(239,68,68,0.5)]">
                            <LogOut size={20} className="rotate-180" />
                        </span>
                        <span className="text-[10px] font-bold text-red-200">
                            {isAr ? 'مغادرة' : 'Leave'}
                        </span>
                    </button>

                    {isHost && sessionId != null && (
                        <button
                            onClick={() => setShowEndConfirm(true)}
                            disabled={isEnding}
                            className="flex flex-col items-center gap-1 min-w-[56px] p-2 rounded-2xl text-red-300 hover:text-red-100 transition-all active:scale-95 disabled:opacity-50"
                            title={isAr ? 'إنهاء الجلسة للجميع' : 'End session for all'}
                        >
                            <span className="h-11 w-11 rounded-full bg-red-950/80 border border-red-500/60 flex items-center justify-center text-red-400 hover:bg-red-900 shadow-md">
                                {isEnding ? <Loader2 size={18} className="animate-spin" /> : <PhoneOff size={18} />}
                            </span>
                            <span className="text-[10px] font-bold text-red-400">
                                {isAr ? 'إنهاء' : 'End'}
                            </span>
                        </button>
                    )}
                </div>
            </div>

            {showEndConfirm && (
                <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-[#1a1a1a] border border-white/15 rounded-3xl p-6 max-w-sm w-full text-center shadow-2xl flex flex-col gap-4 animate-scale-up">
                        <div className="w-14 h-14 rounded-full bg-red-500/20 text-red-400 border border-red-500/40 flex items-center justify-center mx-auto">
                            <PhoneOff size={28} />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <h3 className="text-white font-bold text-lg">
                                {isAr ? 'إنهاء الجلسة التعليمية' : 'End Educational Session'}
                            </h3>
                            <p className="text-white/60 text-xs">
                                {isAr
                                    ? 'هل أنت متأكد من إنهاء الجلسة للجميع؟ سيتم إغلاق البث واعتماد إنهاء الدرس.'
                                    : 'Are you sure you want to end the session for everyone? The room will close.'}
                            </p>
                        </div>
                        <div className="flex items-center gap-3 mt-2">
                            <button
                                onClick={() => setShowEndConfirm(false)}
                                className="flex-1 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs transition-colors"
                            >
                                {isAr ? 'إلغاء' : 'Cancel'}
                            </button>
                            <button
                                onClick={handleEndSession}
                                disabled={isEnding}
                                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs transition-colors shadow-lg flex items-center justify-center gap-2"
                            >
                                {isEnding ? <Loader2 size={16} className="animate-spin" /> : null}
                                <span>{isAr ? 'نعم، أنهِ الجلسة' : 'Yes, End Session'}</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
