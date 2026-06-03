<?php

namespace App\Services;

use App\Models\EmploymentProfile;
use App\Models\Organization;
use App\Models\User;

final class EmployeeEmploymentAssigner
{
    public function applyOrganizationDefaults(User $employee, Organization $organization): void
    {
        $employee->forceFill([
            'employment_profile_id' => null,
            'weekly_work_hours' => (int) $organization->default_weekly_work_hours,
            'annual_leave_days' => (int) $organization->default_annual_leave_days,
        ])->save();
    }

    public function applyProfile(User $employee, EmploymentProfile $profile): void
    {
        $employee->forceFill([
            'employment_profile_id' => $profile->id,
            'weekly_work_hours' => (int) $profile->weekly_work_hours,
            'annual_leave_days' => (int) $profile->annual_leave_days,
        ])->save();
    }

    public function applyCustom(User $employee, int $weeklyWorkHours, int $annualLeaveDays): void
    {
        $employee->forceFill([
            'employment_profile_id' => null,
            'weekly_work_hours' => $weeklyWorkHours,
            'annual_leave_days' => $annualLeaveDays,
        ])->save();
    }
}
