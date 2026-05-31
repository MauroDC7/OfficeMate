import type { PresenceSummary } from '@/types/presence';

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
