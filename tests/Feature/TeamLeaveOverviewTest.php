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

it('shows colleague leave on the employee dashboard for today', function () {
    $organization = Organization::factory()->create();
    $user = User::factory()->forOrganization($organization)->create();
    $colleague = User::factory()->forOrganization($organization)->create([
        'first_name' => 'Noor',
        'last_name' => 'Peeters',
    ]);

    $today = CarbonImmutable::now('Europe/Brussels')->startOfDay();

    LeaveRequest::factory()->for($colleague)->approved()->vacation()->create([
        'starts_on' => $today->toDateString(),
        'ends_on' => $today->addDay()->toDateString(),
    ]);

    $this->actingAs($user)
        ->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('dashboard')
            ->where('hasOrganization', true)
            ->has('teamLeaveToday', 1)
            ->where('teamLeaveToday.0.user.name', 'Noor Peeters'));
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
