<?php

namespace App\Services\TimesheetReport;

use App\Contracts\Exports\TimesheetReportExporter;
use App\Models\Organization;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\StreamedResponse;

final class CsvTimesheetReportExporter implements TimesheetReportExporter
{
    public function format(): string
    {
        return 'csv';
    }

    public function mimeType(): string
    {
        return 'text/csv; charset=UTF-8';
    }

    public function fileExtension(): string
    {
        return 'csv';
    }

    /**
     * @param  list<TimesheetReportRow>  $rows
     */
    public function download(
        Organization $organization,
        TimesheetReportFilters $filters,
        array $rows,
    ): StreamedResponse {
        $filename = sprintf(
            'urent-rapport-%s-%s-tot-%s.csv',
            Str::slug($organization->name),
            $filters->startsOn,
            $filters->endsOn,
        );

        return response()->streamDownload(function () use ($rows): void {
            $handle = fopen('php://output', 'w');

            if ($handle === false) {
                return;
            }

            fwrite($handle, "\xEF\xBB\xBF");

            fputcsv($handle, [
                'Medewerker',
                'E-mail',
                'Datum',
                'Start',
                'Einde',
                'Duur (min)',
                'Duur',
                'Titel',
                'Omschrijving',
                'Project',
                'Klant',
            ], ';');

            foreach ($rows as $row) {
                fputcsv($handle, [
                    $row->employeeName,
                    $row->employeeEmail,
                    $row->workedOn,
                    $row->startTime,
                    $row->endTime,
                    $row->durationMinutes,
                    $row->durationLabel,
                    $row->title,
                    $row->description ?? '',
                    $row->projectName ?? '',
                    $row->clientName ?? '',
                ], ';');
            }

            fclose($handle);
        }, $filename, [
            'Content-Type' => $this->mimeType(),
        ]);
    }
}
