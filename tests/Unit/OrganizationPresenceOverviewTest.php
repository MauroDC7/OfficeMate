<?php

use App\Enums\UserRole;
use App\Models\LeaveRequest;
use App\Models\Organization;
use App\Models\User;
use App\Services\OrganizationPresenceOverview;
use Carbon\CarbonImmutable;

beforeEach(function () {
    CarbonImmutable::setTestNow(CarbonImmutable::parse('2026-05-19 10:00:00', 'UTC'));
});

afterEach(function () {
    CarbonImmutable::setTestNow();
});

it('prioritizes sick leave over vacation for the same day', function () {
    $organization = Organization::factory()->create();
    $employee = User::factory()->forOrganization($organization)->create([
        'role' => UserRole::Employee,
    ]);

    LeaveRequest::factory()->for($employee)->approved()->vacation()->create([
        'starts_on' => '2026-05-19',
        'ends_on' => '2026-05-19',
    ]);
    LeaveRequest::factory()->for($employee)->approved()->sick()->create([
        'starts_on' => '2026-05-19',
        'ends_on' => '2026-05-19',
    ]);

    $overview = app(OrganizationPresenceOverview::class)->forOrganization($organization);

    expect($overview['summary']['sick'])->toBe(1)
        ->and($overview['summary']['vacation'])->toBe(0)
        ->and($overview['employees'][0]['status'])->toBe('sick');
});

it('marks employees without leave as out of office until they are seen at the office', function () {
    $organization = Organization::factory()->create();
    User::factory()->forOrganization($organization)->create([
        'role' => UserRole::Employee,
    ]);

    $overview = app(OrganizationPresenceOverview::class)->forOrganization($organization);

    expect($overview['summary']['out_of_office'])->toBe(1)
        ->and($overview['summary']['in_office'])->toBe(0)
        ->and($overview['employees'][0]['status'])->toBe('out_of_office');
});

it('marks employees as in office when they were seen at the office today', function () {
    $organization = Organization::factory()->create();
    User::factory()->forOrganization($organization)->create([
        'role' => UserRole::Employee,
        'last_seen_at_office' => CarbonImmutable::now(),
    ]);

    $overview = app(OrganizationPresenceOverview::class)->forOrganization($organization);

    expect($overview['summary']['in_office'])->toBe(1)
        ->and($overview['summary']['out_of_office'])->toBe(0)
        ->and($overview['employees'][0]['status'])->toBe('in_office');
});
