export type TimyAction = {
    label: string;
    href: string;
};

export type TimyPendingAction = {
    type: 'create_leave_request';
    params: {
        type: string;
        starts_on: string;
        ends_on: string;
        notes?: string | null;
    };
    summary: string;
};

export type TimyMessage = {
    id: number;
    role: 'user' | 'assistant';
    content: string;
    actions: TimyAction[] | null;
    pending_action: TimyPendingAction | null;
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
