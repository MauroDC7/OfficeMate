<?php

namespace App\Services\TimesheetReport;

use App\Contracts\Exports\TimesheetReportExporter;
use InvalidArgumentException;

final class TimesheetReportExporterResolver
{
    public function __construct(
        private readonly CsvTimesheetReportExporter $csvTimesheetReportExporter,
    ) {}

    public function resolve(string $format): TimesheetReportExporter
    {
        return match ($format) {
            'csv' => $this->csvTimesheetReportExporter,
            default => throw new InvalidArgumentException("Exportformaat '{$format}' wordt nog niet ondersteund."),
        };
    }
}
