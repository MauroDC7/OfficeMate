<?php

use App\Enums\UserRole;
use App\Models\Organization;
use App\Models\Project;
use App\Models\Team;
use App\Models\TeamMembership;
use App\Models\User;

it('allows admins to view any team in their organization', function () {
    $admin = User::factory()->admin()->create();
    $organization = Organization::query()->findOrFail($admin->organization_id);
    $team = Team::factory()->for($organization)->create(['name' => 'Support']);

    $this->actingAs($admin)
        ->get(route('teams.show', $team))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('teams/show')
            ->where('team.name', 'Support')
            ->where('isAdmin', true)
            ->where('canManage', true));
});

it('allows employees to view teams they belong to', function () {
    $organization = Organization::factory()->create();
    $employee = User::factory()->forOrganization($organization)->create(['role' => UserRole::Employee]);
    $team = Team::factory()->for($organization)->create();
    TeamMembership::factory()->for($team)->for($employee)->approved()->create();

    $this->actingAs($employee)
        ->get(route('teams.show', $team))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('isAdmin', false)
            ->where('canManage', false)
            ->has('members', 1));
});

it('forbids employees from viewing teams they are not in', function () {
    $organization = Organization::factory()->create();
    $employee = User::factory()->forOrganization($organization)->create(['role' => UserRole::Employee]);
    $team = Team::factory()->for($organization)->create();

    $this->actingAs($employee)
        ->get(route('teams.show', $team))
        ->assertForbidden();
});

it('shows pending memberships only to admins on the team page', function () {
    $admin = User::factory()->admin()->create();
    $organization = Organization::query()->findOrFail($admin->organization_id);
    $team = Team::factory()->for($organization)->create();
    $applicant = User::factory()->forOrganization($organization)->create(['role' => UserRole::Employee]);
    TeamMembership::factory()->for($team)->for($applicant)->pending()->create();

    $this->actingAs($admin)
        ->get(route('teams.show', $team))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->has('pendingMemberships', 1));
});

it('lists projects linked to the team', function () {
    $admin = User::factory()->admin()->create();
    $organization = Organization::query()->findOrFail($admin->organization_id);
    $team = Team::factory()->for($organization)->create();
    $project = Project::factory()->for($organization)->create(['name' => 'Website']);
    $team->projects()->attach($project);

    $this->actingAs($admin)
        ->get(route('teams.show', $team))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('projects.0.name', 'Website'));
});
