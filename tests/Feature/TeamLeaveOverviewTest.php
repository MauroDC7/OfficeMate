<?php

use App\Models\LeaveRequest;
use App\Models\Organization;
use App\Models\User;
use Carbon\CarbonImmutable;

beforeEach(function () {
    CarbonImmutable::setTestNow(CarbonImmutable::parse('2026-05-19 10:00:00', 'UTC'));
});

afterEach(function () {
    CarbonImmutable::setTestNow();
});

it('shows colleague leave on the employee dashboard for the current week', function () {
    $organization = Organization::factory()->create();
    $user = User::factory()->forOrganization($organization)->create();
    $colleague = User::factory()->forOrganization($organization)->create([
        'first_name' => 'Noor',
        'last_name' => 'Peeters',
    ]);

    $monday = CarbonImmutable::now()->startOfWeek(CarbonImmutable::MONDAY);

    LeaveRequest::factory()->for($colleague)->approved()->vacation()->create([
        'starts_on' => $monday->addDay()->toDateString(),
        'ends_on' => $monday->addDays(2)->toDateString(),
    ]);

    LeaveRequest::factory()->for($user)->approved()->create([
        'starts_on' => $monday->toDateString(),
        'ends_on' => $monday->toDateString(),
    ]);

    $this->actingAs($user)
        ->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('dashboard')
            ->where('hasOrganization', true)
            ->has('teamLeaveThisWeek', 1)
            ->where('teamLeaveThisWeek.0.user.name', 'Noor Peeters'));
});

it('shows upcoming colleague leave on the leave requests page', function () {
    $organization = Organization::factory()->create();
    $user = User::factory()->forOrganization($organization)->create();
    $colleague = User::factory()->forOrganization($organization)->create([
        'first_name' => 'Tom',
        'last_name' => 'Janssens',
    ]);

    LeaveRequest::factory()->for($colleague)->approved()->create([
        'starts_on' => '2026-06-10',
        'ends_on' => '2026-06-12',
    ]);

    $this->actingAs($user)
        ->get(route('leaveRequests'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('leaveRequests')
            ->where('hasOrganization', true)
            ->has('teamLeaveUpcoming', 1)
            ->where('teamLeaveUpcoming.0.user.name', 'Tom Janssens'));
});

it('returns empty team leave when the user has no organization', function () {
    $user = User::factory()->create(['organization_id' => null]);

    $this->actingAs($user)
        ->get(route('leaveRequests'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('hasOrganization', false)
            ->has('teamLeaveUpcoming', 0));
});
