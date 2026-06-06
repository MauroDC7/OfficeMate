import type { PresenceStatus, PresenceSummary } from '@/types/presence';

export const PRESENCE_STATUS_DOT: Record<PresenceStatus, string> = {
    in_office: 'bg-emerald-500',
    out_of_office: 'bg-gray-400',
    vacation: 'bg-sky-500',
    sick: 'bg-amber-500',
    other_leave: 'bg-violet-500',
};

export const PRESENCE_STATUS_ACCENT: Record<PresenceStatus, string> = {
    in_office: 'bg-emerald-500',
    out_of_office: 'bg-gray-300',
    vacation: 'bg-sky-400',
    sick: 'bg-amber-400',
    other_leave: 'bg-violet-400',
};

export function formatTeamsLine(teams: string[]): string {
    if (teams.length === 0) {
        return 'Geen team';
    }

    if (teams.length === 1) {
        return teams[0];
    }

    if (teams.length === 2) {
        return `${teams[0]}, ${teams[1]}`;
    }

    return `${teams[0]} +${teams.length - 1} teams`;
}

export function formatPresenceSummary(summary: PresenceSummary): string {
    const parts = [
        summary.in_office > 0 ? `${summary.in_office} op kantoor` : null,
        summary.out_of_office > 0 ? `${summary.out_of_office} niet op kantoor` : null,
        summary.vacation > 0 ? `${summary.vacation} vakantie` : null,
        summary.sick > 0 ? `${summary.sick} ziek` : null,
        summary.other_leave > 0 ? `${summary.other_leave} overig verlof` : null,
    ].filter((part): part is string => part !== null);

    if (parts.length === 0) {
        return 'Nog geen medewerkers in je organisatie';
    }

    return parts.join(' · ');
}
