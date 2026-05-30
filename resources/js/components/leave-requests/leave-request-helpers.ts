import type {
    LeaveRequestListItem,
    LeaveRequestStatus,
    LeaveType,
} from '@/types/leave-requests';

export const LEAVE_TYPE_LABELS: Record<LeaveType, string> = {
    vacation: 'Vakantie',
    sick: 'Ziekte',
    personal: 'Persoonlijk verlof',
    other: 'Overig',
};

export const LEAVE_TYPE_OPTIONS: { value: LeaveType; label: string }[] = (
    Object.keys(LEAVE_TYPE_LABELS) as LeaveType[]
).map((value) => ({ value, label: LEAVE_TYPE_LABELS[value] }));

export const LEAVE_REQUEST_STATUS_LABELS: Record<LeaveRequestStatus, string> = {
    pending: 'In behandeling',
    approved: 'Goedgekeurd',
    rejected: 'Afgewezen',
};

export const LEAVE_REQUEST_STATUS_STYLES: Record<LeaveRequestStatus, string> = {
    pending: 'border-amber-200 bg-amber-50 text-amber-800',
    approved: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    rejected: 'border-gray-200 bg-gray-50 text-gray-600',
};

const DATE_FORMATTER = new Intl.DateTimeFormat('nl-BE', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
});

export function formatLeavePeriod(request: Pick<LeaveRequestListItem, 'starts_on' | 'ends_on'>): string {
    const start = DATE_FORMATTER.format(new Date(`${request.starts_on}T12:00:00`));

    if (request.ends_on === request.starts_on) {
        return start;
    }

    const end = DATE_FORMATTER.format(new Date(`${request.ends_on}T12:00:00`));

    return `${start} – ${end}`;
}

export function formatDayCount(count: number): string {
    if (count === 1) {
        return '1 dag';
    }

    return `${count} dagen`;
}

export type LeaveRequestStatusFilter = 'all' | LeaveRequestStatus;

export const LEAVE_REQUEST_FILTERS: { value: LeaveRequestStatusFilter; label: string }[] = [
    { value: 'all', label: 'Alle' },
    { value: 'pending', label: LEAVE_REQUEST_STATUS_LABELS.pending },
    { value: 'approved', label: LEAVE_REQUEST_STATUS_LABELS.approved },
    { value: 'rejected', label: LEAVE_REQUEST_STATUS_LABELS.rejected },
];
