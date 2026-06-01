import { Head, Link, usePage } from '@inertiajs/react';
import { useMemo, useState } from 'react';

import { useAlert } from '@/components/alert';
import { ProjectAccessPanel } from '@/components/projects/project-access-panel';
import { ProjectCard } from '@/components/projects/project-card';
import { ProjectFormPanel } from '@/components/projects/project-form-panel';
import { PROJECT_STATUS_LABELS, PROJECT_TYPE_LABELS } from '@/components/projects/project-helpers';
import { TaskAvailabilityToggle } from '@/components/projects/task-availability-toggle';
import { WeeklyStatusFormPanel } from '@/components/projects/weekly-status-form-panel';
import { AppLayout } from '@/layouts/app-layout';
import { cn } from '@/lib/utils';
import { settings } from '@/routes';
import type { ProjectCard as ProjectCardType, ProjectsPageProps, ProjectType } from '@/types/projects';

type TypeFilter = 'all' | ProjectType;

function matchesSearch(query: string, project: ProjectCardType): boolean {
    const needle = query.trim().toLowerCase();

    if (needle === '') {
        return true;
    }

    const haystack = [
        project.name,
        project.client_name ?? '',
        PROJECT_STATUS_LABELS[project.status],
        project.teams.map((team) => team.name).join(' '),
    ]
        .join(' ')
        .toLowerCase();

    return haystack.includes(needle);
}

function IconPlus({ className }: { className?: string }) {
    return (
        <svg className={className} width={18} height={18} viewBox="0 0 24 24" aria-hidden fill="none">
            <path stroke="currentColor" strokeWidth={2} strokeLinecap="round" d="M12 5v14M5 12h14" />
        </svg>
    );
}

const FILTERS: { value: TypeFilter; label: string }[] = [
    { value: 'all', label: 'Alle' },
    { value: 'external', label: PROJECT_TYPE_LABELS.external },
    { value: 'internal', label: PROJECT_TYPE_LABELS.internal },
];

export default function Projects() {
    const { success } = useAlert();
    const {
        organization,
        projectCards,
        stats,
        organizationTeams,
        organizationUsers,
        isAdmin,
        canCreate,
        awaitingOrganizationInvite,
        weeklyStatus,
        taskAvailability,
    } = usePage<ProjectsPageProps>().props;

    const [search, setSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
    const [showForm, setShowForm] = useState(false);
    const [editingProject, setEditingProject] = useState<ProjectCardType | null>(null);
    const [showAccess, setShowAccess] = useState(false);
    const [showWeeklyStatus, setShowWeeklyStatus] = useState(false);

    const weeklyStatusPending =
        weeklyStatus !== null &&
        (weeklyStatus.difficult_this_week === null || weeklyStatus.difficult_this_week === '');

    const filteredProjects = useMemo(
        () =>
            projectCards.filter(
                (project) =>
                    (typeFilter === 'all' || project.type === typeFilter) &&
                    matchesSearch(search, project),
            ),
        [projectCards, search, typeFilter],
    );

    const hasProjects = projectCards.length > 0;

    function openCreate() {
        setEditingProject(null);
        setShowForm(true);
    }

    function openEdit(project: ProjectCardType) {
        setEditingProject(project);
        setShowForm(true);
    }

    function closeForm() {
        setShowForm(false);
        setEditingProject(null);
    }

    if (organization === null) {
        return (
            <AppLayout>
                <Head title="Projecten" />
                <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
                    <h1 className="text-xl font-semibold tracking-tight text-gray-900">Projecten</h1>
                    <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                        {awaitingOrganizationInvite ? (
                            <>
                                <p className="text-sm font-medium text-gray-900">
                                    Nog geen bedrijf gekoppeld
                                </p>
                                <p className="mt-2 text-sm leading-relaxed text-gray-500">
                                    Je beheerder nodigt je per e-mail uit. Open de link in die mail om
                                    projecten en timesheets te gebruiken.
                                </p>
                                <Link
                                    href={settings.url()}
                                    className="mt-4 inline-flex text-sm font-medium text-gray-900 underline decoration-gray-400 underline-offset-2 hover:text-gray-700"
                                >
                                    Account bekijken in instellingen
                                </Link>
                            </>
                        ) : (
                            <p className="text-sm text-gray-500">
                                Koppel eerst een organisatie om projecten te beheren.
                            </p>
                        )}
                    </div>
                </main>
            </AppLayout>
        );
    }

    return (
        <AppLayout>
            <Head title="Projecten" />
            <main className="mx-auto box-border w-full min-w-0 max-w-7xl px-4 py-4 sm:px-6 sm:py-5 lg:px-8 lg:py-6">
                <div className="flex flex-col gap-4">
                    <div className="min-w-0">
                        <h1 className="text-lg font-semibold tracking-tight text-gray-900 sm:text-xl lg:text-2xl">
                            Projecten Overzicht
                        </h1>
                        <p className="mt-1 max-w-2xl text-sm text-gray-500">
                            {isAdmin
                                ? `Beheer projecten en klanten binnen ${organization.name}.`
                                : `Projecten waar jij bij betrokken bent binnen ${organization.name}.`}
                        </p>
                    </div>

                    <div className="flex flex-col gap-3">
                        <div className="relative min-w-0 w-full">
                            <label htmlFor="project-search" className="sr-only">
                                Zoek projecten
                            </label>
                            <input
                                id="project-search"
                                type="search"
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                                placeholder="Zoek een project of klant…"
                                className="h-10 w-full rounded-lg border border-gray-300 bg-white py-0 ps-10 pe-4 text-sm shadow-sm outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-900/10"
                            />
                            <span
                                className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-gray-400"
                                aria-hidden
                            >
                                ⌕
                            </span>
                        </div>

                        {(taskAvailability !== null ||
                            weeklyStatus !== null ||
                            isAdmin ||
                            canCreate) && (
                            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
                                {taskAvailability !== null ? (
                                    <TaskAvailabilityToggle value={taskAvailability} />
                                ) : null}
                                {weeklyStatus !== null ? (
                                    <button
                                        type="button"
                                        onClick={() => setShowWeeklyStatus(true)}
                                        className="relative inline-flex h-10 w-full items-center justify-center rounded-lg border border-gray-300 bg-white px-4 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 sm:w-auto"
                                    >
                                        Weekly debrief
                                        {weeklyStatusPending || weeklyStatus.reminder_due ? (
                                            <span
                                                className="absolute -top-1 -end-1 size-2.5 rounded-full bg-red-600 ring-2 ring-white"
                                                aria-hidden
                                            />
                                        ) : null}
                                    </button>
                                ) : null}
                                {isAdmin ? (
                                    <button
                                        type="button"
                                        onClick={() => setShowAccess(true)}
                                        className="inline-flex h-10 w-full items-center justify-center rounded-lg border border-gray-300 bg-white px-4 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 sm:w-auto"
                                    >
                                        Rechten
                                    </button>
                                ) : null}
                                {canCreate ? (
                                    <button
                                        type="button"
                                        onClick={openCreate}
                                        className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-gray-900 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-800 sm:ms-auto sm:w-auto"
                                    >
                                        <IconPlus />
                                        Nieuw project
                                    </button>
                                ) : null}
                            </div>
                        )}
                    </div>
                </div>

                <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <div className="rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
                        <p className="text-xs font-medium tracking-wide text-gray-500 uppercase">
                            Totaal actieve projecten
                        </p>
                        <p className="mt-1 text-2xl font-semibold text-gray-900">
                            {stats.total_projects}
                        </p>
                    </div>
                    <div className="rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
                        <p className="text-xs font-medium tracking-wide text-gray-500 uppercase">
                            Getrackte uren deze maand
                        </p>
                        <p className="mt-1 text-2xl font-semibold text-gray-900">
                            {stats.tracked_hours_month}
                            <span className="ml-1 text-sm font-normal text-gray-400">uur</span>
                        </p>
                    </div>
                    <div className="rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
                        <p className="text-xs font-medium tracking-wide text-gray-500 uppercase">
                            Budget benutting
                        </p>
                        <p className="mt-1 text-2xl font-semibold text-gray-900">
                            {stats.budget_utilization}
                            <span className="ml-0.5 text-sm font-normal text-gray-400">%</span>
                        </p>
                    </div>
                </div>

                {hasProjects ? (
                    <div className="mt-5 inline-flex rounded-lg border border-gray-200 bg-white p-0.5 shadow-sm">
                        {FILTERS.map((filter) => (
                            <button
                                key={filter.value}
                                type="button"
                                onClick={() => setTypeFilter(filter.value)}
                                className={cn(
                                    'rounded-md px-3 py-1.5 text-sm font-medium transition',
                                    typeFilter === filter.value
                                        ? 'bg-gray-900 text-white'
                                        : 'text-gray-600 hover:text-gray-900',
                                )}
                            >
                                {filter.label}
                            </button>
                        ))}
                    </div>
                ) : null}

                <section className="mt-5">
                    {filteredProjects.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-gray-200 bg-white px-4 py-10 text-center shadow-sm sm:px-8">
                            <p className="text-sm font-semibold text-gray-900">
                                {search.trim() !== '' || typeFilter !== 'all'
                                    ? 'Geen projecten gevonden voor deze filters.'
                                    : canCreate
                                      ? 'Nog geen projecten aangemaakt'
                                      : 'Je bent nog niet betrokken bij een project'}
                            </p>
                            <p className="mx-auto mt-2 max-w-sm text-sm text-gray-500">
                                {canCreate
                                    ? 'Maak je eerste project aan om uren per klant te volgen.'
                                    : 'Zodra je aan een projectteam wordt toegevoegd, verschijnt het hier.'}
                            </p>
                            {canCreate && search.trim() === '' && typeFilter === 'all' ? (
                                <button
                                    type="button"
                                    onClick={openCreate}
                                    className="mt-4 inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800"
                                >
                                    <IconPlus />
                                    Nieuw project
                                </button>
                            ) : null}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                            {filteredProjects.map((project) => (
                                <ProjectCard
                                    key={project.id}
                                    project={project}
                                    isAdmin={isAdmin}
                                    onEdit={openEdit}
                                    onDeleted={() => success('Project verwijderd.')}
                                />
                            ))}
                        </div>
                    )}
                </section>
            </main>

            {showForm && canCreate ? (
                <ProjectFormPanel
                    key={editingProject?.id ?? 'new'}
                    onClose={closeForm}
                    teams={organizationTeams}
                    project={editingProject}
                    onSuccess={(message) => success(message)}
                />
            ) : null}

            {showAccess && isAdmin ? (
                <ProjectAccessPanel
                    onClose={() => setShowAccess(false)}
                    users={organizationUsers}
                    onSuccess={(message) => success(message)}
                />
            ) : null}

            {showWeeklyStatus && weeklyStatus !== null ? (
                <WeeklyStatusFormPanel
                    weeklyStatus={weeklyStatus}
                    onClose={() => setShowWeeklyStatus(false)}
                    onSuccess={() => success('Weekly debrief opgeslagen.')}
                />
            ) : null}
        </AppLayout>
    );
}
