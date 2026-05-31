import { router } from '@inertiajs/react';
import { type ChangeEvent, useId } from 'react';

import { update as updateTaskAvailability } from '@/routes/dashboard/task-availability';

type TaskAvailabilityOption = {
    value: string;
    label: string;
};

type DashboardTaskStatusSelectProps = {
    value: string;
    options: TaskAvailabilityOption[];
};

export function DashboardTaskStatusSelect({ value, options }: DashboardTaskStatusSelectProps) {
    const selectId = useId();

    function onChange(event: ChangeEvent<HTMLSelectElement>) {
        router.patch(
            updateTaskAvailability.url(),
            { task_availability: event.target.value },
            { preserveScroll: true },
        );
    }

    return (
        <section className="rounded-xl border border-gray-200 bg-white px-4 py-4 shadow-sm sm:px-5">
            <label htmlFor={selectId} className="text-sm font-medium text-gray-900">
                Set tasks
            </label>
            <select
                id={selectId}
                value={value}
                onChange={onChange}
                className="mt-2 w-full max-w-xs rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-900/10"
            >
                {options.map((option) => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
        </section>
    );
}
