<?php

namespace App\Services;

use App\Enums\TaskAvailability;
use App\Models\User;
use App\Models\WeeklyStatusUpdate;
use Carbon\CarbonImmutable;

final class ProjectsEmployeeContext
{
    public function __construct(
        private readonly WeeklyDebriefSchedule $weeklyDebriefSchedule,
        private readonly WeeklyDebriefDraftGenerator $weeklyDebriefDraftGenerator,
    ) {}

    /**
     * @return array{
     *     weeklyStatus: array{
     *         week_start: string,
     *         difficult_this_week: string|null,
     *         plans_next_week: string|null,
     *         reminder_due: bool,
     *         ai_draft_available: bool,
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

        $now = CarbonImmutable::now($this->weeklyDebriefSchedule->timezone());
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
                'reminder_due' => $this->weeklyDebriefSchedule->isReminderDue($now)
                    && $weeklyStatusRow === null,
                'ai_draft_available' => $this->weeklyDebriefDraftGenerator->isConfigured(),
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
