import { cn } from '@/lib/utils';
import type { PresenceStatus } from '@/types/presence';

const STATUS_STYLES: Record<PresenceStatus, string> = {
    in_office: 'bg-emerald-100 text-emerald-800 ring-emerald-200',
    out_of_office: 'bg-gray-100 text-gray-700 ring-gray-200',
    vacation: 'bg-sky-100 text-sky-800 ring-sky-200',
    sick: 'bg-amber-100 text-amber-900 ring-amber-200',
    other_leave: 'bg-violet-100 text-violet-800 ring-violet-200',
};

type PresenceStatusBadgeProps = {
    label: string;
    status: PresenceStatus;
};

export function PresenceStatusBadge({ label, status }: PresenceStatusBadgeProps) {
    return (
        <span
            className={cn(
                'inline-flex shrink-0 items-center rounded-md px-2.5 py-1 text-xs font-medium ring-1 ring-inset',
                STATUS_STYLES[status],
            )}
        >
            {label}
        </span>
    );
}
