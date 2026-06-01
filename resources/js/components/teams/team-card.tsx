import { router } from '@inertiajs/react';

import { useAlert } from '@/components/alert';
import { MemberAvatarStack } from '@/components/teams/user-picker';
import { cn } from '@/lib/utils';
import { destroy as destroyTeam } from '@/routes/teams';
import type { TeamCard as TeamCardType } from '@/types/teams';

type TeamCardProps = {
    team: TeamCardType;
    isAdmin: boolean;
    onEdit?: (team: TeamCardType) => void;
    onDeleted?: () => void;
};

const STATUS_LABEL = {
    pending: 'In afwachting',
    approved: 'Actief',
    rejected: 'Afgewezen',
} as const;

export function TeamCard({ team, isAdmin, onEdit, onDeleted }: TeamCardProps) {
    const { confirm } = useAlert();
    const departmentLabel = team.department?.trim() ?? 'Algemeen';

    return (
        <article className="group relative flex flex-col rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition hover:border-gray-300 hover:shadow-md">
            <div className="flex items-start justify-between gap-3">
                <span className="text-[10px] font-semibold tracking-wider text-gray-400 uppercase">
                    {departmentLabel}
                </span>
                {team.my_status !== null && team.my_status !== 'approved' ? (
                    <span
                        className={cn(
                            'rounded-full px-2 py-0.5 text-[10px] font-semibold',
                            team.my_status === 'pending' && 'bg-amber-100 text-amber-800',
                            team.my_status === 'rejected' && 'bg-gray-100 text-gray-600',
                        )}
                    >
                        {STATUS_LABEL[team.my_status]}
                    </span>
                ) : (
                    <span
                        className="size-2 shrink-0 rounded-full bg-emerald-400"
                        title="Actief"
                        aria-hidden
                    />
                )}
            </div>

            <h3 className="mt-2 text-lg font-semibold tracking-tight text-gray-900">{team.name}</h3>

            <div className="mt-auto flex items-end justify-between gap-3 pt-6">
                <MemberAvatarStack
                    members={team.members_preview}
                    memberCount={team.member_count}
                />
                <div className="text-end">
                    <p className="text-[10px] font-medium tracking-wide text-gray-400 uppercase">
                        Leden
                    </p>
                    <p className="text-sm font-semibold text-gray-900">{team.member_count}</p>
                </div>
            </div>

            {isAdmin ? (
                <div className="absolute end-3 top-3 flex gap-1 opacity-0 transition group-hover:opacity-100">
                    <button
                        type="button"
                        onClick={() => onEdit?.(team)}
                        className="rounded-md px-2 py-1 text-xs font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                    >
                        Bewerken
                    </button>
                    <button
                        type="button"
                        onClick={async () => {
                            const accepted = await confirm({
                                message: `Team “${team.name}” verwijderen?`,
                                confirmLabel: 'Verwijderen',
                                variant: 'danger',
                            });

                            if (!accepted) {
                                return;
                            }

                            router.delete(destroyTeam.url({ team: team.id }), {
                                onSuccess: onDeleted,
                            });
                        }}
                        className="rounded-md px-2 py-1 text-xs font-medium text-gray-400 hover:bg-red-50 hover:text-red-700"
                    >
                        Verwijderen
                    </button>
                </div>
            ) : null}
        </article>
    );
}
