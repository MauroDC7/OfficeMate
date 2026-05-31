<?php

use App\Models\User;
use App\Services\Slack\SlackIncomingWebhook;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Notification;

it('calls the Slack webhook when an invite is sent and SLACK_INCOMING_WEBHOOK_URL is set', function () {
    Notification::fake();
    Http::fake([
        'hooks.slack.com/*' => Http::response('ok', 200),
    ]);

    config(['services.slack.incoming_webhook_url' => 'https://hooks.slack.com/services/T000/B000/SECRET']);

    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)
        ->post(route('teams.organization-invites.store'), [
            'email' => 'slack-invite@example.com',
        ])
        ->assertRedirect(route('teams'))
        ->assertSessionHas('status');

    Http::assertSent(fn ($request): bool => str_contains($request->url(), 'hooks.slack.com')
        && isset($request->data()['text'])
        && is_string($request->data()['text'])
        && $request->data()['text'] !== '');
});

it('does nothing when webhook URL is absent', function () {
    Http::fake();

    config(['services.slack.incoming_webhook_url' => null]);

    $slack = app(SlackIncomingWebhook::class);

    expect($slack->isConfigured())->toBeFalse();
    expect($slack->send('hello'))->toBeFalse();

    Http::assertNothingSent();
});
