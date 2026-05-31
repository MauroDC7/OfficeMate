import { LeaveRequestStatusBadge } from '@/components/leave-requests/leave-request-status-badge';
import { formatDayCount, formatLeavePeriod } from '@/components/leave-requests/leave-request-helpers';
import { RowActionsMenu, type RowActionItem } from '@/components/leave-requests/row-actions-menu';
import { UserAvatar } from '@/components/user-avatar';
import type { AdminLeaveRequestListItem } from '@/types/admin-leave-requests';

type AdminLeaveRequestsListProps = {
    requests: AdminLeaveRequestListItem[];
    onApprove: (request: AdminLeaveRequestListItem) => void;
    onReject: (request: AdminLeaveRequestListItem) => void;
    onRevertApproval: (request: AdminLeaveRequestListItem) => void;
    onRevertRejection: (request: AdminLeaveRequestListItem) => void;
};

const TH_CLASS =
    'px-5 py-3 text-start text-xs font-medium tracking-wide text-gray-500 uppercase';
const TD_CLASS = 'px-5 py-4 align-middle text-sm text-gray-700';

function buildActions(
    request: AdminLeaveRequestListItem,
    onApprove: (request: AdminLeaveRequestListItem) => void,
    onReject: (request: AdminLeaveRequestListItem) => void,
    onRevertApproval: (request: AdminLeaveRequestListItem) => void,
    onRevertRejection: (request: AdminLeaveRequestListItem) => void,
): RowActionItem[] {
    if (request.can_approve) {
        return [
            { label: 'Goedkeuren', onClick: () => onApprove(request) },
            { label: 'Afwijzen', danger: true, onClick: () => onReject(request) },
        ];
    }

    if (request.can_revert_approval) {
        return [
            {
                label: 'Annuleren',
                danger: true,
                onClick: () => onRevertApproval(request),
            },
        ];
    }

    if (request.can_revert_rejection) {
        return [
            {
                label: 'Terugzetten',
                danger: true,
                onClick: () => onRevertRejection(request),
            },
        ];
    }

    return [];
}

function RequestMeta({ request }: { request: AdminLeaveRequestListItem }) {
    return (
        <>
            {request.notes !== null && request.notes !== '' ? (
                <p className="mt-2 text-xs text-gray-500">{request.notes}</p>
            ) : null}
            {request.rejection_reason !== null && request.rejection_reason !== '' ? (
                <p className="mt-1 text-xs text-red-600">
                    Reden afwijzing: {request.rejection_reason}
                </p>
            ) : null}
            {request.attachment !== null ? (
                <p className="mt-1 text-xs">
                    <a
                        href={request.attachment.url}
                        className="font-medium text-red-600 underline decoration-red-600/30 underline-offset-2 hover:text-red-700"
                    >
                        {request.attachment.name}
                    </a>
                </p>
            ) : null}
        </>
    );
}

export function AdminLeaveRequestsList({
    requests,
    onApprove,
    onReject,
    onRevertApproval,
    onRevertRejection,
}: AdminLeaveRequestsListProps) {
    if (requests.length === 0) {
        return null;
    }

    return (
        <>
            {/* Desktop: tabel voor vaste kolomuitlijning */}
            <div className="hidden sm:block sm:overflow-x-auto">
                <table className="w-full min-w-[36rem] table-fixed border-collapse text-left">
                    <colgroup>
                        <col className="w-[34%]" />
                        <col className="w-[28%]" />
                        <col className="w-[12%]" />
                        <col className="w-[18%]" />
                        <col className="w-[8%]" />
                    </colgroup>
                    <thead>
                        <tr className="border-b border-gray-100 bg-gray-50/70">
                            <th className={TH_CLASS}>Medewerker</th>
                            <th className={TH_CLASS}>Periode</th>
                            <th className={TH_CLASS}>Dagen</th>
                            <th className={TH_CLASS}>Status</th>
                            <th className={`${TH_CLASS} pe-5`}>
                                <span className="sr-only">Acties</span>
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {requests.map((request) => {
                            const actions = buildActions(
                                request,
                                onApprove,
                                onReject,
                                onRevertApproval,
                                onRevertRejection,
                            );
                            const period = formatLeavePeriod(request);
                            const days = formatDayCount(request.day_count);

                            return (
                                <tr key={request.id} className="group">
                                    <td className={TD_CLASS}>
                                        <div className="flex items-center gap-3">
                                            <UserAvatar
                                                user={request.user}
                                                className="size-10 shrink-0"
                                                textClassName="text-xs"
                                                title={request.user.name}
                                            />
                                            <div className="min-w-0">
                                                <p className="truncate font-medium text-gray-900">
                                                    {request.user.name}
                                                </p>
                                                <p className="mt-0.5 truncate text-xs text-gray-500">
                                                    {request.user.email} · {request.type_label}
                                                </p>
                                                <RequestMeta request={request} />
                                            </div>
                                        </div>
                                    </td>
                                    <td className={`${TD_CLASS} whitespace-nowrap tabular-nums`}>
                                        {period}
                                    </td>
                                    <td className={`${TD_CLASS} whitespace-nowrap tabular-nums`}>
                                        {days}
                                    </td>
                                    <td className={TD_CLASS}>
                                        <LeaveRequestStatusBadge status={request.status} />
                                    </td>
                                    <td className={`${TD_CLASS} pe-5 text-end`}>
                                        {actions.length > 0 ? (
                                            <RowActionsMenu
                                                items={actions}
                                                label={`Acties voor aanvraag van ${request.user.name}`}
                                            />
                                        ) : null}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Mobiel: kaarten */}
            <ul className="divide-y divide-gray-100 sm:hidden">
                {requests.map((request) => {
                    const actions = buildActions(
                        request,
                        onApprove,
                        onReject,
                        onRevertApproval,
                        onRevertRejection,
                    );
                    const period = formatLeavePeriod(request);
                    const days = formatDayCount(request.day_count);

                    return (
                        <li key={request.id} className="px-4 py-4">
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex min-w-0 flex-1 items-center gap-3">
                                    <UserAvatar
                                        user={request.user}
                                        className="size-10 shrink-0"
                                        textClassName="text-xs"
                                        title={request.user.name}
                                    />
                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-medium text-gray-900">
                                            {request.user.name}
                                        </p>
                                        <p className="mt-0.5 truncate text-xs text-gray-500">
                                            {request.user.email} · {request.type_label}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex shrink-0 items-center gap-2">
                                    <LeaveRequestStatusBadge status={request.status} />
                                    {actions.length > 0 ? (
                                        <RowActionsMenu
                                            items={actions}
                                            label={`Acties voor aanvraag van ${request.user.name}`}
                                        />
                                    ) : null}
                                </div>
                            </div>

                            <dl className="mt-4 grid grid-cols-[4.75rem_1fr] gap-x-4 gap-y-2.5 text-sm">
                                <dt className="text-gray-500">Periode</dt>
                                <dd className="text-gray-900 tabular-nums">{period}</dd>
                                <dt className="text-gray-500">Dagen</dt>
                                <dd className="text-gray-900 tabular-nums">{days}</dd>
                            </dl>

                            <div className="mt-3">
                                <RequestMeta request={request} />
                            </div>
                        </li>
                    );
                })}
            </ul>
        </>
    );
}
