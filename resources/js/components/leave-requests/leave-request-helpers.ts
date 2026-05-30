import type {
    LeaveRequestListItem,
    LeaveRequestStatus,
    LeaveType,
} from '@/types/leave-requests';

export const LEAVE_TYPE_LABELS: Record<LeaveType, string> = {
    vacation: 'Vakantie',
    sick: 'Ziekte',
    other: 'Overig',
};

/** Types in het keuzeraster (Overig wordt apart over volle breedte getoond). */
export const LEAVE_TYPE_PRIMARY_OPTIONS: { value: LeaveType; label: string; src: string }[] = [
    { value: 'vacation', label: LEAVE_TYPE_LABELS.vacation, src: '/img/Leave Vacation Icon 50.png' },
    { value: 'sick', label: LEAVE_TYPE_LABELS.sick, src: '/img/Leave Sick Icon 50.png' },
];

export const LEAVE_TYPE_OPTIONS: { value: LeaveType; label: string }[] = (
    Object.keys(LEAVE_TYPE_LABELS) as LeaveType[]
).map((value) => ({ value, label: LEAVE_TYPE_LABELS[value] }));

export const LEAVE_REQUEST_STATUS_LABELS: Record<LeaveRequestStatus, string> = {
    pending: 'In behandeling',
    approved: 'Goedgekeurd',
    rejected: 'Afgewezen',
};

/** Actieve filter-tab (merk-rood, zelfde als primaire actieknoppen in instellingen). */
export const LEAVE_FILTER_TAB_ACTIVE_CLASS =
    'border-red-600 bg-red-600 text-white shadow-sm';

export const LEAVE_FILTER_TAB_INACTIVE_CLASS =
    'border-gray-200 bg-white text-gray-700 hover:bg-gray-50';

/** Kolomindeling medewerkerslijst (type · periode · dagen · status). */
export const LEAVE_TABLE_ROW_GRID =
    'sm:grid sm:grid-cols-[minmax(0,1.7fr)_minmax(0,1.5fr)_minmax(0,0.7fr)_auto_2.5rem] sm:items-center sm:gap-x-6';

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

const SHORT_DATE_FORMATTER = new Intl.DateTimeFormat('nl-BE', {
    day: 'numeric',
    month: 'short',
});

/** Periode zonder jaartal, voor compacte plekken zoals de overzichtskaarten. */
export function formatLeavePeriodShort(
    request: Pick<LeaveRequestListItem, 'starts_on' | 'ends_on'>,
): string {
    const start = SHORT_DATE_FORMATTER.format(new Date(`${request.starts_on}T12:00:00`));

    if (request.ends_on === request.starts_on) {
        return start;
    }

    const end = SHORT_DATE_FORMATTER.format(new Date(`${request.ends_on}T12:00:00`));

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
