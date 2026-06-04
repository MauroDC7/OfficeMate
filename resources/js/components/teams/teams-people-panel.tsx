import { PeopleEmployeeCard } from '@/components/teams/people-employee-card';
import { formatPresenceSummary } from '@/components/presence/presence-helpers';
import type { PresenceEmployee, PresenceSummary } from '@/types/presence';

type TeamsPeoplePanelProps = {
    summary: PresenceSummary;
    employees: PresenceEmployee[];
    currentUserId: number;
};

type SummaryStat = {
    key: keyof PresenceSummary;
    label: string;
    value: number;
    dotClass: string;
};

const SUMMARY_STATS: SummaryStat[] = [
    { key: 'in_office', label: 'Op kantoor', value: 0, dotClass: 'bg-emerald-500' },
    { key: 'out_of_office', label: 'Niet op kantoor', value: 0, dotClass: 'bg-gray-400' },
    { key: 'vacation', label: 'Vakantie', value: 0, dotClass: 'bg-sky-500' },
    { key: 'sick', label: 'Ziek', value: 0, dotClass: 'bg-amber-500' },
    { key: 'other_leave', label: 'Overig verlof', value: 0, dotClass: 'bg-violet-500' },
];

export function TeamsPeoplePanel({ summary, employees, currentUserId }: TeamsPeoplePanelProps) {
    const visibleStats = SUMMARY_STATS.map((stat) => ({
        ...stat,
        value: summary[stat.key],
    })).filter((stat) => stat.value > 0);

    const totalHeadcount =
        summary.in_office +
        summary.out_of_office +
        summary.vacation +
        summary.sick +
        summary.other_leave;

    return (
        <section className="mt-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <p className="text-sm text-gray-500">{formatPresenceSummary(summary)}</p>
                {totalHeadcount > 0 ? (
                    <p className="text-xs font-medium text-gray-400">
                        {totalHeadcount} {totalHeadcount === 1 ? 'medewerker' : 'medewerkers'}
                    </p>
                ) : null}
            </div>

            {visibleStats.length > 0 ? (
                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                    {visibleStats.map((stat) => (
                        <div
                            key={stat.key}
                            className="rounded-xl border border-gray-200 bg-white px-3 py-3 shadow-sm sm:px-4"
                        >
                            <div className="flex items-center gap-2">
                                <span
                                    className={`size-2 shrink-0 rounded-full ${stat.dotClass}`}
                                    aria-hidden
                                />
                                <p className="text-[10px] font-medium tracking-wide text-gray-500 uppercase">
                                    {stat.label}
                                </p>
                            </div>
                            <p className="mt-1 text-2xl font-semibold tabular-nums text-gray-900">
                                {stat.value}
                            </p>
                        </div>
                    ))}
                </div>
            ) : null}

            {employees.length === 0 ? (
                <p className="mt-5 rounded-xl border border-gray-200 bg-white px-4 py-10 text-center text-sm text-gray-500 shadow-sm">
                    Nog geen medewerkers in je organisatie.
                </p>
            ) : (
                <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {employees.map((employee) => (
                        <PeopleEmployeeCard
                            key={employee.id}
                            employee={employee}
                            currentUserId={currentUserId}
                        />
                    ))}
                </div>
            )}
        </section>
    );
}
