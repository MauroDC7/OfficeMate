import { Head, Link, router, usePage } from '@inertiajs/react';
import { useState } from 'react';

import { useAlert } from '@/components/alert';
import { ProjectFormPanel } from '@/components/projects/project-form-panel';
import {
    PROJECT_STATUS_BADGE,
    PROJECT_STATUS_LABELS,
    formatTrackedHours,
} from '@/components/projects/project-helpers';
import { MemberAvatarStack } from '@/components/teams/user-picker';
import { formatDurationMinutes, formatMinutesRange } from '@/components/timesheets/timesheet-helpers';
import { AppLayout } from '@/layouts/app-layout';
import { cn } from '@/lib/utils';
import { projects as projectsIndex, timesheets } from '@/routes';
import { destroy as destroyProject } from '@/routes/projects';
import { show as showTeam } from '@/routes/teams';
import type { ProjectShowPageProps } from '@/types/projects';

function formatWorkedOn(ymd: string): string {
    const [year, month, day] = ymd.split('-').map(Number);

    if (year === undefined || month === undefined || day === undefined) {
        return ymd;
    }

    return new Date(year, month - 1, day).toLocaleDateString('nl-BE', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
    });
}

export default function ProjectShow() {
    const { success, confirm } = useAlert();
    const props = usePage<ProjectShowPageProps>().props;
    const {
        project,
        teams,
        members,
        hours,
        hours_by_member,
        recent_entries,
        pending_proposals,
        isAdmin,
        canUpdate,
        organizationTeams,
        projectCard,
    } = props;

    const [showEditForm, setShowEditForm] = useState(false);

    const isExternal = project.type === 'external';
    const eyebrow = isExternal
        ? `Klant · ${project.client_name?.trim() || 'Onbekend'}`
        : 'Intern project';

    const hasBudget = project.hours_budget !== null && project.hours_budget > 0;
    const trackedHoursTotal = formatTrackedHours(hours.tracked_minutes_total);
    const budgetPercent = hasBudget
        ? Math.min(100, Math.round((hours.tracked_minutes_total / 60 / project.hours_budget!) * 100))
        : 0;
    const overBudget = hasBudget && hours.tracked_minutes_total / 60 > project.hours_budget!;
    const memberLabel = members.length === 1 ? 'lid' : 'leden';
    const hoursScopeLabel = isAdmin ? 'Totaal getrackt' : 'Jouw uren op dit project';

    const bookHoursUrl = timesheets.url({
        query: { project: project.id },
    });

    return (
        <AppLayout>
            <Head title={project.name} />
            <main className="mx-auto box-border w-full min-w-0 max-w-7xl px-4 py-4 sm:px-6 sm:py-5 lg:px-8 lg:py-6">
                <Link
                    href={projectsIndex.url()}
                    className="text-sm font-medium text-gray-500 transition hover:text-gray-900"
                >
                    ← Terug naar projecten
                </Link>

                <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="flex min-w-0 gap-4">
                        {project.logo !== null ? (
                            <img
                                src={project.logo}
                                alt=""
                                className="size-14 shrink-0 rounded-xl border border-gray-200 object-cover sm:size-16"
                            />
                        ) : (
                            <div
                                className="flex size-14 shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-gray-100 text-lg font-semibold text-gray-500 sm:size-16"
                                aria-hidden
                            >
                                {project.name.trim().charAt(0).toUpperCase() || '?'}
                            </div>
                        )}
                        <div className="min-w-0">
                            <p className="text-[10px] font-semibold tracking-wider text-gray-400 uppercase">
                                {eyebrow}
                            </p>
                            <div className="mt-1 flex flex-wrap items-center gap-2">
                                <h1 className="text-lg font-semibold tracking-tight text-gray-900 sm:text-xl lg:text-2xl">
                                    {project.name}
                                </h1>
                                <span
                                    className={cn(
                                        'rounded-full px-2 py-0.5 text-[10px] font-semibold',
                                        PROJECT_STATUS_BADGE[project.status],
                                    )}
                                >
                                    {PROJECT_STATUS_LABELS[project.status]}
                                </span>
                            </div>
                            {project.creator !== null ? (
                                <p className="mt-1 text-sm text-gray-500">
                                    Aangemaakt door {project.creator.name}
                                </p>
                            ) : null}
                        </div>
                    </div>

                    <div className="flex w-full shrink-0 flex-col gap-2 sm:flex-row lg:w-auto">
                        <Link
                            href={bookHoursUrl}
                            className="inline-flex h-10 w-full items-center justify-center rounded-lg bg-gray-900 px-4 text-sm font-medium text-white shadow-sm transition hover:bg-gray-800 sm:w-auto"
                        >
                            Uren boeken
                        </Link>
                        {canUpdate && projectCard !== null ? (
                            <button
                                type="button"
                                onClick={() => setShowEditForm(true)}
                                className="inline-flex h-10 w-full items-center justify-center rounded-lg border border-gray-300 bg-white px-4 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 sm:w-auto"
                            >
                                Bewerken
                            </button>
                        ) : null}
                    </div>
                </div>

                <section className="mt-5 rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
                    <h2 className="text-sm font-semibold text-gray-900">Uren & budget</h2>
                    <div className="mt-3 grid gap-4 sm:grid-cols-3">
                        <div>
                            <p className="text-[10px] font-medium tracking-wide text-gray-400 uppercase">
                                {hoursScopeLabel}
                            </p>
                            <p className="mt-1 text-lg font-semibold text-gray-900">
                                {trackedHoursTotal}
                                {hasBudget ? (
                                    <span className="text-sm font-normal text-gray-400">
                                        {' '}
                                        / {project.hours_budget}u
                                    </span>
                                ) : null}
                            </p>
                        </div>
                        <div>
                            <p className="text-[10px] font-medium tracking-wide text-gray-400 uppercase">
                                Deze week
                            </p>
                            <p className="mt-1 text-lg font-semibold text-gray-900">
                                {formatTrackedHours(hours.tracked_minutes_week)}
                            </p>
                        </div>
                        <div>
                            <p className="text-[10px] font-medium tracking-wide text-gray-400 uppercase">
                                Deze maand
                            </p>
                            <p className="mt-1 text-lg font-semibold text-gray-900">
                                {formatTrackedHours(hours.tracked_minutes_month)}
                            </p>
                        </div>
                    </div>
                    {hasBudget ? (
                        <div className="mt-4">
                            <div className="flex items-center justify-between text-xs text-gray-500">
                                <span>Budgetbenutting</span>
                                <span className={cn(overBudget && 'font-medium text-red-600')}>
                                    {budgetPercent}%
                                    {overBudget ? ' · overschreden' : ''}
                                </span>
                            </div>
                            <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-gray-100">
                                <div
                                    className={cn(
                                        'h-full rounded-full transition-all',
                                        overBudget ? 'bg-red-500' : 'bg-gray-900',
                                    )}
                                    style={{ width: `${budgetPercent}%` }}
                                />
                            </div>
                        </div>
                    ) : null}
                </section>

                <div className="mt-5 flex flex-col gap-5">
                    <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
                        <div className="border-b border-gray-100 px-4 py-3 sm:px-5">
                            <h2 className="text-sm font-semibold text-gray-900">Teams</h2>
                            <p className="mt-0.5 text-xs text-gray-500">
                                Teams met toegang tot dit project.
                            </p>
                        </div>
                        {teams.length === 0 ? (
                            <p className="px-4 py-6 text-sm text-gray-500 sm:px-5">
                                Nog geen team gekoppeld.
                            </p>
                        ) : (
                            <ul className="divide-y divide-gray-100">
                                {teams.map((team) => (
                                    <li key={team.id} className="px-4 py-3 sm:px-5">
                                        <Link
                                            href={showTeam.url({ team: team.id })}
                                            className="text-sm font-medium text-gray-900 underline decoration-gray-300 underline-offset-2 hover:text-gray-700"
                                        >
                                            {team.name}
                                        </Link>
                                        {team.department !== null && team.department.trim() !== '' ? (
                                            <p className="mt-0.5 text-xs text-gray-500">{team.department}</p>
                                        ) : null}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </section>

                    <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
                        <div className="border-b border-gray-100 px-4 py-3 sm:px-5">
                            <h2 className="text-sm font-semibold text-gray-900">
                                Leden ({members.length})
                            </h2>
                        </div>
                        {members.length === 0 ? (
                            <p className="px-4 py-6 text-sm text-gray-500 sm:px-5">
                                Nog geen leden via gekoppelde teams.
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
                                            <p className="truncate text-xs text-gray-500">{member.email}</p>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                        <p className="border-t border-gray-100 px-4 py-2 text-xs text-gray-400 sm:px-5">
                            {members.length} {memberLabel} via teams
                        </p>
                    </section>

                    {hours_by_member.length > 0 ? (
                        <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
                            <div className="border-b border-gray-100 px-4 py-3 sm:px-5">
                                <h2 className="text-sm font-semibold text-gray-900">
                                    {isAdmin ? 'Uren per medewerker' : 'Jouw bijdrage'}
                                </h2>
                            </div>
                            <ul className="divide-y divide-gray-100">
                                {hours_by_member.map((row) => (
                                    <li
                                        key={row.user.id}
                                        className="flex items-center justify-between gap-3 px-4 py-3 sm:px-5"
                                    >
                                        <div className="flex min-w-0 items-center gap-3">
                                            <MemberAvatarStack
                                                members={[
                                                    {
                                                        id: row.user.id,
                                                        name: row.user.name,
                                                        email: '',
                                                        first_name: '',
                                                        last_name: '',
                                                        avatar: row.user.avatar,
                                                    },
                                                ]}
                                                memberCount={1}
                                            />
                                            <span className="truncate text-sm font-medium text-gray-900">
                                                {row.user.name}
                                            </span>
                                        </div>
                                        <span className="shrink-0 text-sm font-semibold text-gray-900">
                                            {formatTrackedHours(row.tracked_minutes)}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </section>
                    ) : null}

                    <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
                        <div className="flex flex-col gap-2 border-b border-gray-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                            <div>
                                <h2 className="text-sm font-semibold text-gray-900">
                                    Recente registraties
                                </h2>
                                <p className="mt-0.5 text-xs text-gray-500">
                                    {isAdmin
                                        ? 'Laatste uren op dit project.'
                                        : 'Jouw laatste uren op dit project.'}
                                </p>
                            </div>
                            <Link
                                href={bookHoursUrl}
                                className="text-xs font-medium text-gray-600 underline decoration-gray-300 underline-offset-2 hover:text-gray-900"
                            >
                                Naar timesheets →
                            </Link>
                        </div>
                        {recent_entries.length === 0 ? (
                            <p className="px-4 py-6 text-sm text-gray-500 sm:px-5">
                                Nog geen uren geregistreerd op dit project.
                            </p>
                        ) : (
                            <ul className="divide-y divide-gray-100">
                                {recent_entries.map((entry) => (
                                    <li key={entry.id} className="px-4 py-3 sm:px-5">
                                        <div className="flex flex-wrap items-start justify-between gap-2">
                                            <div className="min-w-0">
                                                <p className="text-sm font-medium text-gray-900">
                                                    {entry.title}
                                                </p>
                                                <p className="mt-0.5 text-xs text-gray-500">
                                                    {formatWorkedOn(entry.worked_on)} ·{' '}
                                                    {formatMinutesRange(
                                                        entry.start_minutes,
                                                        entry.end_minutes,
                                                    )}{' '}
                                                    (
                                                    {formatDurationMinutes(
                                                        entry.start_minutes,
                                                        entry.end_minutes,
                                                    )}
                                                    )
                                                </p>
                                                {isAdmin && entry.user !== null ? (
                                                    <p className="mt-0.5 text-xs text-gray-400">
                                                        {entry.user.name}
                                                    </p>
                                                ) : null}
                                            </div>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </section>

                    {isAdmin && pending_proposals.length > 0 ? (
                        <section className="rounded-xl border border-amber-200 bg-amber-50/60 shadow-sm">
                            <div className="border-b border-amber-100 px-4 py-3 sm:px-5">
                                <h2 className="text-sm font-semibold text-gray-900">
                                    Open timesheet-voorstellen
                                </h2>
                                <p className="mt-0.5 text-xs text-gray-600">
                                    AI-voorstellen gekoppeld aan dit project.
                                </p>
                            </div>
                            <ul className="divide-y divide-amber-100">
                                {pending_proposals.map((proposal) => (
                                    <li key={proposal.id} className="px-4 py-3 sm:px-5">
                                        <p className="text-sm font-medium text-gray-900">
                                            {proposal.title}
                                        </p>
                                        <p className="mt-0.5 text-xs text-gray-600">
                                            {proposal.user.name} · {formatWorkedOn(proposal.worked_on)}{' '}
                                            ·{' '}
                                            {formatMinutesRange(
                                                proposal.start_minutes,
                                                proposal.end_minutes,
                                            )}
                                        </p>
                                    </li>
                                ))}
                            </ul>
                            <p className="border-t border-amber-100 px-4 py-2 text-xs text-gray-500 sm:px-5">
                                Beheer voorstellen via timesheets per medewerker.
                            </p>
                        </section>
                    ) : null}

                    {canUpdate && projectCard !== null ? (
                        <div className="flex justify-end border-t border-gray-100 pt-2">
                            <button
                                type="button"
                                onClick={async () => {
                                    const accepted = await confirm({
                                        message: `Project “${project.name}” verwijderen?`,
                                        confirmLabel: 'Verwijderen',
                                        variant: 'danger',
                                    });

                                    if (!accepted) {
                                        return;
                                    }

                                    router.delete(
                                        destroyProject.url({ project: project.id }),
                                        {
                                            onSuccess: () =>
                                                success('Project verwijderd.'),
                                        },
                                    );
                                }}
                                className="rounded-md px-2.5 py-1 text-xs font-medium text-gray-500 transition hover:bg-red-50 hover:text-red-700"
                            >
                                Project verwijderen
                            </button>
                        </div>
                    ) : null}
                </div>
            </main>

            {showEditForm && canUpdate && projectCard !== null ? (
                <ProjectFormPanel
                    project={projectCard}
                    teams={organizationTeams}
                    onClose={() => setShowEditForm(false)}
                    onSuccess={() => success('Project bijgewerkt.')}
                />
            ) : null}
        </AppLayout>
    );
}
