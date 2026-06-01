import {
    index as timyConversationsIndex,
    show as timyConversationShow,
    store as timyConversationsStore,
} from '@/routes/timy/conversations';
import { store as timyStoreMessage } from '@/routes/timy/conversations/messages';
import { store as timyExecuteAction } from '@/routes/timy/actions';
import { context as timyContextRoute } from '@/routes/timy';
import type { TimyPendingAction } from '@/types/timy';
import type { TimyConversation, TimyConversationSummary, TimyMessage } from '@/types/timy';

export type TimyContextHints = {
    tips: string[];
    page: string;
    aiConfigured: boolean;
};

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

function mapContextPayload(data: {
    tips?: string[];
    page?: string;
    ai_configured?: boolean;
}): TimyContextHints {
    return {
        tips: Array.isArray(data.tips) ? data.tips : [],
        page: typeof data.page === 'string' ? data.page : 'dashboard',
        aiConfigured: data.ai_configured ?? true,
    };
}

export async function fetchTimyContext(
    pagePath: string,
): Promise<TimyContextHints | { error: string }> {
    const result = await timyFetch<{
        tips: string[];
        page: string;
        ai_configured: boolean;
    }>(timyContextRoute.url({ query: { page_path: pagePath } }));

    if ('error' in result) {
        return result;
    }

    return mapContextPayload(result.data);
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

export async function createTimyConversation(
    pagePath: string,
): Promise<
    | ({ conversation: TimyConversation; messages: TimyMessage[] } & TimyContextHints)
    | { error: string }
> {
    const result = await timyFetch<{
        conversation: TimyConversation;
        messages: TimyMessage[];
        tips: string[];
        page: string;
        ai_configured: boolean;
    }>(timyConversationsStore.url({ query: { page_path: pagePath } }), { method: 'POST' });

    if ('error' in result) {
        return result;
    }

    return {
        conversation: result.data.conversation,
        messages: result.data.messages,
        ...mapContextPayload(result.data),
    };
}

export async function loadTimyConversation(
    conversationId: number,
    pagePath: string,
): Promise<
    | ({ conversation: TimyConversation; messages: TimyMessage[] } & TimyContextHints)
    | { error: string }
> {
    const result = await timyFetch<{
        conversation: TimyConversation;
        messages: TimyMessage[];
        tips: string[];
        page: string;
        ai_configured: boolean;
    }>(timyConversationShow.url({ timy_conversation: conversationId, query: { page_path: pagePath } }));

    if ('error' in result) {
        return result;
    }

    return {
        conversation: result.data.conversation,
        messages: result.data.messages,
        ...mapContextPayload(result.data),
    };
}

export async function sendTimyMessage(
    conversationId: number,
    content: string,
    pagePath: string,
): Promise<({ messages: TimyMessage[] } & TimyContextHints) | { error: string }> {
    const result = await timyFetch<{
        messages: TimyMessage[];
        tips: string[];
        page: string;
        ai_configured: boolean;
    }>(timyStoreMessage.url({ timy_conversation: conversationId }), {
        method: 'POST',
        body: JSON.stringify({ content, page_path: pagePath }),
    });

    if ('error' in result) {
        return result;
    }

    return {
        messages: result.data.messages,
        ...mapContextPayload(result.data),
    };
}

export async function executeTimyAction(
    pendingAction: TimyPendingAction,
): Promise<{ message: string } | { error: string }> {
    const result = await timyFetch<{ message: string; result: Record<string, unknown> }>(
        timyExecuteAction.url(),
        {
            method: 'POST',
            body: JSON.stringify({
                type: pendingAction.type,
                params: pendingAction.params,
            }),
        },
    );

    if ('error' in result) {
        return result;
    }

    return { message: result.data.message };
}
