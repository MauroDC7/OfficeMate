import { cn } from '@/lib/utils';

const DEFAULT_SUGGESTIONS = [
    'Hoe boek ik uren deze week?',
    'Hoe vraag ik verlof aan?',
    'Welke projecten heb ik open?',
] as const;

const PAGE_SUGGESTIONS: Record<string, readonly string[]> = {
    timesheets: [
        'Hoeveel uur heb ik deze week geboekt?',
        'Waar vind ik AI-voorstellen?',
        'Hoe boek ik uren?',
    ],
    projects: [
        'Welke projecten heb ik open?',
        'Genereer een weekstatus-concept',
        'Geef een kort overzicht',
    ],
    leave_requests: [
        'Vraag verlof aan voor 7 juni tot 13 juni',
        'Wat is de status van mijn verlof?',
    ],
    admin_leave: [
        'Hoeveel verlofaanvragen wachten op goedkeuring?',
        'Open verlofbeheer',
    ],
    teams: ['Hoeveel teamaanvragen zijn open?', 'Open Teams'],
    dashboard: ['Geef een overzicht van deze week', 'Waar boek ik uren?'],
};

type ChatbotSuggestionChipsProps = {
    pageKey: string;
    onSelect: (text: string) => void;
    className?: string;
};

export function ChatbotSuggestionChips({
    pageKey,
    onSelect,
    className,
}: ChatbotSuggestionChipsProps) {
    const suggestions = PAGE_SUGGESTIONS[pageKey] ?? DEFAULT_SUGGESTIONS;

    return (
        <div className={cn('flex flex-wrap gap-2', className)}>
            {suggestions.map((suggestion) => (
                <button
                    key={suggestion}
                    type="button"
                    onClick={() => onSelect(suggestion)}
                    className="rounded-full border border-gray-200 bg-white px-3 py-1.5 text-left text-xs font-medium text-gray-700 shadow-sm transition hover:border-gray-300 hover:bg-gray-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900"
                >
                    {suggestion}
                </button>
            ))}
        </div>
    );
}

export function resolveTimyPageKey(pagePath: string): string {
    const path = (pagePath.split('?')[0] ?? '/').replace(/^\/+|\/+$/g, '') || 'dashboard';

    if (path === 'dashboard' || path === '') {
        return 'dashboard';
    }

    if (path.startsWith('timesheets')) {
        return 'timesheets';
    }

    if (path.startsWith('projects')) {
        return 'projects';
    }

    if (path.startsWith('admin/leave-requests')) {
        return 'admin_leave';
    }

    if (path.startsWith('leave-requests')) {
        return 'leave_requests';
    }

    if (path.startsWith('teams')) {
        return 'teams';
    }

    return 'dashboard';
}
