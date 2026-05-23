<?php

use App\Events\TimesheetEntryChanged;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;

it('broadcasts immediately on the user private channel', function (): void {
    $event = new TimesheetEntryChanged(42);

    expect($event)->toBeInstanceOf(ShouldBroadcastNow::class)
        ->and($event->broadcastOn())->toEqual([new PrivateChannel('user.42')])
        ->and($event->broadcastAs())->toBe('timesheet.changed');
});
