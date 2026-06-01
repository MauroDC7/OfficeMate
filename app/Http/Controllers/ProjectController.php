<?php

namespace App\Http\Controllers;

use App\Enums\ProjectStatus;
use App\Enums\ProjectType;
use App\Enums\UserRole;
use App\Http\Requests\Projects\StoreProjectRequest;
use App\Http\Requests\Projects\UpdateProjectRequest;
use App\Models\Project;
use App\Models\User;
use App\Services\OrganizationContext;
use App\Services\ProjectOverviewBuilder;
use App\Services\ProjectsEmployeeContext;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

final class ProjectController extends Controller
{
    public function __construct(
        private readonly OrganizationContext $organizationContext,
        private readonly ProjectOverviewBuilder $projectOverviewBuilder,
        private readonly ProjectsEmployeeContext $projectsEmployeeContext,
    ) {}

    public function index(Request $request): Response
    {
        $user = $request->user();
        abort_unless($user instanceof User, 401);

        $organization = $this->organizationContext->forUser($user);
        $isAdmin = $user->role === UserRole::Admin;
        $canCreate = $user->can('create', Project::class);

        if ($organization === null) {
            return Inertia::render('projects', [
                'organization' => null,
                'projectCards' => [],
                'stats' => ['total_projects' => 0, 'tracked_hours_month' => 0, 'budget_utilization' => 0],
                'organizationTeams' => [],
                'organizationUsers' => [],
                'isAdmin' => $isAdmin,
                'canCreate' => $canCreate,
                'awaitingOrganizationInvite' => ! $isAdmin && $user->organization_id === null,
                ...$this->projectsEmployeeContext->forUser($user),
            ]);
        }

        return Inertia::render('projects', [
            'organization' => [
                'id' => $organization->id,
                'name' => $organization->name,
            ],
            'projectCards' => $this->projectOverviewBuilder->cardsFor($organization, $user, $isAdmin),
            'stats' => $this->projectOverviewBuilder->statsFor($organization, $user, $isAdmin),
            'organizationTeams' => $canCreate
                ? $this->projectOverviewBuilder->organizationTeams($organization)
                : [],
            'organizationUsers' => $isAdmin ? $this->organizationUsers($organization->id) : [],
            'isAdmin' => $isAdmin,
            'canCreate' => $canCreate,
            'awaitingOrganizationInvite' => false,
            ...$this->projectsEmployeeContext->forUser($user),
        ]);
    }

    public function store(StoreProjectRequest $request): RedirectResponse
    {
        $this->authorize('create', Project::class);

        $user = $request->user();
        abort_unless($user instanceof User, 401);

        $organization = $this->organizationContext->forUserOrFail($user);
        $validated = $request->validated();
        $type = ProjectType::from($validated['type']);

        $project = Project::query()->create([
            'organization_id' => $organization->id,
            'name' => $validated['name'],
            'type' => $type,
            'status' => ProjectStatus::from($validated['status'] ?? ProjectStatus::InProgress->value),
            'hours_budget' => $validated['hours_budget'] ?? null,
            'client_name' => $type === ProjectType::External ? ($validated['client_name'] ?? null) : null,
            'created_by' => $user->id,
            'is_active' => true,
        ]);

        $project->teams()->sync($this->teamIds($validated));

        return redirect()->route('projects');
    }

    public function update(UpdateProjectRequest $request, Project $project): RedirectResponse
    {
        $user = $request->user();
        abort_unless($user instanceof User, 401);

        $organization = $this->organizationContext->forUserOrFail($user);
        abort_unless($project->organization_id === $organization->id, 404);
        $this->authorize('update', $project);

        $validated = $request->validated();
        $type = ProjectType::from($validated['type']);

        $project->update([
            'name' => $validated['name'],
            'type' => $type,
            'status' => ProjectStatus::from($validated['status']),
            'hours_budget' => $validated['hours_budget'] ?? null,
            'client_name' => $type === ProjectType::External ? ($validated['client_name'] ?? null) : null,
        ]);

        $project->teams()->sync($this->teamIds($validated));

        return redirect()->route('projects');
    }

    public function destroy(Request $request, Project $project): RedirectResponse
    {
        $user = $request->user();
        abort_unless($user instanceof User, 401);

        $organization = $this->organizationContext->forUserOrFail($user);
        abort_unless($project->organization_id === $organization->id, 404);
        $this->authorize('delete', $project);

        $project->delete();

        return redirect()->route('projects');
    }

    /**
     * @param  array<string, mixed>  $validated
     * @return list<int>
     */
    private function teamIds(array $validated): array
    {
        return collect($validated['team_ids'] ?? [])
            ->map(fn (mixed $id): int => (int) $id)
            ->unique()
            ->values()
            ->all();
    }

    /**
     * @return list<array{id: int, name: string, email: string, first_name: string, last_name: string, avatar: string|null, can_create_projects: bool}>
     */
    private function organizationUsers(int $organizationId): array
    {
        return User::query()
            ->where('organization_id', $organizationId)
            ->where('role', UserRole::Employee)
            ->orderBy('first_name')
            ->orderBy('last_name')
            ->get(['id', 'first_name', 'last_name', 'email', 'avatar_path', 'can_create_projects'])
            ->map(fn (User $user): array => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'first_name' => $user->first_name,
                'last_name' => $user->last_name,
                'avatar' => $user->avatar,
                'can_create_projects' => $user->can_create_projects,
            ])
            ->all();
    }
}
