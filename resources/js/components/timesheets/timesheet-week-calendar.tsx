import { TimesheetFormPopup } from '@/components/timesheets/timesheet-form-popup';
import { TimesheetWeekBody } from '@/components/timesheets/timesheet-week-body';
import { TimesheetWeekHeader } from '@/components/timesheets/timesheet-week-header';
import { useTimesheetWeekCalendar } from '@/components/timesheets/use-timesheet-week-calendar';
import type { TimesheetWeekCalendarProps } from '@/components/timesheets/week-calendar-types';

export type { TimesheetWeekCalendarProps } from '@/components/timesheets/week-calendar-types';

export function TimesheetWeekCalendar(props: TimesheetWeekCalendarProps) {
    const calendar = useTimesheetWeekCalendar(props);

    return (
        <div className="space-y-4">
            <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
                <TimesheetWeekHeader
                    weekRangeLabel={calendar.weekRangeLabel}
                    onPrevWeek={() => calendar.navigateWeek(-1)}
                    onNextWeek={() => calendar.navigateWeek(1)}
                    weekDays={calendar.weekDays}
                    minutesPerDay={calendar.minutesPerDay}
                />
                <TimesheetWeekBody
                    weekDays={calendar.weekDays}
                    entriesByDay={props.entriesByDay}
                    onSlotClick={calendar.openModalForSlot}
                    onEntryClick={calendar.openModalForEntry}
                />
            </div>

            {calendar.modal !== null ? (
                <TimesheetFormPopup
                    modal={calendar.modal}
                    draft={calendar.draft}
                    formError={calendar.formError}
                    serverErrors={calendar.serverErrors}
                    submitting={calendar.submitting}
                    onDraftChange={calendar.setDraftField}
                    onClose={calendar.closeModal}
                    onSave={calendar.saveModal}
                    onDelete={calendar.deleteEntry}
                />
            ) : null}
        </div>
    );
}
