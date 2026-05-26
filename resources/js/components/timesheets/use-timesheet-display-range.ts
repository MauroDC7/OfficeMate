import { useCallback, useMemo, useState } from 'react';

import {
    buildGridDisplay,
    loadDisplayRangeHours,
    resolveDisplayEndMinutes,
    resolveDisplayStartMinutes,
    saveDisplayRangeHours,
    type TimesheetGridDisplay,
} from '@/components/timesheets/timesheet-grid-display';

export function useTimesheetDisplayRange(): {
    startHour: string;
    endHour: string;
    setStartHour: (value: string) => void;
    setEndHour: (value: string) => void;
    gridDisplay: TimesheetGridDisplay;
} {
    const [startHour, setStartHourState] = useState(
        () => loadDisplayRangeHours().start,
    );
    const [endHour, setEndHourState] = useState(
        () => loadDisplayRangeHours().end,
    );

    const persist = useCallback((start: string, end: string) => {
        saveDisplayRangeHours({ start, end });
    }, []);

    const setStartHour = useCallback(
        (value: string) => {
            setStartHourState(value);
            persist(value, endHour);
        },
        [endHour, persist],
    );

    const setEndHour = useCallback(
        (value: string) => {
            setEndHourState(value);
            persist(startHour, value);
        },
        [persist, startHour],
    );

    const gridDisplay = useMemo(
        () =>
            buildGridDisplay(
                resolveDisplayStartMinutes(startHour),
                resolveDisplayEndMinutes(endHour),
            ),
        [endHour, startHour],
    );

    return {
        startHour,
        endHour,
        setStartHour,
        setEndHour,
        gridDisplay,
    };
}
