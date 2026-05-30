<?php

namespace App\Http\Controllers;

use App\Events\TimesheetEntryChanged;
use App\Http\Requests\StoreTimesheetEntryRequest;
use App\Http\Requests\UpdateTimesheetEntryRequest;
use App\Models\TimesheetEntry;
use Carbon\CarbonImmutable;
use Illuminate\Http\RedirectResponse;

final class TimesheetEntryController extends CrudController
{
    public function store(StoreTimesheetEntryRequest $request): RedirectResponse
    {
        $entry = $request->user()->timesheetEntries()->create($this->fields($request));

        TimesheetEntryChanged::dispatch($entry->user_id);

        return $this->redirectToWeek($entry->worked_on->toDateString());
    }

    public function update(UpdateTimesheetEntryRequest $request, TimesheetEntry $timesheetEntry): RedirectResponse
    {
        $this->mustOwn($request->user(), $timesheetEntry);

        $timesheetEntry->update($this->fields($request));

        TimesheetEntryChanged::dispatch($timesheetEntry->user_id);

        return $this->redirectToWeek($timesheetEntry->worked_on->toDateString());
    }

    public function destroy(TimesheetEntry $timesheetEntry): RedirectResponse
    {
        $this->mustOwn(request()->user(), $timesheetEntry);

        $workedOn = $timesheetEntry->worked_on->toDateString();
        $userId = $timesheetEntry->user_id;

        $timesheetEntry->delete();

        TimesheetEntryChanged::dispatch($userId);

        return $this->redirectToWeek($workedOn);
    }

    /**
     * @return array<string, mixed>
     */
    private function fields(StoreTimesheetEntryRequest|UpdateTimesheetEntryRequest $request): array
    {
        return $request->safe()->only([
            'title',
            'description',
            'project_id',
            'client_name',
            'worked_on',
            'start_minutes',
            'end_minutes',
        ]);
    }

    private function redirectToWeek(string $workedOnYmd): RedirectResponse
    {
        $week = CarbonImmutable::parse($workedOnYmd)
            ->startOfWeek(CarbonImmutable::MONDAY)
            ->toDateString();

        return redirect()->route('timesheets', ['week' => $week]);
    }
}
