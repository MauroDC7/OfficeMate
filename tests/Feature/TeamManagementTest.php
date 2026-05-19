<?php

use App\Enums\TeamMembershipStatus;
use App\Enums\UserRole;
use App\Models\Organization;
use App\Models\Team;
use App\Models\TeamMembership;
use App\Models\User;
use App\Services\OrganizationContext;

it('shows teams page for employees with organization context', function () {
    $organization = Organization::factory()->create(['name' => 'Acme']);
    $employee = User::factory()->forOrganization($organization)->create(['role' => UserRole::Employee]);
    $team = Team::factory()->for($organization)->create(['name' => 'Engineering']);

    $this->actingAs($employee)
        ->get(route('teams'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('teams')
            ->where('organization.name', 'Acme')
            ->where('isAdmin', false)
            ->has('teams', 1)
            ->where('teams.0.name', 'Engineering'));
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

it('allows admins to create teams', function () {
    $admin = User::factory()->create(['role' => UserRole::Admin]);
    $organization = app(OrganizationContext::class)->forUser($admin);

    $this->actingAs($admin)
        ->post(route('teams.store'), ['name' => 'Sales'])
        ->assertRedirect(route('teams'));

    $this->assertDatabaseHas('teams', [
        'organization_id' => $organization->id,
        'name' => 'Sales',
        'parent_id' => null,
    ]);
});

it('allows admins to approve pending memberships', function () {
    $admin = User::factory()->create(['role' => UserRole::Admin]);
    $membership = TeamMembership::factory()->pending()->create();

    $this->actingAs($admin)
        ->post(route('team-memberships.approve', $membership))
        ->assertRedirect(route('teams'));

    expect($membership->fresh()->status)->toBe(TeamMembershipStatus::Approved);
});

it('allows admins to reject pending memberships', function () {
    $admin = User::factory()->create(['role' => UserRole::Admin]);
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
    $admin = User::factory()->create(['role' => UserRole::Admin]);
    $organization = app(OrganizationContext::class)->forUser($admin);
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

it('allows admins to update organization name from settings', function () {
    $admin = User::factory()->create(['role' => UserRole::Admin]);
    $organization = Organization::factory()->create(['name' => 'Acme BV']);
    $admin->forceFill(['organization_id' => $organization->id])->save();

    $this->actingAs($admin)
        ->patch(route('settings.organization.update', $organization), [
            'name' => 'Acme International',
        ])
        ->assertRedirect(route('settings'));

    expect($organization->fresh()->name)->toBe('Acme International');
});

it('forbids employees from updating organization settings', function () {
    $employee = User::factory()->create(['role' => UserRole::Employee]);
    $organization = Organization::factory()->create();

    $this->actingAs($employee)
        ->patch(route('settings.organization.update', $organization), [
            'name' => 'Hacked Inc',
        ])
        ->assertForbidden();
});
