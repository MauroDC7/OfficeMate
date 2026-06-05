<?php

namespace App\Contracts\Exports;

use App\Models\Organization;
use App\Services\TimesheetReport\TimesheetReportFilters;
use App\Services\TimesheetReport\TimesheetReportRow;
use Symfony\Component\HttpFoundation\Response;

interface TimesheetReportExporter
{
    public function format(): string;

    public function mimeType(): string;

    public function fileExtension(): string;

    /**
     * @param  list<TimesheetReportRow>  $rows
     */
    public function download(
        Organization $organization,
        TimesheetReportFilters $filters,
        array $rows,
    ): Response;
}
