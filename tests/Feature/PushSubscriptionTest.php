<?php

use App\Models\LeaveRequest;
use App\Models\User;
use App\Notifications\LeaveRequestApprovedNotification;
use NotificationChannels\WebPush\WebPushChannel;

it('stores a push subscription for the authenticated user', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->post(route('settings.push-subscription.store'), [
            'endpoint' => 'https://fcm.googleapis.com/fcm/send/example-endpoint',
            'keys' => [
                'p256dh' => base64_encode(str_repeat('a', 65)),
                'auth' => base64_encode(str_repeat('b', 16)),
            ],
        ])
        ->assertRedirect(route('settings').'#push');

    expect($user->pushSubscriptions()->count())->toBe(1);
});

it('removes a push subscription by endpoint', function () {
    $user = User::factory()->create();
    $endpoint = 'https://fcm.googleapis.com/fcm/send/example-endpoint';

    $user->updatePushSubscription(
        $endpoint,
        base64_encode(str_repeat('a', 65)),
        base64_encode(str_repeat('b', 16)),
    );

    $this->actingAs($user)
        ->delete(route('settings.push-subscription.destroy'), [
            'endpoint' => $endpoint,
        ])
        ->assertRedirect(route('settings').'#push');

    expect($user->pushSubscriptions()->count())->toBe(0);
});

it('includes web push for leave approval notifications', function () {
    $employee = User::factory()->create();
    $leaveRequest = LeaveRequest::factory()->for($employee)->pending()->create();
    $notification = new LeaveRequestApprovedNotification($leaveRequest);

    expect($notification->via($employee))->toContain(WebPushChannel::class);
});
