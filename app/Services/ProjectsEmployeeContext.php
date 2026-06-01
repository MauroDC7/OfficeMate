<?php

namespace App\Services;

use App\Enums\TaskAvailability;
use App\Models\User;
use App\Models\WeeklyStatusUpdate;
use Carbon\CarbonImmutable;

final class ProjectsEmployeeContext
{
    /**
     * @return array{
     *     weeklyStatus: array{
     *         week_start: string,
     *         difficult_this_week: string|null,
     *         plans_next_week: string|null,
     *         reminder_due: bool,
     *     }|null,
     *     taskAvailability: string|null,
     *     taskAvailabilityOptions: list<array{value: string, label: string}>,
     * }
     */
    public function forUser(User $user): array
    {
        if ($user->organization_id === null) {
            return [
                'weeklyStatus' => null,
                'taskAvailability' => null,
                'taskAvailabilityOptions' => [],
            ];
        }

        $timezone = config('services.timesheets.timezone', 'Europe/Brussels');
        $now = CarbonImmutable::now($timezone);
        $monday = $now->startOfWeek(CarbonImmutable::MONDAY);

        $weeklyStatusRow = WeeklyStatusUpdate::query()
            ->where('user_id', $user->id)
            ->whereDate('week_start', $monday->toDateString())
            ->first();

        return [
            'weeklyStatus' => [
                'week_start' => $monday->toDateString(),
                'difficult_this_week' => $weeklyStatusRow?->difficult_this_week,
                'plans_next_week' => $weeklyStatusRow?->plans_next_week,
                'reminder_due' => $now->isFriday()
                    && $now->format('H:i') >= '15:00'
                    && $weeklyStatusRow === null,
            ],
            'taskAvailability' => ($user->task_availability ?? TaskAvailability::OpenForTasks)->value,
            'taskAvailabilityOptions' => array_map(
                fn (TaskAvailability $option): array => [
                    'value' => $option->value,
                    'label' => $option->label(),
                ],
                TaskAvailability::cases(),
            ),
        ];
    }
}
