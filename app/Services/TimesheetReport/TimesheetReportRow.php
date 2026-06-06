<?php

namespace App\Services\TimesheetReport;

final readonly class TimesheetReportRow
{
    public function __construct(
        public int $id,
        public int $userId,
        public string $employeeName,
        public string $employeeEmail,
        public string $workedOn,
        public string $startTime,
        public string $endTime,
        public int $durationMinutes,
        public string $durationLabel,
        public string $title,
        public ?string $description,
        public ?string $projectName,
        public ?string $clientName,
    ) {}
}
