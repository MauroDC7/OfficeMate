<?php

use App\Enums\UserRole;
use App\Models\Organization;
use App\Models\User;
use App\Services\RecordOfficePresence;
use Carbon\CarbonImmutable;

it('records office presence when the request ip matches', function () {
    $organization = Organization::factory()->create([
        'office_ip_addresses' => ['203.0.113.10'],
    ]);
    $employee = User::factory()->forOrganization($organization)->create([
        'role' => UserRole::Employee,
    ]);

    app(RecordOfficePresence::class)->forUser($employee, '203.0.113.10');

    expect($employee->fresh()->last_seen_at_office)->not->toBeNull();
});

it('does not record office presence for a non matching ip', function () {
    $organization = Organization::factory()->create([
        'office_ip_addresses' => ['203.0.113.10'],
    ]);
    $employee = User::factory()->forOrganization($organization)->create([
        'role' => UserRole::Employee,
    ]);

    app(RecordOfficePresence::class)->forUser($employee, '198.51.100.4');

    expect($employee->fresh()->last_seen_at_office)->toBeNull();
});

it('records office presence through authenticated web requests', function () {
    $organization = Organization::factory()->create([
        'office_ip_addresses' => ['203.0.113.10'],
    ]);
    $employee = User::factory()->forOrganization($organization)->create([
        'role' => UserRole::Employee,
    ]);

    $this->actingAs($employee)
        ->withServerVariables(['REMOTE_ADDR' => '203.0.113.10'])
        ->get(route('dashboard'))
        ->assertOk();

    expect($employee->fresh()->last_seen_at_office)->not->toBeNull();
});

it('marks employees as in office on the teams people tab', function () {
    CarbonImmutable::setTestNow(CarbonImmutable::parse('2026-05-19 10:00:00', 'UTC'));

    $organization = Organization::factory()->create([
        'office_ip_addresses' => ['203.0.113.10'],
    ]);
    $admin = User::factory()->forOrganization($organization)->create([
        'role' => UserRole::Admin,
        'last_seen_at_office' => now(),
    ]);
    User::factory()->forOrganization($organization)->create([
        'role' => UserRole::Employee,
    ]);

    $this->actingAs($admin)
        ->get(route('teams', ['tab' => 'people']))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('people.summary.in_office', 1)
            ->where('people.summary.out_of_office', 1));

    CarbonImmutable::setTestNow();
});
