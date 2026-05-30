import { LEAVE_REQUEST_STATUS_LABELS } from '@/components/leave-requests/leave-request-helpers';
import { cn } from '@/lib/utils';
import type { LeaveRequestStatus } from '@/types/leave-requests';

type LeaveRequestStatusBadgeProps = {
    status: LeaveRequestStatus;
};

export function LeaveRequestStatusBadge({ status }: LeaveRequestStatusBadgeProps) {
    return (
        <span
            className={cn(
                'inline-flex shrink-0 items-center rounded-md bg-red-600 px-2.5 py-1',
                'text-xs font-medium text-white shadow-sm',
            )}
        >
            {LEAVE_REQUEST_STATUS_LABELS[status]}
        </span>
    );
}
