import { router } from '@inertiajs/react';

import { useAlert } from '@/components/alert';
import { LeaveRequestStatusBadge } from '@/components/leave-requests/leave-request-status-badge';
import {
    formatDayCount,
    formatLeavePeriod,
    LEAVE_TABLE_ROW_GRID,
} from '@/components/leave-requests/leave-request-helpers';
import { LeaveTypeIcon } from '@/components/leave-requests/leave-type-icon';
import { RowActionsMenu, type RowActionItem } from '@/components/leave-requests/row-actions-menu';
import { destroy } from '@/routes/leaveRequests';
import type { LeaveRequestListItem } from '@/types/leave-requests';

type LeaveRequestsListProps = {
    requests: LeaveRequestListItem[];
    onEdit?: (request: LeaveRequestListItem) => void;
    onCancelled?: () => void;
};

export function LeaveRequestsList({ requests, onEdit, onCancelled }: LeaveRequestsListProps) {
    const { confirm } = useAlert();

    if (requests.length === 0) {
        return (
            <p className="px-4 py-10 text-center text-sm text-gray-500 sm:px-5">
                Geen aanvragen in deze weergave.
            </p>
        );
    }

    async function withdraw(request: LeaveRequestListItem) {
        const accepted = await confirm({
            message: `Aanvraag “${request.type_label}” (${formatLeavePeriod(request)}) intrekken?`,
            confirmLabel: 'Intrekken',
            variant: 'danger',
        });

        if (!accepted) {
            return;
        }

        router.delete(destroy.url({ leave_request: request.id }), {
            preserveScroll: true,
            onSuccess: onCancelled,
        });
    }

    return (
        <div>
            <div
                className={`hidden bg-gray-50/70 px-5 py-2.5 text-xs font-medium tracking-wide text-gray-500 uppercase ${LEAVE_TABLE_ROW_GRID}`}
            >
                <span>Type</span>
                <span>Periode</span>
                <span>Dagen</span>
                <span>Status</span>
                <span className="sr-only">Acties</span>
            </div>

            <ul className="divide-y divide-gray-100">
                {requests.map((request) => {
                    const actions: RowActionItem[] = [];

                    if (request.can_edit) {
                        if (onEdit !== undefined) {
                            actions.push({ label: 'Bewerken', onClick: () => onEdit(request) });
                        }

                        actions.push({
                            label: 'Intrekken',
                            danger: true,
                            onClick: () => withdraw(request),
                        });
                    }

                    return (
                    <li
                        key={request.id}
                        className={`flex flex-col gap-3 px-4 py-3.5 sm:px-5 ${LEAVE_TABLE_ROW_GRID}`}
                    >
                        <div className="flex min-w-0 items-center gap-3 sm:col-start-1">
                            <LeaveTypeIcon type={request.type} />
                            <div className="min-w-0">
                                <p className="truncate text-sm font-medium text-gray-900">
                                    {request.type_label}
                                </p>
                                {request.notes !== null && request.notes !== '' ? (
                                    <p className="truncate text-xs text-gray-500">{request.notes}</p>
                                ) : null}
                            </div>
                        </div>

                        <div className="text-sm text-gray-700 tabular-nums sm:col-start-2">
                            {formatLeavePeriod(request)}
                        </div>

                        <div className="text-sm text-gray-700 tabular-nums sm:col-start-3">
                            {formatDayCount(request.day_count)}
                        </div>

                        <div className="flex items-center sm:col-start-4">
                            <LeaveRequestStatusBadge status={request.status} />
                        </div>

                        <div className="flex items-center sm:col-start-5 sm:justify-end">
                            {actions.length > 0 ? (
                                <RowActionsMenu items={actions} label="Acties voor aanvraag" />
                            ) : (
                                <span className="hidden sm:block sm:size-9" aria-hidden />
                            )}
                        </div>

                        {request.status === 'rejected' &&
                        request.rejection_reason !== null &&
                        request.rejection_reason !== '' ? (
                            <p className="text-xs text-red-600 sm:col-span-5">
                                Reden afwijzing: {request.rejection_reason}
                            </p>
                        ) : null}

                        {request.attachment !== null ? (
                            <p className="text-xs sm:col-span-5">
                                <a
                                    href={request.attachment.url}
                                    className="font-medium text-red-600 underline decoration-red-600/30 underline-offset-2 hover:text-red-700"
                                >
                                    {request.attachment.name}
                                </a>
                            </p>
                        ) : null}
                    </li>
                    );
                })}
            </ul>
        </div>
    );
}
