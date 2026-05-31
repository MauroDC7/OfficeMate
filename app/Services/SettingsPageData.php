<?php

namespace App\Services;

use App\Enums\UserRole;
use App\Models\EmploymentProfile;
use App\Models\Organization;
use App\Models\User;
use Illuminate\Http\Request;

final class SettingsPageData
{
    public function __construct(
        private readonly TrackerConnectionStatus $trackerConnectionStatus,
        private readonly OrganizationContext $organizationContext,
    ) {}

    /**
     * @return array{
     *     awaitingOrganizationInvite: bool,
     *     tracker: array{
     *         is_connected: bool,
     *         last_activity_at: string|null,
     *         last_activity_label: string|null,
     *         download_url: string|null,
     *     }|null,
     *     isAdmin: bool,
     *     canCreateOrganization: bool,
     *     employment: array{
     *         defaults: array{weekly_work_hours: int, annual_leave_days: int},
     *         profiles: list<array{
     *             id: int,
     *             name: string,
     *             weekly_work_hours: int,
     *             annual_leave_days: int,
     *         }>,
     *         max_profiles: int,
     *         preselectedEmployee: array{
     *             id: int,
     *             first_name: string,
     *             last_name: string,
     *             email: string,
     *             avatar: string|null,
     *             weekly_work_hours: int,
     *             annual_leave_days: int,
     *             employment_profile_id: int|null,
     *         }|null,
     *     }|null,
     * }
     */
    public function forRequest(Request $request): array
    {
        $user = $request->user();
        abort_unless($user instanceof User, 401);

        $awaitingOrganizationInvite = $user->role !== UserRole::Admin
            && $user->organization_id === null;

        $tracker = $awaitingOrganizationInvite
            ? null
            : [
                ...$this->trackerConnectionStatus->forUser($user),
                'download_url' => config('services.timetraq.tracker_download_url'),
            ];

        $isAdmin = $user->role === UserRole::Admin;
        $employment = null;

        if ($isAdmin && $user->organization_id !== null) {
            $organization = $this->organizationContext->forUserOrFail($user);
            $employment = $this->employmentPayload($organization, $request);
        }

        return [
            'awaitingOrganizationInvite' => $awaitingOrganizationInvite,
            'canCreateOrganization' => $user->organization_id === null,
            'tracker' => $tracker,
            'isAdmin' => $isAdmin,
            'employment' => $employment,
        ];
    }

    /**
     * @return array{
     *     defaults: array{weekly_work_hours: int, annual_leave_days: int},
     *     profiles: list<array{
     *         id: int,
     *         name: string,
     *         weekly_work_hours: int,
     *         annual_leave_days: int,
     *     }>,
     *     max_profiles: int,
     *     preselectedEmployee: array{
     *         id: int,
     *         first_name: string,
     *         last_name: string,
     *         email: string,
     *         avatar: string|null,
     *         weekly_work_hours: int,
     *         annual_leave_days: int,
     *         employment_profile_id: int|null,
     *     }|null,
     * }
     */
    private function employmentPayload(Organization $organization, Request $request): array
    {
        return [
            'defaults' => [
                'weekly_work_hours' => (int) $organization->default_weekly_work_hours,
                'annual_leave_days' => (int) $organization->default_annual_leave_days,
            ],
            'profiles' => $organization->employmentProfiles()
                ->get(['id', 'name', 'weekly_work_hours', 'annual_leave_days'])
                ->map(fn (EmploymentProfile $profile): array => [
                    'id' => $profile->id,
                    'name' => $profile->name,
                    'weekly_work_hours' => (int) $profile->weekly_work_hours,
                    'annual_leave_days' => (int) $profile->annual_leave_days,
                ])
                ->all(),
            'max_profiles' => EmploymentProfile::MAX_PER_ORGANIZATION,
            'preselectedEmployee' => $this->resolvePreselectedEmployee($organization, $request),
        ];
    }

    /**
     * @return array{
     *     id: int,
     *     first_name: string,
     *     last_name: string,
     *     email: string,
     *     avatar: string|null,
     *     weekly_work_hours: int,
     *     annual_leave_days: int,
     *     employment_profile_id: int|null,
     * }|null
     */
    private function resolvePreselectedEmployee(Organization $organization, Request $request): ?array
    {
        $employeeId = $request->integer('employee');

        if ($employeeId <= 0) {
            return null;
        }

        $employee = User::query()
            ->where('organization_id', $organization->id)
            ->where('role', UserRole::Employee)
            ->whereKey($employeeId)
            ->first([
                'id',
                'first_name',
                'last_name',
                'email',
                'avatar_path',
                'weekly_work_hours',
                'annual_leave_days',
                'employment_profile_id',
            ]);

        if ($employee === null) {
            return null;
        }

        return [
            'id' => $employee->id,
            'first_name' => $employee->first_name,
            'last_name' => $employee->last_name,
            'email' => $employee->email,
            'avatar' => $employee->avatar,
            'weekly_work_hours' => (int) $employee->weekly_work_hours,
            'annual_leave_days' => (int) $employee->annual_leave_days,
            'employment_profile_id' => $employee->employment_profile_id,
        ];
    }
}
