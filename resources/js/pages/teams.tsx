import { Head, Link, router, usePage } from '@inertiajs/react';
import { useMemo, useState } from 'react';

import { useAlert } from '@/components/alert';
import { CreateTeamFormPanel } from '@/components/teams/create-team-form-panel';
import { TeamCard } from '@/components/teams/team-card';
import { AppLayout } from '@/layouts/app-layout';
import { cn } from '@/lib/utils';
import { settings } from '@/routes';
import { approve, reject } from '@/routes/team-memberships';
import type { TeamsPageProps } from '@/types/teams';

function matchesSearch(
    query: string,
    team: TeamsPageProps['teamCards'][number],
): boolean {
    const needle = query.trim().toLowerCase();

    if (needle === '') {
        return true;
    }

    const haystack = [team.name, team.department ?? '', team.members_preview.map((m) => m.name).join(' ')]
        .join(' ')
        .toLowerCase();

    return haystack.includes(needle);
}

function IconPlus({ className }: { className?: string }) {
    return (
        <svg className={className} width={18} height={18} viewBox="0 0 24 24" aria-hidden fill="none">
            <path
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                d="M12 5v14M5 12h14"
            />
        </svg>
    );
}

export default function Teams() {
    const { success } = useAlert();
    const {
        organization,
        teamCards,
        stats,
        organizationUsers,
        pendingMemberships,
        isAdmin,
    } = usePage<TeamsPageProps>().props;

    const [search, setSearch] = useState('');
    const [selectedMemberIds, setSelectedMemberIds] = useState<number[]>([]);
    const [showCreateForm, setShowCreateForm] = useState(false);

    const filteredTeams = useMemo(
        () => teamCards.filter((team) => matchesSearch(search, team)),
        [teamCards, search],
    );

    const openCreateForm = () => setShowCreateForm(true);

    if (organization === null) {
        return (
            <AppLayout>
                <Head title="Teams" />
                <main className="mx-auto max-w-5xl px-4 py-8">
                    <h1 className="text-xl font-semibold text-gray-900">Teams</h1>
                    <p className="mt-2 text-sm text-gray-500">
                        Voer eerst je uitnodigingscode in bij Instellingen om teams te zien.
                    </p>
                    <Link
                        href={settings.url()}
                        className="mt-4 inline-flex rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800"
                    >
                        Naar instellingen
                    </Link>
                </main>
            </AppLayout>
        );
    }

    return (
        <AppLayout>
            <Head title="Teams" />
            <main className="mx-auto box-border w-full min-w-0 max-w-7xl px-4 py-4 sm:px-6 sm:py-5 lg:px-8 lg:py-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                    <div className="min-w-0">
                        <h1 className="text-lg font-semibold tracking-tight text-gray-900 sm:text-xl lg:text-2xl">
                            Teams
                        </h1>
                        <p className="mt-1 max-w-2xl text-sm text-gray-500">
                            {isAdmin
                                ? `Beheer teams binnen ${organization.name}.`
                                : `Teams waar jij lid van bent binnen ${organization.name}.`}
                        </p>
                    </div>

                    <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center lg:w-auto lg:max-w-xl">
                        <div className="relative min-w-0 flex-1">
                            <label htmlFor="team-search" className="sr-only">
                                Zoek teams
                            </label>
                            <input
                                id="team-search"
                                type="search"
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                                placeholder="Zoek een team…"
                                className="w-full rounded-lg border border-gray-300 bg-white py-2.5 ps-10 pe-4 text-sm shadow-sm outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-900/10"
                            />
                            <span
                                className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-gray-400"
                                aria-hidden
                            >
                                ⌕
                            </span>
                        </div>

                        {isAdmin ? (
                            <button
                                type="button"
                                onClick={openCreateForm}
                                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-800"
                            >
                                <IconPlus />
                                Team toevoegen
                            </button>
                        ) : null}
                    </div>
                </div>

                {isAdmin ? (
                    <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:max-w-xl">
                        <div className="rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
                            <p className="text-xs font-medium tracking-wide text-gray-500 uppercase">
                                Totaal teams
                            </p>
                            <p className="mt-1 text-2xl font-semibold text-gray-900">{stats.total_teams}</p>
                        </div>
                        <div className="rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
                            <p className="text-xs font-medium tracking-wide text-gray-500 uppercase">
                                Actieve leden
                            </p>
                            <p className="mt-1 text-2xl font-semibold text-gray-900">{stats.total_members}</p>
                        </div>
                    </div>
                ) : null}

                {isAdmin && pendingMemberships.length > 0 ? (
                    <section className="mt-5 rounded-xl border border-amber-200 bg-amber-50/60 p-4 sm:p-5">
                        <h2 className="text-sm font-semibold text-gray-900">
                            Open lidmaatschapsaanvragen ({pendingMemberships.length})
                        </h2>
                        <ul className="mt-3 space-y-2">
                            {pendingMemberships.map((membership) => (
                                <li
                                    key={membership.id}
                                    className="flex flex-col gap-2 rounded-lg border border-amber-100 bg-white p-3 sm:flex-row sm:items-center sm:justify-between"
                                >
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">
                                            {membership.user.name}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            {membership.user.email} · {membership.team.name}
                                        </p>
                                    </div>
                                    <div className="flex gap-2">
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

                <section className="mt-5">
                    {filteredTeams.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-gray-200 bg-white px-6 py-14 text-center shadow-sm">
                            <p className="text-sm font-semibold text-gray-900">
                                {search.trim() !== ''
                                    ? 'Geen teams gevonden voor je zoekopdracht.'
                                    : isAdmin
                                      ? 'Nog geen teams aangemaakt'
                                      : 'Je zit nog in geen team'}
                            </p>
                            <p className="mx-auto mt-2 max-w-sm text-sm text-gray-500">
                                {isAdmin
                                    ? 'Voeg je eerste team toe om collega’s te groeperen.'
                                    : 'Vraag je beheerder om je toe te voegen aan een team.'}
                            </p>
                            {isAdmin ? (
                                <button
                                    type="button"
                                    onClick={openCreateForm}
                                    className="mt-4 inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800"
                                >
                                    <IconPlus />
                                    Team toevoegen
                                </button>
                            ) : null}
                        </div>
                    ) : (
                        <div
                            className={cn(
                                'grid grid-cols-1 gap-4 sm:grid-cols-2',
                                isAdmin ? 'xl:grid-cols-3' : 'lg:grid-cols-3',
                            )}
                        >
                            {filteredTeams.map((team) => (
                                <TeamCard
                                    key={team.id}
                                    team={team}
                                    isAdmin={isAdmin}
                                    onDeleted={() => success('Team verwijderd.')}
                                />
                            ))}
                        </div>
                    )}
                </section>

                {!isAdmin && teamCards.length > 0 ? (
                    <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:max-w-xl">
                        <div className="rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
                            <p className="text-xs font-medium tracking-wide text-gray-500 uppercase">
                                Jouw teams
                            </p>
                            <p className="mt-1 text-2xl font-semibold text-gray-900">{stats.total_teams}</p>
                        </div>
                        <div className="rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
                            <p className="text-xs font-medium tracking-wide text-gray-500 uppercase">
                                Collega&apos;s in teams
                            </p>
                            <p className="mt-1 text-2xl font-semibold text-gray-900">{stats.total_members}</p>
                        </div>
                    </div>
                ) : null}
            </main>

            {isAdmin ? (
                <CreateTeamFormPanel
                    open={showCreateForm}
                    onClose={() => setShowCreateForm(false)}
                    organizationUsers={organizationUsers}
                    selectedMemberIds={selectedMemberIds}
                    onMemberIdsChange={setSelectedMemberIds}
                    onSuccess={() => success('Team aangemaakt.')}
                />
            ) : null}
        </AppLayout>
    );
}
