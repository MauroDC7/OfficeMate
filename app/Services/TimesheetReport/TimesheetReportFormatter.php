<?php

namespace App\Services\TimesheetReport;

final class TimesheetReportFormatter
{
    public static function minutesToTime(int $minutes): string
    {
        $normalized = (($minutes % 1440) + 1440) % 1440;
        $hours = intdiv($normalized, 60);
        $rest = $normalized % 60;

        return sprintf('%02d:%02d', $hours, $rest);
    }

    public static function durationLabel(int $minutes): string
    {
        $hours = intdiv($minutes, 60);
        $rest = $minutes % 60;

        if ($hours === 0) {
            return "{$rest} min";
        }

        if ($rest === 0) {
            return "{$hours} u";
        }

        return "{$hours} u {$rest} min";
    }
}
