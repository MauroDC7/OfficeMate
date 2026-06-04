import { router } from '@inertiajs/react';

import { useAlert } from '@/components/alert';
import { RowActionsMenu, type RowActionItem } from '@/components/leave-requests/row-actions-menu';
import {
    PRESENCE_STATUS_ACCENT,
    PRESENCE_STATUS_DOT,
    formatTeamsLine,
} from '@/components/presence/presence-helpers';
import { UserAvatar } from '@/components/user-avatar';
import { getUserDisplayFullName } from '@/lib/user-display';
import { cn } from '@/lib/utils';
import { store as grantAdminRole } from '@/routes/settings/employees/admin-role';
import { destroy as removeOrganizationMember } from '@/routes/settings/employees';
import type { PresenceEmployee } from '@/types/presence';
import type { User } from '@/types/auth';

type PeopleEmployeeCardProps = {
    employee: PresenceEmployee;
    currentUserId: number;
};

function formatLeaveUntil(isoDate: string): string {
    const date = new Date(`${isoDate}T12:00:00`);

    return date.toLocaleDateString('nl-BE', { day: 'numeric', month: 'short' });
}

const TASK_AVAILABILITY_TEXT: Record<PresenceEmployee['task_availability'], string> = {
    open_for_tasks: 'text-blue-700',
    on_task: 'text-gray-600',
};

export function PeopleEmployeeCard({ employee, currentUserId }: PeopleEmployeeCardProps) {
    const { success, error } = useAlert();

    const teamsLine = formatTeamsLine(employee.teams);
    const isSelf = employee.id === currentUserId;
    const isAdmin = employee.role === 'admin';

    function reloadPeople() {
        router.reload({ only: ['people'], preserveScroll: true });
    }

    function grantAdmin() {
        router.post(grantAdminRole.url({ user: employee.id }), {}, {
            preserveScroll: true,
            onSuccess: () => {
                success(`${getUserDisplayFullName(employee as User)} is nu beheerder.`);
                reloadPeople();
            },
            onError: () => {
                error('Beheerdersrechten toekennen mislukt. Probeer het opnieuw.');
            },
        });
    }

    function removeFromOrganization() {
        const name = getUserDisplayFullName(employee as User);

        if (
            !window.confirm(
                `${name} uit het bedrijf halen? Het account blijft bestaan, maar deze persoon verliest toegang tot teams en bedrijfsgegevens.`,
            )
        ) {
            return;
        }

        router.delete(removeOrganizationMember.url({ user: employee.id }), {
            preserveScroll: true,
            onSuccess: () => {
                success(`${name} is uit het bedrijf gehaald.`);
                reloadPeople();
            },
            onError: (errors) => {
                const message =
                    typeof errors.user === 'string'
                        ? errors.user
                        : 'Uit het bedrijf halen mislukt. Probeer het opnieuw.';
                error(message);
            },
        });
    }

    const actions: RowActionItem[] = [];

    if (!isSelf) {
        if (employee.role === 'employee') {
            actions.push({ label: 'Beheerder maken', onClick: grantAdmin });
        }

        actions.push({
            label: 'Uit bedrijf halen',
            onClick: removeFromOrganization,
            danger: true,
        });
    }

    return (
        <article className="group flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition hover:border-gray-300 hover:shadow-md">
            <div
                className={cn('h-1 w-full shrink-0', PRESENCE_STATUS_ACCENT[employee.status])}
                aria-hidden
            />

            <div className="flex flex-1 flex-col p-5">
                <div className="flex items-start gap-3">
                    <UserAvatar user={employee} className="size-12 text-sm" />

                    <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                                <p className="truncate text-[10px] font-semibold tracking-wider text-gray-400 uppercase">
                                    {teamsLine}
                                </p>
                                <h3 className="mt-1 truncate text-base font-semibold tracking-tight text-gray-900">
                                    {employee.name}
                                </h3>
                                <p className="truncate text-xs text-gray-500">{employee.email}</p>
                            </div>

                            <div className="flex shrink-0 flex-col items-end gap-1.5">
                                {isAdmin ? (
                                    <span className="rounded-full bg-gray-900 px-2 py-0.5 text-[10px] font-semibold text-white">
                                        Beheerder
                                    </span>
                                ) : null}
                                {actions.length > 0 ? (
                                    <RowActionsMenu items={actions} label="Medewerkeracties" />
                                ) : null}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-4 flex items-end justify-between gap-3 border-t border-gray-100 pt-4">
                    <div className="min-w-0">
                        <p className="text-[10px] font-medium tracking-wide text-gray-400 uppercase">
                            Vandaag
                        </p>
                        <div className="mt-1 flex min-w-0 items-center gap-2">
                            <span
                                className={cn(
                                    'size-2 shrink-0 rounded-full',
                                    PRESENCE_STATUS_DOT[employee.status],
                                )}
                                aria-hidden
                            />
                            <p className="truncate text-sm font-semibold text-gray-900">
                                {employee.status_label}
                            </p>
                        </div>
                        {employee.leave_ends_on !== null ? (
                            <p className="mt-0.5 text-xs text-gray-500">
                                Tot {formatLeaveUntil(employee.leave_ends_on)}
                            </p>
                        ) : null}
                    </div>

                    <div className="shrink-0 text-end">
                        <p className="text-[10px] font-medium tracking-wide text-gray-400 uppercase">
                            Taken
                        </p>
                        <p
                            className={cn(
                                'mt-1 text-xs font-medium',
                                TASK_AVAILABILITY_TEXT[employee.task_availability],
                            )}
                        >
                            {employee.task_availability_label}
                        </p>
                    </div>
                </div>
            </div>
        </article>
    );
}
