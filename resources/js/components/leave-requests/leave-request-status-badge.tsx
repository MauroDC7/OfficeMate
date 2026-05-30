import {
    LEAVE_REQUEST_STATUS_LABELS,
    LEAVE_REQUEST_STATUS_STYLES,
} from '@/components/leave-requests/leave-request-helpers';
import { cn } from '@/lib/utils';
import type { LeaveRequestStatus } from '@/types/leave-requests';

type LeaveRequestStatusBadgeProps = {
    status: LeaveRequestStatus;
};

export function LeaveRequestStatusBadge({ status }: LeaveRequestStatusBadgeProps) {
    return (
        <span
            className={cn(
                'inline-flex shrink-0 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold tracking-wide uppercase',
                LEAVE_REQUEST_STATUS_STYLES[status],
            )}
        >
            {LEAVE_REQUEST_STATUS_LABELS[status]}
        </span>
    );
}
