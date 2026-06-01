import { usePage } from '@inertiajs/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import {
    ChatbotPanel,
    PLACEHOLDER_REPLY,
    type ChatMessage,
} from '@/components/chatbot/chatbot-panel';
import { cn } from '@/lib/utils';
import { getUserFirstName } from '@/lib/user-display';

const TYPING_DELAY_MS = 900;

function createMessageId(): string {
    return `msg-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function welcomeMessage(firstName: string): ChatMessage {
    const greeting =
        firstName !== '' ? `Hoi ${firstName}!` : 'Hoi!';

    return {
        id: 'welcome',
        role: 'assistant',
        content: `${greeting} Ik ben Timy. Waar kan ik je vandaag mee helpen? Straks beantwoord ik je vragen over timesheets, verlof en projecten — direct vanuit TimeTraq.`,
    };
}

export function ChatbotWidget() {
    const user = usePage().props.auth.user;
    const firstName = getUserFirstName(user);

    const [isOpen, setIsOpen] = useState(false);
    const [draft, setDraft] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>(() => [
        welcomeMessage(firstName),
    ]);
    const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        setMessages([welcomeMessage(firstName)]);
    }, [firstName]);

    useEffect(() => {
        return () => {
            if (typingTimeoutRef.current !== null) {
                clearTimeout(typingTimeoutRef.current);
            }
        };
    }, []);

    useEffect(() => {
        if (!isOpen) {
            return;
        }

        function onKeyDown(event: KeyboardEvent) {
            if (event.key === 'Escape') {
                setIsOpen(false);
            }
        }

        window.addEventListener('keydown', onKeyDown);

        return () => window.removeEventListener('keydown', onKeyDown);
    }, [isOpen]);

    const sendMessage = useCallback((text: string) => {
        const trimmed = text.trim();
        if (trimmed === '' || user === null || isTyping) {
            return;
        }

        setMessages((current) => [
            ...current,
            { id: createMessageId(), role: 'user', content: trimmed },
        ]);
        setDraft('');
        setIsTyping(true);

        if (typingTimeoutRef.current !== null) {
            clearTimeout(typingTimeoutRef.current);
        }

        typingTimeoutRef.current = setTimeout(() => {
            setMessages((current) => [
                ...current,
                {
                    id: createMessageId(),
                    role: 'assistant',
                    content: PLACEHOLDER_REPLY,
                },
            ]);
            setIsTyping(false);
            typingTimeoutRef.current = null;
        }, TYPING_DELAY_MS);
    }, [isTyping, user]);

    const handleSend = useCallback(() => {
        sendMessage(draft);
    }, [draft, sendMessage]);

    const handleSuggestionSelect = useCallback(
        (text: string) => {
            sendMessage(text);
        },
        [sendMessage],
    );

    if (user === null || typeof document === 'undefined') {
        return null;
    }

    return createPortal(
        <>
            <ChatbotPanel
                isOpen={isOpen}
                messages={messages}
                draft={draft}
                isTyping={isTyping}
                user={user}
                onDraftChange={setDraft}
                onSend={handleSend}
                onSuggestionSelect={handleSuggestionSelect}
                onClose={() => setIsOpen(false)}
            />

            <button
                type="button"
                onClick={() => setIsOpen((open) => !open)}
                aria-expanded={isOpen}
                className={cn(
                    'fixed end-4 bottom-4 z-[60] inline-flex items-center justify-center gap-2 rounded-full border shadow-lg transition duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 sm:end-6 sm:bottom-6',
                    isOpen
                        ? 'size-12 border-gray-200 bg-white text-gray-700 hover:bg-gray-50 focus-visible:outline-gray-900'
                        : 'border-gray-200 bg-white px-4 py-3 text-gray-900 shadow-md hover:border-gray-300 hover:bg-gray-50 focus-visible:outline-gray-900 sm:pe-5',
                )}
                aria-label={isOpen ? 'Chat sluiten' : 'Chat met Timy openen'}
            >
                {isOpen ? (
                    <svg
                        width={20}
                        height={20}
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2}
                        strokeLinecap="round"
                        aria-hidden
                    >
                        <path d="M6 6l12 12M18 6L6 18" />
                    </svg>
                ) : (
                    <>
                        <span className="flex size-8 shrink-0 items-center justify-center rounded-full border border-gray-100 bg-gray-50 p-1">
                            <img
                                src="/img/Logo.png"
                                alt=""
                                className="size-full object-contain"
                                width={28}
                                height={28}
                                decoding="async"
                                draggable={false}
                                aria-hidden
                            />
                        </span>
                        <span className="hidden text-sm font-semibold sm:inline">
                            Timy
                        </span>
                    </>
                )}
            </button>
        </>,
        document.body,
    );
}
