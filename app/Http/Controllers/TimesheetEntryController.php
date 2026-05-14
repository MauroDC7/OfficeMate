<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreTimesheetEntryRequest;
use App\Http\Requests\UpdateTimesheetEntryRequest;
use App\Models\TimesheetEntry;
use Carbon\CarbonImmutable;
use Illuminate\Http\RedirectResponse;

final class TimesheetEntryController extends CrudController
{
    public function store(StoreTimesheetEntryRequest $request): RedirectResponse
    {
        $data = $request->safe()->only([
            'title',
            'description',
            'client_name',
            'worked_on',
            'start_minutes',
            'end_minutes',
        ]);

        $request->user()->timesheetEntries()->create($data);

        $workedOn = CarbonImmutable::parse((string) $data['worked_on']);

        return redirect()->route('timesheets', [
            'week' => $workedOn->startOfWeek(CarbonImmutable::MONDAY)->toDateString(),
        ]);
    }

    public function update(UpdateTimesheetEntryRequest $request, TimesheetEntry $timesheetEntry): RedirectResponse
    {
        $this->mustOwn($request->user(), $timesheetEntry);

        $data = $request->safe()->only([
            'title',
            'description',
            'client_name',
            'worked_on',
            'start_minutes',
            'end_minutes',
        ]);

        $timesheetEntry->update($data);

        $workedOn = CarbonImmutable::parse((string) $data['worked_on']);

        return redirect()->route('timesheets', [
            'week' => $workedOn->startOfWeek(CarbonImmutable::MONDAY)->toDateString(),
        ]);
    }

    public function destroy(TimesheetEntry $timesheetEntry): RedirectResponse
    {
        $this->mustOwn(request()->user(), $timesheetEntry);

        $weekMonday = CarbonImmutable::parse($timesheetEntry->worked_on->toDateString())
            ->startOfWeek(CarbonImmutable::MONDAY)
            ->toDateString();

        $timesheetEntry->delete();

        return redirect()->route('timesheets', [
            'week' => $weekMonday,
        ]);
    }
}
