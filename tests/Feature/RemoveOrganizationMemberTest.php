<?php

use App\Enums\TeamMembershipStatus;
use App\Enums\UserRole;
use App\Models\Organization;
use App\Models\Team;
use App\Models\TeamMembership;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('allows admins to remove employees from their organization', function () {
    $organization = Organization::factory()->create();
    $admin = User::factory()->admin($organization)->create();
    $employee = User::factory()->forOrganization($organization)->create([
        'role' => UserRole::Employee,
        'organization_joined_at' => now(),
    ]);
    $team = Team::factory()->for($organization)->create();
    TeamMembership::factory()->create([
        'team_id' => $team->id,
        'user_id' => $employee->id,
        'status' => TeamMembershipStatus::Approved,
    ]);

    $this->actingAs($admin)
        ->delete(route('settings.employees.destroy', $employee))
        ->assertRedirect(route('settings'));

    $employee->refresh();

    expect($employee->organization_id)->toBeNull()
        ->and($employee->organization_joined_at)->toBeNull()
        ->and($employee->role)->toBe(UserRole::Employee)
        ->and($employee->teamMemberships)->toBeEmpty();
});

it('forbids admins from removing themselves', function () {
    $organization = Organization::factory()->create();
    $admin = User::factory()->admin($organization)->create();

    $this->actingAs($admin)
        ->from(route('settings'))
        ->delete(route('settings.employees.destroy', $admin))
        ->assertRedirect(route('settings'))
        ->assertSessionHasErrors('user');

    expect($admin->fresh()->organization_id)->toBe($organization->id);
});

it('forbids removing the last admin from the organization', function () {
    $organization = Organization::factory()->create();
    $onlyAdmin = User::factory()->admin($organization)->create();
    $employee = User::factory()->forOrganization($organization)->create();

    $this->actingAs($onlyAdmin)
        ->from(route('settings'))
        ->delete(route('settings.employees.destroy', $onlyAdmin))
        ->assertRedirect(route('settings'))
        ->assertSessionHasErrors('user');

    $this->actingAs($onlyAdmin)
        ->delete(route('settings.employees.destroy', $employee))
        ->assertRedirect(route('settings'));

    expect($employee->fresh()->organization_id)->toBeNull();
});

it('forbids employees from removing organization members', function () {
    $organization = Organization::factory()->create();
    $employee = User::factory()->forOrganization($organization)->create([
        'role' => UserRole::Employee,
    ]);
    $colleague = User::factory()->forOrganization($organization)->create([
        'role' => UserRole::Employee,
    ]);

    $this->actingAs($employee)
        ->delete(route('settings.employees.destroy', $colleague))
        ->assertForbidden();

    expect($colleague->fresh()->organization_id)->toBe($organization->id);
});

it('forbids removing users outside the organization', function () {
    $organization = Organization::factory()->create();
    $otherOrganization = Organization::factory()->create();
    $admin = User::factory()->admin($organization)->create();
    $outsider = User::factory()->forOrganization($otherOrganization)->create();

    $this->actingAs($admin)
        ->delete(route('settings.employees.destroy', $outsider))
        ->assertNotFound();
});
