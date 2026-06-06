import { TaskAvailabilityToggle } from '@/components/projects/task-availability-toggle';
import { dashboardSectionClassName } from '@/components/dashboard/dashboard-styles';
import type { TeamLeaveItem } from '@/types/leave-requests';

type EmployeeDashboardTodayProps = {
    taskAvailability: string | null;
    teamLeaveToday: TeamLeaveItem[];
};

export function EmployeeDashboardToday({
    taskAvailability,
    teamLeaveToday,
}: EmployeeDashboardTodayProps) {
    if (taskAvailability === null && teamLeaveToday.length === 0) {
        return null;
    }

    return (
        <section className={dashboardSectionClassName}>
            {taskAvailability !== null ? (
                <>
                    <div className="border-b border-gray-100 px-4 py-3 sm:px-5">
                        <h2 className="text-sm font-semibold text-gray-900">Status</h2>
                        <p className="mt-0.5 text-xs text-gray-500">
                            Geef aan of je open staat voor nieuwe taken of bezig bent met een
                            lopende taak.
                        </p>
                    </div>
                    <div className="px-4 py-4 sm:px-5">
                        <TaskAvailabilityToggle value={taskAvailability} />
                    </div>
                </>
            ) : null}

            {teamLeaveToday.length > 0 ? (
                <div
                    className={
                        taskAvailability !== null
                            ? 'border-t border-gray-100 px-4 py-4 sm:px-5'
                            : 'px-4 py-4 sm:px-5'
                    }
                >
                    {taskAvailability !== null ? (
                        <p className="mb-3 text-xs font-medium text-gray-500 uppercase">
                            Afwezig vandaag
                        </p>
                    ) : (
                        <>
                            <h2 className="text-sm font-semibold text-gray-900">
                                Afwezig vandaag
                            </h2>
                            <p className="mt-0.5 text-xs text-gray-500">
                                Collega&apos;s met goedgekeurd verlof vandaag.
                            </p>
                        </>
                    )}
                    <ul className="divide-y divide-gray-100 rounded-lg border border-gray-200">
                        {teamLeaveToday.map((item) => (
                            <li
                                key={item.id}
                                className="flex items-center justify-between gap-3 px-3 py-2.5"
                            >
                                <div className="min-w-0">
                                    <p className="truncate text-sm font-medium text-gray-900">
                                        {item.user.name}
                                    </p>
                                    <p className="truncate text-xs text-gray-500">
                                        {item.type_label}
                                    </p>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            ) : null}
        </section>
    );
}
