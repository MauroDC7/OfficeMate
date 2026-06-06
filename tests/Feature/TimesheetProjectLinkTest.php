<?php

use App\Enums\ProjectType;
use App\Enums\UserRole;
use App\Models\Organization;
use App\Models\Project;
use App\Models\Team;
use App\Models\TeamMembership;
use App\Models\TimesheetEntry;
use App\Models\TimesheetEntryProposal;
use App\Models\User;
use Carbon\CarbonImmutable;

function timesheetWorkedOnYmd(): string
{
    $day = CarbonImmutable::now();

    while ($day->isWeekend()) {
        $day = $day->subDay();
    }

    return $day->toDateString();
}

it('exposes selectable projects on the timesheets page', function () {
    $organization = Organization::factory()->create();
    $user = User::factory()->forOrganization($organization)->create();
    $project = Project::factory()->for($organization)->create([
        'name' => 'NFC Betaal',
        'created_by' => $user->id,
    ]);

    $this->actingAs($user)
        ->get(route('timesheets'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('projectOptions', 1)
            ->where('projectOptions.0.name', 'NFC Betaal'));
});

it('stores a timesheet entry linked to a project and sets client name for external projects', function () {
    $organization = Organization::factory()->create();
    $user = User::factory()->forOrganization($organization)->create();
    $project = Project::factory()->for($organization)->create([
        'type' => ProjectType::External,
        'client_name' => 'Rabobank',
        'created_by' => $user->id,
    ]);

    $this->actingAs($user)
        ->post(route('timesheets.entries.store'), [
            'title' => 'Ontwikkeling',
            'description' => null,
            'color' => '#6b7280',
            'project_id' => $project->id,
            'worked_on' => timesheetWorkedOnYmd(),
            'start_minutes' => 540,
            'end_minutes' => 600,
        ])
        ->assertSessionHasNoErrors()
        ->assertRedirect();

    $this->assertDatabaseHas('timesheet_entries', [
        'user_id' => $user->id,
        'project_id' => $project->id,
        'client_name' => 'Rabobank',
    ]);
});

it('stores and updates the calendar color of a timesheet entry', function () {
    $user = User::factory()->create();
    $workedOn = timesheetWorkedOnYmd();

    $this->actingAs($user)
        ->post(route('timesheets.entries.store'), [
            'title' => 'Kleur test',
            'description' => null,
            'color' => '#6b7280',
            'project_id' => null,
            'worked_on' => $workedOn,
            'start_minutes' => 540,
            'end_minutes' => 600,
        ])
        ->assertSessionHasNoErrors()
        ->assertRedirect();

    $entry = TimesheetEntry::query()->where('user_id', $user->id)->firstOrFail();

    expect($entry->color)->toBe('#6b7280');

    $this->actingAs($user)
        ->patch(route('timesheets.entries.update', $entry), [
            'title' => $entry->title,
            'description' => null,
            'color' => '#dc2626',
            'project_id' => null,
            'worked_on' => $workedOn,
            'start_minutes' => 540,
            'end_minutes' => 600,
        ])
        ->assertSessionHasNoErrors()
        ->assertRedirect();

    expect($entry->fresh()->color)->toBe('#dc2626');
});

it('rejects invalid timesheet entry colors', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->post(route('timesheets.entries.store'), [
            'title' => 'Kleur test',
            'description' => null,
            'color' => 'paars',
            'project_id' => null,
            'worked_on' => timesheetWorkedOnYmd(),
            'start_minutes' => 540,
            'end_minutes' => 600,
        ])
        ->assertSessionHasErrors('color');
});

it('clears project and client when no project is selected', function () {
    $organization = Organization::factory()->create();
    $user = User::factory()->forOrganization($organization)->create();
    $project = Project::factory()->for($organization)->create(['created_by' => $user->id]);
    $workedOn = timesheetWorkedOnYmd();
    $entry = TimesheetEntry::factory()->for($user)->create([
        'project_id' => $project->id,
        'client_name' => 'Oud',
        'worked_on' => $workedOn,
        'start_minutes' => 540,
        'end_minutes' => 600,
    ]);

    $this->actingAs($user)
        ->patch(route('timesheets.entries.update', $entry), [
            'title' => $entry->title,
            'description' => null,
            'color' => $entry->color,
            'project_id' => '',
            'worked_on' => $workedOn,
            'start_minutes' => 540,
            'end_minutes' => 600,
        ])
        ->assertSessionHasNoErrors()
        ->assertRedirect();

    expect($entry->fresh())
        ->project_id->toBeNull()
        ->client_name->toBeNull();
});

it('rejects projects the employee cannot access', function () {
    $organization = Organization::factory()->create();
    $employee = User::factory()->forOrganization($organization)->create();
    $hidden = Project::factory()->for($organization)->create();

    $this->actingAs($employee)
        ->post(route('timesheets.entries.store'), [
            'title' => 'Test',
            'description' => null,
            'color' => '#6b7280',
            'project_id' => $hidden->id,
            'worked_on' => timesheetWorkedOnYmd(),
            'start_minutes' => 540,
            'end_minutes' => 600,
        ])
        ->assertSessionHasErrors('project_id');
});

it('allows employees to log time on projects linked to their team', function () {
    $organization = Organization::factory()->create();
    $employee = User::factory()->forOrganization($organization)->create();
    $team = Team::factory()->for($organization)->create();
    TeamMembership::factory()->for($team)->for($employee)->approved()->create();
    $project = Project::factory()->for($organization)->internal()->create();
    $project->teams()->attach($team);

    $this->actingAs($employee)
        ->post(route('timesheets.entries.store'), [
            'title' => 'Intern werk',
            'description' => null,
            'color' => '#6b7280',
            'project_id' => $project->id,
            'worked_on' => timesheetWorkedOnYmd(),
            'start_minutes' => 540,
            'end_minutes' => 600,
        ])
        ->assertSessionHasNoErrors()
        ->assertRedirect();

    $this->assertDatabaseHas('timesheet_entries', [
        'user_id' => $employee->id,
        'project_id' => $project->id,
        'client_name' => null,
    ]);
});

it('updates a proposal with a project and copies it when approved', function () {
    $organization = Organization::factory()->create();
    $admin = User::factory()->forOrganization($organization)->create(['role' => UserRole::Admin]);
    $project = Project::factory()->for($organization)->create([
        'type' => ProjectType::External,
        'client_name' => 'ING',
    ]);
    $workedOn = timesheetWorkedOnYmd();
    $proposal = TimesheetEntryProposal::factory()->for($admin)->create([
        'worked_on' => $workedOn,
        'start_minutes' => 540,
        'end_minutes' => 600,
    ]);

    $this->actingAs($admin)
        ->patch(route('timesheets.proposals.update', $proposal), [
            'title' => $proposal->title,
            'description' => null,
            'project_id' => $project->id,
            'worked_on' => $workedOn,
            'start_minutes' => 540,
            'end_minutes' => 600,
        ])
        ->assertSessionHasNoErrors()
        ->assertRedirect();

    expect($proposal->fresh())
        ->project_id->toBe($project->id)
        ->client_name->toBe('ING');

    $this->actingAs($admin)
        ->post(route('timesheets.proposals.approve', $proposal))
        ->assertRedirect();

    $this->assertDatabaseHas('timesheet_entries', [
        'user_id' => $admin->id,
        'project_id' => $project->id,
        'client_name' => 'ING',
    ]);
    $this->assertDatabaseMissing('timesheet_entry_proposals', ['id' => $proposal->id]);
});
