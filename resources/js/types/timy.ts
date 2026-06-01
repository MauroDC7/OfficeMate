export type TimyAction = {
    label: string;
    href: string;
};

export type TimyMessage = {
    id: number;
    role: 'user' | 'assistant';
    content: string;
    actions: TimyAction[] | null;
    created_at: string | null;
};

export type TimyConversation = {
    id: number;
    title: string | null;
    updated_at: string | null;
};

export type TimyConversationSummary = TimyConversation & {
    preview: string | null;
};
