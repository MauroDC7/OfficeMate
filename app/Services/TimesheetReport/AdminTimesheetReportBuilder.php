<?php

namespace App\Services\TimesheetReport;

use App\Enums\TeamMembershipStatus;
use App\Models\Organization;
use App\Models\TeamMembership;
use App\Models\TimesheetEntry;
use App\Models\User;

final class AdminTimesheetReportBuilder
{
    /**
     * @return list<TimesheetReportRow>
     */
    public function rows(Organization $organization, TimesheetReportFilters $filters): array
    {
        $userIds = $this->resolveUserIds($organization, $filters);

        if ($userIds === []) {
            return [];
        }

        $query = TimesheetEntry::query()
            ->whereIn('user_id', $userIds)
            ->whereDate('worked_on', '>=', $filters->startsOn)
            ->whereDate('worked_on', '<=', $filters->endsOn)
            ->with([
                'user:id,first_name,last_name,email,organization_id',
                'project:id,name,client_name',
            ])
            ->orderBy('worked_on')
            ->orderBy('start_minutes')
            ->orderBy('id');

        if ($filters->projectId !== null) {
            $query->where('project_id', $filters->projectId);
        }

        return $query
            ->get()
            ->map(fn (TimesheetEntry $entry): TimesheetReportRow => $this->mapRow($entry))
            ->all();
    }

    /**
     * @param  list<TimesheetReportRow>  $rows
     * @return array{entry_count: int, total_minutes: int, employee_count: int}
     */
    public function summary(array $rows): array
    {
        $employeeIds = [];

        foreach ($rows as $row) {
            $employeeIds[$row->userId] = true;
        }

        return [
            'entry_count' => count($rows),
            'total_minutes' => array_sum(array_map(
                fn (TimesheetReportRow $row): int => $row->durationMinutes,
                $rows,
            )),
            'employee_count' => count($employeeIds),
        ];
    }

    /**
     * @return list<int>
     */
    private function resolveUserIds(Organization $organization, TimesheetReportFilters $filters): array
    {
        $query = User::query()
            ->where('organization_id', $organization->id)
            ->orderBy('first_name')
            ->orderBy('last_name');

        if ($filters->userId !== null) {
            $query->whereKey($filters->userId);
        }

        if ($filters->teamId !== null) {
            $teamUserIds = TeamMembership::query()
                ->where('team_id', $filters->teamId)
                ->where('status', TeamMembershipStatus::Approved)
                ->pluck('user_id')
                ->all();

            $query->whereIn('id', $teamUserIds);
        }

        return $query->pluck('id')->all();
    }

    private function mapRow(TimesheetEntry $entry): TimesheetReportRow
    {
        $durationMinutes = max(0, $entry->end_minutes - $entry->start_minutes);
        /** @var User $user */
        $user = $entry->user;

        $projectName = $entry->project?->name;
        $clientName = $entry->client_name ?? $entry->project?->client_name;

        return new TimesheetReportRow(
            id: $entry->id,
            userId: $user->id,
            employeeName: $user->name,
            employeeEmail: $user->email,
            workedOn: $entry->worked_on->format('Y-m-d'),
            startTime: TimesheetReportFormatter::minutesToTime($entry->start_minutes),
            endTime: TimesheetReportFormatter::minutesToTime($entry->end_minutes),
            durationMinutes: $durationMinutes,
            durationLabel: TimesheetReportFormatter::durationLabel($durationMinutes),
            title: $entry->title,
            description: $entry->description,
            projectName: $projectName,
            clientName: $clientName,
        );
    }
}
