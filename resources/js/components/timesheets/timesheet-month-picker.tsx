import { useEffect, useId, useRef, useState } from 'react';

import { cn } from '@/lib/utils';

const MONTH_LABELS = [
    'jan',
    'feb',
    'mrt',
    'apr',
    'mei',
    'jun',
    'jul',
    'aug',
    'sep',
    'okt',
    'nov',
    'dec',
] as const;

const triggerClassName =
    'inline-flex h-9 min-w-[10.5rem] items-center justify-between gap-2 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-sm font-medium text-gray-800 shadow-sm transition hover:border-gray-300 hover:bg-gray-50 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 focus:outline-none';

function formatMonthLabel(monthYmd: string): string {
    const [year, month] = monthYmd.split('-').map(Number);

    return new Date(year, month - 1, 1).toLocaleDateString('nl-BE', {
        month: 'long',
        year: 'numeric',
    });
}

function currentMonthYmd(): string {
    const now = new Date();

    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function yearFromMonthYmd(monthYmd: string): number {
    return Number(monthYmd.split('-')[0]);
}

function monthIndexFromMonthYmd(monthYmd: string): number {
    return Number(monthYmd.split('-')[1]);
}

function IconChevronLeft({ className }: { className?: string }) {
    return (
        <svg
            className={className}
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden
        >
            <path
                fillRule="evenodd"
                d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z"
                clipRule="evenodd"
            />
        </svg>
    );
}

function IconChevronRight({ className }: { className?: string }) {
    return (
        <svg
            className={className}
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden
        >
            <path
                fillRule="evenodd"
                d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
                clipRule="evenodd"
            />
        </svg>
    );
}

function IconCalendar({ className }: { className?: string }) {
    return (
        <svg
            className={className}
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden
        >
            <path
                fillRule="evenodd"
                d="M5.75 2a.75.75 0 01.75.75V4h7V2.75a.75.75 0 011.5 0V4h1.25A2.75 2.75 0 0118 6.75v10.5A2.75 2.75 0 0115.25 20H4.75A2.75 2.75 0 012 17.25V6.75A2.75 2.75 0 014.75 4H6V2.75A.75.75 0 016.75 2h-1zm-1 5.5c-.69 0-1.25.56-1.25 1.25v8.5c0 .69.56 1.25 1.25 1.25h10.5c.69 0 1.25-.56 1.25-1.25v-8.5c0-.69-.56-1.25-1.25-1.25H4.75z"
                clipRule="evenodd"
            />
        </svg>
    );
}

type TimesheetMonthPickerProps = {
    value: string;
    onChange: (monthYmd: string) => void;
    className?: string;
};

export function TimesheetMonthPicker({
    value,
    onChange,
    className,
}: TimesheetMonthPickerProps) {
    const listboxId = useId();
    const containerRef = useRef<HTMLDivElement>(null);
    const [open, setOpen] = useState(false);
    const [viewYear, setViewYear] = useState(() => yearFromMonthYmd(value));

    const selectedYear = yearFromMonthYmd(value);
    const selectedMonth = monthIndexFromMonthYmd(value);

    useEffect(() => {
        setViewYear(yearFromMonthYmd(value));
    }, [value]);

    useEffect(() => {
        if (!open) {
            return;
        }

        function onPointerDown(event: MouseEvent): void {
            if (
                containerRef.current !== null &&
                !containerRef.current.contains(event.target as Node)
            ) {
                setOpen(false);
            }
        }

        function onKeyDown(event: KeyboardEvent): void {
            if (event.key === 'Escape') {
                setOpen(false);
            }
        }

        document.addEventListener('mousedown', onPointerDown);
        window.addEventListener('keydown', onKeyDown);

        return () => {
            document.removeEventListener('mousedown', onPointerDown);
            window.removeEventListener('keydown', onKeyDown);
        };
    }, [open]);

    function selectMonth(month: number): void {
        const monthYmd = `${viewYear}-${String(month).padStart(2, '0')}`;
        onChange(monthYmd);
        setOpen(false);
    }

    return (
        <div
            ref={containerRef}
            className={cn('relative flex shrink-0 items-center gap-1.5', className)}
        >
            <span className="text-xs text-gray-500">Maand</span>
            <button
                type="button"
                onClick={() => setOpen((wasOpen) => !wasOpen)}
                className={triggerClassName}
                aria-haspopup="listbox"
                aria-expanded={open}
                aria-controls={listboxId}
                title="Maand kiezen"
            >
                <span className="capitalize">{formatMonthLabel(value)}</span>
                <IconCalendar className="h-4 w-4 shrink-0 text-gray-500" />
            </button>

            {open ? (
                <div
                    id={listboxId}
                    role="listbox"
                    aria-label="Maand kiezen"
                    className="absolute top-full left-0 z-50 mt-1.5 w-[17rem] rounded-xl border border-gray-200 bg-white p-2 shadow-lg"
                >
                    <div className="flex items-center justify-between rounded-lg bg-gray-50 px-1 py-1">
                        <button
                            type="button"
                            onClick={() => setViewYear((year) => year - 1)}
                            className="rounded-md p-1.5 text-gray-600 transition hover:bg-white hover:text-gray-900"
                            aria-label="Vorig jaar"
                        >
                            <IconChevronLeft className="h-4 w-4" />
                        </button>
                        <span className="text-sm font-semibold text-gray-900 tabular-nums">
                            {viewYear}
                        </span>
                        <button
                            type="button"
                            onClick={() => setViewYear((year) => year + 1)}
                            className="rounded-md p-1.5 text-gray-600 transition hover:bg-white hover:text-gray-900"
                            aria-label="Volgend jaar"
                        >
                            <IconChevronRight className="h-4 w-4" />
                        </button>
                    </div>

                    <div className="mt-2 grid grid-cols-4 gap-1">
                        {MONTH_LABELS.map((label, index) => {
                            const month = index + 1;
                            const isSelected =
                                viewYear === selectedYear &&
                                month === selectedMonth;

                            return (
                                <button
                                    key={label}
                                    type="button"
                                    role="option"
                                    aria-selected={isSelected}
                                    onClick={() => selectMonth(month)}
                                    className={cn(
                                        'rounded-md px-1 py-2 text-xs font-medium transition sm:text-sm',
                                        isSelected
                                            ? 'bg-violet-100 text-violet-800 ring-1 ring-violet-300/70'
                                            : 'text-gray-700 hover:bg-gray-50',
                                    )}
                                >
                                    {label}
                                </button>
                            );
                        })}
                    </div>

                    <div className="mt-2 border-t border-gray-100 pt-2">
                        <button
                            type="button"
                            onClick={() => {
                                onChange(currentMonthYmd());
                                setOpen(false);
                            }}
                            className="w-full rounded-md px-2 py-1.5 text-left text-sm font-medium text-violet-700 transition hover:bg-violet-50"
                        >
                            Deze maand
                        </button>
                    </div>
                </div>
            ) : null}
        </div>
    );
}
