<?php

use App\Models\LeaveRequest;
use App\Models\User;
use App\Services\LeaveRequestOverlapChecker;

it('detects overlapping leave periods for a user', function () {
    $user = User::factory()->create();
    $checker = app(LeaveRequestOverlapChecker::class);

    LeaveRequest::factory()->for($user)->approved()->create([
        'starts_on' => '2026-04-01',
        'ends_on' => '2026-04-10',
    ]);

    expect($checker->overlapsForUser($user->id, '2026-04-05', '2026-04-07'))->toBeTrue()
        ->and($checker->overlapsForUser($user->id, '2026-04-11', '2026-04-15'))->toBeFalse();
});
