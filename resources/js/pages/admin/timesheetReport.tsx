import { Head, router, usePage } from '@inertiajs/react';
import { useState } from 'react';

import {
    dashboardSectionClassName,
    dashboardSectionLinkClassName,
} from '@/components/dashboard/dashboard-styles';
import { formatDayTotal } from '@/components/timesheets/timesheet-helpers';
import { AppLayout } from '@/layouts/app-layout';
import { cn } from '@/lib/utils';
import type { AdminTimesheetReportPageProps } from '@/types/admin-timesheet-report';

const selectClassName =
    'mt-1 block w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm outline-none focus:border-red-500/55 focus:ring-2 focus:ring-red-500/15';

const labelClassName = 'block text-xs font-semibold tracking-wide text-gray-500 uppercase';

function buildExportUrl(
    filters: AdminTimesheetReportPageProps['filters'],
    format: 'csv' | 'pdf',
): string {
    const params = new URLSearchParams({
        starts_on: filters.starts_on,
        ends_on: filters.ends_on,
        format,
    });

    if (filters.user_id !== null) {
        params.set('user_id', String(filters.user_id));
    }

    if (filters.project_id !== null) {
        params.set('project_id', String(filters.project_id));
    }

    if (filters.team_id !== null) {
        params.set('team_id', String(filters.team_id));
    }

    return `/admin/timesheet-report/export?${params.toString()}`;
}

export default function AdminTimesheetReport() {
    const {
        organizationName,
        filters,
        filterOptions,
        summary,
        rows,
        exportFormats,
    } = usePage<AdminTimesheetReportPageProps>().props;

    const [startsOn, setStartsOn] = useState(filters.starts_on);
    const [endsOn, setEndsOn] = useState(filters.ends_on);
    const [userId, setUserId] = useState(filters.user_id?.toString() ?? '');
    const [projectId, setProjectId] = useState(filters.project_id?.toString() ?? '');
    const [teamId, setTeamId] = useState(filters.team_id?.toString() ?? '');

    function applyFilters() {
        router.get(
            '/admin/timesheet-report',
            {
                starts_on: startsOn,
                ends_on: endsOn,
                user_id: userId !== '' ? userId : undefined,
                project_id: projectId !== '' ? projectId : undefined,
                team_id: teamId !== '' ? teamId : undefined,
            },
            { preserveState: true, replace: true },
        );
    }

    const trimmedOrganizationName = organizationName.trim();

    return (
        <AppLayout>
            <Head title="Urenrapportage — beheerder" />
            <main className="mx-auto box-border w-full max-w-5xl min-w-0 px-4 py-4 sm:px-5 sm:py-5 md:max-w-6xl md:px-6 lg:max-w-7xl lg:px-8 lg:py-6 xl:max-w-none xl:px-8 2xl:px-12">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        <h1 className="text-lg font-semibold tracking-tight text-gray-900 sm:text-xl lg:text-2xl">
                            Urenrapportage
                        </h1>
                        <p className="mt-1 text-sm text-gray-500">
                            {trimmedOrganizationName !== ''
                                ? `Goedgekeurde timesheet-uren voor ${trimmedOrganizationName}.`
                                : 'Goedgekeurde timesheet-uren van je organisatie.'}
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <a
                            href={buildExportUrl(filters, 'csv')}
                            className={cn(
                                dashboardSectionLinkClassName,
                                'inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold shadow-sm transition hover:bg-gray-50',
                            )}
                        >
                            CSV exporteren
                        </a>
                        <a
                            href={buildExportUrl(filters, 'pdf')}
                            className={cn(
                                dashboardSectionLinkClassName,
                                'inline-flex items-center justify-center rounded-lg border border-gray-900 bg-gray-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-800',
                            )}
                        >
                            PDF exporteren
                        </a>
                    </div>
                </div>

                <section className="mt-5 rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
                    <h2 className="text-sm font-semibold text-gray-900">Filters</h2>
                    <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        <div>
                            <label htmlFor="starts-on" className={labelClassName}>
                                Van
                            </label>
                            <input
                                id="starts-on"
                                type="date"
                                value={startsOn}
                                onChange={(event) => setStartsOn(event.target.value)}
                                className={selectClassName}
                            />
                        </div>
                        <div>
                            <label htmlFor="ends-on" className={labelClassName}>
                                Tot
                            </label>
                            <input
                                id="ends-on"
                                type="date"
                                value={endsOn}
                                onChange={(event) => setEndsOn(event.target.value)}
                                className={selectClassName}
                            />
                        </div>
                        <div>
                            <label htmlFor="employee" className={labelClassName}>
                                Medewerker
                            </label>
                            <select
                                id="employee"
                                value={userId}
                                onChange={(event) => setUserId(event.target.value)}
                                className={selectClassName}
                            >
                                <option value="">Alle medewerkers</option>
                                {filterOptions.employees.map((employee) => (
                                    <option key={employee.id} value={employee.id}>
                                        {employee.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="project" className={labelClassName}>
                                Project
                            </label>
                            <select
                                id="project"
                                value={projectId}
                                onChange={(event) => setProjectId(event.target.value)}
                                className={selectClassName}
                            >
                                <option value="">Alle projecten</option>
                                {filterOptions.projects.map((project) => (
                                    <option key={project.id} value={project.id}>
                                        {project.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="team" className={labelClassName}>
                                Team
                            </label>
                            <select
                                id="team"
                                value={teamId}
                                onChange={(event) => setTeamId(event.target.value)}
                                className={selectClassName}
                            >
                                <option value="">Alle teams</option>
                                {filterOptions.teams.map((team) => (
                                    <option key={team.id} value={team.id}>
                                        {team.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className="mt-4 flex flex-wrap items-center gap-3">
                        <button
                            type="button"
                            onClick={applyFilters}
                            className="inline-flex items-center rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-800"
                        >
                            Toepassen
                        </button>
                        <p className="text-xs text-gray-500">
                            CSV en PDF gebruiken dezelfde filters.
                        </p>
                    </div>
                </section>

                <div className="mt-5 grid gap-4 sm:grid-cols-3">
                    <div className="rounded-xl border border-gray-200 bg-white px-4 py-4 shadow-sm">
                        <p className="text-xs font-medium tracking-wide text-gray-500 uppercase">
                            Regels
                        </p>
                        <p className="mt-2 text-2xl font-semibold tabular-nums text-gray-900">
                            {summary.entry_count}
                        </p>
                    </div>
                    <div className="rounded-xl border border-gray-200 bg-white px-4 py-4 shadow-sm">
                        <p className="text-xs font-medium tracking-wide text-gray-500 uppercase">
                            Totaal uren
                        </p>
                        <p className="mt-2 text-2xl font-semibold tabular-nums text-gray-900">
                            {formatDayTotal(summary.total_minutes)}
                        </p>
                    </div>
                    <div className="rounded-xl border border-gray-200 bg-white px-4 py-4 shadow-sm">
                        <p className="text-xs font-medium tracking-wide text-gray-500 uppercase">
                            Medewerkers
                        </p>
                        <p className="mt-2 text-2xl font-semibold tabular-nums text-gray-900">
                            {summary.employee_count}
                        </p>
                    </div>
                </div>

                <section className={cn(dashboardSectionClassName, 'mt-5')}>
                    <div className="border-b border-gray-100 px-4 py-3 sm:px-5">
                        <h2 className="text-sm font-semibold text-gray-900">Preview</h2>
                        <p className="mt-0.5 text-xs text-gray-500">
                            Alleen goedgekeurde timesheet-entries. Export gebruikt dezelfde filters.
                        </p>
                    </div>

                    {rows.length === 0 ? (
                        <div className="px-4 py-10 text-center sm:px-5">
                            <p className="text-sm font-medium text-gray-700">
                                Geen uren gevonden voor deze filters
                            </p>
                            <p className="mt-1 text-xs text-gray-500">
                                Pas de periode of filters aan en probeer opnieuw.
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-100 text-sm">
                                <thead className="bg-gray-50/80">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide text-gray-500 uppercase sm:px-5">
                                            Medewerker
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide text-gray-500 uppercase sm:px-5">
                                            Datum
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide text-gray-500 uppercase sm:px-5">
                                            Tijd
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide text-gray-500 uppercase sm:px-5">
                                            Duur
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide text-gray-500 uppercase sm:px-5">
                                            Titel
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide text-gray-500 uppercase sm:px-5">
                                            Project
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 bg-white">
                                    {rows.map((row) => (
                                        <tr key={row.id}>
                                            <td className="px-4 py-3 text-gray-900 sm:px-5">
                                                {row.employee_name}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-gray-600 sm:px-5">
                                                {row.worked_on}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-gray-600 sm:px-5">
                                                {row.time_range}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-gray-600 sm:px-5">
                                                {row.duration_label}
                                            </td>
                                            <td className="px-4 py-3 text-gray-900 sm:px-5">
                                                {row.title}
                                            </td>
                                            <td className="px-4 py-3 text-gray-600 sm:px-5">
                                                {row.project_name ?? row.client_name ?? '—'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>

                <div className="mt-4 flex flex-wrap gap-2">
                    {exportFormats.map((format) => (
                        <span
                            key={format.value}
                            className={cn(
                                'rounded-full px-3 py-1 text-xs font-medium',
                                format.available
                                    ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
                                    : 'bg-gray-100 text-gray-500 ring-1 ring-gray-200',
                            )}
                        >
                            {format.label}
                        </span>
                    ))}
                </div>
            </main>
        </AppLayout>
    );
}
