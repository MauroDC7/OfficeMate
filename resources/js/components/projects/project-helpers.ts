import type { ProjectStatus, ProjectType } from '@/types/projects';

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
    in_progress: 'In uitvoering',
    on_hold: 'On hold',
    waiting_for_client: 'Wacht op klant',
    done: 'Afgerond',
};

export const PROJECT_STATUS_BADGE: Record<ProjectStatus, string> = {
    in_progress: 'bg-emerald-100 text-emerald-800',
    on_hold: 'bg-amber-100 text-amber-800',
    waiting_for_client: 'bg-blue-100 text-blue-800',
    done: 'bg-gray-100 text-gray-600',
};

export const PROJECT_STATUS_DOT: Record<ProjectStatus, string> = {
    in_progress: 'bg-emerald-500',
    on_hold: 'bg-amber-500',
    waiting_for_client: 'bg-blue-500',
    done: 'bg-gray-400',
};

export const PROJECT_STATUS_OPTIONS: { value: ProjectStatus; label: string }[] = (
    Object.keys(PROJECT_STATUS_LABELS) as ProjectStatus[]
).map((value) => ({ value, label: PROJECT_STATUS_LABELS[value] }));

export const PROJECT_TYPE_LABELS: Record<ProjectType, string> = {
    internal: 'Intern',
    external: 'Extern',
};

/**
 * Formatteer minuten als afgeronde uren met een Nederlandse "u", bijv. 612u.
 */
export function formatTrackedHours(minutes: number): string {
    return `${Math.round(minutes / 60)}u`;
}
