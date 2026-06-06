<?php

namespace App\Services\TimesheetReport;

use App\Contracts\Exports\TimesheetReportExporter;
use InvalidArgumentException;

final class TimesheetReportExporterResolver
{
    public function __construct(
        private readonly CsvTimesheetReportExporter $csvTimesheetReportExporter,
        private readonly BrandedPdfTimesheetReportExporter $brandedPdfTimesheetReportExporter,
    ) {}

    public function resolve(string $format): TimesheetReportExporter
    {
        return match ($format) {
            'csv' => $this->csvTimesheetReportExporter,
            'pdf' => $this->brandedPdfTimesheetReportExporter,
            default => throw new InvalidArgumentException("Exportformaat '{$format}' wordt nog niet ondersteund."),
        };
    }
}
