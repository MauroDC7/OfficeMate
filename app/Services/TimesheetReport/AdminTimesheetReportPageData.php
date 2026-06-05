<?php

namespace App\Services\TimesheetReport;

use App\Models\Organization;
use App\Models\Project;
use App\Models\Team;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Http\Request;

final class AdminTimesheetReportPageData
{
    public function __construct(
        private readonly AdminTimesheetReportBuilder $adminTimesheetReportBuilder,
    ) {}

    /**
     * @return array{
     *     organizationName: string,
     *     filters: array{
     *         starts_on: string,
     *         ends_on: string,
     *         user_id: int|null,
     *         project_id: int|null,
     *         team_id: int|null,
     *     },
     *     filterOptions: array{
     *         employees: list<array{id: int, name: string}>,
     *         projects: list<array{id: int, name: string}>,
     *         teams: list<array{id: int, name: string}>,
     *     },
     *     summary: array{entry_count: int, total_minutes: int, employee_count: int},
     *     rows: list<array{
     *         id: int,
     *         employee_name: string,
     *         worked_on: string,
     *         time_range: string,
     *         duration_label: string,
     *         title: string,
     *         project_name: string|null,
     *         client_name: string|null,
     *     }>,
     *     exportFormats: list<array{value: string, label: string, available: bool}>,
     * }
     */
    public function forOrganization(Organization $organization, Request $request): array
    {
        $filters = $this->resolveFilters($request);
        $rows = $this->adminTimesheetReportBuilder->rows($organization, $filters);

        return [
            'organizationName' => $organization->name,
            'filters' => [
                'starts_on' => $filters->startsOn,
                'ends_on' => $filters->endsOn,
                'user_id' => $filters->userId,
                'project_id' => $filters->projectId,
                'team_id' => $filters->teamId,
            ],
            'filterOptions' => $this->filterOptions($organization),
            'summary' => $this->adminTimesheetReportBuilder->summary($rows),
            'rows' => array_map(
                fn (TimesheetReportRow $row): array => [
                    'id' => $row->id,
                    'employee_name' => $row->employeeName,
                    'worked_on' => $row->workedOn,
                    'time_range' => "{$row->startTime} – {$row->endTime}",
                    'duration_label' => $row->durationLabel,
                    'title' => $row->title,
                    'project_name' => $row->projectName,
                    'client_name' => $row->clientName,
                ],
                $rows,
            ),
            'exportFormats' => [
                ['value' => 'csv', 'label' => 'CSV', 'available' => true],
                ['value' => 'pdf', 'label' => 'PDF (branded)', 'available' => true],
            ],
        ];
    }

    private function resolveFilters(Request $request): TimesheetReportFilters
    {
        $timezone = config('services.timesheets.timezone', 'Europe/Brussels');
        $monday = CarbonImmutable::now($timezone)->startOfWeek(CarbonImmutable::MONDAY);
        $sunday = $monday->addDays(6);

        $startsOn = $request->query('starts_on');
        $endsOn = $request->query('ends_on');

        if (! is_string($startsOn) || $startsOn === '') {
            $startsOn = $monday->toDateString();
        }

        if (! is_string($endsOn) || $endsOn === '') {
            $endsOn = $sunday->toDateString();
        }

        $userId = $request->query('user_id');
        $projectId = $request->query('project_id');
        $teamId = $request->query('team_id');

        return new TimesheetReportFilters(
            startsOn: $startsOn,
            endsOn: $endsOn,
            userId: is_numeric($userId) ? (int) $userId : null,
            projectId: is_numeric($projectId) ? (int) $projectId : null,
            teamId: is_numeric($teamId) ? (int) $teamId : null,
        );
    }

    /**
     * @return array{
     *     employees: list<array{id: int, name: string}>,
     *     projects: list<array{id: int, name: string}>,
     *     teams: list<array{id: int, name: string}>,
     * }
     */
    private function filterOptions(Organization $organization): array
    {
        $employees = User::query()
            ->where('organization_id', $organization->id)
            ->orderBy('first_name')
            ->orderBy('last_name')
            ->get(['id', 'first_name', 'last_name'])
            ->map(fn (User $user): array => [
                'id' => $user->id,
                'name' => $user->name,
            ])
            ->all();

        $projects = Project::query()
            ->where('organization_id', $organization->id)
            ->orderBy('name')
            ->get(['id', 'name'])
            ->map(fn (Project $project): array => [
                'id' => $project->id,
                'name' => $project->name,
            ])
            ->all();

        $teams = Team::query()
            ->where('organization_id', $organization->id)
            ->orderBy('name')
            ->get(['id', 'name'])
            ->map(fn (Team $team): array => [
                'id' => $team->id,
                'name' => $team->name,
            ])
            ->all();

        return [
            'employees' => $employees,
            'projects' => $projects,
            'teams' => $teams,
        ];
    }
}
