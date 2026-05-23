<?php

namespace App\Services;

/**
 * Filters desktop-tracker titles that are TimeTraq browser tab labels
 * (entry title + day + time range + "Timesheets"), not real window titles.
 */
final class TimesheetSyntheticWindowTitleFilter
{
    public function shouldExclude(string $title): bool
    {
        $title = trim($title);

        if ($title === '' || ! str_ends_with($title, ' · Timesheets')) {
            return false;
        }

        return preg_match('/ · \d{1,2}:\d{2} – \d{1,2}:\d{2} · Timesheets$/u', $title) === 1;
    }
}
