<?php

namespace App\Services;

use App\Enums\LeaveRequestStatus;
use App\Models\LeaveRequest;
use App\Models\Project;
use App\Models\TimesheetEntry;
use App\Models\TimesheetEntryProposal;
use App\Models\User;
use Carbon\CarbonImmutable;

final class EmployeeDashboardStats
{
    private const TEAM_LEAVE_PREVIEW = 8;

    public function __construct(
        private readonly OrganizationLeaveOverview $organizationLeaveOverview,
    ) {}

    /**
     * @return array{
     *     activeProjects: list<array{id: int, name: string, client_name: string|null}>,
     *     pendingTimesheetCount: int,
     *     hoursThisWeekMinutes: int,
     *     openLeaveDays: int,
     *     pendingLeaveRequestCount: int,
     *     weekStart: string,
     *     teamLeaveThisWeek: list<array{
     *         id: int,
     *         starts_on: string,
     *         ends_on: string,
     *         type_label: string,
     *         user: array{id: int, name: string}
     *     }>,
     *     hasOrganization: bool,
     *     recentNotifications: list<array{id: string, title: string, message: string, created_at: string}>
     * }
     */
    public function forUser(User $user): array
    {
        $timezone = config('services.timesheets.timezone', 'Europe/Brussels');
        $today = CarbonImmutable::now($timezone)->startOfDay();
        $monday = $today->startOfWeek(CarbonImmutable::MONDAY);
        $weekEnd = $monday->addDays(6);

        $activeProjects = Project::query()
            ->active()
            ->orderBy('name')
            ->get(['id', 'name', 'client_name'])
            ->map(fn (Project $project): array => [
                'id' => $project->id,
                'name' => $project->name,
                'client_name' => $project->client_name,
            ])
            ->values()
            ->all();

        $hoursThisWeekMinutes = (int) TimesheetEntry::query()
            ->where('user_id', $user->id)
            ->whereBetween('worked_on', [$monday->toDateString(), $weekEnd->toDateString()])
            ->get(['start_minutes', 'end_minutes'])
            ->sum(fn (TimesheetEntry $entry): int => max(
                0,
                $entry->end_minutes - $entry->start_minutes,
            ));

        $pendingTimesheetCount = TimesheetEntryProposal::query()
            ->where('user_id', $user->id)
            ->count();

        $pendingLeaveRequestCount = LeaveRequest::query()
            ->where('user_id', $user->id)
            ->where('status', LeaveRequestStatus::Pending)
            ->count();

        $openLeaveDays = (int) LeaveRequest::query()
            ->where('user_id', $user->id)
            ->where('status', LeaveRequestStatus::Approved)
            ->where('ends_on', '>=', $today->toDateString())
            ->get()
            ->sum(fn (LeaveRequest $request): int => $this->remainingLeaveDays($request, $today));

        $teamLeaveThisWeek = $user->organization_id !== null
            ? $this->organizationLeaveOverview->approvedLeaveBetween(
                $user->organization_id,
                $monday,
                $weekEnd,
                $user->id,
                self::TEAM_LEAVE_PREVIEW,
            )
            : [];

        return [
            'activeProjects' => $activeProjects,
            'pendingTimesheetCount' => $pendingTimesheetCount,
            'hoursThisWeekMinutes' => $hoursThisWeekMinutes,
            'openLeaveDays' => $openLeaveDays,
            'pendingLeaveRequestCount' => $pendingLeaveRequestCount,
            'weekStart' => $monday->toDateString(),
            'teamLeaveThisWeek' => $teamLeaveThisWeek,
            'hasOrganization' => $user->organization_id !== null,
            'recentNotifications' => [],
        ];
    }

    private function remainingLeaveDays(LeaveRequest $request, CarbonImmutable $today): int
    {
        $start = CarbonImmutable::parse($request->starts_on->format('Y-m-d'));
        $end = CarbonImmutable::parse($request->ends_on->format('Y-m-d'));

        if ($end->lessThan($today)) {
            return 0;
        }

        $effectiveStart = $start->greaterThan($today) ? $start : $today;

        return max(1, $effectiveStart->diffInDays($end) + 1);
    }
}
