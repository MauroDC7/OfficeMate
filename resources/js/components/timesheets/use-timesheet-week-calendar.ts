import { router, usePage } from '@inertiajs/react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useAlert } from '@/components/alert';
import {
    parseCalendarQueryFromUrl,
    type CalendarView,
} from '@/components/timesheets/calendar-view';
import { fetchTrackerWindowTitles } from '@/components/timesheets/fetch-tracker-window-titles';
import {
    addDaysToYmd,
    addMonthsToMonthYmd,
    addWeeksToYmd,
    calendarDaysForView,
    monthYmdFromYmd,
    dayKey,
    dayTotalMinutes,
    entriesByDayAfterMove,
    flattenFormErrors,
    minutesToTimeInput,
    mondayYmdForYmd,
    parseTimeInputToMinutes,
    parseYmdLocal,
    resolveFocusDayYmd,
} from '@/components/timesheets/timesheet-helpers';
import { TIMESHEET_LIST_PROPS } from '@/components/timesheets/timesheet-list-props';
import type {
    TimesheetDraft,
    TimesheetModalState,
    TimesheetWeekCalendarProps,
} from '@/components/timesheets/week-calendar-types';
import { emptyDraft, rectToPopoverAnchor } from '@/components/timesheets/week-calendar-types';
import { useIsMobileViewport } from '@/lib/use-media-query';
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
        color: draft.color,
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
    monthYmd: string;
    entryId?: number | null;
}): Record<string, string | number> {
    const query: Record<string, string | number> = {
        week: options.weekStart,
        view: options.calendarView,
    };

    if (options.calendarView === 'day') {
        query.day = options.focusDayYmd;
    }

    if (options.calendarView === 'month') {
        query.month = options.monthYmd;
    }

    if (options.entryId != null) {
        query.entry = options.entryId;
    }

    return query;
}

type CalendarViewState = {
    calendarView: CalendarView;
    focusDayYmd: string;
    monthYmd: string;
};

function readViewState(
    weekStart: string,
    monthFromServer: string,
    pageUrl: string,
    isMobileViewport: boolean,
): CalendarViewState {
    const { calendarView, focusDay, month } = parseCalendarQueryFromUrl(pageUrl);

    // Multi-day views aren't readable on phone-sized screens; always show
    // a single day there regardless of what the URL says.
    const resolved: CalendarView = isMobileViewport
        ? 'day'
        : (calendarView ?? 'workweek');

    const focusDayYmd = resolveFocusDayYmd(weekStart, focusDay);

    return {
        calendarView: resolved,
        focusDayYmd,
        monthYmd: month ?? monthFromServer,
    };
}

export function useTimesheetWeekCalendar({
    weekStart,
    month,
    entriesByDay,
    openEntryId = null,
}: TimesheetWeekCalendarProps) {
    const page = usePage<{
        projectOptions: TimesheetProjectOption[];
        prefillProjectId?: number | null;
    }>();
    const { projectOptions = [], prefillProjectId = null } = page.props;

    const defaultProjectId =
        prefillProjectId !== null &&
        projectOptions.some((option) => option.id === prefillProjectId)
            ? String(prefillProjectId)
            : '';
    const pageUrl = page.url;
    const { success, confirm, error: showError } = useAlert();
    const isMobileViewport = useIsMobileViewport();

    const [viewState, setViewState] = useState<CalendarViewState>(() =>
        readViewState(weekStart, month, pageUrl, isMobileViewport),
    );

    const { calendarView, focusDayYmd, monthYmd } = viewState;

    const [optimisticEntriesByDay, setOptimisticEntriesByDay] = useState<Record<
        string,
        TimesheetEntryPayload[]
    > | null>(null);

    const displayedEntriesByDay = optimisticEntriesByDay ?? entriesByDay;

    const [modal, setModal] = useState<TimesheetModalState | null>(null);
    const [draft, setDraft] = useState<TimesheetDraft>(() => ({
        ...emptyDraft(),
        projectId: defaultProjectId,
    }));
    const [formError, setFormError] = useState<string | null>(null);
    const [serverErrors, setServerErrors] = useState<Record<string, string>>(
        {},
    );
    const [submitting, setSubmitting] = useState(false);

    const openedEntryKeyRef = useRef<string | null>(null);

    useEffect(() => {
        const next = readViewState(weekStart, month, pageUrl, isMobileViewport);

        queueMicrotask(() => {
            setViewState(next);
        });
    }, [weekStart, month, pageUrl, isMobileViewport]);

    const visibleDays = useMemo(
        () =>
            calendarDaysForView(
                weekStart,
                calendarView,
                focusDayYmd,
                monthYmd,
            ),
        [weekStart, calendarView, focusDayYmd, monthYmd],
    );

    const rangeLabel = useMemo(() => {
        if (calendarView === 'month') {
            const [year, monthIndex] = monthYmd.split('-').map(Number);

            return new Date(year, monthIndex - 1, 1).toLocaleDateString(
                'nl-BE',
                {
                    month: 'long',
                    year: 'numeric',
                },
            );
        }

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
    }, [calendarView, focusDayYmd, monthYmd, visibleDays]);

    const minutesPerDay = useMemo(() => {
        const map: Record<string, number> = {};

        for (const day of visibleDays) {
            const key = dayKey(day);
            map[key] = dayTotalMinutes(displayedEntriesByDay[key] ?? []);
        }

        return map;
    }, [displayedEntriesByDay, visibleDays]);

    const replaceCalendarInHistory = useCallback(
        (next: CalendarViewState) => {
            const url = timesheets.url({
                query: buildTimesheetsQuery({
                    weekStart,
                    calendarView: next.calendarView,
                    focusDayYmd: next.focusDayYmd,
                    monthYmd: next.monthYmd,
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
            monthYmd: string;
        }) => {
            const scrollY = window.scrollY;

            router.get(
                timesheets.url({
                    query: buildTimesheetsQuery({
                        weekStart: options.weekStart,
                        calendarView: options.calendarView,
                        focusDayYmd: options.focusDayYmd,
                        monthYmd: options.monthYmd,
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
            const nextFocusDayYmd =
                view === 'day'
                    ? resolveFocusDayYmd(weekStart, focusDayYmd)
                    : focusDayYmd;
            const nextMonthYmd = monthYmdFromYmd(nextFocusDayYmd);

            if (view === 'month' || calendarView === 'month') {
                visitWeek({
                    weekStart,
                    calendarView: view,
                    focusDayYmd: nextFocusDayYmd,
                    monthYmd: nextMonthYmd,
                });

                return;
            }

            applyViewState({
                calendarView: view,
                focusDayYmd: nextFocusDayYmd,
                monthYmd: nextMonthYmd,
            });
        },
        [weekStart, focusDayYmd, calendarView, applyViewState, visitWeek],
    );

    const setMonthYmd = useCallback(
        (nextMonthYmd: string) => {
            visitWeek({
                weekStart: mondayYmdForYmd(`${nextMonthYmd}-01`),
                calendarView: 'month',
                focusDayYmd: `${nextMonthYmd}-01`,
                monthYmd: nextMonthYmd,
            });
        },
        [visitWeek],
    );

    const selectDay = useCallback(
        (ymd: string) => {
            const next: CalendarViewState = {
                calendarView: 'day',
                focusDayYmd: ymd,
                monthYmd: monthYmdFromYmd(ymd),
            };

            if (mondayYmdForYmd(ymd) === weekStart) {
                applyViewState(next);

                return;
            }

            visitWeek({
                weekStart: mondayYmdForYmd(ymd),
                ...next,
            });
        },
        [weekStart, applyViewState, visitWeek],
    );

    const navigatePrevious = useCallback(() => {
        if (calendarView === 'month') {
            const previousMonth = addMonthsToMonthYmd(monthYmd, -1);

            visitWeek({
                weekStart: mondayYmdForYmd(`${previousMonth}-01`),
                calendarView: 'month',
                focusDayYmd: `${previousMonth}-01`,
                monthYmd: previousMonth,
            });

            return;
        }

        if (calendarView === 'day') {
            const previousDay = addDaysToYmd(focusDayYmd, -1);
            const previousWeekStart = mondayYmdForYmd(previousDay);
            const next: CalendarViewState = {
                calendarView: 'day',
                focusDayYmd: previousDay,
                monthYmd: monthYmdFromYmd(previousDay),
            };

            if (previousWeekStart === weekStart) {
                applyViewState(next);

                return;
            }

            visitWeek({
                weekStart: previousWeekStart,
                ...next,
            });

            return;
        }

        const previousWeek = addWeeksToYmd(weekStart, -1);

        visitWeek({
            weekStart: previousWeek,
            calendarView,
            focusDayYmd: resolveFocusDayYmd(previousWeek, focusDayYmd),
            monthYmd: monthYmdFromYmd(
                resolveFocusDayYmd(previousWeek, focusDayYmd),
            ),
        });
    }, [
        calendarView,
        focusDayYmd,
        weekStart,
        monthYmd,
        applyViewState,
        visitWeek,
    ]);

    const navigateNext = useCallback(() => {
        if (calendarView === 'month') {
            const nextMonth = addMonthsToMonthYmd(monthYmd, 1);

            visitWeek({
                weekStart: mondayYmdForYmd(`${nextMonth}-01`),
                calendarView: 'month',
                focusDayYmd: `${nextMonth}-01`,
                monthYmd: nextMonth,
            });

            return;
        }

        if (calendarView === 'day') {
            const nextDay = addDaysToYmd(focusDayYmd, 1);
            const nextWeekStart = mondayYmdForYmd(nextDay);
            const next: CalendarViewState = {
                calendarView: 'day',
                focusDayYmd: nextDay,
                monthYmd: monthYmdFromYmd(nextDay),
            };

            if (nextWeekStart === weekStart) {
                applyViewState(next);

                return;
            }

            visitWeek({
                weekStart: nextWeekStart,
                ...next,
            });

            return;
        }

        const nextWeek = addWeeksToYmd(weekStart, 1);

        visitWeek({
            weekStart: nextWeek,
            calendarView,
            focusDayYmd: resolveFocusDayYmd(nextWeek, focusDayYmd),
            monthYmd: monthYmdFromYmd(
                resolveFocusDayYmd(nextWeek, focusDayYmd),
            ),
        });
    }, [calendarView, focusDayYmd, weekStart, monthYmd, applyViewState, visitWeek]);

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
        (
            dayKeyValue: string,
            entry: TimesheetEntryPayload,
            anchorRect?: DOMRectReadOnly,
        ) => {
            clearErrors();
            setDraft({
                title: entry.title,
                description: entry.description ?? '',
                projectId:
                    entry.project_id !== null ? String(entry.project_id) : '',
                color: entry.color,
                start: minutesToTimeInput(entry.start_minutes),
                end: minutesToTimeInput(entry.end_minutes),
            });
            setModal({
                mode: 'edit',
                dayKey: dayKeyValue,
                entry,
                anchor:
                    anchorRect !== undefined
                        ? rectToPopoverAnchor(anchorRect)
                        : undefined,
            });
        },
        [clearErrors],
    );

    const openModalForSlot = useCallback(
        (
            dayKeyValue: string,
            startMin: number,
            endMin: number,
            anchorRect?: DOMRectReadOnly,
        ) => {
            clearErrors();
            setDraft({
                ...emptyDraft(),
                projectId: defaultProjectId,
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
                    anchor:
                        anchorRect !== undefined
                            ? rectToPopoverAnchor(anchorRect)
                            : undefined,
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

        for (const [dk, entries] of Object.entries(displayedEntriesByDay)) {
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
                    monthYmd,
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
        monthYmd,
        displayedEntriesByDay,
        openModalForEntry,
    ]);

    const setDraftField = useCallback(
        (field: keyof TimesheetDraft, value: string) => {
            setDraft((current) => ({ ...current, [field]: value }));
        },
        [],
    );

    const setDraftTimeRange = useCallback((start: string, end: string) => {
        setDraft((current) => ({ ...current, start, end }));
    }, []);

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

    const duplicateEntry = useCallback(() => {
        if (modal === null || modal.mode !== 'edit') {
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

        const duration = endMinutes - startMinutes;
        const duplicateStart = endMinutes;
        const duplicateEnd = duplicateStart + duration;

        if (duplicateEnd > 24 * 60) {
            setFormError(
                'Dupliceren past niet meer op deze dag. Pas de tijd aan of maak handmatig een nieuwe registratie.',
            );

            return;
        }

        const trimmedDescription = draft.description.trim();
        const payload = {
            title: draft.title.trim(),
            description: trimmedDescription === '' ? null : trimmedDescription,
            color: draft.color,
            project_id: draft.projectId === '' ? null : Number(draft.projectId),
            worked_on: modal.dayKey,
            start_minutes: duplicateStart,
            end_minutes: duplicateEnd,
        };

        clearErrors();
        setSubmitting(true);

        router.post(store.url(), payload, {
            preserveScroll: true,
            onSuccess: () => {
                closeModal();
                success('Timesheetregistratie gedupliceerd.');
            },
            onError: (errors: ServerErrors) => {
                setServerErrors(flattenFormErrors(errors));
            },
            onFinish: () => {
                setSubmitting(false);
            },
        });
    }, [modal, draft, clearErrors, closeModal, success]);

    const moveEntry = useCallback(
        (
            entry: TimesheetEntryPayload,
            workedOn: string,
            startMinutes: number,
            endMinutes: number,
        ) => {
            setOptimisticEntriesByDay(
                entriesByDayAfterMove(
                    entriesByDay,
                    entry,
                    workedOn,
                    startMinutes,
                    endMinutes,
                ),
            );

            const payload = {
                title: entry.title,
                description: entry.description,
                color: entry.color,
                project_id: entry.project_id,
                worked_on: workedOn,
                start_minutes: startMinutes,
                end_minutes: endMinutes,
            };

            router.patch(update.url({ timesheet_entry: entry.id }), payload, {
                preserveScroll: true,
                only: [...TIMESHEET_LIST_PROPS],
                onSuccess: () => {
                    setOptimisticEntriesByDay(null);
                    success('Timesheetregistratie bijgewerkt.');
                },
                onError: (errors: ServerErrors) => {
                    setOptimisticEntriesByDay(null);
                    const flat = flattenFormErrors(errors);
                    const message =
                        flat.start_minutes ??
                        flat.end_minutes ??
                        flat.worked_on ??
                        Object.values(flat)[0] ??
                        'Verplaatsen mislukt.';

                    showError(message);
                },
            });
        },
        [entriesByDay, success, showError],
    );

    return {
        calendarView,
        focusDayYmd,
        monthYmd,
        setMonthYmd,
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
        setDraftTimeRange,
        formError,
        serverErrors,
        submitting,
        closeModal,
        saveModal,
        deleteEntry,
        duplicateEntry,
        openModalForSlot,
        openModalForEntry,
        moveEntry,
        displayedEntriesByDay,
        projectOptions,
    };
}
