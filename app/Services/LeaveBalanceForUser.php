<?php

namespace App\Services;

use App\Enums\LeaveRequestStatus;
use App\Enums\LeaveType;
use App\Models\LeaveRequest;
use App\Models\User;
use Carbon\CarbonImmutable;

final class LeaveBalanceForUser
{
    /**
     * @return array{
     *     year: int,
     *     annual_days: int,
     *     used_days: int,
     *     pending_days: int,
     *     remaining_days: int,
     * }
     */
    public function forUser(User $user, ?CarbonImmutable $today = null): array
    {
        $timezone = config('services.timesheets.timezone', 'Europe/Brussels');
        $today ??= CarbonImmutable::now($timezone)->startOfDay();
        $year = $today->year;

        $usedDays = 0;
        $pendingDays = 0;

        $requests = LeaveRequest::query()
            ->where('user_id', $user->id)
            ->where('type', LeaveType::Vacation)
            ->whereYear('starts_on', $year)
            ->whereIn('status', [LeaveRequestStatus::Approved, LeaveRequestStatus::Pending])
            ->get();

        foreach ($requests as $request) {
            $days = $request->dayCount();

            if ($request->status === LeaveRequestStatus::Approved) {
                $usedDays += $days;
            } else {
                $pendingDays += $days;
            }
        }

        $annualDays = (int) $user->annual_leave_days;

        return [
            'year' => $year,
            'annual_days' => $annualDays,
            'used_days' => $usedDays,
            'pending_days' => $pendingDays,
            'remaining_days' => max(0, $annualDays - $usedDays),
        ];
    }
}
