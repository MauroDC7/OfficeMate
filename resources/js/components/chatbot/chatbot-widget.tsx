import { usePage } from '@inertiajs/react';
import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

import { ChatbotPanel } from '@/components/chatbot/chatbot-panel';
import {
    createTimyConversation,
    fetchTimyContext,
    listTimyConversations,
    loadTimyConversation,
    sendTimyMessage,
    type TimyContextHints,
} from '@/components/chatbot/timy-api';
import { cn } from '@/lib/utils';
import type { TimyConversation, TimyMessage } from '@/types/timy';

function applyContextHints(
    setTips: (tips: string[]) => void,
    setAiConfigured: (value: boolean) => void,
    hints: TimyContextHints,
): void {
    setTips(hints.tips);
    setAiConfigured(hints.aiConfigured);
}

export function ChatbotWidget() {
    const user = usePage().props.auth.user;
    const pagePath = usePage().url;

    const [isOpen, setIsOpen] = useState(false);
    const [conversation, setConversation] = useState<TimyConversation | null>(null);
    const [messages, setMessages] = useState<TimyMessage[]>([]);
    const [tips, setTips] = useState<string[]>([]);
    const [draft, setDraft] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [aiConfigured, setAiConfigured] = useState(true);

    const ensureConversation = useCallback(async (): Promise<TimyConversation | null> => {
        const listed = await listTimyConversations();
        if ('error' in listed) {
            setError(listed.error);

            return null;
        }

        setAiConfigured(listed.aiConfigured);

        if (listed.conversations.length > 0) {
            const latest = listed.conversations[0];
            if (latest === undefined) {
                return null;
            }

            const loaded = await loadTimyConversation(latest.id, pagePath);
            if ('error' in loaded) {
                setError(loaded.error);

                return null;
            }

            setConversation(loaded.conversation);
            setMessages(loaded.messages);
            applyContextHints(setTips, setAiConfigured, loaded);

            return loaded.conversation;
        }

        const created = await createTimyConversation(pagePath);
        if ('error' in created) {
            setError(created.error);

            return null;
        }

        setConversation(created.conversation);
        setMessages(created.messages);
        applyContextHints(setTips, setAiConfigured, created);

        return created.conversation;
    }, [pagePath]);

    useEffect(() => {
        if (!isOpen || conversation !== null || user === null) {
            return;
        }

        let cancelled = false;

        setIsLoading(true);
        setError(null);

        void ensureConversation().finally(() => {
            if (!cancelled) {
                setIsLoading(false);
            }
        });

        return () => {
            cancelled = true;
        };
    }, [isOpen, conversation, user, ensureConversation]);

    useEffect(() => {
        if (!isOpen || conversation === null || user === null) {
            return;
        }

        let cancelled = false;

        void fetchTimyContext(pagePath).then((result) => {
            if (cancelled || 'error' in result) {
                return;
            }

            applyContextHints(setTips, setAiConfigured, result);
        });

        return () => {
            cancelled = true;
        };
    }, [isOpen, conversation, pagePath, user]);

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

    const handleNewChat = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        setDraft('');

        const created = await createTimyConversation(pagePath);
        setIsLoading(false);

        if ('error' in created) {
            setError(created.error);

            return;
        }

        setConversation(created.conversation);
        setMessages(created.messages);
        applyContextHints(setTips, setAiConfigured, created);
    }, [pagePath]);

    const sendMessage = useCallback(
        async (text: string) => {
            const trimmed = text.trim();
            if (trimmed === '' || isSending || user === null) {
                return;
            }

            let activeConversation = conversation;
            if (activeConversation === null) {
                setIsLoading(true);
                activeConversation = await ensureConversation();
                setIsLoading(false);
            }

            if (activeConversation === null) {
                return;
            }

            setIsSending(true);
            setError(null);
            setDraft('');

            const result = await sendTimyMessage(
                activeConversation.id,
                trimmed,
                pagePath,
            );

            setIsSending(false);

            if ('error' in result) {
                setError(result.error);
                setDraft(trimmed);

                return;
            }

            setMessages((current) => [...current, ...result.messages]);
            applyContextHints(setTips, setAiConfigured, result);
        },
        [conversation, ensureConversation, isSending, pagePath, user],
    );

    const handleSend = useCallback(() => {
        void sendMessage(draft);
    }, [draft, sendMessage]);

    const handleSuggestionSelect = useCallback(
        (text: string) => {
            void sendMessage(text);
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
                pagePath={pagePath}
                messages={messages}
                draft={draft}
                isLoading={isLoading}
                isSending={isSending}
                error={error}
                aiConfigured={aiConfigured}
                tips={tips}
                user={user}
                onDraftChange={setDraft}
                onSend={handleSend}
                onSuggestionSelect={handleSuggestionSelect}
                onNewChat={() => void handleNewChat()}
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
