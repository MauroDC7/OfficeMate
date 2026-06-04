<?php

use App\Models\User;

beforeEach(function () {
    config([
        'broadcasting.default' => 'pusher',
        'broadcasting.connections.pusher.key' => 'test-app-key',
        'broadcasting.connections.pusher.secret' => 'test-app-secret',
        'broadcasting.connections.pusher.app_id' => 'test-app-id',
        'broadcasting.connections.pusher.options.cluster' => 'eu',
    ]);
});

it('rejects unauthenticated broadcast auth', function () {
    $user = User::factory()->create();

    $this->post('/broadcasting/auth', [
        'socket_id' => '123.456',
        'channel_name' => 'private-user.'.$user->id,
    ])
        ->assertRedirect(route('login'));
});

it('authorizes the authenticated users private channel via post', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->post('/broadcasting/auth', [
            'socket_id' => '123.456',
            'channel_name' => 'private-user.'.$user->id,
        ])
        ->assertSuccessful()
        ->assertJsonStructure(['auth']);
});

it('rejects broadcast auth for another users channel', function () {
    $user = User::factory()->create();
    $other = User::factory()->create();

    $this->actingAs($user)
        ->post('/broadcasting/auth', [
            'socket_id' => '123.456',
            'channel_name' => 'private-user.'.$other->id,
        ])
        ->assertForbidden();
});

it('returns forbidden for get requests without channel data', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get('/broadcasting/auth')
        ->assertForbidden();
});

it('shares pusher config with authenticated inertia responses', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('broadcasting.key', 'test-app-key')
            ->where('broadcasting.cluster', 'eu'));
});
