import { router } from '@inertiajs/react';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { WORKDAY_INDICES } from '@/components/timesheets/timesheet-grid-config';
import {
    addDays,
    addWeeksToYmd,
    dayKey,
    dayTotalMinutes,
    flattenFormErrors,
    isToday,
    minutesToTimeInput,
    parseTimeInputToMinutes,
    parseYmdLocal,
} from '@/components/timesheets/timesheet-helpers';
import type { TimesheetDraft, TimesheetModalState, TimesheetWeekCalendarProps } from '@/components/timesheets/week-calendar-types';
import { emptyDraft } from '@/components/timesheets/week-calendar-types';
import { timesheets } from '@/routes';
import { destroy, store, update } from '@/routes/timesheets/entries';
import type { TimesheetEntryPayload } from '@/types/timesheets';

export function useTimesheetWeekCalendar({ weekStart, entriesByDay }: TimesheetWeekCalendarProps) {
    const [modal, setModal] = useState<TimesheetModalState | null>(null);
    const [draft, setDraft] = useState<TimesheetDraft>(emptyDraft);
    const [formError, setFormError] = useState<string | null>(null);
    const [serverErrors, setServerErrors] = useState<Record<string, string>>({});
    const [submitting, setSubmitting] = useState(false);

    const monday = useMemo(() => parseYmdLocal(weekStart), [weekStart]);
    const weekDays = useMemo(() => WORKDAY_INDICES.map((i) => addDays(monday, i)), [monday]);

    const weekRangeLabel = useMemo(() => {
        const from = weekDays[0];
        const to = weekDays[4];

        return `${from.toLocaleDateString('nl-BE', { day: 'numeric', month: 'short' })} – ${to.toLocaleDateString('nl-BE', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        })}`;
    }, [weekDays]);

    const weekHasToday = useMemo(() => weekDays.some((d) => isToday(d)), [weekDays]);

    const minutesPerDay = useMemo(() => {
        const map: Record<string, number> = {};

        for (const d of weekDays) {
            map[dayKey(d)] = dayTotalMinutes(entriesByDay[dayKey(d)] ?? []);
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

        function onKeyDown(e: KeyboardEvent): void {
            if (e.key === 'Escape') {
                closeModal();
            }
        }

        window.addEventListener('keydown', onKeyDown);

        return () => window.removeEventListener('keydown', onKeyDown);
    }, [modal, closeModal]);

    const navigateWeek = useCallback(
        (deltaWeeks: number) => {
            const next = addWeeksToYmd(weekStart, deltaWeeks);
            router.get(timesheets.url({ query: { week: next } }), {}, { preserveScroll: true });
        },
        [weekStart],
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

    const setDraftField = useCallback((field: keyof TimesheetDraft, value: string) => {
        setDraft((d) => ({ ...d, [field]: value }));
    }, []);

    const saveModal = useCallback(() => {
        if (modal === null) {
            return;
        }

        const title = draft.title.trim();

        if (title === '') {
            setFormError('Titel is verplicht.');

            return;
        }

        const start = parseTimeInputToMinutes(draft.start);
        const end = parseTimeInputToMinutes(draft.end);

        if (start === null || end === null) {
            setFormError('Vul geldige tijden in (uu:mm).');

            return;
        }

        if (end <= start) {
            setFormError('Eindtijd moet na de starttijd liggen.');

            return;
        }

        const dayKeyValue = modal.dayKey;
        const payload = {
            title,
            description: draft.description.trim() === '' ? null : draft.description.trim(),
            client_name: draft.client.trim() === '' ? null : draft.client.trim(),
            worked_on: dayKeyValue,
            start_minutes: start,
            end_minutes: end,
        };

        clearErrors();
        setSubmitting(true);

        const options = {
            preserveScroll: true,
            onSuccess: closeModal,
            onError: (errors: Record<string, string | string[]>) => {
                setServerErrors(flattenFormErrors(errors));
            },
            onFinish: () => {
                setSubmitting(false);
            },
        };

        if (modal.mode === 'create') {
            router.post(store.url(), payload, options);
        } else {
            router.patch(update.url({ timesheet_entry: modal.entry.id }), payload, options);
        }
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
            onError: (errors: Record<string, string | string[]>) => {
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
        weekHasToday,
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
        entriesByDay,
    };
}
