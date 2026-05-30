<?php

namespace App\Services;

use App\Enums\ProjectType;
use App\Enums\UserRole;
use App\Models\Project;
use App\Models\User;
use Illuminate\Validation\ValidationException;

final class TimesheetProjectNormalizer
{
    public function __construct(
        private readonly OrganizationContext $organizationContext,
        private readonly ProjectOverviewBuilder $projectOverviewBuilder,
    ) {}

    /**
     * @return list<array{id: int, name: string, type: string, client_name: string|null}>
     */
    public function optionsFor(User $user): array
    {
        $organization = $this->organizationContext->forUser($user);

        if ($organization === null) {
            return [];
        }

        return $this->projectOverviewBuilder->selectableOptionsFor(
            $organization,
            $user,
            $user->role === UserRole::Admin,
        );
    }

    /**
     * @return array{project_id: int|null, client_name: string|null}
     */
    public function normalize(User $user, mixed $rawProjectId): array
    {
        if ($rawProjectId === null || $rawProjectId === '') {
            return [
                'project_id' => null,
                'client_name' => null,
            ];
        }

        if (! is_numeric($rawProjectId)) {
            throw ValidationException::withMessages([
                'project_id' => 'Selecteer een geldig project.',
            ]);
        }

        $projectId = (int) $rawProjectId;
        $organization = $this->organizationContext->forUser($user);

        if ($organization === null) {
            throw ValidationException::withMessages([
                'project_id' => 'Koppel eerst een organisatie om een project te kiezen.',
            ]);
        }

        $project = $this->projectOverviewBuilder->findAccessible(
            $organization,
            $user,
            $user->role === UserRole::Admin,
            $projectId,
        );

        if ($project === null) {
            throw ValidationException::withMessages([
                'project_id' => 'Dit project is niet beschikbaar.',
            ]);
        }

        return [
            'project_id' => $project->id,
            'client_name' => $this->clientNameFor($project),
        ];
    }

    private function clientNameFor(Project $project): ?string
    {
        $name = $project->client_name;

        if ($project->type === ProjectType::External && is_string($name) && trim($name) !== '') {
            return trim($name);
        }

        return null;
    }
}
