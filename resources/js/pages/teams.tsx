import { Head, Link, router, usePage } from '@inertiajs/react';
import { useMemo, useState, useEffect } from 'react';

import { useAlert } from '@/components/alert';
import { TeamFormPanel } from '@/components/teams/team-form-panel';
import {
    OrganizationSettingsPanel,
    OrganizationSettingsTrigger,
} from '@/components/teams/organization-settings-panel';
import { TeamCard } from '@/components/teams/team-card';
import { TeamsAdminTabs, type TeamsAdminTab } from '@/components/teams/teams-admin-tabs';
import { TeamsPeoplePanel } from '@/components/teams/teams-people-panel';
import { AppLayout } from '@/layouts/app-layout';
import { cn } from '@/lib/utils';
import { settings, teams as teamsRoute } from '@/routes';
import { approve, reject } from '@/routes/team-memberships';
import type { Auth } from '@/types/auth';
import type { TeamsPageProps } from '@/types/teams';

type TeamCardData = TeamsPageProps['teamCards'][number];

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
        awaitingOrganizationInvite,
        people,
        initialTab,
        auth,
    } = usePage<TeamsPageProps & { auth: Auth }>().props;
    const currentUserId = auth.user?.id ?? 0;

    const [search, setSearch] = useState('');
    const [selectedMemberIds, setSelectedMemberIds] = useState<number[]>([]);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [editingTeam, setEditingTeam] = useState<TeamCardData | null>(null);
    const [showOrganizationSettings, setShowOrganizationSettings] = useState(false);
    const [activeTab, setActiveTab] = useState<TeamsAdminTab>(initialTab);

    useEffect(() => {
        setShowCreateForm(false);
        setEditingTeam(null);
    }, [teamCards]);

    const showPeopleTab = isAdmin && people !== null;
    const showingPeople = showPeopleTab && activeTab === 'people';

    const setAdminTab = (tab: TeamsAdminTab) => {
        setActiveTab(tab);

        router.get(
            teamsRoute.url({ query: tab === 'people' ? { tab: 'people' } : {} }),
            {},
            { preserveState: true, preserveScroll: true, replace: true },
        );
    };

    const filteredTeams = useMemo(
        () => teamCards.filter((team) => matchesSearch(search, team)),
        [teamCards, search],
    );

    const openCreateForm = () => {
        setEditingTeam(null);
        setSelectedMemberIds([]);
        setShowCreateForm(true);
    };

    const openEditForm = (team: TeamCardData) => {
        setShowCreateForm(false);
        setEditingTeam(team);
        setSelectedMemberIds(team.member_ids ?? []);
    };

    const hasTeams = teamCards.length > 0;
    const showFeaturedOrganizationSettings = isAdmin && !hasTeams;

    if (organization === null) {
        return (
            <AppLayout>
                <Head title="Teams" />
                <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
                    <h1 className="text-xl font-semibold tracking-tight text-gray-900">Teams</h1>
                    <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                        {awaitingOrganizationInvite ? (
                            <>
                                <p className="text-sm font-medium text-gray-900">Nog geen bedrijf gekoppeld</p>
                                <p className="mt-2 text-sm leading-relaxed text-gray-500">
                                    Je beheerder nodigt je per e-mail uit. Open de link in die mail om teams en
                                    timesheets te gebruiken.
                                </p>
                                <Link
                                    href={settings.url()}
                                    className="mt-4 inline-flex text-sm font-medium text-gray-900 underline decoration-gray-400 underline-offset-2 hover:text-gray-700"
                                >
                                    Account bekijken in instellingen
                                </Link>
                            </>
                        ) : (
                            <>
                                <p className="text-sm text-gray-500">
                                    Koppel eerst een organisatie om teams te beheren.
                                </p>
                                {isAdmin ? (
                                    <p className="mt-2 text-sm text-gray-600">
                                        Als beheerder kun je hier straks je bedrijfsnaam instellen zodra je
                                        organisatie is aangemaakt.
                                    </p>
                                ) : null}
                            </>
                        )}
                    </div>
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
                            {showingPeople
                                ? `Medewerkers en aanwezigheid vandaag bij ${organization.name}.`
                                : isAdmin
                                  ? `Beheer teams binnen ${organization.name}.`
                                  : `Teams waar jij lid van bent binnen ${organization.name}.`}
                        </p>
                    </div>

                    {!showingPeople ? (
                        <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center lg:w-auto lg:max-w-2xl">
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
                            <div className="flex shrink-0 flex-wrap items-center gap-2">
                                {!showFeaturedOrganizationSettings ? (
                                    <OrganizationSettingsTrigger
                                        onClick={() => setShowOrganizationSettings(true)}
                                    />
                                ) : null}
                                <button
                                    type="button"
                                    onClick={openCreateForm}
                                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-800"
                                >
                                    <IconPlus />
                                    Team toevoegen
                                </button>
                            </div>
                        ) : null}
                    </div>
                    ) : null}
                </div>

                {showPeopleTab ? (
                    <TeamsAdminTabs activeTab={activeTab} onTabChange={setAdminTab} />
                ) : null}

                {showingPeople && people !== null ? (
                    <TeamsPeoplePanel
                        summary={people.summary}
                        employees={people.employees}
                        currentUserId={currentUserId}
                    />
                ) : null}

                {!showingPeople && isAdmin ? (
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

                {!showingPeople && isAdmin && pendingMemberships.length > 0 ? (
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

                {!showingPeople ? (
                <section className="mt-5">
                    {filteredTeams.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-gray-200 bg-white px-4 py-8 shadow-sm sm:px-8 sm:py-10">
                            {showFeaturedOrganizationSettings ? (
                                <OrganizationSettingsPanel
                                    organization={organization}
                                    onSuccess={(message) => success(message)}
                                    mode="featured"
                                />
                            ) : null}
                            <div
                                className={cn(
                                    showFeaturedOrganizationSettings &&
                                        'border-t border-gray-200 pt-10 text-center',
                                )}
                            >
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
                                    onEdit={openEditForm}
                                    onDeleted={() => success('Team verwijderd.')}
                                />
                            ))}
                        </div>
                    )}
                </section>
                ) : null}

                {!showingPeople && !isAdmin && teamCards.length > 0 ? (
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
                <>
                    <TeamFormPanel
                        mode="create"
                        open={showCreateForm}
                        onClose={() => setShowCreateForm(false)}
                        organizationUsers={organizationUsers}
                        selectedMemberIds={selectedMemberIds}
                        onMemberIdsChange={setSelectedMemberIds}
                        onSuccess={() => success('Team aangemaakt.')}
                    />
                    <TeamFormPanel
                        mode="edit"
                        team={editingTeam ?? undefined}
                        open={editingTeam !== null}
                        onClose={() => setEditingTeam(null)}
                        organizationUsers={organizationUsers}
                        selectedMemberIds={selectedMemberIds}
                        onMemberIdsChange={setSelectedMemberIds}
                        onSuccess={() => success('Team bijgewerkt.')}
                    />
                    {!showFeaturedOrganizationSettings ? (
                        <OrganizationSettingsPanel
                            organization={organization}
                            onSuccess={(message) => success(message)}
                            open={showOrganizationSettings}
                            onOpenChange={setShowOrganizationSettings}
                            mode="dialog"
                        />
                    ) : null}
                </>
            ) : null}
        </AppLayout>
    );
}
