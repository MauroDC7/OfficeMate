<?php

use App\Events\InAppNotificationChanged;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;

it('broadcasts immediately on the user private channel', function (): void {
    $event = new InAppNotificationChanged(42);

    expect($event)->toBeInstanceOf(ShouldBroadcastNow::class)
        ->and($event->broadcastOn())->toEqual([new PrivateChannel('user.42')])
        ->and($event->broadcastAs())->toBe('notification.changed');
});
