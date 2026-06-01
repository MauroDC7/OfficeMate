import {
    useEffect,
    useId,
    useRef,
    type FormEvent,
    type KeyboardEvent,
} from 'react';

import { ChatbotMessageBubble } from '@/components/chatbot/chatbot-message-bubble';
import { ChatbotSuggestionChips } from '@/components/chatbot/chatbot-suggestion-chips';
import { ChatbotTypingIndicator } from '@/components/chatbot/chatbot-typing-indicator';
import { cn } from '@/lib/utils';
import type { User } from '@/types/auth';

export type ChatMessage = {
    id: string;
    role: 'user' | 'assistant';
    content: string;
};

export const PLACEHOLDER_REPLY =
    'Ik ben nog in ontwikkeling, maar straks help ik je hier direct met timesheets, verlof en projecten. Probeer het gerust nog een keer zodra ik volledig live ben.';

type ChatbotPanelProps = {
    isOpen: boolean;
    messages: ChatMessage[];
    draft: string;
    isTyping: boolean;
    user: User;
    onDraftChange: (value: string) => void;
    onSend: () => void;
    onSuggestionSelect: (text: string) => void;
    onClose: () => void;
};

function IconClose({ className }: { className?: string }) {
    return (
        <svg className={className} width={20} height={20} viewBox="0 0 24 24" aria-hidden fill="none">
            <path
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                d="M6 6l12 12M18 6L6 18"
            />
        </svg>
    );
}

export function ChatbotPanel({
    isOpen,
    messages,
    draft,
    isTyping,
    user,
    onDraftChange,
    onSend,
    onSuggestionSelect,
    onClose,
}: ChatbotPanelProps) {
    const titleId = useId();
    const listRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    const showSuggestions =
        messages.length === 1 && messages[0]?.id === 'welcome' && !isTyping;

    useEffect(() => {
        if (!isOpen) {
            return;
        }

        const list = listRef.current;
        if (list === null) {
            return;
        }

        list.scrollTop = list.scrollHeight;
    }, [isOpen, messages, isTyping]);

    useEffect(() => {
        if (!isOpen) {
            return;
        }

        const frame = window.requestAnimationFrame(() => {
            inputRef.current?.focus();
        });

        return () => window.cancelAnimationFrame(frame);
    }, [isOpen]);

    function handleSubmit(event: FormEvent) {
        event.preventDefault();
        onSend();
    }

    function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            onSend();
        }
    }

    return (
        <section
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-hidden={!isOpen}
            className={cn(
                'pointer-events-none fixed end-3 bottom-[4.5rem] z-[60] flex h-[min(32rem,calc(100svh-6rem))] w-[min(100vw-1.5rem,24rem)] flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl transition duration-300 ease-out sm:end-5 sm:bottom-[5rem] sm:w-[26rem]',
                isOpen
                    ? 'pointer-events-auto translate-y-0 scale-100 opacity-100'
                    : 'translate-y-3 scale-[0.98] opacity-0',
            )}
        >
            <header className="relative shrink-0 overflow-hidden border-b border-gray-200 bg-gray-50/90 px-4 py-3.5">
                <div
                    className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-gray-100/80 via-transparent to-transparent"
                    aria-hidden
                />
                <div className="relative flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-white p-1.5 shadow-sm">
                            <img
                                src="/img/logoTransparent.png"
                                alt=""
                                aria-hidden
                                className="size-full object-contain"
                                width={28}
                                height={28}
                                decoding="async"
                                draggable={false}
                            />
                        </span>
                        <div className="min-w-0">
                            <h2
                                id={titleId}
                                className="truncate text-base font-semibold tracking-tight text-gray-900"
                            >
                                Timy
                            </h2>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="shrink-0 rounded-lg p-2 text-gray-500 transition hover:bg-white/80 hover:text-gray-800"
                        aria-label="Chat sluiten"
                    >
                        <IconClose />
                    </button>
                </div>
            </header>

            <div
                ref={listRef}
                className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto overscroll-y-contain bg-gray-50/40 px-4 py-4"
            >
                {messages.map((message) => (
                    <ChatbotMessageBubble
                        key={message.id}
                        role={message.role}
                        content={message.content}
                        user={user}
                        isWelcome={message.id === 'welcome'}
                    />
                ))}

                {isTyping ? <ChatbotTypingIndicator /> : null}

                {showSuggestions ? (
                    <div className="pt-1">
                        <p className="mb-2 text-xs font-medium text-gray-500">
                            Inspiratie nodig?
                        </p>
                        <ChatbotSuggestionChips onSelect={onSuggestionSelect} />
                    </div>
                ) : null}
            </div>

            <form
                onSubmit={handleSubmit}
                className="shrink-0 border-t border-gray-200 bg-white p-3"
            >
                <div className="rounded-xl border border-gray-200 bg-gray-50/50 p-1.5 shadow-sm focus-within:border-gray-300 focus-within:bg-white focus-within:ring-2 focus-within:ring-gray-900/10">
                    <label htmlFor="chatbot-input" className="sr-only">
                        Bericht aan Timy
                    </label>
                    <textarea
                        ref={inputRef}
                        id="chatbot-input"
                        rows={2}
                        value={draft}
                        onChange={(event) => onDraftChange(event.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Stel je vraag…"
                        disabled={isTyping}
                        className="block max-h-32 min-h-[2.75rem] w-full resize-none bg-transparent px-2.5 py-2 text-sm text-gray-900 outline-none placeholder:text-gray-400 disabled:cursor-not-allowed disabled:opacity-60"
                    />
                    <div className="flex items-center justify-between gap-2 px-1 pb-0.5">
                        <p className="ps-1.5 text-[11px] text-gray-400">
                            Enter · Shift+Enter voor regel
                        </p>
                        <button
                            type="submit"
                            disabled={draft.trim() === '' || isTyping}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-gray-900 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            Versturen
                            <svg
                                width={14}
                                height={14}
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth={2}
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                aria-hidden
                            >
                                <path d="m22 2-7 20-4-9-9-4Z" />
                                <path d="M22 2 11 13" />
                            </svg>
                        </button>
                    </div>
                </div>
            </form>
        </section>
    );
}
