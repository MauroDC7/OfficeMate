<?php

namespace App\Services;

use App\Enums\LeaveRequestStatus;
use App\Models\LeaveRequest;
use App\Models\User;
use Carbon\CarbonImmutable;

final class LeaveRequestPageData
{
    /**
     * @return array{
     *     stats: array{
     *         openLeaveDays: int,
     *         pendingCount: int,
     *         approvedUpcomingCount: int,
     *     },
     *     requests: list<array{
     *         id: int,
     *         starts_on: string,
     *         ends_on: string,
     *         status: string,
     *         type: string,
     *         type_label: string,
     *         notes: string|null,
     *         day_count: int,
     *         created_at: string,
     *         can_edit: bool,
     *     }>
     * }
     */
    public function forUser(User $user): array
    {
        $timezone = config('services.timesheets.timezone', 'Europe/Brussels');
        $today = CarbonImmutable::now($timezone)->startOfDay();

        $requests = LeaveRequest::query()
            ->where('user_id', $user->id)
            ->orderByDesc('starts_on')
            ->orderByDesc('id')
            ->get();

        $pendingCount = 0;
        $approvedUpcomingCount = 0;
        $openLeaveDays = 0;

        foreach ($requests as $request) {
            if ($request->status === LeaveRequestStatus::Pending) {
                $pendingCount++;
            }

            if (
                $request->status === LeaveRequestStatus::Approved
                && $request->ends_on->format('Y-m-d') >= $today->toDateString()
            ) {
                $approvedUpcomingCount++;
                $openLeaveDays += $this->remainingLeaveDays($request, $today);
            }
        }

        return [
            'stats' => [
                'openLeaveDays' => $openLeaveDays,
                'pendingCount' => $pendingCount,
                'approvedUpcomingCount' => $approvedUpcomingCount,
            ],
            'requests' => $requests
                ->map(fn (LeaveRequest $request): array => [
                    'id' => $request->id,
                    'starts_on' => $request->starts_on->format('Y-m-d'),
                    'ends_on' => $request->ends_on->format('Y-m-d'),
                    'status' => $request->status->value,
                    'type' => $request->type->value,
                    'type_label' => $request->type->label(),
                    'notes' => $request->notes,
                    'day_count' => $request->dayCount(),
                    'created_at' => $request->created_at?->toIso8601String() ?? '',
                    'can_edit' => $user->can('update', $request),
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
