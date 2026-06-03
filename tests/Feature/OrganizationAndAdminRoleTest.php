<?php

use App\Enums\UserRole;
use App\Models\Organization;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;

uses(RefreshDatabase::class);

it('lets employees without an organization create one and become admin', function () {
    $employee = User::factory()->create([
        'role' => UserRole::Employee,
        'organization_id' => null,
    ]);

    $this->actingAs($employee)
        ->post(route('settings.organization.store'), [
            'name' => 'Acme BV',
        ])
        ->assertRedirect(route('settings'));

    $employee->refresh();

    expect($employee->role)->toBe(UserRole::Admin)
        ->and($employee->organization_id)->not->toBeNull()
        ->and(Organization::query()->find($employee->organization_id)?->name)->toBe('Acme BV');
});

it('shows organization setup on settings when the user has no organization', function () {
    $employee = User::factory()->create([
        'organization_id' => null,
    ]);

    $this->actingAs($employee)
        ->get(route('settings'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('canCreateOrganization', true)
            ->where('isAdmin', false));
});

it('allows admins to grant admin rights to employees in the same organization', function () {
    $organization = Organization::factory()->create();
    $admin = User::factory()->admin($organization)->create();
    $employee = User::factory()->forOrganization($organization)->create([
        'role' => UserRole::Employee,
    ]);

    $this->actingAs($admin)
        ->post(route('settings.employees.admin-role.store', $employee))
        ->assertRedirect(route('settings'));

    expect($employee->fresh()->role)->toBe(UserRole::Admin);
});

it('forbids employees from granting admin rights', function () {
    $organization = Organization::factory()->create();
    $employee = User::factory()->forOrganization($organization)->create([
        'role' => UserRole::Employee,
    ]);
    $colleague = User::factory()->forOrganization($organization)->create([
        'role' => UserRole::Employee,
    ]);

    $this->actingAs($employee)
        ->post(route('settings.employees.admin-role.store', $colleague))
        ->assertForbidden();
});

it('forbids granting admin rights to users outside the organization', function () {
    $organization = Organization::factory()->create();
    $otherOrganization = Organization::factory()->create();
    $admin = User::factory()->admin($organization)->create();
    $outsider = User::factory()->forOrganization($otherOrganization)->create([
        'role' => UserRole::Employee,
    ]);

    $this->actingAs($admin)
        ->post(route('settings.employees.admin-role.store', $outsider))
        ->assertNotFound();
});

it('forbids creating a second organization when already linked', function () {
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)
        ->from(route('settings'))
        ->post(route('settings.organization.store'), [
            'name' => 'Nog een bedrijf',
        ])
        ->assertRedirect(route('settings'))
        ->assertSessionHasErrors('name');
});
