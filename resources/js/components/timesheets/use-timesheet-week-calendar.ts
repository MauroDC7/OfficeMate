import { router } from '@inertiajs/react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { WORKDAY_INDICES } from '@/components/timesheets/timesheet-grid-config';
import {
    addDays,
    addWeeksToYmd,
    dayKey,
    dayTotalMinutes,
    flattenFormErrors,
    minutesToTimeInput,
    parseTimeInputToMinutes,
    parseYmdLocal,
} from '@/components/timesheets/timesheet-helpers';
import type {
    TimesheetDraft,
    TimesheetModalState,
    TimesheetWeekCalendarProps,
} from '@/components/timesheets/week-calendar-types';
import { emptyDraft } from '@/components/timesheets/week-calendar-types';
import { timesheets } from '@/routes';
import { destroy, store, update } from '@/routes/timesheets/entries';
import type { TimesheetEntryPayload } from '@/types/timesheets';

type ServerErrors = Record<string, string | string[]>;

function buildEntryPayload(
    draft: TimesheetDraft,
    workedOn: string,
    start: number,
    end: number,
) {
    const trimmedDescription = draft.description.trim();
    const trimmedClient = draft.client.trim();

    return {
        title: draft.title.trim(),
        description: trimmedDescription === '' ? null : trimmedDescription,
        client_name: trimmedClient === '' ? null : trimmedClient,
        worked_on: workedOn,
        start_minutes: start,
        end_minutes: end,
    };
}

export function useTimesheetWeekCalendar({
    weekStart,
    entriesByDay,
    openEntryId = null,
}: TimesheetWeekCalendarProps) {
    const [modal, setModal] = useState<TimesheetModalState | null>(null);
    const [draft, setDraft] = useState<TimesheetDraft>(() => emptyDraft());
    const [formError, setFormError] = useState<string | null>(null);
    const [serverErrors, setServerErrors] = useState<Record<string, string>>(
        {},
    );
    const [submitting, setSubmitting] = useState(false);

    const openedEntryKeyRef = useRef<string | null>(null);

    const weekDays = useMemo(() => {
        const monday = parseYmdLocal(weekStart);

        return WORKDAY_INDICES.map((i) => addDays(monday, i));
    }, [weekStart]);

    const weekRangeLabel = useMemo(() => {
        const from = weekDays[0];
        const to = weekDays[weekDays.length - 1];

        return `${from.toLocaleDateString('nl-BE', { day: 'numeric', month: 'short' })} – ${to.toLocaleDateString(
            'nl-BE',
            {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
            },
        )}`;
    }, [weekDays]);

    const minutesPerDay = useMemo(() => {
        const map: Record<string, number> = {};

        for (const day of weekDays) {
            const key = dayKey(day);
            map[key] = dayTotalMinutes(entriesByDay[key] ?? []);
        }

        return map;
    }, [entriesByDay, weekDays]);

    const clearErrors = useCallback(() => {
        setFormError(null);
        setServerErrors({});
    }, []);

    const closeModal = useCallback(() => {
        setModal(null);
        clearErrors();
        setSubmitting(false);
    }, [clearErrors]);

    useEffect(() => {
        if (modal === null) {
            return;
        }

        function onKeyDown(event: KeyboardEvent): void {
            if (event.key === 'Escape') {
                closeModal();
            }
        }

        window.addEventListener('keydown', onKeyDown);

        return () => window.removeEventListener('keydown', onKeyDown);
    }, [modal, closeModal]);

    const openModalForEntry = useCallback(
        (dayKeyValue: string, entry: TimesheetEntryPayload) => {
            clearErrors();
            setDraft({
                title: entry.title,
                description: entry.description ?? '',
                client: entry.client_name ?? '',
                start: minutesToTimeInput(entry.start_minutes),
                end: minutesToTimeInput(entry.end_minutes),
            });
            setModal({ mode: 'edit', dayKey: dayKeyValue, entry });
        },
        [clearErrors],
    );

    const openModalForSlot = useCallback(
        (dayKeyValue: string, startMin: number, endMin: number) => {
            clearErrors();
            setDraft({
                ...emptyDraft(),
                start: minutesToTimeInput(startMin),
                end: minutesToTimeInput(endMin),
            });
            setModal({ mode: 'create', dayKey: dayKeyValue, startMin, endMin });
        },
        [clearErrors],
    );

    useEffect(() => {
        if (openEntryId === null) {
            openedEntryKeyRef.current = null;

            return;
        }

        const key = `${weekStart}:${openEntryId}`;

        if (openedEntryKeyRef.current === key) {
            return;
        }

        openedEntryKeyRef.current = key;

        let match: { dayKey: string; entry: TimesheetEntryPayload } | null = null;

        for (const day of weekDays) {
            const dk = dayKey(day);
            const entry = (entriesByDay[dk] ?? []).find(
                (e) => e.id === openEntryId,
            );

            if (entry !== undefined) {
                match = { dayKey: dk, entry };
                break;
            }
        }

        queueMicrotask(() => {
            if (match !== null) {
                openModalForEntry(match.dayKey, match.entry);
            }

            const cleanedUrl = timesheets.url({ query: { week: weekStart } });
            window.history.replaceState(
                window.history.state,
                '',
                cleanedUrl,
            );
        });
    }, [openEntryId, weekStart, weekDays, entriesByDay, openModalForEntry]);

    const navigateWeek = useCallback(
        (deltaWeeks: number) => {
            const nextWeek = addWeeksToYmd(weekStart, deltaWeeks);
            router.get(
                timesheets.url({ query: { week: nextWeek } }),
                {},
                { preserveScroll: true },
            );
        },
        [weekStart],
    );

    const setDraftField = useCallback(
        (field: keyof TimesheetDraft, value: string) => {
            setDraft((current) => ({ ...current, [field]: value }));
        },
        [],
    );

    const saveModal = useCallback(() => {
        if (modal === null) {
            return;
        }

        if (draft.title.trim() === '') {
            setFormError('Titel is verplicht.');

            return;
        }

        const startMinutes = parseTimeInputToMinutes(draft.start);
        const endMinutes = parseTimeInputToMinutes(draft.end);

        if (startMinutes === null || endMinutes === null) {
            setFormError('Vul geldige tijden in (uu:mm).');

            return;
        }

        if (endMinutes <= startMinutes) {
            setFormError('Eindtijd moet na de starttijd liggen.');

            return;
        }

        const payload = buildEntryPayload(
            draft,
            modal.dayKey,
            startMinutes,
            endMinutes,
        );

        clearErrors();
        setSubmitting(true);

        const requestOptions = {
            preserveScroll: true,
            onSuccess: closeModal,
            onError: (errors: ServerErrors) => {
                setServerErrors(flattenFormErrors(errors));
            },
            onFinish: () => {
                setSubmitting(false);
            },
        };

        if (modal.mode === 'create') {
            router.post(store.url(), payload, requestOptions);

            return;
        }

        router.patch(
            update.url({ timesheet_entry: modal.entry.id }),
            payload,
            requestOptions,
        );
    }, [modal, draft, clearErrors, closeModal]);

    const deleteEntry = useCallback(() => {
        if (modal === null || modal.mode !== 'edit') {
            return;
        }

        if (!window.confirm('Deze timesheetregistratie verwijderen?')) {
            return;
        }

        setSubmitting(true);
        setServerErrors({});

        router.delete(destroy.url({ timesheet_entry: modal.entry.id }), {
            preserveScroll: true,
            onSuccess: closeModal,
            onError: (errors: ServerErrors) => {
                setServerErrors(flattenFormErrors(errors));
            },
            onFinish: () => {
                setSubmitting(false);
            },
        });
    }, [modal, closeModal]);

    return {
        weekDays,
        weekRangeLabel,
        minutesPerDay,
        navigateWeek,
        modal,
        draft,
        setDraftField,
        formError,
        serverErrors,
        submitting,
        closeModal,
        saveModal,
        deleteEntry,
        openModalForSlot,
        openModalForEntry,
    };
}
