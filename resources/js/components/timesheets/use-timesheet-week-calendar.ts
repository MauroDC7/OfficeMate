import { router, usePage } from '@inertiajs/react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
    type CalendarView,
    parseCalendarQueryFromUrl,
} from '@/components/timesheets/calendar-view';
import { useIsMobileViewport } from '@/lib/use-media-query';
import {
    addDaysToYmd,
    addWeeksToYmd,
    calendarDaysForView,
    dayKey,
    dayTotalMinutes,
    flattenFormErrors,
    minutesToTimeInput,
    mondayYmdForYmd,
    parseTimeInputToMinutes,
    parseYmdLocal,
    resolveFocusDayYmd,
} from '@/components/timesheets/timesheet-helpers';
import type {
    TimesheetDraft,
    TimesheetModalState,
    TimesheetWeekCalendarProps,
} from '@/components/timesheets/week-calendar-types';
import { emptyDraft } from '@/components/timesheets/week-calendar-types';
import { fetchTrackerWindowTitles } from '@/components/timesheets/fetch-tracker-window-titles';
import { useAlert } from '@/components/alert';
import { timesheets } from '@/routes';
import { destroy, store, update } from '@/routes/timesheets/entries';
import type {
    TimesheetEntryPayload,
    TimesheetProjectOption,
} from '@/types/timesheets';

type ServerErrors = Record<string, string | string[]>;

function buildEntryPayload(
    draft: TimesheetDraft,
    workedOn: string,
    start: number,
    end: number,
) {
    const trimmedDescription = draft.description.trim();

    return {
        title: draft.title.trim(),
        description: trimmedDescription === '' ? null : trimmedDescription,
        project_id: draft.projectId === '' ? null : Number(draft.projectId),
        worked_on: workedOn,
        start_minutes: start,
        end_minutes: end,
    };
}

function buildTimesheetsQuery(options: {
    weekStart: string;
    calendarView: CalendarView;
    focusDayYmd: string;
    entryId?: number | null;
}): Record<string, string | number> {
    const query: Record<string, string | number> = {
        week: options.weekStart,
        view: options.calendarView,
    };

    if (options.calendarView === 'day') {
        query.day = options.focusDayYmd;
    }

    if (options.entryId != null) {
        query.entry = options.entryId;
    }

    return query;
}

type CalendarViewState = {
    calendarView: CalendarView;
    focusDayYmd: string;
};

function readViewState(
    weekStart: string,
    pageUrl: string,
    isMobileViewport: boolean,
): CalendarViewState {
    const { calendarView, focusDay } = parseCalendarQueryFromUrl(pageUrl);

    // Multi-day views aren't readable on phone-sized screens; always show
    // a single day there regardless of what the URL says.
    const resolved: CalendarView = isMobileViewport
        ? 'day'
        : (calendarView ?? 'workweek');

    return {
        calendarView: resolved,
        focusDayYmd: resolveFocusDayYmd(weekStart, focusDay),
    };
}

export function useTimesheetWeekCalendar({
    weekStart,
    entriesByDay,
    openEntryId = null,
}: TimesheetWeekCalendarProps) {
    const page = usePage<{ projectOptions: TimesheetProjectOption[] }>();
    const { projectOptions = [] } = page.props;
    const pageUrl = page.url;
    const { success, confirm } = useAlert();
    const isMobileViewport = useIsMobileViewport();

    const [viewState, setViewState] = useState<CalendarViewState>(() =>
        readViewState(weekStart, pageUrl, isMobileViewport),
    );

    const { calendarView, focusDayYmd } = viewState;

    const [modal, setModal] = useState<TimesheetModalState | null>(null);
    const [draft, setDraft] = useState<TimesheetDraft>(() => emptyDraft());
    const [formError, setFormError] = useState<string | null>(null);
    const [serverErrors, setServerErrors] = useState<Record<string, string>>(
        {},
    );
    const [submitting, setSubmitting] = useState(false);

    const openedEntryKeyRef = useRef<string | null>(null);

    useEffect(() => {
        setViewState(readViewState(weekStart, pageUrl, isMobileViewport));
    }, [weekStart, pageUrl, isMobileViewport]);

    const visibleDays = useMemo(
        () => calendarDaysForView(weekStart, calendarView, focusDayYmd),
        [weekStart, calendarView, focusDayYmd],
    );

    const rangeLabel = useMemo(() => {
        if (calendarView === 'day') {
            const day = parseYmdLocal(focusDayYmd);

            return day.toLocaleDateString('nl-BE', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric',
            });
        }

        const from = visibleDays[0];
        const to = visibleDays[visibleDays.length - 1];

        return `${from.toLocaleDateString('nl-BE', { day: 'numeric', month: 'short' })} – ${to.toLocaleDateString(
            'nl-BE',
            {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
            },
        )}`;
    }, [calendarView, focusDayYmd, visibleDays]);

    const minutesPerDay = useMemo(() => {
        const map: Record<string, number> = {};

        for (const day of visibleDays) {
            const key = dayKey(day);
            map[key] = dayTotalMinutes(entriesByDay[key] ?? []);
        }

        return map;
    }, [entriesByDay, visibleDays]);

    const replaceCalendarInHistory = useCallback(
        (next: CalendarViewState) => {
            const url = timesheets.url({
                query: buildTimesheetsQuery({
                    weekStart,
                    calendarView: next.calendarView,
                    focusDayYmd: next.focusDayYmd,
                }),
            });

            window.history.replaceState(window.history.state, '', url);
        },
        [weekStart],
    );

    const applyViewState = useCallback(
        (next: CalendarViewState) => {
            setViewState(next);
            replaceCalendarInHistory(next);
        },
        [replaceCalendarInHistory],
    );

    const visitWeek = useCallback(
        (options: {
            weekStart: string;
            calendarView: CalendarView;
            focusDayYmd: string;
        }) => {
            const scrollY = window.scrollY;

            router.get(
                timesheets.url({
                    query: buildTimesheetsQuery({
                        weekStart: options.weekStart,
                        calendarView: options.calendarView,
                        focusDayYmd: options.focusDayYmd,
                    }),
                }),
                {},
                {
                    preserveScroll: true,
                    onFinish: () => {
                        window.scrollTo(0, scrollY);
                    },
                },
            );
        },
        [],
    );

    const setCalendarView = useCallback(
        (view: CalendarView) => {
            applyViewState({
                calendarView: view,
                focusDayYmd:
                    view === 'day'
                        ? resolveFocusDayYmd(weekStart, focusDayYmd)
                        : focusDayYmd,
            });
        },
        [weekStart, focusDayYmd, applyViewState],
    );

    const selectDay = useCallback(
        (ymd: string) => {
            const next: CalendarViewState = {
                calendarView: 'day',
                focusDayYmd: ymd,
            };

            if (mondayYmdForYmd(ymd) === weekStart) {
                applyViewState(next);

                return;
            }

            visitWeek({ weekStart: mondayYmdForYmd(ymd), ...next });
        },
        [weekStart, applyViewState, visitWeek],
    );

    const navigatePrevious = useCallback(() => {
        if (calendarView === 'day') {
            const previousDay = addDaysToYmd(focusDayYmd, -1);
            const previousWeekStart = mondayYmdForYmd(previousDay);
            const next: CalendarViewState = {
                calendarView: 'day',
                focusDayYmd: previousDay,
            };

            if (previousWeekStart === weekStart) {
                applyViewState(next);

                return;
            }

            visitWeek({ weekStart: previousWeekStart, ...next });

            return;
        }

        const previousWeek = addWeeksToYmd(weekStart, -1);

        visitWeek({
            weekStart: previousWeek,
            calendarView,
            focusDayYmd: resolveFocusDayYmd(previousWeek, focusDayYmd),
        });
    }, [
        calendarView,
        focusDayYmd,
        weekStart,
        applyViewState,
        visitWeek,
    ]);

    const navigateNext = useCallback(() => {
        if (calendarView === 'day') {
            const nextDay = addDaysToYmd(focusDayYmd, 1);
            const nextWeekStart = mondayYmdForYmd(nextDay);
            const next: CalendarViewState = {
                calendarView: 'day',
                focusDayYmd: nextDay,
            };

            if (nextWeekStart === weekStart) {
                applyViewState(next);

                return;
            }

            visitWeek({ weekStart: nextWeekStart, ...next });

            return;
        }

        const nextWeek = addWeeksToYmd(weekStart, 1);

        visitWeek({
            weekStart: nextWeek,
            calendarView,
            focusDayYmd: resolveFocusDayYmd(nextWeek, focusDayYmd),
        });
    }, [calendarView, focusDayYmd, weekStart, applyViewState, visitWeek]);

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
                projectId:
                    entry.project_id !== null ? String(entry.project_id) : '',
                start: minutesToTimeInput(entry.start_minutes),
                end: minutesToTimeInput(entry.end_minutes),
            });
            setModal({
                mode: 'edit',
                dayKey: dayKeyValue,
                entry,
            });
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

            void fetchTrackerWindowTitles(
                dayKeyValue,
                startMin,
                endMin,
            ).then((trackerWindowTitles) => {
                setModal({
                    mode: 'create',
                    dayKey: dayKeyValue,
                    startMin,
                    endMin,
                    trackerWindowTitles,
                });
            });
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

        for (const [dk, entries] of Object.entries(entriesByDay)) {
            const entry = entries.find((e) => e.id === openEntryId);

            if (entry !== undefined) {
                match = { dayKey: dk, entry };
                break;
            }
        }

        queueMicrotask(() => {
            if (match !== null) {
                openModalForEntry(match.dayKey, match.entry);
            }

            const cleanedUrl = timesheets.url({
                query: buildTimesheetsQuery({
                    weekStart,
                    calendarView,
                    focusDayYmd,
                }),
            });
            window.history.replaceState(
                window.history.state,
                '',
                cleanedUrl,
            );
        });
    }, [
        openEntryId,
        weekStart,
        calendarView,
        focusDayYmd,
        entriesByDay,
        openModalForEntry,
    ]);

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

        const isCreate = modal.mode === 'create';

        const requestOptions = {
            preserveScroll: true,
            onSuccess: () => {
                closeModal();
                success(
                    isCreate
                        ? 'Timesheetregistratie toegevoegd.'
                        : 'Timesheetregistratie bijgewerkt.',
                );
            },
            onError: (errors: ServerErrors) => {
                setServerErrors(flattenFormErrors(errors));
            },
            onFinish: () => {
                setSubmitting(false);
            },
        };

        if (isCreate) {
            router.post(store.url(), payload, requestOptions);

            return;
        }

        router.patch(
            update.url({ timesheet_entry: modal.entry.id }),
            payload,
            requestOptions,
        );
    }, [modal, draft, clearErrors, closeModal, success]);

    const deleteEntry = useCallback(async () => {
        if (modal === null || modal.mode !== 'edit') {
            return;
        }

        const accepted = await confirm({
            message: 'Deze timesheetregistratie verwijderen?',
            confirmLabel: 'Verwijderen',
            variant: 'danger',
        });

        if (!accepted) {
            return;
        }

        setSubmitting(true);
        setServerErrors({});

        router.delete(destroy.url({ timesheet_entry: modal.entry.id }), {
            preserveScroll: true,
            onSuccess: () => {
                closeModal();
                success('Timesheetregistratie verwijderd.');
            },
            onError: (errors: ServerErrors) => {
                setServerErrors(flattenFormErrors(errors));
            },
            onFinish: () => {
                setSubmitting(false);
            },
        });
    }, [modal, closeModal, success, confirm]);

    return {
        calendarView,
        focusDayYmd,
        visibleDays,
        rangeLabel,
        minutesPerDay,
        navigatePrevious,
        navigateNext,
        setCalendarView,
        selectDay,
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
        projectOptions,
    };
}
