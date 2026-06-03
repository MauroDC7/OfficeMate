import { router } from '@inertiajs/react';

import { cn } from '@/lib/utils';
import { update as updateTaskAvailability } from '@/routes/dashboard/task-availability';

type TaskAvailability = 'on_task' | 'open_for_tasks';

const TASK_AVAILABILITY_LABELS: Record<TaskAvailability, string> = {
    open_for_tasks: 'Open for tasks',
    on_task: 'On task',
};

type TaskAvailabilityToggleProps = {
    value: string;
    className?: string;
};

export function TaskAvailabilityToggle({ value, className }: TaskAvailabilityToggleProps) {
    const availability = (value === 'on_task' ? 'on_task' : 'open_for_tasks') as TaskAvailability;
    const isOnTask = availability === 'on_task';
    const currentLabel = TASK_AVAILABILITY_LABELS[availability];
    const nextLabel = TASK_AVAILABILITY_LABELS[isOnTask ? 'open_for_tasks' : 'on_task'];

    function toggle(): void {
        router.patch(
            updateTaskAvailability.url(),
            { task_availability: isOnTask ? 'open_for_tasks' : 'on_task' },
            { preserveScroll: true },
        );
    }

    return (
        <button
            type="button"
            role="switch"
            aria-checked={isOnTask}
            aria-label={`${currentLabel}. Schakel naar ${nextLabel}.`}
            onClick={toggle}
            className={cn(
                'flex w-full items-center justify-between gap-3 rounded-lg border border-gray-300 bg-white px-3 py-2.5 shadow-sm transition hover:bg-gray-50 sm:w-auto sm:min-w-72',
                className,
            )}
        >
            <span className="text-sm font-medium text-gray-900">{currentLabel}</span>
            <span
                className={cn(
                    'relative inline-flex h-5 w-9 shrink-0 rounded-full transition',
                    isOnTask ? 'bg-emerald-500' : 'bg-gray-300',
                )}
                aria-hidden
            >
                <span
                    className={cn(
                        'pointer-events-none inline-block size-4 translate-y-0.5 rounded-full bg-white shadow transition',
                        isOnTask ? 'translate-x-4' : 'translate-x-0.5',
                    )}
                />
            </span>
        </button>
    );
}
