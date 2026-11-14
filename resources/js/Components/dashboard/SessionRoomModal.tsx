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
    MessageSquare,
    Send,
    MessageCircle,
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
        chat_room_id?: string;
        chat_token?: string;
        chat_agora_uid?: string;
    } | null;
}

const AGORA_CONFIG = {
    APP_ID: "3a77d1a600964e9bb4aae8b0dd59f157"
};

try {
    AgoraRTC.disableLogUpload();
} catch {}

type RemoteUserView = {
    uid: string | number;
    videoOn: boolean;
    videoTrack: IRemoteVideoTrack | null;
};

interface ChatMessage {
    id: string;
    senderUid: string | number;
    senderName: string;
    text: string;
    time: string;
    isSelf: boolean;
}

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

    // In-session Chat state
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [messageInput, setMessageInput] = useState('');
    const [unreadCount, setUnreadCount] = useState(0);
    const isChatOpenRef = useRef(false);
    const messagesEndRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        isChatOpenRef.current = isChatOpen;
        if (isChatOpen) {
            setUnreadCount(0);
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [isChatOpen]);

    useEffect(() => {
        if (isChatOpen) {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages.length, isChatOpen]);

    const isHost = (agora?.role || '').toLowerCase() === 'host';
    const appId = agora?.app_id || AGORA_CONFIG.APP_ID;
    const channel = agora?.channel || '';
    const token = agora?.token || null;
    const uid = (agora?.uid ?? 0) as string | number;
    const sessionId = agora?.session_id;
    const chatRoomId = agora?.chat_room_id;

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
        if (screenTrackRef.current) {
            screenTrackRef.current.removeAllListeners();
            screenTrackRef.current.close();
        }
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

    const stopScreenSharing = useCallback(async () => {
        const client = clientRef.current;
        if (screenTrackRef.current) {
            screenTrackRef.current.removeAllListeners();
            if (client) {
                try { await client.unpublish(screenTrackRef.current); } catch {}
            }
            screenTrackRef.current.close();
            screenTrackRef.current = null;
        }
        setIsScreenSharing(false);

        if (client && cameraTrackRef.current) {
            try {
                await client.publish(cameraTrackRef.current);
                setIsVideoOff(false);
                requestAnimationFrame(() => {
                    const localPlayer = document.getElementById('local-player');
                    if (localPlayer && cameraTrackRef.current) cameraTrackRef.current.play(localPlayer);
                });
            } catch (err) {
                console.error('Failed to restore camera after screen share:', err);
            }
        }
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
                    if (player && videoTrack) videoTrack.play(player, { fit: 'contain' });
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

        // Listen for in-session real-time chat messages via Data Stream
        client.on('stream-message', (remoteUid, payload) => {
            try {
                const text = new TextDecoder().decode(payload);
                const data = JSON.parse(text);
                if (data && data.text) {
                    const newMsg: ChatMessage = {
                        id: data.id || String(Date.now()),
                        senderUid: remoteUid,
                        senderName: data.senderName || String(remoteUid),
                        text: data.text,
                        time: data.time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                        isSelf: false,
                    };
                    setMessages((prev) => [...prev, newMsg]);
                    if (!isChatOpenRef.current) {
                        setUnreadCount((c) => c + 1);
                    }
                }
            } catch (err) {
                console.warn('stream-message decode error:', err);
            }
        });

        try {
            let micTrack: IMicrophoneAudioTrack | null = null;
            let cameraTrack: ICameraVideoTrack | null = null;
            const tracksToPublish = [];
            const permissionWarnings: string[] = [];

            try {
                micTrack = await AgoraRTC.createMicrophoneAudioTrack();
                micTrackRef.current = micTrack;
                tracksToPublish.push(micTrack);
            } catch (micErr: any) {
                console.warn('Microphone access failed:', micErr);
                setIsMuted(true);
                permissionWarnings.push(language === 'ar' ? 'الميكروفون' : 'Microphone');
            }

            try {
                cameraTrack = await AgoraRTC.createCameraVideoTrack();
                cameraTrackRef.current = cameraTrack;
                tracksToPublish.push(cameraTrack);
            } catch (camErr: any) {
                console.warn('Camera access failed:', camErr);
                setIsVideoOff(true);
                permissionWarnings.push(language === 'ar' ? 'الكاميرا' : 'Camera');
            }

            await client.join(appId, channel, token, uid);

            if (tracksToPublish.length > 0) {
                await client.publish(tracksToPublish);
            }
            setJoined(true);

            if (cameraTrack) {
                requestAnimationFrame(() => {
                    const localPlayer = document.getElementById('local-player');
                    if (localPlayer) cameraTrack.play(localPlayer);
                });
            }

            if (permissionWarnings.length > 0) {
                const missing = permissionWarnings.join(language === 'ar' ? ' و ' : ' & ');
                setError(
                    language === 'ar'
                        ? `تم الانضمام للجلسة. تعذر تشغيل (${missing}) لعدم منح الإذن في المتصفح. يمكنك الضغط على أيقونة الإعدادات ⚙️ بجانب الرابط في شريط المتصفح وتفعيل الوصول.`
                        : `Joined session. Could not access (${missing}) because permission was dismissed. Please allow in browser address bar settings.`
                );
            }
        } catch (e: any) {
            console.error('Session join error:', e);
            const isPerm = e?.message?.includes('Permission') || e?.name === 'NotAllowedError';
            if (isPerm) {
                setError(
                    language === 'ar'
                        ? 'تم رفض أو تجاهل إذن الميكروفون/الكاميرا في المتصفح. يرجى الضغط على أيقونة الإعدادات بجانب رابط الموقع في شريط المتصفح وتفعيل الميكروفون والكاميرا ثم المحاولة مجدداً.'
                        : 'Microphone/Camera permission was dismissed or blocked. Please allow permissions via the browser address bar icon.'
                );
            } else {
                setError(e?.message || (language === 'ar' ? 'فشل الدخول إلى الجلسة، تأكد من صلاحيات الكاميرا والميكروفون' : 'Failed to enter the session. Please check camera & microphone permissions'));
            }
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

    const toggleMute = async () => {
        if (!micTrackRef.current) {
            try {
                const mic = await AgoraRTC.createMicrophoneAudioTrack();
                micTrackRef.current = mic;
                if (clientRef.current && joined) {
                    await clientRef.current.publish([mic]);
                }
                setIsMuted(false);
                setError(null);
                return;
            } catch (err: any) {
                setError(language === 'ar' ? 'يرجى السماح بصلاحية الميكروفون من إعدادات المتصفح' : 'Please allow microphone permission in browser settings');
                return;
            }
        }
        const next = !isMuted;
        micTrackRef.current?.setMuted(next);
        setIsMuted(next);
    };

    const toggleVideo = async () => {
        if (!cameraTrackRef.current) {
            try {
                const cam = await AgoraRTC.createCameraVideoTrack();
                cameraTrackRef.current = cam;
                if (clientRef.current && joined) {
                    await clientRef.current.publish([cam]);
                }
                setIsVideoOff(false);
                setError(null);
                requestAnimationFrame(() => {
                    const localPlayer = document.getElementById('local-player');
                    if (localPlayer) cam.play(localPlayer);
                });
                return;
            } catch (err: any) {
                setError(language === 'ar' ? 'يرجى السماح بصلاحية الكاميرا من إعدادات المتصفح' : 'Please allow camera permission in browser settings');
                return;
            }
        }
        const next = !isVideoOff;
        if (cameraTrackRef.current) cameraTrackRef.current.setEnabled(!next);
        setIsVideoOff(next);
    };

    const toggleScreenShare = async () => {
        const client = clientRef.current;
        if (!client) return;

        try {
            if (!isScreenSharing) {
                // In Agora Web SDK 4.x, passing encoder config and "disable" for audio
                const screenTrackResult = await AgoraRTC.createScreenVideoTrack(
                    { encoderConfig: "1080p_1" },
                    "disable"
                );
                const screenTrack: ILocalVideoTrack = Array.isArray(screenTrackResult)
                    ? screenTrackResult[0]
                    : screenTrackResult;

                screenTrackRef.current = screenTrack;

                // Handle user clicking native browser "Stop sharing" bar
                screenTrack.on('track-ended', () => {
                    stopScreenSharing();
                });

                if (cameraTrackRef.current) {
                    try { await client.unpublish(cameraTrackRef.current); } catch {}
                }

                await client.publish(screenTrack);
                setIsScreenSharing(true);
                setIsVideoOff(true);
                setError(null);

                requestAnimationFrame(() => {
                    const localPlayer = document.getElementById('local-player');
                    if (localPlayer) screenTrack.play(localPlayer, { fit: 'contain' });
                });
            } else {
                await stopScreenSharing();
            }
        } catch (e: any) {
            console.error('Screen share error:', e);
            const msg = e?.message || '';
            if (msg.includes('Permission') || e?.name === 'NotAllowedError') {
                setError(
                    language === 'ar'
                        ? 'تعذرت مشاركة الشاشة. تأكد من السماح بمشاركة الشاشة في المتصفح، ومنح Google Chrome إذن (تسجيل الشاشة / Screen Recording) من إعدادات نظام Mac (System Settings > Privacy & Security).'
                        : 'Screen sharing permission denied. Please allow screen sharing in browser and check macOS Privacy & Security > Screen Recording for Google Chrome.'
                );
            } else {
                setError(msg || (language === 'ar' ? 'فشلت مشاركة الشاشة' : 'Screen sharing failed'));
            }
        }
    };

    const handleSendMessage = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        const trimmed = messageInput.trim();
        if (!trimmed || !clientRef.current || !joined) return;

        const now = new Date();
        const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const senderLabel = isHost
            ? (language === 'ar' ? 'المعلم' : 'Teacher')
            : (language === 'ar' ? 'الطالب' : 'Student');

        const msgPayload = {
            type: 'chat',
            id: String(Date.now()),
            senderUid: uid,
            senderName: senderLabel,
            text: trimmed,
            time: timeStr,
        };

        try {
            const encoded = new TextEncoder().encode(JSON.stringify(msgPayload));
            await clientRef.current.sendStreamMessage(encoded);
        } catch (err) {
            console.warn('sendStreamMessage warning:', err);
        }

        setMessages((prev) => [
            ...prev,
            {
                id: msgPayload.id,
                senderUid: uid,
                senderName: language === 'ar' ? 'أنت' : 'You',
                text: trimmed,
                time: timeStr,
                isSelf: true,
            }
        ]);
        setMessageInput('');
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
            <div className="relative z-10 flex items-center justify-between px-4 py-3 bg-black/30 border-b border-white/5">
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
                        {chatRoomId && (
                            <span className="hidden md:inline-block text-[11px] font-semibold text-white/50 px-2 py-0.5 rounded bg-white/5 border border-white/10" dir="ltr">
                                Chat: {chatRoomId}
                            </span>
                        )}
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

            {/* Main Stage (Video Grid + Slide-in Chat) */}
            <div className="flex-1 flex overflow-hidden">
                {/* Video Grid */}
                <div className="flex-1 overflow-y-auto p-4 flex flex-col justify-center">
                    <div className={`grid gap-3 h-full max-h-[75vh] ${remoteList.length > 0 ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'}`}>
                        {/* Local video */}
                        <div className="relative bg-black rounded-2xl overflow-hidden border border-white/10 min-h-[240px] flex items-center justify-center">
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
                            <span className="absolute bottom-2 left-3 text-white/70 text-[10px] font-bold bg-black/50 px-2.5 py-1 rounded-full border border-white/10">
                                {language === 'ar' ? 'أنت' : 'You'}
                            </span>
                        </div>

                        {/* Remote videos */}
                        {remoteList.map((user) => (
                            <div key={String(user.uid)} className="relative bg-slate-900 rounded-2xl overflow-hidden border border-white/10 min-h-[240px] flex items-center justify-center">
                                <div id={`remote-player-${user.uid}`} className="absolute inset-0" />
                                {!user.videoOn && (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-white/60">
                                        <VideoOff size={28} />
                                        <span className="text-xs font-bold">
                                            {language === 'ar' ? 'الصوت فقط' : 'Audio only'}
                                        </span>
                                    </div>
                                )}
                                <span className="absolute bottom-2 left-2 text-white/70 text-[10px] font-bold bg-black/50 px-2.5 py-1 rounded-full border border-white/10" dir="ltr">
                                    {String(user.uid)}
                                </span>
                            </div>
                        ))}

                        {remoteList.length === 0 && joined && (
                            <div className="col-span-full flex flex-col items-center justify-center py-10 gap-2 text-white/40 pointer-events-none">
                                <Loader2 size={28} className="animate-spin text-primary" />
                                <span className="text-xs font-semibold">
                                    {language === 'ar' ? 'بانتظار انضمام الطرف الآخر...' : 'Waiting for the other participant to join...'}
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {/* In-Session Chat Drawer */}
                {isChatOpen && (
                    <div className="w-80 sm:w-96 bg-[#181818] border-s border-white/10 flex flex-col shadow-2xl z-20 animate-fade-in">
                        {/* Chat Header */}
                        <div className="p-3.5 border-b border-white/10 flex items-center justify-between bg-black/20">
                            <div className="flex items-center gap-2 text-white">
                                <MessageCircle size={18} className="text-primary" />
                                <h3 className="font-bold text-sm">
                                    {language === 'ar' ? 'محادثة الجلسة' : 'Session Chat'}
                                </h3>
                            </div>
                            <button
                                onClick={() => setIsChatOpen(false)}
                                className="p-1 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        {chatRoomId && (
                            <div className="px-3.5 py-1.5 bg-black/30 border-b border-white/5 flex items-center justify-between text-[11px] text-white/50">
                                <span>{language === 'ar' ? 'معرف الغرفة:' : 'Room ID:'}</span>
                                <span className="font-mono text-primary font-semibold" dir="ltr">#{chatRoomId}</span>
                            </div>
                        )}

                        {/* Messages Area */}
                        <div className="flex-1 overflow-y-auto p-3.5 space-y-3">
                            {messages.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-white/40 gap-2">
                                    <MessageSquare size={32} className="opacity-30" />
                                    <p className="text-xs">
                                        {language === 'ar' ? 'لا توجد رسائل بعد. ابدأ المحادثة!' : 'No messages yet. Start chatting!'}
                                    </p>
                                </div>
                            ) : (
                                messages.map((m) => (
                                    <div
                                        key={m.id}
                                        className={`flex flex-col ${m.isSelf ? 'items-end' : 'items-start'}`}
                                    >
                                        <div className="flex items-center gap-1.5 text-[10px] text-white/50 mb-1 px-1">
                                            <span className="font-bold text-white/70">{m.senderName}</span>
                                            <span>•</span>
                                            <span>{m.time}</span>
                                        </div>
                                        <div
                                            className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-xs leading-relaxed break-words shadow-sm ${
                                                m.isSelf
                                                    ? 'bg-primary text-white rounded-tr-none'
                                                    : 'bg-white/10 text-white rounded-tl-none border border-white/10'
                                            }`}
                                        >
                                            {m.text}
                                        </div>
                                    </div>
                                ))
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        <form onSubmit={handleSendMessage} className="p-3 border-t border-white/10 bg-black/20 flex items-center gap-2">
                            <input
                                type="text"
                                value={messageInput}
                                onChange={(e) => setMessageInput(e.target.value)}
                                placeholder={language === 'ar' ? 'اكتب رسالتك...' : 'Type a message...'}
                                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-white/40 focus:outline-none focus:border-primary transition"
                            />
                            <button
                                type="submit"
                                disabled={!messageInput.trim() || !joined}
                                className="p-2.5 rounded-xl bg-primary hover:bg-primary-dark text-white disabled:opacity-40 transition shadow-sm"
                                title={language === 'ar' ? 'إرسال' : 'Send'}
                            >
                                <Send size={15} className={direction === 'rtl' ? 'rotate-180' : ''} />
                            </button>
                        </form>
                    </div>
                )}
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

                    {/* Screen Sharing (Available for all participants) */}
                    <ControlButton
                        onClick={toggleScreenShare}
                        label={language === 'ar' ? 'الشاشة' : 'Screen'}
                        active={isScreenSharing}
                        activeIcon={<Monitor size={22} />}
                        inactiveIcon={<MonitorOff size={22} />}
                        danger={isScreenSharing}
                    />

                    {/* Chat Drawer Toggle */}
                    <ControlButton
                        onClick={() => setIsChatOpen(!isChatOpen)}
                        label={language === 'ar' ? 'المحادثة' : 'Chat'}
                        active={isChatOpen}
                        activeIcon={<MessageSquare size={22} />}
                        inactiveIcon={<MessageSquare size={22} />}
                        danger={false}
                        badge={unreadCount > 0 ? unreadCount : undefined}
                    />

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
    badge?: number;
    onClick: () => void;
}

const ControlButton: React.FC<ControlButtonProps> = ({ label, active, activeIcon, inactiveIcon, danger, badge, onClick }) => (
    <button
        onClick={onClick}
        className="relative flex flex-col items-center gap-1 min-w-[64px] px-2 rounded-2xl hover:bg-white/5 transition-colors"
        title={label}
    >
        <span className={`relative h-12 w-12 rounded-full flex items-center justify-center transition-colors ${
            danger
                ? 'bg-red-500 text-white shadow-[0_0_16px_rgba(239,68,68,.35)]'
                : active
                    ? 'bg-primary text-white shadow-[0_0_16px_rgba(16,185,129,.35)]'
                    : 'bg-white/10 text-white hover:bg-white/20'
        }`}>
            {active ? activeIcon : inactiveIcon}
            {badge != null && badge > 0 && (
                <span className="absolute -top-1 -right-1 h-5 min-w-[20px] px-1 rounded-full bg-red-500 text-white text-[10px] font-black flex items-center justify-center border-2 border-black">
                    {badge}
                </span>
            )}
        </span>
        <span className={`text-[9px] font-bold ${danger ? 'text-red-300' : 'text-white/80'}`}>
            {label}
        </span>
    </button>
);
