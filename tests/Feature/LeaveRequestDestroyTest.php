<?php

use App\Models\LeaveRequest;
use App\Models\User;

it('allows the owner to withdraw a pending leave request', function () {
    $user = User::factory()->create();
    $leaveRequest = LeaveRequest::factory()->for($user)->pending()->create();

    $this->actingAs($user)
        ->delete(route('leaveRequests.destroy', $leaveRequest))
        ->assertRedirect(route('leaveRequests'));

    expect(LeaveRequest::query()->find($leaveRequest->id))->toBeNull();
});

it('forbids withdrawing an approved leave request', function () {
    $user = User::factory()->create();
    $leaveRequest = LeaveRequest::factory()->for($user)->approved()->create();

    $this->actingAs($user)
        ->delete(route('leaveRequests.destroy', $leaveRequest))
        ->assertForbidden();

    expect(LeaveRequest::query()->find($leaveRequest->id))->not->toBeNull();
});

it('forbids withdrawing another users leave request', function () {
    $owner = User::factory()->create();
    $other = User::factory()->create();
    $leaveRequest = LeaveRequest::factory()->for($owner)->pending()->create();

    $this->actingAs($other)
        ->delete(route('leaveRequests.destroy', $leaveRequest))
        ->assertForbidden();
});

it('requires authentication to withdraw a leave request', function () {
    $leaveRequest = LeaveRequest::factory()->create();

    $this->delete(route('leaveRequests.destroy', $leaveRequest))
        ->assertRedirect(route('login'));
});
