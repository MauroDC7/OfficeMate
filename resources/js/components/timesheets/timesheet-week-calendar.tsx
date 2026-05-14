import { TimesheetFormPopup } from '@/components/timesheets/timesheet-form-popup';
import { TimesheetWeekBody } from '@/components/timesheets/timesheet-week-body';
import { TimesheetWeekHeader } from '@/components/timesheets/timesheet-week-header';
import { useTimesheetWeekCalendar } from '@/components/timesheets/use-timesheet-week-calendar';
import type { TimesheetWeekCalendarProps } from '@/components/timesheets/week-calendar-types';

export type { TimesheetWeekCalendarProps } from '@/components/timesheets/week-calendar-types';

export function TimesheetWeekCalendar(props: TimesheetWeekCalendarProps) {
    const c = useTimesheetWeekCalendar(props);

    return (
        <div className="space-y-4">
            <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
                <TimesheetWeekHeader
                    weekRangeLabel={c.weekRangeLabel}
                    onPrevWeek={() => c.navigateWeek(-1)}
                    onThisWeek={c.goToThisWeek}
                    onNextWeek={() => c.navigateWeek(1)}
                    weekDays={c.weekDays}
                    minutesPerDay={c.minutesPerDay}
                    slotHeightIndex={c.slotHeightIndex}
                    onBumpSlotHeight={c.bumpSlotHeight}
                />
                <TimesheetWeekBody
                    weekDays={c.weekDays}
                    entriesByDay={c.entriesByDay}
                    weekHasToday={c.weekHasToday}
                    slotHeightIndex={c.slotHeightIndex}
                    onSlotClick={c.openModalForSlot}
                    onEntryClick={c.openModalForEntry}
                />
            </div>

            {c.modal !== null ? (
                <TimesheetFormPopup
                    modal={c.modal}
                    draft={c.draft}
                    formError={c.formError}
                    serverErrors={c.serverErrors}
                    submitting={c.submitting}
                    onDraftChange={c.setDraftField}
                    onClose={c.closeModal}
                    onSave={c.saveModal}
                    onDelete={c.deleteEntry}
                />
            ) : null}
        </div>
    );
}
