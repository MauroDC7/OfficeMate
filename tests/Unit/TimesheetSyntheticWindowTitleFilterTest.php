<?php

use App\Services\TimesheetSyntheticWindowTitleFilter;

it('excludes synthetic OfficeMate timesheet browser tab titles', function () {
    $filter = app(TimesheetSyntheticWindowTitleFilter::class);

    expect($filter->shouldExclude(
        'Tijdregistratie en statuscontrole · ma 18 mei · 15:45 – 16:00 · Timesheets',
    ))->toBeTrue();
});

it('keeps real desktop window titles', function () {
    $filter = app(TimesheetSyntheticWindowTitleFilter::class);

    expect($filter->shouldExclude('GitHub — Pull requests'))->toBeFalse()
        ->and($filter->shouldExclude('Timesheets - OfficeMate'))->toBeFalse()
        ->and($filter->shouldExclude('services.php — OfficeMate'))->toBeFalse();
});
