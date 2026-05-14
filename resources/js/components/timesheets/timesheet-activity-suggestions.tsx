import { router } from '@inertiajs/react';
import type { ReactNode } from 'react';

import {
    formatActivityDayLabel,
    formatMinutesRange,
    formatShortRelativeNl,
} from '@/components/timesheets/timesheet-helpers';
import { cn } from '@/lib/utils';
import { destroy } from '@/routes/timesheets/entries';
import type { TimesheetActivityItem } from '@/types/timesheets';

const RELOAD_PROPS = ['recentActivity', 'entriesByDay'];

const ICON_BUTTON_CLASS =
    'inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-700 shadow-sm hover:bg-gray-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900 disabled:opacity-40';

type TimesheetActivitySuggestionsProps = {
    recentActivity: TimesheetActivityItem[];
    onNavigateToEntryEdit: (entryId: number, workedOnYmd: string) => void;
};

type IconProps = { className?: string };

function Svg({ className, children }: IconProps & { children: ReactNode }) {
    return (
        <svg
            className={className}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden
        >
            {children}
        </svg>
    );
}

function IconTrash({ className }: IconProps) {
    return (
        <Svg className={className}>
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
        </Svg>
    );
}

function Subheading({ children }: { children: ReactNode }) {
    return (
        <h3 className="border-b border-gray-100 bg-gray-50 px-4 py-2 text-xs font-semibold tracking-wide text-gray-900 uppercase sm:px-5">
            {children}
        </h3>
    );
}

type ActivityRowProps = {
    item: TimesheetActivityItem;
    onEdit: (entryId: number, workedOnYmd: string) => void;
    onDelete: (entryId: number) => void;
};

function ActivityRow({ item, onEdit, onDelete }: ActivityRowProps) {
    const kindLabel = item.kind === 'created' ? 'Nieuw' : 'Bijgewerkt';

    return (
        <li className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <div className="min-w-0">
                <p className="text-xs text-gray-600">{kindLabel}</p>
                <p className="truncate font-medium text-gray-900">
                    {item.title}
                </p>
                <p className="text-sm text-gray-500">
                    {formatActivityDayLabel(item.worked_on)} ·{' '}
                    {formatMinutesRange(item.start_minutes, item.end_minutes)}
                </p>
                <p className="text-xs text-gray-400">
                    {formatShortRelativeNl(item.updated_at)}
                </p>
            </div>
            <div className="flex gap-1.5">
                <button
                    type="button"
                    className={ICON_BUTTON_CLASS}
                    title="Bewerken"
                    aria-label="Bewerken"
                    onClick={() => onEdit(item.id, item.worked_on)}
                >
                    <img
                        src="/img/Edit Icon 48.png"
                        alt=""
                        className="h-4 w-4"
                    />
                </button>
                <button
                    type="button"
                    className={cn(
                        ICON_BUTTON_CLASS,
                        'text-red-600 hover:bg-red-50',
                    )}
                    title="Verwijderen"
                    aria-label="Verwijderen"
                    onClick={() => onDelete(item.id)}
                >
                    <IconTrash className="h-4 w-4" />
                </button>
            </div>
        </li>
    );
}

export function TimesheetActivitySuggestions({
    recentActivity,
    onNavigateToEntryEdit,
}: TimesheetActivitySuggestionsProps) {
    function handleDelete(entryId: number): void {
        if (!window.confirm('Deze registratie verwijderen?')) {
            return;
        }

        router.delete(destroy.url({ timesheet_entry: entryId }), {
            preserveScroll: true,
            onSuccess: () => router.reload({ only: RELOAD_PROPS }),
        });
    }

    return (
        <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-100 px-4 py-4 sm:px-5">
                <h2 className="text-base font-semibold text-gray-900">
                    Activiteit
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                    AI-voorstellen en recente wijzigingen.
                </p>
            </div>

            <div>
                <Subheading>AI-voorstellen</Subheading>
                <p className="px-4 py-8 text-center text-sm text-gray-500 sm:px-5">
                    Hier komen straks AI-voorstellen. Nog geen koppeling.
                </p>
            </div>

            <div>
                <Subheading>Recente activiteit</Subheading>
                {recentActivity.length === 0 ? (
                    <p className="px-4 py-6 text-center text-sm text-gray-500 sm:px-5">
                        Nog niets.
                    </p>
                ) : (
                    <ul className="divide-y divide-gray-100">
                        {recentActivity.map((item) => (
                            <ActivityRow
                                key={item.id}
                                item={item}
                                onEdit={onNavigateToEntryEdit}
                                onDelete={handleDelete}
                            />
                        ))}
                    </ul>
                )}
            </div>
        </section>
    );
}
