<?php

use App\Enums\UserRole;
use App\Models\Organization;
use App\Models\User;

it('lets admins store office ip addresses', function () {
    $organization = Organization::factory()->create();
    $admin = User::factory()->forOrganization($organization)->create([
        'role' => UserRole::Admin,
    ]);

    $this->actingAs($admin)
        ->patch(route('settings.organization.office-ips.update'), [
            'office_ip_addresses' => ['203.0.113.10', '192.168.1.0/24'],
        ])
        ->assertRedirect(route('settings'));

    expect($organization->fresh()->office_ip_addresses)->toBe([
        '203.0.113.10',
        '192.168.1.0/24',
    ]);
});

it('forbids employees from updating office ip addresses', function () {
    $organization = Organization::factory()->create();
    $employee = User::factory()->forOrganization($organization)->create([
        'role' => UserRole::Employee,
    ]);

    $this->actingAs($employee)
        ->patch(route('settings.organization.office-ips.update'), [
            'office_ip_addresses' => ['203.0.113.10'],
        ])
        ->assertForbidden();
});

it('exposes office ip settings to admins on the settings page', function () {
    $organization = Organization::factory()->create([
        'office_ip_addresses' => ['203.0.113.10'],
    ]);
    $admin = User::factory()->forOrganization($organization)->create([
        'role' => UserRole::Admin,
    ]);

    $this->actingAs($admin)
        ->get(route('settings'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('officePresence.office_ip_addresses', ['203.0.113.10']));
});
