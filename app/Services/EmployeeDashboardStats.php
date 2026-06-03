<?php

namespace App\Services;

use App\Enums\LeaveRequestStatus;
use App\Enums\UserRole;
use App\Models\LeaveRequest;
use App\Models\TimesheetEntry;
use App\Models\TimesheetEntryProposal;
use App\Models\User;
use Carbon\CarbonImmutable;

final class EmployeeDashboardStats
{
    public function __construct(
        private readonly OrganizationLeaveOverview $organizationLeaveOverview,
        private readonly TimesheetProjectNormalizer $timesheetProjectNormalizer,
        private readonly ProjectsEmployeeContext $projectsEmployeeContext,
        private readonly TrackerConnectionStatus $trackerConnectionStatus,
    ) {}

    /**
     * @return array{
     *     activeProjects: list<array{id: int, name: string, client_name: string|null}>,
     *     actionCount: int,
     *     pendingTimesheetCount: int,
     *     hoursThisWeekMinutes: int,
     *     openLeaveDays: int,
     *     pendingLeaveRequestCount: int,
     *     weeklyStatus: array{
     *         week_start: string,
     *         difficult_this_week: string|null,
     *         plans_next_week: string|null,
     *         reminder_due: bool,
     *         ai_draft_available: bool,
     *     }|null,
     *     weeklyStatusReminderDue: bool,
     *     weekStart: string,
     *     myLeaveThisWeek: list<array{
     *         id: int,
     *         starts_on: string,
     *         ends_on: string,
     *         type_label: string,
     *         user: array{id: int, name: string}
     *     }>,
     *     teamLeaveToday: list<array{
     *         id: int,
     *         starts_on: string,
     *         ends_on: string,
     *         type_label: string,
     *         user: array{id: int, name: string}
     *     }>,
     *     taskAvailability: string|null,
     *     taskAvailabilityLabel: string|null,
     *     trackerIsConnected: bool,
     *     hasOrganization: bool,
     *     recentNotifications: list<array{id: string, title: string, message: string, created_at: string}>,
     * }
     */
    public function forUser(User $user): array
    {
        $timezone = config('services.timesheets.timezone', 'Europe/Brussels');
        $today = CarbonImmutable::now($timezone)->startOfDay();
        $monday = $today->startOfWeek(CarbonImmutable::MONDAY);
        $weekEnd = $monday->addDays(6);

        $activeProjects = array_map(
            fn (array $project): array => [
                'id' => $project['id'],
                'name' => $project['name'],
                'client_name' => $project['client_name'],
            ],
            $this->timesheetProjectNormalizer->optionsFor($user),
        );

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
            ->whereBetween('worked_on', [$monday->toDateString(), $weekEnd->toDateString()])
            ->count();

        $pendingLeaveRequestCount = LeaveRequest::query()
            ->where('user_id', $user->id)
            ->where('status', LeaveRequestStatus::Pending)
            ->count();

        $openLeaveDays = 0;

        LeaveRequest::query()
            ->where('user_id', $user->id)
            ->where('status', LeaveRequestStatus::Approved)
            ->where('ends_on', '>=', $today->toDateString())
            ->get()
            ->each(function (LeaveRequest $request) use ($today, &$openLeaveDays): void {
                $openLeaveDays += $this->remainingLeaveDays($request, $today);
            });

        $projectsContext = $this->projectsEmployeeContext->forUser($user);
        $weeklyStatus = $projectsContext['weeklyStatus'];
        $weeklyStatusReminderDue = is_array($weeklyStatus) && $weeklyStatus['reminder_due'];

        $actionCount = $pendingTimesheetCount + ($weeklyStatusReminderDue ? 1 : 0);

        $myLeaveThisWeek = $user->organization_id !== null
            ? $this->organizationLeaveOverview->approvedLeaveBetween(
                $user->organization_id,
                $monday,
                $weekEnd,
                excludeUserId: null,
                limit: 3,
                onlyUserIds: [$user->id],
            )
            : [];

        $teamLeaveToday = $user->organization_id !== null
            ? $this->organizationLeaveOverview->approvedLeaveBetween(
                $user->organization_id,
                $today,
                $today,
                $user->id,
                8,
            )
            : [];

        $taskAvailability = $user->organization_id !== null && $user->role !== UserRole::Admin
            ? $projectsContext['taskAvailability']
            : null;

        $matchingAvailabilityOption = $taskAvailability === null
            ? null
            : collect($projectsContext['taskAvailabilityOptions'])
                ->firstWhere('value', $taskAvailability);

        $taskAvailabilityLabel = is_array($matchingAvailabilityOption)
            ? $matchingAvailabilityOption['label']
            : null;

        return [
            'activeProjects' => $activeProjects,
            'actionCount' => $actionCount,
            'pendingTimesheetCount' => $pendingTimesheetCount,
            'hoursThisWeekMinutes' => $hoursThisWeekMinutes,
            'openLeaveDays' => $openLeaveDays,
            'pendingLeaveRequestCount' => $pendingLeaveRequestCount,
            'weeklyStatus' => $weeklyStatus,
            'weeklyStatusReminderDue' => $weeklyStatusReminderDue,
            'weekStart' => $monday->toDateString(),
            'myLeaveThisWeek' => $myLeaveThisWeek,
            'teamLeaveToday' => $teamLeaveToday,
            'taskAvailability' => $taskAvailability,
            'taskAvailabilityLabel' => $taskAvailabilityLabel,
            'trackerIsConnected' => $this->trackerConnectionStatus->forUser($user)['is_connected'],
            'hasOrganization' => $user->organization_id !== null,
            'recentNotifications' => $user->notifications()
                ->latest()
                ->limit(5)
                ->get()
                ->map(fn ($notification): array => [
                    'id' => $notification->id,
                    'title' => $notification->data['title'] ?? 'Melding',
                    'message' => $notification->data['message'] ?? '',
                    'created_at' => $notification->created_at?->toIso8601String() ?? '',
                ])
                ->values()
                ->all(),
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
