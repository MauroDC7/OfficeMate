import { LeaveRequestStatusBadge } from '@/components/leave-requests/leave-request-status-badge';
import {
    formatDayCount,
    formatLeavePeriod,
} from '@/components/leave-requests/leave-request-helpers';
import type { LeaveRequestListItem } from '@/types/leave-requests';

type LeaveRequestsListProps = {
    requests: LeaveRequestListItem[];
};

export function LeaveRequestsList({ requests }: LeaveRequestsListProps) {
    if (requests.length === 0) {
        return (
            <p className="px-4 py-10 text-center text-sm text-gray-500 sm:px-5">
                Geen aanvragen in deze weergave.
            </p>
        );
    }

    return (
        <ul className="divide-y divide-gray-100">
            {requests.map((request) => (
                <li
                    key={request.id}
                    className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5"
                >
                    <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm font-medium text-gray-900">{request.type_label}</p>
                            <LeaveRequestStatusBadge status={request.status} />
                        </div>
                        <p className="mt-1 text-sm text-gray-600">{formatLeavePeriod(request)}</p>
                        <p className="mt-0.5 text-xs text-gray-500">
                            {formatDayCount(request.day_count)}
                        </p>
                        {request.notes !== null && request.notes !== '' ? (
                            <p className="mt-1 text-xs text-gray-500">{request.notes}</p>
                        ) : null}
                    </div>
                </li>
            ))}
        </ul>
    );
}
