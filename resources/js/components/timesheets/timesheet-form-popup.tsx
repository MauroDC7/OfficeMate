import { createPortal } from 'react-dom';

import { minutesToTimeLabel } from '@/components/timesheets/timesheet-helpers';
import type {
    TimesheetDraft,
    TimesheetModalState,
} from '@/components/timesheets/week-calendar-types';

type TimesheetFormPopupProps = {
    modal: TimesheetModalState;
    draft: TimesheetDraft;
    formError: string | null;
    serverErrors: Record<string, string>;
    submitting: boolean;
    onDraftChange: (field: keyof TimesheetDraft, value: string) => void;
    onClose: () => void;
    onSave: () => void;
    onDelete: () => void;
};

export function TimesheetFormPopup({
    modal,
    draft,
    formError,
    serverErrors,
    submitting,
    onDraftChange,
    onClose,
    onSave,
    onDelete,
}: TimesheetFormPopupProps) {
    if (typeof document === 'undefined') {
        return null;
    }

    return createPortal(
        <div
            className="fixed inset-0 z-[9999] flex items-end justify-center bg-black/40 p-4 sm:items-center"
            role="presentation"
            onClick={onClose}
        >
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="timesheet-modal-title"
                className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-5 shadow-xl"
                onClick={(e) => e.stopPropagation()}
            >
                <h3
                    id="timesheet-modal-title"
                    className="text-lg font-semibold text-gray-900"
                >
                    {modal.mode === 'create'
                        ? 'Timesheet toevoegen'
                        : 'Timesheet bewerken'}
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                    {minutesToTimeLabel(
                        modal.mode === 'create'
                            ? modal.startMin
                            : modal.entry.start_minutes,
                    )}{' '}
                    –{' '}
                    {minutesToTimeLabel(
                        modal.mode === 'create'
                            ? modal.endMin
                            : modal.entry.end_minutes,
                    )}{' '}
                    <span className="text-gray-400">
                        (pas aan indien nodig)
                    </span>
                </p>

                <div className="mt-4 space-y-4">
                    <div>
                        <label
                            htmlFor="ts-title"
                            className="text-sm font-medium text-gray-800"
                        >
                            Titel <span className="text-red-600">*</span>
                        </label>
                        <input
                            id="ts-title"
                            type="text"
                            value={draft.title}
                            onChange={(e) =>
                                onDraftChange('title', e.target.value)
                            }
                            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-violet-500 focus:ring-1 focus:ring-violet-500 focus:outline-none"
                            autoComplete="off"
                        />
                        {serverErrors.title !== undefined ? (
                            <p className="mt-1 text-sm text-red-600">
                                {serverErrors.title}
                            </p>
                        ) : null}
                    </div>
                    <div>
                        <label
                            htmlFor="ts-desc"
                            className="text-sm font-medium text-gray-800"
                        >
                            Beschrijving
                        </label>
                        <textarea
                            id="ts-desc"
                            value={draft.description}
                            onChange={(e) =>
                                onDraftChange('description', e.target.value)
                            }
                            rows={3}
                            className="mt-1 w-full resize-y rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-violet-500 focus:ring-1 focus:ring-violet-500 focus:outline-none"
                        />
                        {serverErrors.description !== undefined ? (
                            <p className="mt-1 text-sm text-red-600">
                                {serverErrors.description}
                            </p>
                        ) : null}
                    </div>
                    <div>
                        <label
                            htmlFor="ts-client"
                            className="text-sm font-medium text-gray-800"
                        >
                            Klantnaam{' '}
                            <span className="font-normal text-gray-500">
                                (optioneel)
                            </span>
                        </label>
                        <input
                            id="ts-client"
                            type="text"
                            value={draft.client}
                            onChange={(e) =>
                                onDraftChange('client', e.target.value)
                            }
                            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-violet-500 focus:ring-1 focus:ring-violet-500 focus:outline-none"
                            autoComplete="organization"
                        />
                        {serverErrors.client_name !== undefined ? (
                            <p className="mt-1 text-sm text-red-600">
                                {serverErrors.client_name}
                            </p>
                        ) : null}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label
                                htmlFor="ts-start"
                                className="text-sm font-medium text-gray-800"
                            >
                                Van
                            </label>
                            <input
                                id="ts-start"
                                type="time"
                                value={draft.start}
                                onChange={(e) =>
                                    onDraftChange('start', e.target.value)
                                }
                                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-violet-500 focus:ring-1 focus:ring-violet-500 focus:outline-none"
                            />
                        </div>
                        <div>
                            <label
                                htmlFor="ts-end"
                                className="text-sm font-medium text-gray-800"
                            >
                                Tot
                            </label>
                            <input
                                id="ts-end"
                                type="time"
                                value={draft.end}
                                onChange={(e) =>
                                    onDraftChange('end', e.target.value)
                                }
                                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-violet-500 focus:ring-1 focus:ring-violet-500 focus:outline-none"
                            />
                        </div>
                    </div>
                    {(serverErrors.start_minutes !== undefined ||
                        serverErrors.end_minutes !== undefined) && (
                        <p className="text-sm text-red-600">
                            {serverErrors.start_minutes ??
                                serverErrors.end_minutes}
                        </p>
                    )}
                    {serverErrors.worked_on !== undefined ? (
                        <p className="text-sm text-red-600">
                            {serverErrors.worked_on}
                        </p>
                    ) : null}
                    {formError !== null ? (
                        <p className="text-sm text-red-600">{formError}</p>
                    ) : null}
                </div>

                <div className="mt-6 flex flex-wrap items-center justify-between gap-2">
                    <div>
                        {modal.mode === 'edit' ? (
                            <button
                                type="button"
                                onClick={onDelete}
                                disabled={submitting}
                                className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 shadow-sm transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                Verwijderen
                            </button>
                        ) : null}
                    </div>
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={submitting}
                            className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            Annuleren
                        </button>
                        <button
                            type="button"
                            onClick={onSave}
                            disabled={submitting}
                            className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {submitting ? 'Bezig…' : 'Opslaan'}
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        document.body,
    );
}
