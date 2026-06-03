import { router } from '@inertiajs/react';

import { cn } from '@/lib/utils';
import { update as updateTaskAvailability } from '@/routes/dashboard/task-availability';

type TaskAvailabilityToggleProps = {
    value: string;
    className?: string;
};

export function TaskAvailabilityToggle({ value, className }: TaskAvailabilityToggleProps) {
    const isOpen = value === 'open_for_tasks';

    function toggle(): void {
        router.patch(
            updateTaskAvailability.url(),
            { task_availability: isOpen ? 'on_task' : 'open_for_tasks' },
            { preserveScroll: true },
        );
    }

    return (
        <div
            className={cn(
                'inline-flex h-10 w-full items-center justify-between gap-2 rounded-lg border border-gray-300 bg-white px-3 shadow-sm sm:w-auto sm:justify-start',
                className,
            )}
        >
            <span className="text-sm font-medium text-gray-500">Status</span>
            <div className="flex items-center gap-2">
                <button
                    type="button"
                    role="switch"
                    aria-checked={isOpen}
                    aria-label={isOpen ? 'Open for tasks' : 'On task'}
                    onClick={toggle}
                    className={cn(
                        'relative inline-flex h-5 w-9 shrink-0 rounded-full transition',
                        isOpen ? 'bg-emerald-500' : 'bg-gray-300',
                    )}
                >
                    <span
                        className={cn(
                            'pointer-events-none inline-block size-4 translate-y-0.5 rounded-full bg-white shadow transition',
                            isOpen ? 'translate-x-4' : 'translate-x-0.5',
                        )}
                    />
                </button>
                <span className="text-sm font-medium text-gray-700">{isOpen ? 'Open' : 'Bezig'}</span>
            </div>
        </div>
    );
}
