import { cn } from '@/lib/utils';

type TaskAvailability = 'on_task' | 'open_for_tasks';

const TASK_AVAILABILITY_STYLES: Record<TaskAvailability, string> = {
    open_for_tasks: 'bg-blue-100 text-blue-900 ring-blue-300',
    on_task: 'bg-slate-200 text-slate-800 ring-slate-400',
};

type TaskAvailabilityBadgeProps = {
    label: string;
    availability: TaskAvailability;
};

export function TaskAvailabilityBadge({ label, availability }: TaskAvailabilityBadgeProps) {
    return (
        <span
            className={cn(
                'inline-flex shrink-0 items-center rounded-md px-2.5 py-1 text-xs font-medium ring-1 ring-inset',
                TASK_AVAILABILITY_STYLES[availability],
            )}
        >
            {label}
        </span>
    );
}
