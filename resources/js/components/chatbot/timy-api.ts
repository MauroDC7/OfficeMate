import {
    index as timyConversationsIndex,
    show as timyConversationShow,
    store as timyConversationsStore,
} from '@/routes/timy/conversations';
import { store as timyStoreMessage } from '@/routes/timy/conversations/messages';
import type { TimyConversation, TimyConversationSummary, TimyMessage } from '@/types/timy';

function csrfToken(): string {
    const meta = document.querySelector('meta[name="csrf-token"]');

    return meta?.getAttribute('content') ?? '';
}

async function parseJson<T>(response: Response): Promise<T & { message?: string }> {
    return (await response.json()) as T & { message?: string };
}

async function timyFetch<T>(
    url: string,
    init?: RequestInit,
): Promise<{ data: T } | { error: string }> {
    const response = await fetch(url, {
        credentials: 'same-origin',
        headers: {
            Accept: 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
            ...(init?.body !== undefined
                ? { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': csrfToken() }
                : {}),
            ...init?.headers,
        },
        ...init,
    });

    const data = await parseJson<T>(response);

    if (!response.ok) {
        return {
            error:
                typeof data.message === 'string' && data.message !== ''
                    ? data.message
                    : 'Er ging iets mis. Probeer het opnieuw.',
        };
    }

    return { data };
}

export async function listTimyConversations(): Promise<
    | { conversations: TimyConversationSummary[]; aiConfigured: boolean }
    | { error: string }
> {
    const result = await timyFetch<{
        conversations: TimyConversationSummary[];
        ai_configured: boolean;
    }>(timyConversationsIndex.url());

    if ('error' in result) {
        return result;
    }

    return {
        conversations: result.data.conversations,
        aiConfigured: result.data.ai_configured,
    };
}

export async function createTimyConversation(): Promise<
    | { conversation: TimyConversation; messages: TimyMessage[] }
    | { error: string }
> {
    const result = await timyFetch<{
        conversation: TimyConversation;
        messages: TimyMessage[];
    }>(timyConversationsStore.url(), { method: 'POST' });

    if ('error' in result) {
        return result;
    }

    return {
        conversation: result.data.conversation,
        messages: result.data.messages,
    };
}

export async function loadTimyConversation(
    conversationId: number,
): Promise<
    | { conversation: TimyConversation; messages: TimyMessage[]; aiConfigured: boolean }
    | { error: string }
> {
    const result = await timyFetch<{
        conversation: TimyConversation;
        messages: TimyMessage[];
        ai_configured: boolean;
    }>(timyConversationShow.url({ timy_conversation: conversationId }));

    if ('error' in result) {
        return result;
    }

    return {
        conversation: result.data.conversation,
        messages: result.data.messages,
        aiConfigured: result.data.ai_configured,
    };
}

export async function sendTimyMessage(
    conversationId: number,
    content: string,
    pagePath: string,
): Promise<{ messages: TimyMessage[] } | { error: string }> {
    const result = await timyFetch<{ messages: TimyMessage[] }>(
        timyStoreMessage.url({ timy_conversation: conversationId }),
        {
            method: 'POST',
            body: JSON.stringify({ content, page_path: pagePath }),
        },
    );

    if ('error' in result) {
        return result;
    }

    return { messages: result.data.messages };
}
