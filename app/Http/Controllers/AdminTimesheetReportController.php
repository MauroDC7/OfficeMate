<?php

namespace App\Http\Controllers;

use App\Enums\UserRole;
use App\Http\Requests\AdminTimesheetReportRequest;
use App\Models\User;
use App\Services\OrganizationContext;
use App\Services\TimesheetReport\AdminTimesheetReportBuilder;
use App\Services\TimesheetReport\AdminTimesheetReportPageData;
use App\Services\TimesheetReport\TimesheetReportExporterResolver;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use InvalidArgumentException;
use Symfony\Component\HttpFoundation\StreamedResponse;

final class AdminTimesheetReportController extends Controller
{
    public function __construct(
        private readonly OrganizationContext $organizationContext,
        private readonly AdminTimesheetReportPageData $adminTimesheetReportPageData,
        private readonly AdminTimesheetReportBuilder $adminTimesheetReportBuilder,
        private readonly TimesheetReportExporterResolver $timesheetReportExporterResolver,
    ) {}

    public function index(Request $request): Response
    {
        $user = $request->user();
        abort_unless($user instanceof User && $user->role === UserRole::Admin, 403);

        $organization = $this->organizationContext->forUserOrFail($user);

        return Inertia::render(
            'admin/timesheetReport',
            $this->adminTimesheetReportPageData->forOrganization($organization, $request),
        );
    }

    public function export(AdminTimesheetReportRequest $request): StreamedResponse
    {
        $user = $request->user();
        abort_unless($user instanceof User && $user->role === UserRole::Admin, 403);

        $organization = $this->organizationContext->forUserOrFail($user);
        $filters = $request->filters();

        try {
            $exporter = $this->timesheetReportExporterResolver->resolve($request->exportFormat());
        } catch (InvalidArgumentException $exception) {
            throw ValidationException::withMessages([
                'format' => $exception->getMessage(),
            ]);
        }

        $rows = $this->adminTimesheetReportBuilder->rows($organization, $filters);

        return $exporter->download($organization, $filters, $rows);
    }
}
