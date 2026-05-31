<?php

use App\Enums\TeamMembershipStatus;
use App\Enums\UserRole;
use App\Models\Organization;
use App\Models\Team;
use App\Models\TeamMembership;
use App\Models\User;

it('shows teams page for employees with organization context', function () {
    $organization = Organization::factory()->create(['name' => 'Acme']);
    $employee = User::factory()->forOrganization($organization)->create(['role' => UserRole::Employee]);
    $team = Team::factory()->for($organization)->create(['name' => 'Engineering']);
    TeamMembership::factory()->for($team)->for($employee)->approved()->create();

    $this->actingAs($employee)
        ->get(route('teams'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('teams')
            ->where('organization.name', 'Acme')
            ->where('isAdmin', false)
            ->has('teamCards', 1)
            ->where('teamCards.0.name', 'Engineering'));
});

it('hides teams from employees who are not members', function () {
    $organization = Organization::factory()->create();
    $employee = User::factory()->forOrganization($organization)->create(['role' => UserRole::Employee]);
    Team::factory()->for($organization)->create(['name' => 'Hidden Squad']);

    $this->actingAs($employee)
        ->get(route('teams'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('teamCards', 0));
});

it('shows all organization teams to admins', function () {
    $organization = Organization::factory()->create();
    $admin = User::factory()->forOrganization($organization)->create(['role' => UserRole::Admin]);
    Team::factory()->for($organization)->create(['name' => 'Alpha']);
    Team::factory()->for($organization)->create(['name' => 'Beta']);

    $this->actingAs($admin)
        ->get(route('teams'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('isAdmin', true)
            ->has('teamCards', 2));
});

it('prompts employees without organization to use settings', function () {
    $employee = User::factory()->create(['role' => UserRole::Employee]);

    $this->actingAs($employee)
        ->get(route('teams'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('organization', null));
});

it('allows employees to request team membership as pending', function () {
    $organization = Organization::factory()->create();
    $employee = User::factory()->forOrganization($organization)->create(['role' => UserRole::Employee]);
    $team = Team::factory()->for($organization)->create();

    $this->actingAs($employee)
        ->post(route('teams.join', $team))
        ->assertRedirect(route('teams'));

    $this->assertDatabaseHas('team_memberships', [
        'team_id' => $team->id,
        'user_id' => $employee->id,
        'status' => TeamMembershipStatus::Pending->value,
    ]);
});

it('forbids employees from creating teams', function () {
    $employee = User::factory()->create(['role' => UserRole::Employee]);

    $this->actingAs($employee)
        ->post(route('teams.store'), ['name' => 'Sales'])
        ->assertForbidden();
});

it('allows admins to create teams with members', function () {
    $admin = User::factory()->admin()->create();
    $organization = Organization::query()->findOrFail($admin->organization_id);
    $colleague = User::factory()->forOrganization($organization)->create(['role' => UserRole::Employee]);

    $this->actingAs($admin)
        ->post(route('teams.store'), [
            'name' => 'Sales',
            'department' => 'Commercial',
            'member_ids' => [$colleague->id],
        ])
        ->assertRedirect(route('teams'));

    $team = Team::query()->where('name', 'Sales')->first();

    expect($team)->not->toBeNull()
        ->and($team->department)->toBe('Commercial');

    $this->assertDatabaseHas('team_memberships', [
        'team_id' => $team->id,
        'user_id' => $colleague->id,
        'status' => TeamMembershipStatus::Approved->value,
    ]);
});

it('allows admins to approve pending memberships', function () {
    $admin = User::factory()->admin()->create();
    $membership = TeamMembership::factory()->pending()->create();

    $this->actingAs($admin)
        ->post(route('team-memberships.approve', $membership))
        ->assertRedirect(route('teams'));

    expect($membership->fresh()->status)->toBe(TeamMembershipStatus::Approved);
});

it('allows admins to reject pending memberships', function () {
    $admin = User::factory()->admin()->create();
    $membership = TeamMembership::factory()->pending()->create();

    $this->actingAs($admin)
        ->post(route('team-memberships.reject', $membership))
        ->assertRedirect(route('teams'));

    expect($membership->fresh()->status)->toBe(TeamMembershipStatus::Rejected);
});

it('allows employees to leave a team', function () {
    $employee = User::factory()->create(['role' => UserRole::Employee]);
    $membership = TeamMembership::factory()->for($employee)->approved()->create();

    $this->actingAs($employee)
        ->delete(route('team-memberships.destroy', $membership))
        ->assertRedirect(route('teams'));

    $this->assertDatabaseMissing('team_memberships', ['id' => $membership->id]);
});

it('lets rejected employees request membership again', function () {
    $organization = Organization::factory()->create();
    $employee = User::factory()->forOrganization($organization)->create(['role' => UserRole::Employee]);
    $team = Team::factory()->for($organization)->create();
    $membership = TeamMembership::factory()
        ->for($team)
        ->for($employee)
        ->create(['status' => TeamMembershipStatus::Rejected]);

    $this->actingAs($employee)
        ->post(route('teams.join', $team))
        ->assertRedirect(route('teams'));

    expect($membership->fresh()->status)->toBe(TeamMembershipStatus::Pending);
});

it('shows pending memberships for admins on the teams page', function () {
    $admin = User::factory()->admin()->create();
    $organization = Organization::query()->findOrFail($admin->organization_id);
    $employee = User::factory()->forOrganization($organization)->create(['role' => UserRole::Employee]);
    $team = Team::factory()->for($organization)->create(['name' => 'Support']);
    TeamMembership::factory()->for($team)->for($employee)->pending()->create();

    $this->actingAs($admin)
        ->get(route('teams'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('teams')
            ->where('isAdmin', true)
            ->has('pendingMemberships', 1)
            ->where('pendingMemberships.0.team.name', 'Support')
            ->where('pendingMemberships.0.user.email', $employee->email));
});

it('allows admins to update organization name from teams', function () {
    $organization = Organization::factory()->create(['name' => 'Acme BV']);
    $admin = User::factory()->admin($organization)->create();

    $this->actingAs($admin)
        ->patch(route('teams.organization.update', $organization), [
            'name' => 'Acme International',
        ])
        ->assertRedirect(route('teams'));

    expect($organization->fresh()->name)->toBe('Acme International');
});

it('forbids employees from updating organization settings', function () {
    $employee = User::factory()->create(['role' => UserRole::Employee]);
    $organization = Organization::factory()->create();

    $this->actingAs($employee)
        ->patch(route('teams.organization.update', $organization), [
            'name' => 'Hacked Inc',
        ])
        ->assertForbidden();
});
