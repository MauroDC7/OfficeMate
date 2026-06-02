<?php

namespace App\Services;

use App\Enums\LeaveRequestStatus;
use App\Models\LeaveRequest;
use App\Models\User;
use Carbon\CarbonImmutable;

final class OrganizationLeaveOverview
{
    /**
     * @param  list<int>|null  $onlyUserIds
     * @return list<array{
     *     id: int,
     *     starts_on: string,
     *     ends_on: string,
     *     type_label: string,
     *     user: array{id: int, name: string}
     * }>
     */
    public function approvedLeaveBetween(
        int $organizationId,
        CarbonImmutable $rangeStart,
        CarbonImmutable $rangeEnd,
        ?int $excludeUserId = null,
        ?int $limit = null,
        ?array $onlyUserIds = null,
    ): array {
        if ($onlyUserIds !== null) {
            $memberIds = array_values(array_unique($onlyUserIds));
        } else {
            $memberIds = User::query()
                ->where('organization_id', $organizationId)
                ->pluck('id')
                ->all();
        }

        if ($memberIds === []) {
            return [];
        }

        $query = LeaveRequest::query()
            ->whereIn('user_id', $memberIds)
            ->where('status', LeaveRequestStatus::Approved)
            ->where('ends_on', '>=', $rangeStart->toDateString())
            ->where('starts_on', '<=', $rangeEnd->toDateString())
            ->with('user:id,first_name,last_name')
            ->orderBy('starts_on')
            ->orderBy('id');

        if ($excludeUserId !== null) {
            $query->where('user_id', '!=', $excludeUserId);
        }

        if ($limit !== null) {
            $query->limit($limit);
        }

        return $query
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
    }
}
