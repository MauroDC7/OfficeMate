<?php

use App\Models\LeaveRequest;
use App\Models\User;
use App\Notifications\LeaveRequestApprovedNotification;
use App\Services\RecentInAppNotifications;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Http;

it('returns the five latest database notifications for a user', function () {
    Config::set('services.openai.key', null);

    $user = User::factory()->create();
    $leaveRequest = LeaveRequest::factory()->for($user)->create();

    $user->notify(new LeaveRequestApprovedNotification($leaveRequest));

    Http::fake();

    $items = app(RecentInAppNotifications::class)->forUser($user);

    expect($items)->toHaveCount(1)
        ->and($items[0]['title'])->toBe('Verlof goedgekeurd');
});
