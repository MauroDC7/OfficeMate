<?php

namespace App\Services;

use App\Enums\EmployeePresenceStatus;
use App\Enums\LeaveRequestStatus;
use App\Enums\LeaveType;
use App\Enums\TaskAvailability;
use App\Enums\TeamMembershipStatus;
use App\Enums\UserRole;
use App\Models\LeaveRequest;
use App\Models\Organization;
use App\Models\Team;
use App\Models\TeamMembership;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Support\Collection;

final class OrganizationPresenceOverview
{
    public function __construct(
        private readonly OfficePresenceResolver $officePresenceResolver,
    ) {}

    /**
     * @return array{
     *     summary: array{
     *         in_office: int,
     *         out_of_office: int,
     *         vacation: int,
     *         sick: int,
     *         other_leave: int,
     *     },
     *     employees: list<array{
     *         id: int,
     *         name: string,
     *         email: string,
     *         first_name: string,
     *         last_name: string,
     *         avatar: string|null,
     *         teams: list<string>,
     *         status: string,
     *         status_label: string,
     *         leave_ends_on: string|null,
     *         role: string,
     *         task_availability: string,
     *         task_availability_label: string,
     *     }>
     * }
     */
    public function forOrganization(Organization $organization, ?CarbonImmutable $today = null): array
    {
        $timezone = config('services.timesheets.timezone', 'Europe/Brussels');
        $today ??= CarbonImmutable::now($timezone)->startOfDay();
        $todayString = $today->toDateString();

        $employees = User::query()
            ->where('organization_id', $organization->id)
            ->orderBy('first_name')
            ->orderBy('last_name')
            ->get(['id', 'first_name', 'last_name', 'email', 'avatar_path', 'last_seen_at_office', 'role', 'task_availability']);

        if ($employees->isEmpty()) {
            return [
                'summary' => $this->emptySummary(),
                'employees' => [],
            ];
        }

        $memberIds = $employees->pluck('id')->all();

        /** @var Collection<int, LeaveRequest> $leaveByUserId */
        $leaveByUserId = LeaveRequest::query()
            ->whereIn('user_id', $memberIds)
            ->where('status', LeaveRequestStatus::Approved)
            ->where('starts_on', '<=', $todayString)
            ->where('ends_on', '>=', $todayString)
            ->get()
            ->groupBy('user_id')
            ->map(fn (Collection $leaves): LeaveRequest => $this->pickLeave($leaves));

        $teamIds = Team::query()
            ->where('organization_id', $organization->id)
            ->pluck('id');

        /** @var Collection<int, list<string>> $teamsByUserId */
        $teamsByUserId = TeamMembership::query()
            ->whereIn('team_id', $teamIds)
            ->where('status', TeamMembershipStatus::Approved)
            ->whereIn('user_id', $memberIds)
            ->with('team:id,name')
            ->get()
            ->groupBy('user_id')
            ->map(
                fn (Collection $memberships): array => $memberships
                    ->map(fn (TeamMembership $membership): string => $membership->team->name)
                    ->sort()
                    ->values()
                    ->all(),
            );

        $summary = $this->emptySummary();
        $employeePayloads = [];

        foreach ($employees as $employee) {
            $leave = $leaveByUserId->get($employee->id);
            $status = $this->resolveStatus($employee, $leave);
            $summary[$status->value]++;

            $employeePayloads[] = [
                'id' => $employee->id,
                'name' => $employee->name,
                'email' => $employee->email,
                'first_name' => $employee->first_name,
                'last_name' => $employee->last_name,
                'avatar' => $employee->avatar,
                'teams' => $teamsByUserId->get($employee->id, []),
                'status' => $status->value,
                'status_label' => $status->label(),
                'leave_ends_on' => $leave?->ends_on->format('Y-m-d'),
                'role' => $employee->role instanceof UserRole
                    ? $employee->role->value
                    : (string) $employee->role,
                'task_availability' => ($employee->task_availability ?? TaskAvailability::OpenForTasks)->value,
                'task_availability_label' => ($employee->task_availability ?? TaskAvailability::OpenForTasks)->label(),
            ];
        }

        return [
            'summary' => $summary,
            'employees' => $employeePayloads,
        ];
    }

    /**
     * @return array{
     *     in_office: int,
     *     out_of_office: int,
     *     vacation: int,
     *     sick: int,
     *     other_leave: int,
     * }
     */
    private function emptySummary(): array
    {
        return [
            'in_office' => 0,
            'out_of_office' => 0,
            'vacation' => 0,
            'sick' => 0,
            'other_leave' => 0,
        ];
    }

    /**
     * @param  Collection<int, LeaveRequest>  $leaves
     */
    private function pickLeave(Collection $leaves): LeaveRequest
    {
        return $leaves->sortBy(fn (LeaveRequest $leave): int => match ($leave->type) {
            LeaveType::Sick => 0,
            LeaveType::Vacation => 1,
            LeaveType::Other => 2,
        })->first();
    }

    private function resolveStatus(User $user, ?LeaveRequest $leave): EmployeePresenceStatus
    {
        if ($leave !== null) {
            return match ($leave->type) {
                LeaveType::Vacation => EmployeePresenceStatus::Vacation,
                LeaveType::Sick => EmployeePresenceStatus::Sick,
                LeaveType::Other => EmployeePresenceStatus::OtherLeave,
            };
        }

        return $this->officePresenceResolver->isInOffice($user)
            ? EmployeePresenceStatus::InOffice
            : EmployeePresenceStatus::OutOfOffice;
    }
}
