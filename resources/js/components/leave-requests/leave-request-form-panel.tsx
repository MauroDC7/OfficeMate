import { Form } from '@inertiajs/react';
import { useEffect, useId, useState } from 'react';

import { LEAVE_TYPE_OPTIONS } from '@/components/leave-requests/leave-request-helpers';
import { cn } from '@/lib/utils';
import { store, update } from '@/routes/leaveRequests';
import type { LeaveRequestListItem, LeaveType } from '@/types/leave-requests';

type LeaveRequestFormPanelProps = {
    onClose: () => void;
    onSuccess: (message: string) => void;
    request?: LeaveRequestListItem | null;
};

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

const inputClass =
    'mt-1.5 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm outline-none transition focus:border-gray-400 focus:ring-2 focus:ring-gray-900/10';

export function LeaveRequestFormPanel({
    onClose,
    onSuccess,
    request = null,
}: LeaveRequestFormPanelProps) {
    const titleId = useId();
    const isEdit = request !== null;
    const [type, setType] = useState<LeaveType>(request?.type ?? 'vacation');

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

    const formProps = isEdit
        ? update.form.patch({ leave_request: request.id })
        : store.form.post();

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
                className="max-h-[92svh] w-full max-w-lg overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-xl sm:rounded-2xl"
                onClick={(event) => event.stopPropagation()}
            >
                <div className="flex items-start justify-between gap-3 border-b border-gray-200 px-5 py-4 sm:px-6">
                    <div>
                        <h2 id={titleId} className="text-base font-semibold text-gray-900">
                            {isEdit ? 'Verlofaanvraag bewerken' : 'Nieuwe verlofaanvraag'}
                        </h2>
                        <p className="mt-0.5 text-sm text-gray-500">
                            {isEdit
                                ? 'Pas type en periode aan zolang de aanvraag in behandeling is.'
                                : 'Kies het type en de periode. Je aanvraag wordt ter goedkeuring ingediend.'}
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
                    {...formProps}
                    options={{ preserveScroll: true }}
                    onSuccess={() => {
                        onSuccess(
                            isEdit ? 'Verlofaanvraag bijgewerkt.' : 'Verlofaanvraag ingediend.',
                        );
                        onClose();
                    }}
                    className="space-y-5 px-5 py-5 sm:px-6"
                >
                    {({ errors, processing }) => (
                        <>
                            <div>
                                <span className="text-sm font-medium text-gray-800">Type</span>
                                <div className="mt-1.5 grid grid-cols-2 gap-2">
                                    {LEAVE_TYPE_OPTIONS.map((option) => (
                                        <label
                                            key={option.value}
                                            className={cn(
                                                'flex cursor-pointer items-center justify-center rounded-lg border px-3 py-2 text-sm font-medium transition',
                                                type === option.value
                                                    ? 'border-gray-900 bg-gray-900 text-white'
                                                    : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400',
                                            )}
                                        >
                                            <input
                                                type="radio"
                                                name="type"
                                                value={option.value}
                                                checked={type === option.value}
                                                onChange={() => setType(option.value)}
                                                className="sr-only"
                                            />
                                            {option.label}
                                        </label>
                                    ))}
                                </div>
                                {errors.type ? (
                                    <p className="mt-1 text-xs text-red-600">{errors.type}</p>
                                ) : null}
                            </div>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div>
                                    <label
                                        htmlFor="leave-starts-on"
                                        className="text-sm font-medium text-gray-800"
                                    >
                                        Van <span className="text-red-600">*</span>
                                    </label>
                                    <input
                                        id="leave-starts-on"
                                        name="starts_on"
                                        type="date"
                                        required
                                        defaultValue={request?.starts_on ?? ''}
                                        className={inputClass}
                                    />
                                    {errors.starts_on ? (
                                        <p className="mt-1 text-xs text-red-600">{errors.starts_on}</p>
                                    ) : null}
                                </div>
                                <div>
                                    <label
                                        htmlFor="leave-ends-on"
                                        className="text-sm font-medium text-gray-800"
                                    >
                                        Tot en met <span className="text-red-600">*</span>
                                    </label>
                                    <input
                                        id="leave-ends-on"
                                        name="ends_on"
                                        type="date"
                                        required
                                        defaultValue={request?.ends_on ?? ''}
                                        className={inputClass}
                                    />
                                    {errors.ends_on ? (
                                        <p className="mt-1 text-xs text-red-600">{errors.ends_on}</p>
                                    ) : null}
                                </div>
                            </div>

                            <div>
                                <label htmlFor="leave-notes" className="text-sm font-medium text-gray-800">
                                    Opmerking
                                </label>
                                <textarea
                                    id="leave-notes"
                                    name="notes"
                                    rows={3}
                                    defaultValue={request?.notes ?? ''}
                                    placeholder="Optioneel: extra toelichting voor je beheerder"
                                    className={inputClass}
                                />
                                {errors.notes ? (
                                    <p className="mt-1 text-xs text-red-600">{errors.notes}</p>
                                ) : null}
                                {type === 'sick' ? (
                                    <p className="mt-1.5 text-xs text-gray-500">
                                        Een doktersbrief upload je in een volgende stap bij ziekteverlof.
                                    </p>
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
                                    {processing ? 'Bezig…' : isEdit ? 'Opslaan' : 'Indienen'}
                                </button>
                            </div>
                        </>
                    )}
                </Form>
            </section>
        </div>
    );
}
