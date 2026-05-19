<?php

namespace App\Services;

use App\Models\Project;
use App\Models\TimesheetEntry;
use App\Models\TimesheetEntryProposal;
use App\Models\User;
use Carbon\CarbonImmutable;

final class EmployeeDashboardStats
{
    /**
     * @return array{
     *     activeProjects: list<array{id: int, name: string, client_name: string|null}>,
     *     pendingTimesheetCount: int,
     *     hoursThisWeekMinutes: int,
     *     weekStart: string,
     *     recentNotifications: list<array{id: string, title: string, message: string, created_at: string}>
     * }
     */
    public function forUser(User $user): array
    {
        $monday = CarbonImmutable::now()->startOfWeek(CarbonImmutable::MONDAY);
        $weekEnd = $monday->addDays(6);

        $activeProjects = Project::query()
            ->active()
            ->orderBy('name')
            ->get(['id', 'name', 'client_name'])
            ->map(fn (Project $project): array => [
                'id' => $project->id,
                'name' => $project->name,
                'client_name' => $project->client_name,
            ])
            ->values()
            ->all();

        $hoursThisWeekMinutes = (int) TimesheetEntry::query()
            ->where('user_id', $user->id)
            ->whereBetween('worked_on', [$monday->toDateString(), $weekEnd->toDateString()])
            ->get(['start_minutes', 'end_minutes'])
            ->sum(fn (TimesheetEntry $entry): int => max(
                0,
                $entry->end_minutes - $entry->start_minutes,
            ));

        $pendingTimesheetCount = TimesheetEntryProposal::query()
            ->where('user_id', $user->id)
            ->count();

        return [
            'activeProjects' => $activeProjects,
            'pendingTimesheetCount' => $pendingTimesheetCount,
            'hoursThisWeekMinutes' => $hoursThisWeekMinutes,
            'weekStart' => $monday->toDateString(),
            'recentNotifications' => [],
        ];
    }
}
