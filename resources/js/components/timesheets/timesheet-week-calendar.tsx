import { TimesheetFormPopup } from '@/components/timesheets/timesheet-form-popup';
import { TimesheetWeekBody } from '@/components/timesheets/timesheet-week-body';
import { TimesheetWeekHeader } from '@/components/timesheets/timesheet-week-header';
import { useTimesheetDisplayRange } from '@/components/timesheets/use-timesheet-display-range';
import { useTimesheetWeekCalendar } from '@/components/timesheets/use-timesheet-week-calendar';
import type { TimesheetWeekCalendarProps } from '@/components/timesheets/week-calendar-types';

export type { TimesheetWeekCalendarProps } from '@/components/timesheets/week-calendar-types';

export function TimesheetWeekCalendar(props: TimesheetWeekCalendarProps) {
    const calendar = useTimesheetWeekCalendar(props);
    const displayRange = useTimesheetDisplayRange();

    return (
        <div className="space-y-4">
            <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
                <TimesheetWeekHeader
                    rangeLabel={calendar.rangeLabel}
                    calendarView={calendar.calendarView}
                    focusDayYmd={calendar.focusDayYmd}
                    startHour={displayRange.startHour}
                    endHour={displayRange.endHour}
                    onStartHourChange={displayRange.setStartHour}
                    onEndHourChange={displayRange.setEndHour}
                    onPrev={calendar.navigatePrevious}
                    onNext={calendar.navigateNext}
                    onViewChange={calendar.setCalendarView}
                    onDaySelect={calendar.selectDay}
                    visibleDays={calendar.visibleDays}
                    minutesPerDay={calendar.minutesPerDay}
                />
                <TimesheetWeekBody
                    visibleDays={calendar.visibleDays}
                    entriesByDay={calendar.displayedEntriesByDay}
                    gridDisplay={displayRange.gridDisplay}
                    onSlotClick={calendar.openModalForSlot}
                    onEntryClick={calendar.openModalForEntry}
                    onEntryMove={calendar.moveEntry}
                />
            </div>

            {calendar.modal !== null ? (
                <TimesheetFormPopup
                    modal={calendar.modal}
                    draft={calendar.draft}
                    projectOptions={calendar.projectOptions}
                    trackerWindowTitles={
                        calendar.modal.mode === 'edit'
                            ? calendar.modal.entry.tracker_window_titles
                            : calendar.modal.trackerWindowTitles
                    }
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
