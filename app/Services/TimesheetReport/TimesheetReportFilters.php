<?php

namespace App\Services\TimesheetReport;

final readonly class TimesheetReportFilters
{
    public function __construct(
        public string $startsOn,
        public string $endsOn,
        public ?int $userId = null,
        public ?int $projectId = null,
        public ?int $teamId = null,
    ) {}

    /**
     * @param  array<string, mixed>  $validated
     */
    public static function fromValidated(array $validated): self
    {
        return new self(
            startsOn: (string) $validated['starts_on'],
            endsOn: (string) $validated['ends_on'],
            userId: isset($validated['user_id']) ? (int) $validated['user_id'] : null,
            projectId: isset($validated['project_id']) ? (int) $validated['project_id'] : null,
            teamId: isset($validated['team_id']) ? (int) $validated['team_id'] : null,
        );
    }

    /**
     * @return array<string, string|int|null>
     */
    public function toQueryArray(): array
    {
        return array_filter([
            'starts_on' => $this->startsOn,
            'ends_on' => $this->endsOn,
            'user_id' => $this->userId,
            'project_id' => $this->projectId,
            'team_id' => $this->teamId,
        ], fn (mixed $value): bool => $value !== null && $value !== '');
    }
}
