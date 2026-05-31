import { PresenceEmployeeCard } from '@/components/presence/presence-employee-card';
import { formatPresenceSummary } from '@/components/presence/presence-helpers';
import type { PresenceEmployee, PresenceSummary } from '@/types/presence';

type TeamsPresencePanelProps = {
    summary: PresenceSummary;
    employees: PresenceEmployee[];
};

export function TeamsPresencePanel({ summary, employees }: TeamsPresencePanelProps) {
    return (
        <section className="mt-5">
            <p className="text-sm font-medium text-gray-700">{formatPresenceSummary(summary)}</p>

            {employees.length === 0 ? (
                <p className="mt-5 rounded-xl border border-gray-200 bg-white px-4 py-10 text-center text-sm text-gray-500 shadow-sm">
                    Nog geen medewerkers in je organisatie.
                </p>
            ) : (
                <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {employees.map((employee) => (
                        <PresenceEmployeeCard key={employee.id} employee={employee} />
                    ))}
                </div>
            )}
        </section>
    );
}
