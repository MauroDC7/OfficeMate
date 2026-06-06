<?php

use App\Models\Organization;
use App\Models\User;
use App\Models\WeeklyStatusUpdate;
use App\Notifications\WeeklyStatusReminderNotification;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Notification;

beforeEach(function () {
    CarbonImmutable::setTestNow(CarbonImmutable::parse('2026-05-22 15:00:00', 'Europe/Brussels'));
    Config::set('services.timesheets.timezone', 'Europe/Brussels');
    Config::set('services.weekly_debrief.reminder_weekday', 5);
    Config::set('services.weekly_debrief.reminder_time', '15:00');
    Notification::fake();
    Cache::flush();
});

afterEach(function () {
    CarbonImmutable::setTestNow();
});

it('sends an email reminder to users without a weekly debrief on friday', function () {
    $organization = Organization::factory()->create();
    $user = User::factory()->forOrganization($organization)->create();

    $this->artisan('weekly-status:send-reminders')
        ->assertSuccessful();

    Notification::assertSentTo($user, WeeklyStatusReminderNotification::class);
});

it('does not send duplicate email reminders in the same week', function () {
    $organization = Organization::factory()->create();
    $user = User::factory()->forOrganization($organization)->create();
    $weekStart = CarbonImmutable::now()->startOfWeek(CarbonImmutable::MONDAY)->toDateString();

    Cache::put("weekly-debrief-reminder:{$user->id}:{$weekStart}", true, now()->addDay());

    $this->artisan('weekly-status:send-reminders')
        ->assertSuccessful();

    Notification::assertNothingSent();
});

it('does not remind users who already submitted their weekly debrief', function () {
    $organization = Organization::factory()->create();
    $user = User::factory()->forOrganization($organization)->create();
    $monday = CarbonImmutable::now()->startOfWeek(CarbonImmutable::MONDAY);

    WeeklyStatusUpdate::factory()->for($user)->create([
        'week_start' => $monday->toDateString(),
    ]);

    $this->artisan('weekly-status:send-reminders')
        ->assertSuccessful();

    Notification::assertNothingSent();
});

it('sends reminders when --force is used outside the scheduled minute', function () {
    CarbonImmutable::setTestNow(CarbonImmutable::parse('2026-05-21 15:00:00', 'Europe/Brussels'));

    $organization = Organization::factory()->create();
    $user = User::factory()->forOrganization($organization)->create();

    $this->artisan('weekly-status:send-reminders', ['--force' => true])
        ->assertSuccessful();

    Notification::assertSentTo($user, WeeklyStatusReminderNotification::class);
});

it('does not send reminders on other weekdays', function () {
    CarbonImmutable::setTestNow(CarbonImmutable::parse('2026-05-21 15:00:00', 'Europe/Brussels'));

    $organization = Organization::factory()->create();
    User::factory()->forOrganization($organization)->create();

    $this->artisan('weekly-status:send-reminders')
        ->assertSuccessful();

    Notification::assertNothingSent();
});

it('sends a Slack digest per organization when the incoming webhook is configured', function () {
    Http::fake([
        'hooks.slack.com/*' => Http::response('ok', 200),
    ]);

    config([
        'services.slack.incoming_webhook_url' => 'https://hooks.slack.com/services/T000/B000/SECRET',
        'services.slack.weekly_debrief_reminders' => true,
    ]);

    $organization = Organization::factory()->create(['name' => 'Acme BV']);
    User::factory()->forOrganization($organization)->create([
        'first_name' => 'Jan',
        'last_name' => 'Janssen',
    ]);
    User::factory()->forOrganization($organization)->create([
        'first_name' => 'Piet',
        'last_name' => 'Pieters',
    ]);

    $this->artisan('weekly-status:send-reminders')
        ->assertSuccessful();

    Http::assertSent(fn ($request): bool => str_contains($request->url(), 'hooks.slack.com')
        && str_contains((string) $request->data()['text'], 'Acme BV')
        && str_contains((string) $request->data()['text'], 'Nog open:')
        && str_contains((string) $request->data()['text'], 'Jan Janssen'));
});

it('does not send a duplicate Slack digest in the same week', function () {
    Http::fake([
        'hooks.slack.com/*' => Http::response('ok', 200),
    ]);

    config([
        'services.slack.incoming_webhook_url' => 'https://hooks.slack.com/services/T000/B000/SECRET',
        'services.slack.weekly_debrief_reminders' => true,
    ]);

    $organization = Organization::factory()->create();
    User::factory()->forOrganization($organization)->create();
    $weekStart = CarbonImmutable::now()->startOfWeek(CarbonImmutable::MONDAY)->toDateString();

    Cache::put("weekly-debrief-slack-digest:{$organization->id}:{$weekStart}", true, now()->addDay());

    $this->artisan('weekly-status:send-reminders')
        ->assertSuccessful();

    Http::assertNothingSent();
});

it('sends only Slack digests with --slack-only and does not send emails', function () {
    Http::fake([
        'hooks.slack.com/*' => Http::response('ok', 200),
    ]);

    config([
        'services.slack.incoming_webhook_url' => 'https://hooks.slack.com/services/T000/B000/SECRET',
        'services.slack.weekly_debrief_reminders' => true,
    ]);

    $organization = Organization::factory()->create(['name' => 'Slack Only BV']);
    User::factory()->forOrganization($organization)->create();

    $this->artisan('weekly-status:send-reminders', ['--force' => true, '--slack-only' => true])
        ->assertSuccessful();

    Notification::assertNothingSent();

    Http::assertSent(fn ($request): bool => str_contains((string) $request->data()['text'], 'Slack Only BV'));
});

it('does not send Slack digests when the webhook URL is absent', function () {
    Http::fake();

    config([
        'services.slack.incoming_webhook_url' => null,
        'services.slack.weekly_debrief_reminders' => true,
    ]);

    $organization = Organization::factory()->create();
    User::factory()->forOrganization($organization)->create();

    $this->artisan('weekly-status:send-reminders')
        ->assertSuccessful();

    Http::assertNothingSent();
});
