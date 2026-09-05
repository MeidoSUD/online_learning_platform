import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../../Contexts/LanguageContext';
import { Send, Sparkles, Loader2, Trash2, User, Bot } from 'lucide-react';
import { aiService } from '../../Services/api';

interface AiMessage {
    id: string | number;
    role: 'user' | 'assistant';
    content: string;
    created_at?: string;
}

export const AiAssistantTab: React.FC = () => {
    const { t, language, direction } = useLanguage();
    const [messages, setMessages] = useState<AiMessage[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [historyLoading, setHistoryLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const bodyRef = useRef<HTMLDivElement>(null);

    const loadHistory = async () => {
        setHistoryLoading(true);
        try {
            const data = await aiService.history();
            setMessages(Array.isArray(data) ? data : []);
        } catch (e) {
            console.error(e);
        } finally {
            setHistoryLoading(false);
        }
    };

    useEffect(() => {
        loadHistory();
    }, []);

    useEffect(() => {
        bodyRef.current?.scrollTo({ top: bodyRef.current.scrollHeight, behavior: 'smooth' });
    }, [messages, historyLoading]);

    const handleSend = async () => {
        const text = input.trim();
        if (!text || sending) return;
        setSending(true);
        setInput('');
        setMessages(prev => [...prev, { id: `local-${Date.now()}`, role: 'user', content: text }]);
        setLoading(true);
        try {
            const res = await aiService.send(text);
            if (res.success && res.data?.reply) {
                setMessages(prev => [...prev, {
                    id: res.data.id ?? `local-${Date.now()}`,
                    role: 'assistant',
                    content: res.data.reply,
                    created_at: res.data.created_at,
                }]);
            } else {
                setMessages(prev => [...prev, {
                    id: `local-err-${Date.now()}`,
                    role: 'assistant',
                    content: res.message || (language === 'ar' ? 'لم أتمكن من الرد حالياً' : 'I could not reply right now'),
                }]);
            }
        } catch (e: any) {
            setMessages(prev => [...prev, {
                id: `local-err-${Date.now()}`,
                role: 'assistant',
                content: e.message || (language === 'ar' ? 'حدث خطأ، حاول مجدداً' : 'Something went wrong, try again'),
            }]);
        } finally {
            setLoading(false);
            setSending(false);
        }
    };

    const handleClear = async () => {
        if (!window.confirm(language === 'ar' ? 'مسح المحادثة؟' : 'Clear conversation?')) return;
        try {
            await aiService.clear();
            setMessages([]);
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <div className="space-y-6 animate-fade-in" dir={direction}>
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-[var(--text-main)]">
                    {language === 'ar' ? 'مساعدي الذكي' : 'My AI Assistant'}
                </h2>
                {messages.length > 0 && (
                    <button
                        onClick={handleClear}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-red-200 bg-red-50 text-red-600 text-sm hover:bg-red-100 transition-colors"
                    >
                        <Trash2 size={15} />
                        {language === 'ar' ? 'مسح' : 'Clear'}
                    </button>
                )}
            </div>

            <div className="bg-white rounded-[var(--radius-md)] shadow-[var(--shadow-sm)] border border-[var(--border)] flex flex-col h-[70vh] overflow-hidden">
                <div className="px-5 py-4 border-b border-[var(--border)] flex items-center gap-3 bg-gradient-to-r from-primary/10 to-transparent">
                    <div className="p-2.5 rounded-full bg-primary/15 text-primary">
                        <Sparkles size={20} />
                    </div>
                    <div>
                        <p className="font-bold text-[var(--text-main)]">Ewan Genius AI</p>
                        <p className="text-xs text-[var(--text-muted)]">
                            {language === 'ar' ? 'مساعدك التعليمي الذكي' : 'Your smart educational assistant'}
                        </p>
                    </div>
                </div>

                <div ref={bodyRef} className="flex-1 overflow-y-auto p-5 space-y-4 bg-[var(--light-bg)]">
                    {historyLoading ? (
                        <div className="flex justify-center py-10">
                            <Loader2 className="animate-spin text-primary" size={28} />
                        </div>
                    ) : messages.length === 0 ? (
                        <div className="text-center py-16">
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary mb-4">
                                <Sparkles size={28} />
                            </div>
                            <p className="text-[var(--text-muted)] font-medium">
                                {language === 'ar' ? 'اسألني عن أي شيء في دراستك!' : 'Ask me anything about your studies!'}
                            </p>
                            <p className="text-[var(--text-muted)] text-sm mt-1">
                                {language === 'ar' ? 'شرح الدروس، حل المسائل، والمزيد' : 'Lesson explanations, solving problems, and more'}
                            </p>
                        </div>
                    ) : (
                        messages.map(msg => (
                            <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                {msg.role === 'assistant' && (
                                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                        <Bot size={16} className="text-primary" />
                                    </div>
                                )}
                                <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                                    msg.role === 'user'
                                        ? 'bg-gradient-to-br from-[var(--green-light)] to-[var(--green)] text-white rounded-br-sm'
                                        : 'bg-white border border-[var(--border)] text-[var(--text-main)] rounded-bl-sm shadow-[var(--shadow-sm)]'
                                }`}>
                                    {msg.content}
                                </div>
                                {msg.role === 'user' && (
                                    <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center shrink-0">
                                        <User size={16} className="text-white" />
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                    {loading && (
                        <div className="flex gap-3 justify-start">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                <Bot size={16} className="text-primary" />
                            </div>
                            <div className="px-4 py-3 bg-white border border-[var(--border)] rounded-2xl rounded-bl-sm flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full bg-[var(--text-muted)] animate-bounce" />
                                <span className="w-2 h-2 rounded-full bg-[var(--text-muted)] animate-bounce" style={{ animationDelay: '0.15s' }} />
                                <span className="w-2 h-2 rounded-full bg-[var(--text-muted)] animate-bounce" style={{ animationDelay: '0.3s' }} />
                            </div>
                        </div>
                    )}
                </div>

                <div className="px-4 py-3 border-t border-[var(--border)] bg-white">
                    <div className="flex items-center gap-2">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') handleSend(); }}
                            placeholder={language === 'ar' ? 'اكتب سؤالك...' : 'Type your question...'}
                            className="flex-1 px-4 py-3 rounded-[50px] border border-[var(--border)] text-sm bg-[var(--light-bg)] focus:outline-none focus:border-primary"
                        />
                        <button
                            onClick={handleSend}
                            disabled={!input.trim() || sending}
                            className="flex items-center gap-1.5 px-5 py-3 rounded-[50px] bg-gradient-to-br from-[var(--green-light)] to-[var(--green)] text-white text-sm font-bold hover:shadow-[0_10px_28px_rgba(61,139,55,.35)] transition-all shadow-[0_6px_20px_rgba(61,139,55,.3)] disabled:opacity-40"
                        >
                            {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                            {language === 'ar' ? 'إرسال' : 'Send'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
