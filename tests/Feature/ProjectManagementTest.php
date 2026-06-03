<?php

use App\Enums\ProjectStatus;
use App\Enums\ProjectType;
use App\Models\Organization;
use App\Models\Project;
use App\Models\Team;
use App\Models\TeamMembership;
use App\Models\TimesheetEntry;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

it('shows projects an employee is involved in through their team', function () {
    $organization = Organization::factory()->create();
    $employee = User::factory()->forOrganization($organization)->create();
    $team = Team::factory()->for($organization)->create();
    TeamMembership::factory()->for($team)->for($employee)->approved()->create();

    $visible = Project::factory()->for($organization)->create(['name' => 'NFC Betaalsysteem']);
    $visible->teams()->attach($team);

    Project::factory()->for($organization)->create(['name' => 'Verborgen Project']);

    $this->actingAs($employee)
        ->get(route('projects'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('projects')
            ->where('isAdmin', false)
            ->where('canCreate', false)
            ->has('projectCards', 1)
            ->where('projectCards.0.name', 'NFC Betaalsysteem'));
});

it('shows all organization projects to admins', function () {
    $admin = User::factory()->admin()->create();
    $organization = Organization::query()->findOrFail($admin->organization_id);
    Project::factory()->for($organization)->count(2)->create();

    $this->actingAs($admin)
        ->get(route('projects'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('isAdmin', true)
            ->where('canCreate', true)
            ->where('weeklyStatus', null)
            ->has('projectCards', 2));
});

it('forbids admins from submitting a weekly debrief', function () {
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)
        ->post(route('weekly-status.store'), [
            'week_start' => '2026-06-02',
            'difficult_this_week' => 'Test',
            'plans_next_week' => 'Test',
        ])
        ->assertForbidden();
});

it('forbids employees without permission from creating projects', function () {
    $employee = User::factory()->create();

    $this->actingAs($employee)
        ->post(route('projects.store'), ['name' => 'Test', 'type' => 'internal'])
        ->assertForbidden();
});

it('allows permitted employees to create projects', function () {
    $organization = Organization::factory()->create();
    $employee = User::factory()->forOrganization($organization)->create(['can_create_projects' => true]);

    $this->actingAs($employee)
        ->post(route('projects.store'), [
            'name' => 'Intern Dashboard',
            'type' => 'internal',
        ])
        ->assertRedirect(route('projects'));

    $this->assertDatabaseHas('projects', [
        'name' => 'Intern Dashboard',
        'organization_id' => $organization->id,
        'created_by' => $employee->id,
        'type' => ProjectType::Internal->value,
        'client_name' => null,
    ]);
});

it('allows admins to create an external project with client and teams', function () {
    $admin = User::factory()->admin()->create();
    $organization = Organization::query()->findOrFail($admin->organization_id);
    $team = Team::factory()->for($organization)->create();

    $this->actingAs($admin)
        ->post(route('projects.store'), [
            'name' => 'NFC Betaalsysteem',
            'type' => 'external',
            'client_name' => 'Rabobank',
            'status' => ProjectStatus::WaitingForClient->value,
            'hours_budget' => 1200,
            'team_ids' => [$team->id],
        ])
        ->assertRedirect(route('projects'));

    $project = Project::query()->where('name', 'NFC Betaalsysteem')->first();

    expect($project)->not->toBeNull()
        ->and($project->client_name)->toBe('Rabobank')
        ->and($project->type)->toBe(ProjectType::External)
        ->and($project->status)->toBe(ProjectStatus::WaitingForClient)
        ->and($project->hours_budget)->toBe(1200);

    $this->assertDatabaseHas('project_team', [
        'project_id' => $project->id,
        'team_id' => $team->id,
    ]);
});

it('requires a client name for external projects', function () {
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)
        ->post(route('projects.store'), [
            'name' => 'Zonder Klant',
            'type' => 'external',
        ])
        ->assertSessionHasErrors('client_name');
});

it('allows admins to update a project status', function () {
    $admin = User::factory()->admin()->create();
    $organization = Organization::query()->findOrFail($admin->organization_id);
    $project = Project::factory()->for($organization)->create([
        'status' => ProjectStatus::InProgress,
    ]);

    $this->actingAs($admin)
        ->patch(route('projects.update', $project), [
            'name' => $project->name,
            'type' => $project->type->value,
            'client_name' => $project->client_name,
            'status' => ProjectStatus::Done->value,
        ])
        ->assertRedirect(route('projects'));

    expect($project->fresh()->status)->toBe(ProjectStatus::Done);
});

it('forbids employees from updating projects', function () {
    $organization = Organization::factory()->create();
    $employee = User::factory()->forOrganization($organization)->create(['can_create_projects' => true]);
    $project = Project::factory()->for($organization)->create();

    $this->actingAs($employee)
        ->patch(route('projects.update', $project), [
            'name' => 'Gekaapt',
            'type' => 'internal',
            'status' => ProjectStatus::Done->value,
        ])
        ->assertForbidden();
});

it('allows admins to delete a project', function () {
    $admin = User::factory()->admin()->create();
    $organization = Organization::query()->findOrFail($admin->organization_id);
    $project = Project::factory()->for($organization)->create();

    $this->actingAs($admin)
        ->delete(route('projects.destroy', $project))
        ->assertRedirect(route('projects'));

    $this->assertDatabaseMissing('projects', ['id' => $project->id]);
});

it('allows admins to grant project creation rights', function () {
    $admin = User::factory()->admin()->create();
    $organization = Organization::query()->findOrFail($admin->organization_id);
    $employee = User::factory()->forOrganization($organization)->create(['can_create_projects' => false]);

    $this->actingAs($admin)
        ->patch(route('projects.creator-access.update', $employee), [
            'can_create_projects' => true,
        ])
        ->assertRedirect(route('projects'));

    expect($employee->fresh()->can_create_projects)->toBeTrue();
});

it('forbids employees from granting project creation rights', function () {
    $organization = Organization::factory()->create();
    $employee = User::factory()->forOrganization($organization)->create();
    $other = User::factory()->forOrganization($organization)->create();

    $this->actingAs($employee)
        ->patch(route('projects.creator-access.update', $other), [
            'can_create_projects' => true,
        ])
        ->assertForbidden();
});

it('stores a project logo on create', function () {
    Storage::fake('public');

    $admin = User::factory()->admin()->create();
    $logo = UploadedFile::fake()->image('logo.png', 64, 64);

    $this->actingAs($admin)
        ->post(route('projects.store'), [
            'name' => 'Met Logo',
            'type' => 'internal',
            'logo' => $logo,
        ])
        ->assertRedirect(route('projects'));

    $project = Project::query()->where('name', 'Met Logo')->first();

    expect($project)->not->toBeNull()
        ->and($project->logo_path)->not->toBeNull()
        ->and($project->logo)->not->toBeNull();

    Storage::disk('public')->assertExists($project->logo_path);
});

it('replaces and removes a project logo on update', function () {
    Storage::fake('public');

    $admin = User::factory()->admin()->create();
    $organization = Organization::query()->findOrFail($admin->organization_id);
    $project = Project::factory()->for($organization)->internal()->create();
    $oldPath = UploadedFile::fake()->image('old.png')->store('project-logos', 'public');
    $project->update(['logo_path' => $oldPath]);

    $newLogo = UploadedFile::fake()->image('new.png', 48, 48);

    $this->actingAs($admin)
        ->patch(route('projects.update', $project), [
            'name' => $project->name,
            'type' => $project->type->value,
            'status' => $project->status->value,
            'logo' => $newLogo,
        ])
        ->assertRedirect(route('projects'));

    $project->refresh();
    $newPath = $project->logo_path;

    expect($newPath)->not->toBe($oldPath);
    Storage::disk('public')->assertMissing($oldPath);
    Storage::disk('public')->assertExists($newPath);

    $this->actingAs($admin)
        ->patch(route('projects.update', $project), [
            'name' => $project->name,
            'type' => $project->type->value,
            'status' => $project->status->value,
            'remove_logo' => true,
        ])
        ->assertRedirect(route('projects'));

    expect($project->fresh()->logo_path)->toBeNull();
    Storage::disk('public')->assertMissing($newPath);
});

it('rejects invalid project logos', function () {
    Storage::fake('public');

    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)
        ->post(route('projects.store'), [
            'name' => 'Ongeldig Logo',
            'type' => 'internal',
            'logo' => UploadedFile::fake()->create('brief.pdf', 100, 'application/pdf'),
        ])
        ->assertSessionHasErrors('logo');
});

it('tracks hours per project from linked timesheet entries', function () {
    $admin = User::factory()->admin()->create();
    $organization = Organization::query()->findOrFail($admin->organization_id);
    $project = Project::factory()->for($organization)->create();

    TimesheetEntry::factory()->for($admin)->create([
        'project_id' => $project->id,
        'start_minutes' => 540,
        'end_minutes' => 600,
    ]);
    TimesheetEntry::factory()->for($admin)->create([
        'project_id' => $project->id,
        'start_minutes' => 600,
        'end_minutes' => 690,
    ]);

    $this->actingAs($admin)
        ->get(route('projects'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('projectCards.0.tracked_minutes', 150));
});
