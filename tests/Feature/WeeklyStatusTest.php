<?php

use App\Models\Organization;
use App\Models\User;
use App\Models\WeeklyStatusUpdate;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\Config;

beforeEach(function () {
    CarbonImmutable::setTestNow(CarbonImmutable::parse('2026-05-22 15:30:00', 'Europe/Brussels'));
    Config::set('services.timesheets.timezone', 'Europe/Brussels');
});

afterEach(function () {
    CarbonImmutable::setTestNow();
});

function weeklyStatusUser(): User
{
    $organization = Organization::factory()->create();

    return User::factory()->forOrganization($organization)->create();
}

it('shows weekly status on the projects page', function () {
    $user = weeklyStatusUser();
    $monday = CarbonImmutable::now()->startOfWeek(CarbonImmutable::MONDAY);

    $this->actingAs($user)
        ->get(route('projects'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('projects')
            ->where('weeklyStatus.week_start', $monday->toDateString())
            ->where('weeklyStatus.difficult_this_week', null)
            ->where('weeklyStatus.reminder_due', true));
});

it('stores a weekly status update', function () {
    $user = weeklyStatusUser();
    $monday = CarbonImmutable::now()->startOfWeek(CarbonImmutable::MONDAY);

    $this->actingAs($user)
        ->post(route('weekly-status.store'), [
            'week_start' => $monday->toDateString(),
            'difficult_this_week' => 'Complexe integratie met externe API.',
            'plans_next_week' => 'Tests afronden en deployen.',
        ])
        ->assertRedirect(route('projects'));

    expect(WeeklyStatusUpdate::query()->where('user_id', $user->id)->count())->toBe(1);

    $status = WeeklyStatusUpdate::query()->first();

    expect($status->difficult_this_week)->toBe('Complexe integratie met externe API.')
        ->and($status->plans_next_week)->toBe('Tests afronden en deployen.')
        ->and($status->week_start->format('Y-m-d'))->toBe($monday->toDateString());
});

it('updates an existing weekly status for the same week', function () {
    $user = weeklyStatusUser();
    $monday = CarbonImmutable::now()->startOfWeek(CarbonImmutable::MONDAY);

    WeeklyStatusUpdate::factory()->for($user)->create([
        'week_start' => $monday->toDateString(),
        'difficult_this_week' => 'Oud',
        'plans_next_week' => 'Oud',
    ]);

    $this->actingAs($user)
        ->post(route('weekly-status.store'), [
            'week_start' => $monday->toDateString(),
            'difficult_this_week' => 'Nieuw moeilijk',
            'plans_next_week' => 'Nieuw plan',
        ])
        ->assertRedirect(route('projects'));

    expect(WeeklyStatusUpdate::query()->where('user_id', $user->id)->count())->toBe(1)
        ->and(WeeklyStatusUpdate::query()->first()->difficult_this_week)->toBe('Nieuw moeilijk');
});

it('marks reminder as not due before friday 15:00', function () {
    CarbonImmutable::setTestNow(CarbonImmutable::parse('2026-05-22 14:00:00', 'Europe/Brussels'));

    $user = weeklyStatusUser();

    $this->actingAs($user)
        ->get(route('projects'))
        ->assertInertia(fn ($page) => $page->where('weeklyStatus.reminder_due', false));
});

it('does not mark reminder as due on other weekdays after 15:00', function () {
    CarbonImmutable::setTestNow(CarbonImmutable::parse('2026-05-21 16:00:00', 'Europe/Brussels'));

    $user = weeklyStatusUser();

    $this->actingAs($user)
        ->get(route('projects'))
        ->assertInertia(fn ($page) => $page->where('weeklyStatus.reminder_due', false));
});

it('marks reminder as not due when already submitted', function () {
    $user = weeklyStatusUser();
    $monday = CarbonImmutable::now()->startOfWeek(CarbonImmutable::MONDAY);

    WeeklyStatusUpdate::factory()->for($user)->create([
        'week_start' => $monday->toDateString(),
    ]);

    $this->actingAs($user)
        ->get(route('projects'))
        ->assertInertia(fn ($page) => $page
            ->where('weeklyStatus.reminder_due', false)
            ->where('weeklyStatus.difficult_this_week', fn ($value) => $value !== null));
});
