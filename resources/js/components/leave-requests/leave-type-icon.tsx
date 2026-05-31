import { LEAVE_TYPE_PRIMARY_OPTIONS } from '@/components/leave-requests/leave-request-helpers';
import { cn } from '@/lib/utils';
import type { LeaveType } from '@/types/leave-requests';

type LeaveTypeIconProps = {
    type: LeaveType;
    className?: string;
};

function OtherGlyph() {
    return (
        <svg
            width={18}
            height={18}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.8}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
        >
            <circle cx="5" cy="12" r="1.4" />
            <circle cx="12" cy="12" r="1.4" />
            <circle cx="19" cy="12" r="1.4" />
        </svg>
    );
}

export function LeaveTypeIcon({ type, className }: LeaveTypeIconProps) {
    const option = LEAVE_TYPE_PRIMARY_OPTIONS.find((entry) => entry.value === type);

    if (option !== undefined) {
        return (
            <img
                src={option.src}
                alt=""
                className={cn('size-9 shrink-0 object-contain', className)}
                width={36}
                height={36}
                decoding="async"
                draggable={false}
            />
        );
    }

    return (
        <span
            className={cn(
                'inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-500',
                className,
            )}
            aria-hidden
        >
            <OtherGlyph />
        </span>
    );
}
