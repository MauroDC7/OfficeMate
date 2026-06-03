<?php

use App\Enums\UserRole;
use App\Models\DesktopActivity;
use App\Models\EmploymentProfile;
use App\Models\Organization;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;

uses(RefreshDatabase::class);

it('shows tracker status for organization members', function () {
    $organization = Organization::factory()->create();
    $employee = User::factory()->forOrganization($organization)->create([
        'role' => UserRole::Employee,
        'weekly_work_hours' => 38,
        'annual_leave_days' => 20,
    ]);

    $employee->createToken('officemate-tracker');

    DesktopActivity::factory()->for($employee)->create([
        'ended_at' => now()->subMinutes(5),
    ]);

    $this->actingAs($employee)
        ->get(route('settings'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('awaitingOrganizationInvite', false)
            ->where('isAdmin', false)
            ->where('tracker.is_connected', true)
            ->where('tracker.is_active', true)
            ->where('tracker.last_activity_label', fn ($label) => is_string($label) && $label !== '')
            ->where('tracker.recent_activity_count_7d', 1)
            ->where('tracker.use_ai_for_proposals', true)
            ->where('tracker.is_admin', false)
            ->where('employment', null));
});

it('shows employment defaults and profiles for admins', function () {
    $organization = Organization::factory()->create([
        'default_weekly_work_hours' => 38,
        'default_annual_leave_days' => 22,
    ]);
    $admin = User::factory()->forOrganization($organization)->create([
        'role' => UserRole::Admin,
    ]);
    $profile = EmploymentProfile::factory()->for($organization)->create([
        'name' => 'Deeltijd',
        'weekly_work_hours' => 32,
        'annual_leave_days' => 20,
    ]);

    $this->actingAs($admin)
        ->get(route('settings'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('isAdmin', true)
            ->where('employment.defaults.weekly_work_hours', 38)
            ->where('employment.defaults.annual_leave_days', 22)
            ->where('employment.profiles.0.id', $profile->id)
            ->where('employment.max_profiles', 5));
});

it('allows admins to update organization employment defaults', function () {
    $organization = Organization::factory()->create();
    $admin = User::factory()->forOrganization($organization)->create([
        'role' => UserRole::Admin,
    ]);

    $this->actingAs($admin)
        ->patch(route('settings.organization.employment-defaults.update'), [
            'default_weekly_work_hours' => 36,
            'default_annual_leave_days' => 24,
        ])
        ->assertRedirect(route('settings'));

    expect($organization->fresh())
        ->default_weekly_work_hours->toBe(36)
        ->default_annual_leave_days->toBe(24);
});

it('allows admins to assign a contract profile to an employee', function () {
    $organization = Organization::factory()->create();
    $admin = User::factory()->forOrganization($organization)->create([
        'role' => UserRole::Admin,
    ]);
    $employee = User::factory()->forOrganization($organization)->create([
        'role' => UserRole::Employee,
    ]);
    $profile = EmploymentProfile::factory()->for($organization)->create([
        'weekly_work_hours' => 32,
        'annual_leave_days' => 18,
    ]);

    $this->actingAs($admin)
        ->patch(route('settings.employees.employment.update', $employee), [
            'mode' => 'profile',
            'employment_profile_id' => $profile->id,
        ])
        ->assertRedirect(route('settings'));

    $employee->refresh();

    expect($employee->employment_profile_id)->toBe($profile->id)
        ->and($employee->weekly_work_hours)->toBe(32)
        ->and($employee->annual_leave_days)->toBe(18);
});

it('allows admins to set custom employment values', function () {
    $organization = Organization::factory()->create();
    $admin = User::factory()->forOrganization($organization)->create([
        'role' => UserRole::Admin,
    ]);
    $employee = User::factory()->forOrganization($organization)->create([
        'role' => UserRole::Employee,
    ]);

    $this->actingAs($admin)
        ->patch(route('settings.employees.employment.update', $employee), [
            'mode' => 'custom',
            'weekly_work_hours' => 28,
            'annual_leave_days' => 15,
        ])
        ->assertRedirect(route('settings'));

    expect($employee->fresh())
        ->employment_profile_id->toBeNull()
        ->weekly_work_hours->toBe(28)
        ->annual_leave_days->toBe(15);
});

it('searches employees by name or email', function () {
    $organization = Organization::factory()->create();
    $admin = User::factory()->forOrganization($organization)->create([
        'role' => UserRole::Admin,
    ]);
    $employee = User::factory()->forOrganization($organization)->create([
        'role' => UserRole::Employee,
        'first_name' => 'Zoë',
        'last_name' => 'Vermeulen',
        'email' => 'zoe@acme.test',
    ]);

    $this->actingAs($admin)
        ->getJson(route('settings.employees.search', ['q' => 'zoe@']))
        ->assertOk()
        ->assertJsonPath('results.0.id', $employee->id);
});

it('forbids employees from updating employment settings', function () {
    $organization = Organization::factory()->create();
    $employee = User::factory()->forOrganization($organization)->create([
        'role' => UserRole::Employee,
    ]);
    $colleague = User::factory()->forOrganization($organization)->create([
        'role' => UserRole::Employee,
    ]);

    $this->actingAs($employee)
        ->patch(route('settings.employees.employment.update', $colleague), [
            'mode' => 'custom',
            'weekly_work_hours' => 20,
            'annual_leave_days' => 10,
        ])
        ->assertForbidden();
});

it('preselects an employee when opening settings from the dashboard link', function () {
    $organization = Organization::factory()->create();
    $admin = User::factory()->forOrganization($organization)->create([
        'role' => UserRole::Admin,
    ]);
    $employee = User::factory()->forOrganization($organization)->create([
        'role' => UserRole::Employee,
        'organization_joined_at' => now(),
    ]);

    $this->actingAs($admin)
        ->get(route('settings', ['employee' => $employee->id]))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('employment.preselectedEmployee.id', $employee->id)
            ->where('employment.preselectedEmployee.email', $employee->email));
});

it('marks employment setup complete when admin saves employee settings', function () {
    $organization = Organization::factory()->create();
    $admin = User::factory()->forOrganization($organization)->create([
        'role' => UserRole::Admin,
    ]);
    $employee = User::factory()->forOrganization($organization)->create([
        'role' => UserRole::Employee,
        'organization_joined_at' => now(),
        'employment_setup_completed_at' => null,
    ]);

    $this->actingAs($admin)
        ->patch(route('settings.employees.employment.update', $employee), [
            'mode' => 'organization_default',
        ])
        ->assertRedirect(route('settings'));

    expect($employee->fresh()->employment_setup_completed_at)->not->toBeNull();
});

it('limits employment profiles per organization', function () {
    $organization = Organization::factory()->create();
    $admin = User::factory()->forOrganization($organization)->create([
        'role' => UserRole::Admin,
    ]);

    EmploymentProfile::factory()->count(5)->for($organization)->create();

    $this->actingAs($admin)
        ->post(route('settings.employment-profiles.store'), [
            'name' => 'Extra',
            'weekly_work_hours' => 40,
            'annual_leave_days' => 25,
        ])
        ->assertSessionHasErrors('name');
});
