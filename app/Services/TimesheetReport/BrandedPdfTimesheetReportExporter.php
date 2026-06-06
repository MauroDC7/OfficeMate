<?php

namespace App\Services\TimesheetReport;

use App\Contracts\Exports\TimesheetReportExporter;
use App\Models\Organization;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Response;

final class BrandedPdfTimesheetReportExporter implements TimesheetReportExporter
{
    public function __construct(
        private readonly AdminTimesheetReportBuilder $adminTimesheetReportBuilder,
    ) {}

    public function format(): string
    {
        return 'pdf';
    }

    public function mimeType(): string
    {
        return 'application/pdf';
    }

    public function fileExtension(): string
    {
        return 'pdf';
    }

    /**
     * @param  list<TimesheetReportRow>  $rows
     */
    public function download(
        Organization $organization,
        TimesheetReportFilters $filters,
        array $rows,
    ): Response {
        $timezone = config('services.timesheets.timezone', 'Europe/Brussels');

        $filename = sprintf(
            'urent-rapport-%s-%s-tot-%s.pdf',
            Str::slug($organization->name),
            $filters->startsOn,
            $filters->endsOn,
        );

        return Pdf::loadView('exports.timesheet-report', [
            'organizationName' => $organization->name,
            'filters' => $filters,
            'rows' => $rows,
            'summary' => $this->adminTimesheetReportBuilder->summary($rows),
            'generatedAt' => now($timezone)->format('d-m-Y H:i'),
            'logoDataUri' => $this->logoDataUri(),
        ])
            ->setPaper('a4', 'landscape')
            ->download($filename);
    }

    private function logoDataUri(): ?string
    {
        $path = public_path('img/Logo.png');

        if (! is_file($path)) {
            return null;
        }

        $mime = mime_content_type($path);

        if (! is_string($mime) || $mime === '') {
            return null;
        }

        $contents = file_get_contents($path);

        if ($contents === false) {
            return null;
        }

        return 'data:'.$mime.';base64,'.base64_encode($contents);
    }
}
