<?php

namespace App\Services;

use App\Enums\LeaveRequestStatus;
use App\Enums\TeamMembershipStatus;
use App\Enums\UserRole;
use App\Models\LeaveRequest;
use App\Models\Organization;
use App\Models\OrganizationInvite;
use App\Models\Team;
use App\Models\TeamMembership;
use App\Models\TimesheetEntry;
use App\Models\TimesheetEntryProposal;
use App\Models\User;
use Carbon\CarbonImmutable;

final class AdminDashboardStats
{
    public function __construct(
        private readonly OrganizationPresenceOverview $organizationPresenceOverview,
    ) {}

    private const PENDING_MEMBERSHIPS_PREVIEW = 5;

    private const PENDING_LEAVE_PREVIEW = 5;

    private const CURRENT_LEAVE_PREVIEW = 5;

    private const EMPLOYMENT_SETUP_PREVIEW = 5;

    /**
     * @return array{
     *     organizationName: string,
     *     memberCount: int,
     *     teamCount: int,
     *     pendingMembershipCount: int,
     *     pendingLeaveRequestCount: int,
     *     pendingProposalCount: int,
     *     openInviteCount: int,
     *     hoursThisWeekMinutes: int,
     *     weekStart: string,
     *     pendingMemberships: list<array{
     *         id: int,
     *         team: array{id: int, name: string},
     *         user: array{id: int, name: string, email: string}
     *     }>,
     *     pendingLeaveRequests: list<array{
     *         id: int,
     *         starts_on: string,
     *         ends_on: string,
     *         type_label: string,
     *         user: array{id: int, name: string}
     *     }>,
     *     currentLeave: list<array{
     *         id: int,
     *         starts_on: string,
     *         ends_on: string,
     *         type: string,
     *         type_label: string,
     *         user: array{id: int, name: string}
     *     }>,
     *     employmentSetupCount: int,
     *     employeesNeedingEmploymentSetup: list<array{
     *         id: int,
     *         name: string,
     *         email: string,
     *         joined_at: string
     *     }>,
     *     presenceSummary: array{
     *         in_office: int,
     *         out_of_office: int,
     *         vacation: int,
     *         sick: int,
     *         other_leave: int,
     *     }
     * }
     */
    public function forOrganization(Organization $organization): array
    {
        $timezone = config('services.timesheets.timezone', 'Europe/Brussels');
        $today = CarbonImmutable::now($timezone)->startOfDay();
        $monday = $today->startOfWeek(CarbonImmutable::MONDAY);
        $weekEnd = $monday->addDays(6);

        $memberIds = User::query()
            ->where('organization_id', $organization->id)
            ->pluck('id')
            ->all();

        $teamIds = Team::query()
            ->where('organization_id', $organization->id)
            ->pluck('id')
            ->all();

        $pendingMembershipsQuery = TeamMembership::query()
            ->where('status', TeamMembershipStatus::Pending)
            ->whereIn('team_id', $teamIds);

        $pendingMembershipCount = (clone $pendingMembershipsQuery)->count();

        $pendingMemberships = $pendingMembershipsQuery
            ->with(['team:id,name', 'user:id,first_name,last_name,email'])
            ->orderBy('created_at')
            ->limit(self::PENDING_MEMBERSHIPS_PREVIEW)
            ->get()
            ->map(fn (TeamMembership $membership): array => [
                'id' => $membership->id,
                'team' => [
                    'id' => $membership->team->id,
                    'name' => $membership->team->name,
                ],
                'user' => [
                    'id' => $membership->user->id,
                    'name' => $membership->user->name,
                    'email' => $membership->user->email,
                ],
            ])
            ->all();

        $pendingLeaveQuery = LeaveRequest::query()
            ->whereIn('user_id', $memberIds)
            ->where('status', LeaveRequestStatus::Pending);

        $pendingLeaveRequestCount = $pendingLeaveQuery->count();

        $pendingLeaveRequests = (clone $pendingLeaveQuery)
            ->with('user:id,first_name,last_name')
            ->orderBy('created_at')
            ->limit(self::PENDING_LEAVE_PREVIEW)
            ->get()
            ->map(fn (LeaveRequest $leave): array => [
                'id' => $leave->id,
                'starts_on' => $leave->starts_on->format('Y-m-d'),
                'ends_on' => $leave->ends_on->format('Y-m-d'),
                'type_label' => $leave->type->label(),
                'user' => [
                    'id' => $leave->user->id,
                    'name' => $leave->user->name,
                ],
            ])
            ->all();

        $pendingProposalCount = TimesheetEntryProposal::query()
            ->whereIn('user_id', $memberIds)
            ->count();

        $openInviteCount = OrganizationInvite::query()
            ->where('organization_id', $organization->id)
            ->whereNull('redeemed_at')
            ->where('expires_at', '>', CarbonImmutable::now())
            ->count();

        $hoursThisWeekMinutes = (int) TimesheetEntry::query()
            ->whereIn('user_id', $memberIds)
            ->whereBetween('worked_on', [$monday->toDateString(), $weekEnd->toDateString()])
            ->get(['start_minutes', 'end_minutes'])
            ->sum(fn (TimesheetEntry $entry): int => max(
                0,
                $entry->end_minutes - $entry->start_minutes,
            ));

        $currentLeave = LeaveRequest::query()
            ->whereIn('user_id', $memberIds)
            ->where('status', LeaveRequestStatus::Approved)
            ->where('ends_on', '>=', $today->toDateString())
            ->where('starts_on', '<=', $weekEnd->toDateString())
            ->with('user:id,first_name,last_name')
            ->orderBy('starts_on')
            ->limit(self::CURRENT_LEAVE_PREVIEW)
            ->get()
            ->map(fn (LeaveRequest $leave): array => [
                'id' => $leave->id,
                'starts_on' => $leave->starts_on->format('Y-m-d'),
                'ends_on' => $leave->ends_on->format('Y-m-d'),
                'type' => $leave->type->value,
                'type_label' => $leave->type->label(),
                'user' => [
                    'id' => $leave->user->id,
                    'name' => $leave->user->name,
                ],
            ])
            ->all();

        $employmentSetupQuery = User::query()
            ->where('organization_id', $organization->id)
            ->where('role', UserRole::Employee)
            ->whereNull('employment_setup_completed_at')
            ->whereNotNull('organization_joined_at');

        $employmentSetupCount = (clone $employmentSetupQuery)->count();

        $employeesNeedingEmploymentSetup = $employmentSetupQuery
            ->orderByDesc('organization_joined_at')
            ->limit(self::EMPLOYMENT_SETUP_PREVIEW)
            ->get(['id', 'first_name', 'last_name', 'email', 'organization_joined_at'])
            ->map(fn (User $employee): array => [
                'id' => $employee->id,
                'name' => $employee->name,
                'email' => $employee->email,
                'joined_at' => $employee->organization_joined_at?->toIso8601String() ?? '',
            ])
            ->all();

        $presenceSummary = $this->organizationPresenceOverview
            ->forOrganization($organization)['summary'];

        return [
            'organizationName' => $organization->name,
            'memberCount' => count($memberIds),
            'teamCount' => count($teamIds),
            'pendingMembershipCount' => $pendingMembershipCount,
            'pendingLeaveRequestCount' => $pendingLeaveRequestCount,
            'pendingProposalCount' => $pendingProposalCount,
            'openInviteCount' => $openInviteCount,
            'hoursThisWeekMinutes' => $hoursThisWeekMinutes,
            'weekStart' => $monday->toDateString(),
            'pendingMemberships' => $pendingMemberships,
            'pendingLeaveRequests' => $pendingLeaveRequests,
            'currentLeave' => $currentLeave,
            'employmentSetupCount' => $employmentSetupCount,
            'employeesNeedingEmploymentSetup' => $employeesNeedingEmploymentSetup,
            'presenceSummary' => $presenceSummary,
        ];
    }
}
