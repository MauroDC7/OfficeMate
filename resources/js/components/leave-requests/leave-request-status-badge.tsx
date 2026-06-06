import { LEAVE_REQUEST_STATUS_LABELS } from '@/components/leave-requests/leave-request-helpers';
import { cn } from '@/lib/utils';
import type { LeaveRequestStatus } from '@/types/leave-requests';

type LeaveRequestStatusBadgeProps = {
    status: LeaveRequestStatus;
};

const STATUS_CLASSES: Record<LeaveRequestStatus, string> = {
    pending: 'bg-amber-100 text-amber-800',
    approved: 'bg-emerald-100 text-emerald-800',
    rejected: 'bg-red-100 text-red-700',
};

export function LeaveRequestStatusBadge({ status }: LeaveRequestStatusBadgeProps) {
    return (
        <span
            className={cn(
                'inline-flex shrink-0 items-center rounded-md px-2.5 py-1',
                'text-xs font-medium shadow-sm',
                STATUS_CLASSES[status],
            )}
        >
            {LEAVE_REQUEST_STATUS_LABELS[status]}
        </span>
    );
}
