import { Head, Link, router, usePage } from '@inertiajs/react';
import { useState } from 'react';

import { useAlert } from '@/components/alert';
import { TeamLeaveOverview } from '@/components/leave-requests/team-leave-overview';
import { MemberAvatarStack } from '@/components/teams/user-picker';
import { TeamFormPanel } from '@/components/teams/team-form-panel';
import { AppLayout } from '@/layouts/app-layout';
import { show as showProject } from '@/routes/projects';
import { teams as teamsRoute } from '@/routes';
import { approve, reject, destroy as leaveTeam } from '@/routes/team-memberships';
import type { TeamCard } from '@/types/teams';
import type { TeamShowPageProps } from '@/types/teams';

export default function TeamShow() {
    const { success, confirm } = useAlert();
    const props = usePage<TeamShowPageProps>().props;
    const {
        team,
        members,
        pendingMemberships,
        projects: teamProjects,
        teamLeaveUpcoming,
        isAdmin,
        canManage,
        myMembership,
        organizationUsers,
        member_ids,
    } = props;

    const [showEditForm, setShowEditForm] = useState(false);
    const [selectedMemberIds, setSelectedMemberIds] = useState<number[]>(member_ids);

    const editTeam: TeamCard = {
        id: team.id,
        name: team.name,
        department: team.department,
        member_count: team.member_count,
        members_preview: members.slice(0, 4),
        my_status: myMembership?.status ?? null,
        member_ids,
    };

    const departmentLabel = team.department?.trim() ?? 'Algemeen';
    const canLeave = myMembership?.status === 'approved';
    const memberLabel = team.member_count === 1 ? 'lid' : 'leden';

    return (
        <AppLayout>
            <Head title={team.name} />
            <main className="mx-auto box-border w-full min-w-0 max-w-7xl px-4 py-4 sm:px-6 sm:py-5 lg:px-8 lg:py-6">
                <Link
                    href={teamsRoute.url()}
                    className="text-sm font-medium text-gray-500 transition hover:text-gray-900"
                >
                    ← Terug naar teams
                </Link>

                <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                    <div className="min-w-0">
                        <p className="text-[10px] font-semibold tracking-wider text-gray-400 uppercase">
                            {departmentLabel}
                        </p>
                        <h1 className="mt-1 text-lg font-semibold tracking-tight text-gray-900 sm:text-xl lg:text-2xl">
                            {team.name}
                        </h1>
                        <p className="mt-1 max-w-2xl text-sm text-gray-500">
                            {team.member_count} {memberLabel}
                        </p>
                    </div>

                    {canManage || canLeave ? (
                        <div className="flex w-full shrink-0 flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center lg:w-auto lg:justify-end">
                            {canManage ? (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSelectedMemberIds(member_ids);
                                        setShowEditForm(true);
                                    }}
                                    className="inline-flex h-10 w-full items-center justify-center rounded-lg border border-gray-300 bg-white px-4 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 sm:w-auto"
                                >
                                    Bewerken
                                </button>
                            ) : null}
                            {canLeave ? (
                                <button
                                    type="button"
                                    onClick={async () => {
                                        const accepted = await confirm({
                                            message: `Weet je zeker dat je team “${team.name}” wilt verlaten?`,
                                            confirmLabel: 'Team verlaten',
                                            variant: 'danger',
                                        });

                                        if (!accepted || myMembership === null) {
                                            return;
                                        }

                                        router.delete(
                                            leaveTeam.url({
                                                team_membership: myMembership.id,
                                            }),
                                            {
                                                onSuccess: () => success('Je bent het team verlaten.'),
                                            },
                                        );
                                    }}
                                    className="inline-flex h-10 w-full items-center justify-center rounded-lg border border-red-200 bg-white px-4 text-sm font-medium text-red-700 shadow-sm transition hover:bg-red-50 sm:w-auto"
                                >
                                    Team verlaten
                                </button>
                            ) : null}
                        </div>
                    ) : null}
                </div>

                <div className="mt-5 flex flex-col gap-5">
                    <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
                        <div className="border-b border-gray-100 px-4 py-3 sm:px-5">
                            <h2 className="text-sm font-semibold text-gray-900">Leden</h2>
                        </div>
                        {members.length === 0 ? (
                            <p className="px-4 py-6 text-sm text-gray-500 sm:px-5">
                                Nog geen leden in dit team.
                            </p>
                        ) : (
                            <ul className="divide-y divide-gray-100">
                                {members.map((member) => (
                                    <li
                                        key={member.id}
                                        className="flex items-center gap-3 px-4 py-3 sm:px-5"
                                    >
                                        <MemberAvatarStack members={[member]} memberCount={1} />
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm font-medium text-gray-900">
                                                {member.name}
                                            </p>
                                            <p className="truncate text-xs text-gray-500">
                                                {member.email}
                                            </p>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </section>

                    {isAdmin && pendingMemberships.length > 0 ? (
                        <section className="rounded-xl border border-amber-200 bg-amber-50/60 p-4 sm:p-5">
                            <h2 className="text-sm font-semibold text-gray-900">Open aanvragen</h2>
                            <ul className="mt-3 space-y-2">
                                {pendingMemberships.map((membership) => (
                                    <li
                                        key={membership.id}
                                        className="flex flex-col gap-2 rounded-lg border border-amber-100 bg-white p-3 sm:flex-row sm:items-center sm:justify-between"
                                    >
                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-medium text-gray-900">
                                                {membership.user.name}
                                            </p>
                                            <p className="truncate text-xs text-gray-500">
                                                {membership.user.email}
                                            </p>
                                        </div>
                                        <div className="flex shrink-0 flex-wrap gap-2">
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    router.post(
                                                        approve.url({
                                                            team_membership: membership.id,
                                                        }),
                                                        {},
                                                        {
                                                            onSuccess: () =>
                                                                success('Lidmaatschap goedgekeurd.'),
                                                        },
                                                    )
                                                }
                                                className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
                                            >
                                                Goedkeuren
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    router.post(
                                                        reject.url({
                                                            team_membership: membership.id,
                                                        }),
                                                        {},
                                                        {
                                                            onSuccess: () =>
                                                                success('Lidmaatschap afgewezen.'),
                                                        },
                                                    )
                                                }
                                                className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                                            >
                                                Afwijzen
                                            </button>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </section>
                    ) : null}

                    <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
                        <div className="border-b border-gray-100 px-4 py-3 sm:px-5">
                            <h2 className="text-sm font-semibold text-gray-900">Projecten</h2>
                            <p className="mt-0.5 text-xs text-gray-500">
                                Projecten gekoppeld aan dit team.
                            </p>
                        </div>
                        {teamProjects.length === 0 ? (
                            <p className="px-4 py-6 text-sm text-gray-500 sm:px-5">
                                Geen projecten gekoppeld.
                            </p>
                        ) : (
                            <ul className="divide-y divide-gray-100">
                                {teamProjects.map((project) => (
                                    <li key={project.id} className="px-4 py-3 sm:px-5">
                                        <Link
                                            href={showProject.url({ project: project.id })}
                                            className="text-sm font-medium text-gray-900 underline decoration-gray-300 underline-offset-2 hover:text-gray-700"
                                        >
                                            {project.name}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </section>

                    <TeamLeaveOverview
                        title="Verlof van teamleden"
                        description="Goedgekeurd verlof in de komende vier weken."
                        items={teamLeaveUpcoming}
                        emptyMessage="Geen gepland verlof voor dit team."
                        hasOrganization
                    />
                </div>
            </main>

            {canManage ? (
                <TeamFormPanel
                    mode="edit"
                    team={editTeam}
                    open={showEditForm}
                    onClose={() => setShowEditForm(false)}
                    organizationUsers={organizationUsers}
                    selectedMemberIds={selectedMemberIds}
                    onMemberIdsChange={setSelectedMemberIds}
                    onSuccess={() => success('Team bijgewerkt.')}
                />
            ) : null}
        </AppLayout>
    );
}
