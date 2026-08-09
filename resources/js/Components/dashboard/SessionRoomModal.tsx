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
};

export const SessionRoomModal: React.FC<SessionRoomModalProps> = ({ isOpen, onClose, agora }) => {
    const { language, direction } = useLanguage();

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
    const [isEnding, setIsEnding] = useState(false);

    const isHost = (agora?.role || '').toLowerCase() === 'host';
    const appId = agora?.app_id || AGORA_CONFIG.APP_ID;
    const channel = agora?.channel || '';
    const token = agora?.token || null;
    const uid = (agora?.uid ?? 0) as string | number;
    const sessionId = agora?.session_id;

    const cleanup = useCallback(async () => {
        shouldCleanRef.current = false;
        const client = clientRef.current;
        if (client) {
            client.removeAllListeners();
            try { await client.leave(); } catch (_) { /* noop */ }
            clientRef.current = null;
        }
        micTrackRef.current?.close();
        cameraTrackRef.current?.close();
        screenTrackRef.current?.close();
        micTrackRef.current = null;
        cameraTrackRef.current = null;
        screenTrackRef.current = null;
        setJoined(false);
        setRemoteUsers({});
        setIsMuted(false);
        setIsVideoOff(false);
        setIsScreenSharing(false);
        setError(null);
    }, []);

    const initRoom = useCallback(async () => {
        if (!isOpen || !agora || !channel) return;
        setConnecting(true);
        setError(null);
        shouldCleanRef.current = true;

        const client: IAgoraRTCClient = AgoraRTC.createClient({
            mode: 'rtc',
            codec: 'vp8',
        });
        clientRef.current = client;

        client.on('user-published', async (user, mediaType) => {
            await client.subscribe(user, mediaType);
            if (mediaType === 'video') {
                const videoTrack = user.videoTrack as IRemoteVideoTrack | undefined;
                setRemoteUsers((prev) => ({ ...prev, [String(user.uid)]: { uid: user.uid, videoOn: true, videoTrack: videoTrack || null } }));
                requestAnimationFrame(() => {
                    const player = document.getElementById(`remote-player-${user.uid}`);
                    if (player && videoTrack) videoTrack.play(player);
                });
            } else if (mediaType === 'audio') {
                user.audioTrack?.play();
            }
        });

        client.on('user-unpublished', (user, mediaType) => {
            if (mediaType === 'video') {
                (user.videoTrack as IRemoteVideoTrack | undefined)?.stop();
                setRemoteUsers((prev) => {
                    if (!prev[String(user.uid)]) return prev;
                    return {
                        ...prev,
                        [String(user.uid)]: {
                            uid: user.uid,
                            videoOn: false,
                            videoTrack: (user.videoTrack as IRemoteVideoTrack | undefined) || null,
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
                setError(language === 'ar' ? 'انقطع الاتصال بالجلسة' : 'Connection to the session was lost');
            }
        });

        try {
            const micTrack: IMicrophoneAudioTrack = await AgoraRTC.createMicrophoneAudioTrack();
            const cameraTrack: ICameraVideoTrack = await AgoraRTC.createCameraVideoTrack();
            micTrackRef.current = micTrack;
            cameraTrackRef.current = cameraTrack;

            await client.join(appId, channel, token, uid);
            await client.publish([micTrack, cameraTrack]);
            setJoined(true);

            requestAnimationFrame(() => {
                const localPlayer = document.getElementById('local-player');
                if (localPlayer) cameraTrack.play(localPlayer);
            });
        } catch (e: any) {
            setError(e?.message || (language === 'ar' ? 'فشل الدخول إلى الجلسة، تأكد من صلاحيات الكاميرا والميكروفون' : 'Failed to enter the session. Please check camera & microphone permissions'));
        } finally {
            setConnecting(false);
        }
    }, [isOpen, agora, appId, token, uid, language]);

    useEffect(() => {
        if (isOpen) {
            initRoom();
        } else {
            cleanup();
        }
        return () => { cleanup(); };
    }, [isOpen, initRoom, cleanup]);

    const toggleMute = () => {
        const next = !isMuted;
        micTrackRef.current?.setMuted(next);
        setIsMuted(next);
    };

    const toggleVideo = () => {
        const next = !isVideoOff;
        if (cameraTrackRef.current) cameraTrackRef.current.setEnabled(!next);
        setIsVideoOff(next);
    };

    const toggleScreenShare = async () => {
        const client = clientRef.current;
        if (!client) return;

        try {
            if (!isScreenSharing) {
                const screenTrack = await AgoraRTC.createScreenVideoTrack({ screenAV: false }, 'disable');
                screenTrackRef.current = screenTrack;

                if (cameraTrackRef.current) await client.unpublish(cameraTrackRef.current);
                await client.publish(screenTrack);
                setIsScreenSharing(true);
                setIsVideoOff(true);
                requestAnimationFrame(() => {
                    const localPlayer = document.getElementById('local-player');
                    if (localPlayer) screenTrack.play(localPlayer);
                });
            } else {
                if (screenTrackRef.current) {
                    await client.unpublish(screenTrackRef.current);
                    screenTrackRef.current.close();
                }
                screenTrackRef.current = null;

                if (cameraTrackRef.current) {
                    await client.publish(cameraTrackRef.current);
                }
                setIsScreenSharing(false);
                setIsVideoOff(false);
                requestAnimationFrame(() => {
                    const localPlayer = document.getElementById('local-player');
                    if (localPlayer && cameraTrackRef.current) cameraTrackRef.current.play(localPlayer);
                });
            }
        } catch (e: any) {
            setError(e?.message || (language === 'ar' ? 'فشلت مشاركة الشاشة' : 'Screen sharing failed'));
        }
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

    if (!isOpen || !agora) return null;

    const remoteList = Object.values(remoteUsers);

    return (
        <div className="fixed inset-0 z-[80] bg-[#111111] flex flex-col" dir={direction}>
            {/* Connecting overlay */}
            {connecting && (
                <div className="absolute inset-0 z-20 bg-black/70 backdrop-blur-sm flex flex-col items-center justify-center gap-4">
                    <div className="relative">
                        <Loader2 size={52} className="animate-spin text-primary" />
                        <Radio size={18} className="absolute inset-0 m-auto text-primary" />
                    </div>
                    <p className="text-white font-bold text-sm">
                        {language === 'ar' ? 'جارٍ الدخول إلى الغرفة...' : 'Joining the room...'}
                    </p>
                </div>
            )}

            {/* Error banner */}
            {error && !connecting && (
                <div className="absolute top-16 inset-x-4 z-20 mx-auto max-w-lg bg-red-50 border border-red-200 text-red-700 text-sm font-semibold rounded-[var(--radius-md)] px-4 py-3 flex items-start gap-2 shadow-xl animate-fade-in">
                    <AlertTriangle size={18} className="shrink-0 mt-0.5" />
                    <span className="flex-1">{error}</span>
                    <button onClick={() => setError(null)} className="shrink-0 hover:text-red-900 transition-colors">
                        <X size={16} />
                    </button>
                </div>
            )}

            {/* Top bar */}
            <div className="relative z-10 flex items-center justify-between px-4 py-3">
                <div className={`flex items-center gap-3 ${direction === 'rtl' ? 'flex-row-reverse' : ''}`}>
                    <button
                        onClick={handleLeave}
                        className="w-10 h-10 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center transition-colors shrink-0"
                        title={language === 'ar' ? 'خروج' : 'Exit'}
                    >
                        <X size={20} />
                    </button>
                    <div className="flex items-center gap-2 bg-black/40 rounded-xl px-3.5 py-2 border border-white/10">
                        {joined ? (
                            <span className="relative flex h-2.5 w-2.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-60" />
                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-400" />
                            </span>
                        ) : (
                            <Radio size={16} className="text-green-400" />
                        )}
                        <span className="text-white font-bold text-sm max-w-[200px] truncate" dir="ltr">
                            {channel || (language === 'ar' ? 'غرفة الجلسة' : 'Session Room')}
                        </span>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <span className="hidden sm:flex items-center gap-1.5 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full text-[10px] border border-white/10 text-green-400">
                        <ShieldCheck size={12} />
                        {language === 'ar' ? 'اتصال آمن' : 'Secure'}
                    </span>
                    <span className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        isHost ? 'bg-primary/20 text-green-400 border border-primary/30' : 'bg-white/10 text-white/80 border border-white/20'
                    }`}>
                        {isHost ? (language === 'ar' ? 'مضيف' : 'Host') : (language === 'ar' ? 'طالب' : 'Student')}
                    </span>
                </div>
            </div>

            {/* Video Grid */}
            <div className="flex-1 overflow-y-auto px-4 py-2">
                <div className={`grid gap-3 h-full ${remoteList.length > 0 ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'}`}>
                    {/* Local video */}
                    <div className="relative bg-black rounded-[var(--radius-md)] overflow-hidden border border-white/10 min-h-[240px]">
                        <div id="local-player" className="absolute inset-0" />
                        {(!joined || isVideoOff) && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-white/60">
                                {isScreenSharing ? <Monitor size={28} /> : <VideoOff size={28} />}
                                <span className="text-xs font-bold">
                                    {isScreenSharing
                                        ? (language === 'ar' ? 'مشاركة الشاشة' : 'Sharing screen')
                                        : (language === 'ar' ? 'الكاميرا متوقفة' : 'Camera off')}
                                </span>
                            </div>
                        )}
                        <span className="absolute bottom-2 left-3 text-white/70 text-[10px] font-bold bg-black/50 px-2 py-0.5 rounded-full">
                            {language === 'ar' ? 'أنت' : 'You'}
                        </span>
                    </div>

                    {/* Remote videos */}
                    {remoteList.map((user) => (
                        <div key={String(user.uid)} className="relative bg-slate-900 rounded-[var(--radius-md)] overflow-hidden border border-white/10 min-h-[240px]">
                            <div id={`remote-player-${user.uid}`} className="absolute inset-0" />
                            {!user.videoOn && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-white/60">
                                    <VideoOff size={28} />
                                    <span className="text-xs font-bold">
                                        {language === 'ar' ? 'الصوت فقط' : 'Audio only'}
                                    </span>
                                </div>
                            )}
                            <span className="absolute bottom-2 left-2 text-white/70 text-[10px] font-bold bg-black/50 px-2 py-0.5 rounded-full" dir="ltr">
                                {String(user.uid)}
                            </span>
                        </div>
                    ))}

                    {remoteList.length === 0 && joined && (
                        <div className="col-span-full flex flex-col items-center justify-center py-10 gap-2 text-white/40 pointer-events-none">
                            <Loader2 size={28} className="animate-spin" />
                            <span className="text-xs font-semibold">
                                {language === 'ar' ? 'بانتظار انضمام الطرف الآخر...' : 'Waiting for the other side to join...'}
                            </span>
                        </div>
                    )}
                </div>
            </div>

            {/* Bottom controls */}
            <div className="px-4 pb-6 pt-3">
                <div className={`mx-auto flex items-center justify-center gap-2 sm:gap-3 bg-black/50 backdrop-blur-md rounded-[32px] border border-white/10 shadow-2xl px-3 sm:px-5 py-3 max-w-fit ${direction === 'rtl' ? 'flex-row-reverse' : ''}`}>
                    <ControlButton
                        onClick={toggleMute}
                        label={language === 'ar' ? 'كتم الصوت' : 'Mute'}
                        active={isMuted}
                        activeIcon={<MicOff size={22} />}
                        inactiveIcon={<Mic size={22} />}
                        danger={isMuted}
                    />
                    <ControlButton
                        onClick={toggleVideo}
                        label={language === 'ar' ? 'الكاميرا' : 'Video'}
                        active={isVideoOff}
                        activeIcon={<VideoOff size={22} />}
                        inactiveIcon={<Video size={22} />}
                        danger={isVideoOff}
                    />
                    {isHost && (
                        <ControlButton
                            onClick={toggleScreenShare}
                            label={language === 'ar' ? 'الشاشة' : 'Screen'}
                            active={isScreenSharing}
                            activeIcon={<Monitor size={22} />}
                            inactiveIcon={<MonitorOff size={22} />}
                            danger={isScreenSharing}
                        />
                    )}

                    {/* Leave */}
                    <button
                        onClick={handleLeave}
                        className="flex flex-col items-center gap-1 min-w-[64px] px-2 py-2 rounded-2xl hover:bg-red-500/20 transition-colors"
                        title={language === 'ar' ? 'مغادرة' : 'Leave'}
                    >
                        <span className="h-12 w-12 rounded-full bg-red-500 flex items-center justify-center text-white shadow-[0_4px_16px_rgba(239,68,68,.45)] hover:bg-red-600 transition-colors">
                            <LogOut size={24} className="rotate-90" />
                        </span>
                        <span className="text-white/80 text-[9px] font-bold">
                            {language === 'ar' ? 'مغادرة' : 'Leave'}
                        </span>
                    </button>

                    {isHost && sessionId != null && (
                        <button
                            onClick={handleEndSession}
                            disabled={isEnding}
                            className="flex flex-col items-center gap-1 min-w-[64px] px-2 rounded-2xl hover:bg-red-500/20 transition-colors disabled:opacity-60"
                            title={language === 'ar' ? 'إنهاء الجلسة' : 'End session'}
                        >
                            <span className="h-12 w-12 rounded-full bg-red-600 border-2 border-red-400 flex items-center justify-center text-white hover:bg-red-700 transition-colors">
                                {isEnding ? <Loader2 size={22} className="animate-spin" /> : <PhoneOff size={22} />}
                            </span>
                            <span className="text-red-300 text-[9px] font-bold">
                                {language === 'ar' ? 'إنهاء الجلسة' : 'End Session'}
                            </span>
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

interface ControlButtonProps {
    label: string;
    active: boolean;
    activeIcon: React.ReactNode;
    inactiveIcon: React.ReactNode;
    danger?: boolean;
    onClick: () => void;
}

const ControlButton: React.FC<ControlButtonProps> = ({ label, active, activeIcon, inactiveIcon, danger, onClick }) => (
    <button
        onClick={onClick}
        className="flex flex-col items-center gap-1 min-w-[64px] px-2 rounded-2xl hover:bg-white/5 transition-colors"
        title={label}
    >
        <span className={`h-12 w-12 rounded-full flex items-center justify-center transition-colors ${
            danger
                ? 'bg-red-500 text-white shadow-[0_0_16px_rgba(239,68,68,.35)]'
                : 'bg-white/10 text-white hover:bg-white/20'
        }`}>
            {active ? activeIcon : inactiveIcon}
        </span>
        <span className={`text-[9px] font-bold ${danger ? 'text-red-300' : 'text-white/80'}`}>
            {label}
        </span>
    </button>
);