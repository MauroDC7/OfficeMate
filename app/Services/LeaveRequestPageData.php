<?php

namespace App\Services;

use App\Enums\LeaveRequestStatus;
use App\Models\LeaveRequest;
use App\Models\User;
use Carbon\CarbonImmutable;

final class LeaveRequestPageData
{
    public function __construct(
        private readonly LeaveBalanceForUser $leaveBalanceForUser,
    ) {}

    /**
     * @return array{
     *     balance: array{
     *         year: int,
     *         annual_days: int,
     *         used_days: int,
     *         pending_days: int,
     *         remaining_days: int,
     *     },
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
     *         attachment: array{name: string, url: string}|null,
     *     }>
     * }
     */
    public function forUser(User $user): array
    {
        $timezone = config('services.timesheets.timezone', 'Europe/Brussels');
        $today = CarbonImmutable::now($timezone)->startOfDay();

        $requests = LeaveRequest::query()
            ->where('user_id', $user->id)
            ->with('attachments')
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
            'balance' => $this->leaveBalanceForUser->forUser($user, $today),
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
                    'attachment' => $this->attachmentPayload($request),
                ])
                ->values()
                ->all(),
        ];
    }

    /**
     * @return array{name: string, url: string}|null
     */
    private function attachmentPayload(LeaveRequest $request): ?array
    {
        $attachment = $request->attachments->first();

        if ($attachment === null) {
            return null;
        }

        return [
            'name' => $attachment->original_name,
            'url' => route('leaveRequests.medicalCertificate', $request),
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
