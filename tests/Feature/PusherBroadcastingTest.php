<?php

declare(strict_types=1);
use Pusher\Pusher;

it('has the pusher php sdk installed for server-side broadcasts', function () {
    expect(class_exists(Pusher::class))->toBeTrue();
});

it('uses pusher as the configured broadcast connection in production setups', function () {
    config([
        'broadcasting.default' => 'pusher',
        'broadcasting.connections.pusher.driver' => 'pusher',
        'broadcasting.connections.pusher.key' => 'test-key',
        'broadcasting.connections.pusher.secret' => 'test-secret',
        'broadcasting.connections.pusher.app_id' => 'test-app',
        'broadcasting.connections.pusher.options.cluster' => 'eu',
    ]);

    expect(config('broadcasting.default'))->toBe('pusher')
        ->and(config('broadcasting.connections.pusher.options.cluster'))->toBe('eu');
});
