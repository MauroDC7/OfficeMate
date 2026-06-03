import { draft as weeklyStatusDraft } from '@/routes/weekly-status';

export type WeeklyDebriefDraft = {
    difficult_this_week: string;
    plans_next_week: string;
};

function csrfToken(): string {
    const meta = document.querySelector('meta[name="csrf-token"]');

    return meta?.getAttribute('content') ?? '';
}

export async function fetchWeeklyDebriefDraft(
    weekStart: string,
): Promise<{ draft: WeeklyDebriefDraft } | { error: string }> {
    const response = await fetch(weeklyStatusDraft.url(), {
        method: 'POST',
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
            'X-CSRF-TOKEN': csrfToken(),
        },
        credentials: 'same-origin',
        body: JSON.stringify({ week_start: weekStart }),
    });

    const data = (await response.json()) as WeeklyDebriefDraft & { message?: string };

    if (!response.ok) {
        return {
            error:
                typeof data.message === 'string' && data.message !== ''
                    ? data.message
                    : 'Voorstel laden mislukt. Probeer het opnieuw.',
        };
    }

    if (
        typeof data.difficult_this_week !== 'string' ||
        typeof data.plans_next_week !== 'string'
    ) {
        return { error: 'Onverwacht antwoord van de server.' };
    }

    return {
        draft: {
            difficult_this_week: data.difficult_this_week,
            plans_next_week: data.plans_next_week,
        },
    };
}
