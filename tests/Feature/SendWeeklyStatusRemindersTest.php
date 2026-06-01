<?php

use App\Models\Organization;
use App\Models\User;
use App\Models\WeeklyStatusUpdate;
use App\Notifications\WeeklyStatusReminderNotification;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Config;
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

it('does not send reminders on other weekdays', function () {
    CarbonImmutable::setTestNow(CarbonImmutable::parse('2026-05-21 15:00:00', 'Europe/Brussels'));

    $organization = Organization::factory()->create();
    User::factory()->forOrganization($organization)->create();

    $this->artisan('weekly-status:send-reminders')
        ->assertSuccessful();

    Notification::assertNothingSent();
});
