<?php

use App\Models\User;
use App\Models\WeeklyStatusUpdate;
use App\Notifications\WeeklyStatusReminderNotification;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Str;

beforeEach(function () {
    CarbonImmutable::setTestNow(CarbonImmutable::parse('2026-05-22 15:00:00', 'Europe/Brussels'));
    Config::set('services.timesheets.timezone', 'Europe/Brussels');
    Notification::fake();
});

afterEach(function () {
    CarbonImmutable::setTestNow();
});

it('sends a reminder to users without a weekly status on friday', function () {
    $user = User::factory()->create();

    $this->artisan('weekly-status:send-reminders')
        ->assertSuccessful();

    Notification::assertSentTo($user, WeeklyStatusReminderNotification::class);
});

it('does not send duplicate reminders on the same day', function () {
    $user = User::factory()->create();

    $user->notifications()->create([
        'id' => (string) Str::uuid(),
        'type' => WeeklyStatusReminderNotification::class,
        'data' => [
            'title' => 'Weekly debrief invullen',
            'message' => 'Test',
        ],
    ]);

    $this->artisan('weekly-status:send-reminders')
        ->assertSuccessful();

    Notification::assertNothingSent();
});

it('does not remind users who already submitted their weekly status', function () {
    $user = User::factory()->create();
    $monday = CarbonImmutable::now()->startOfWeek(CarbonImmutable::MONDAY);

    WeeklyStatusUpdate::factory()->for($user)->create([
        'week_start' => $monday->toDateString(),
    ]);

    $this->artisan('weekly-status:send-reminders')
        ->assertSuccessful();

    Notification::assertNothingSent();
});

it('does not send reminders on other weekdays', function () {
    CarbonImmutable::setTestNow(CarbonImmutable::parse('2026-05-21 15:00:00', 'Europe/Brussels'));

    User::factory()->create();

    $this->artisan('weekly-status:send-reminders')
        ->assertSuccessful();

    Notification::assertNothingSent();
});
