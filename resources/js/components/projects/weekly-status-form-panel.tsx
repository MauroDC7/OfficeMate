import { Form } from '@inertiajs/react';
import { useEffect, useId } from 'react';

import { cn } from '@/lib/utils';
import { store } from '@/routes/weekly-status';
import type { ProjectsPageProps } from '@/types/projects';

type WeeklyStatusFormPanelProps = {
    weeklyStatus: NonNullable<ProjectsPageProps['weeklyStatus']>;
    onClose: () => void;
    onSuccess?: () => void;
};

const inputClass =
    'mt-1.5 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm outline-none transition focus:border-gray-400 focus:ring-2 focus:ring-gray-900/10';

function IconClose({ className }: { className?: string }) {
    return (
        <svg className={className} width={20} height={20} viewBox="0 0 24 24" aria-hidden fill="none">
            <path
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                d="M6 6l12 12M18 6L6 18"
            />
        </svg>
    );
}

export function WeeklyStatusFormPanel({ weeklyStatus, onClose, onSuccess }: WeeklyStatusFormPanelProps) {
    const titleId = useId();

    useEffect(() => {
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        function onKeyDown(event: KeyboardEvent) {
            if (event.key === 'Escape') {
                onClose();
            }
        }

        window.addEventListener('keydown', onKeyDown);

        return () => {
            document.body.style.overflow = previousOverflow;
            window.removeEventListener('keydown', onKeyDown);
        };
    }, [onClose]);

    return (
        <div
            className="fixed inset-0 z-[9990] flex items-end justify-center bg-gray-900/40 p-3 sm:items-center sm:p-4"
            role="presentation"
            onClick={onClose}
        >
            <section
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                className={cn(
                    'max-h-[92svh] w-full max-w-lg overflow-y-auto rounded-xl border bg-white shadow-xl sm:rounded-2xl',
                    weeklyStatus.reminder_due ? 'border-amber-300' : 'border-gray-200',
                )}
                onClick={(event) => event.stopPropagation()}
            >
                <div className="flex items-start justify-between gap-3 border-b border-gray-200 px-5 py-4 sm:px-6">
                    <div>
                        <h2 id={titleId} className="text-base font-semibold text-gray-900">
                            Weekly debrief
                        </h2>
                        <p className="mt-0.5 text-sm text-gray-500">
                            Wat was moeilijk deze week en wat staat er volgende week op de planning?
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-800"
                        aria-label="Sluiten"
                    >
                        <IconClose />
                    </button>
                </div>

                <Form
                    {...store.form.post()}
                    key={weeklyStatus.week_start}
                    options={{ preserveScroll: true }}
                    onSuccess={() => {
                        onSuccess?.();
                        onClose();
                    }}
                    className="space-y-4 px-5 py-5 sm:px-6"
                >
                    {({ errors, processing }) => (
                        <>
                            <input type="hidden" name="week_start" value={weeklyStatus.week_start} />

                            <div>
                                <label htmlFor="weekly-difficult" className="text-sm font-medium text-gray-800">
                                    Wat was er deze week moeilijk? <span className="text-red-600">*</span>
                                </label>
                                <textarea
                                    id="weekly-difficult"
                                    name="difficult_this_week"
                                    rows={4}
                                    required
                                    defaultValue={weeklyStatus.difficult_this_week ?? ''}
                                    placeholder="Bijv. complexe bug, onduidelijke requirements…"
                                    className={inputClass}
                                />
                                {errors.difficult_this_week ? (
                                    <p className="mt-1 text-xs text-red-600">{errors.difficult_this_week}</p>
                                ) : null}
                            </div>

                            <div>
                                <label htmlFor="weekly-plans" className="text-sm font-medium text-gray-800">
                                    Wat ga je volgende week doen? <span className="text-red-600">*</span>
                                </label>
                                <textarea
                                    id="weekly-plans"
                                    name="plans_next_week"
                                    rows={4}
                                    required
                                    defaultValue={weeklyStatus.plans_next_week ?? ''}
                                    placeholder="Bijv. feature afronden, sprint planning…"
                                    className={inputClass}
                                />
                                {errors.plans_next_week ? (
                                    <p className="mt-1 text-xs text-red-600">{errors.plans_next_week}</p>
                                ) : null}
                            </div>

                            <div className="flex flex-col-reverse gap-2 border-t border-gray-100 pt-4 sm:flex-row sm:justify-end">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50"
                                >
                                    Annuleren
                                </button>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-800 disabled:opacity-60"
                                >
                                    {processing ? 'Opslaan…' : 'Opslaan'}
                                </button>
                            </div>
                        </>
                    )}
                </Form>
            </section>
        </div>
    );
}
