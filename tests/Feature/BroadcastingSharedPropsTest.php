<?php

declare(strict_types=1);

use App\Models\LeaveRequest;
use App\Models\Organization;
use App\Models\User;
use App\Notifications\LeaveRequestApprovedNotification;

it('always shares recent notifications on inertia responses', function () {
    $organization = Organization::factory()->create();
    $user = User::factory()->forOrganization($organization)->create();
    $leaveRequest = LeaveRequest::factory()->for($user)->create();

    config(['services.openai.key' => null]);
    $user->notify(new LeaveRequestApprovedNotification($leaveRequest));

    $this->actingAs($user)
        ->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('recentNotifications', 1)
            ->where('recentNotifications.0.title', 'Verlof goedgekeurd'));
});
