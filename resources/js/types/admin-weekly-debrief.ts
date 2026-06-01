export type AdminWeeklyDebriefRow = {
    user: {
        id: number;
        name: string;
        email: string;
        avatar: string | null;
    };
    difficult_this_week: string | null;
    plans_next_week: string | null;
    submitted: boolean;
    updated_at: string | null;
};

export type AdminWeeklyDebriefSummary = {
    content: string;
    generated_at: string | null;
    submitted_count: number;
    total_members: number;
};

export type AdminWeeklyDebriefPageProps = {
    organizationName: string;
    weekStart: string;
    weekLabel: string;
    previousWeek: string | null;
    nextWeek: string | null;
    submittedCount: number;
    rows: AdminWeeklyDebriefRow[];
    aiConfigured: boolean;
    canGenerateSummary: boolean;
    summary: AdminWeeklyDebriefSummary | null;
};
