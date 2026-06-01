<?php

use App\Enums\UserRole;
use App\Models\Organization;
use App\Models\User;
use App\Models\WeeklyDebriefSummary;
use App\Models\WeeklyStatusUpdate;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Http;

beforeEach(function () {
    CarbonImmutable::setTestNow(CarbonImmutable::parse('2026-05-20 10:00:00', 'Europe/Brussels'));
    Config::set('services.timesheets.timezone', 'Europe/Brussels');
    Config::set('services.openai.key', null);
});

afterEach(function () {
    CarbonImmutable::setTestNow();
});

it('shows weekly debrief submissions for the selected week', function () {
    $organization = Organization::factory()->create();
    $admin = User::factory()->forOrganization($organization)->create([
        'role' => UserRole::Admin,
    ]);
    $employee = User::factory()->forOrganization($organization)->create([
        'role' => UserRole::Employee,
        'first_name' => 'Jan',
        'last_name' => 'Jansen',
    ]);
    $monday = CarbonImmutable::now()->startOfWeek(CarbonImmutable::MONDAY);

    WeeklyStatusUpdate::factory()->for($employee)->create([
        'week_start' => $monday->toDateString(),
        'difficult_this_week' => 'API-integratie',
        'plans_next_week' => 'Tests afronden',
    ]);

    $this->actingAs($admin)
        ->get(route('admin.weeklyDebrief', ['week' => $monday->toDateString()]))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('admin/weeklyDebrief')
            ->where('weekStart', $monday->toDateString())
            ->where('submittedCount', 1)
            ->where('aiConfigured', false)
            ->where('canGenerateSummary', false)
            ->where('summary', null)
            ->where('rows', fn ($rows) => collect($rows)->contains(
                fn ($row) => $row['user']['name'] === 'Jan Jansen'
                    && $row['submitted'] === true
                    && $row['difficult_this_week'] === 'API-integratie',
            )));
});

it('forbids employees from viewing the weekly debrief overview', function () {
    $organization = Organization::factory()->create();
    $employee = User::factory()->forOrganization($organization)->create([
        'role' => UserRole::Employee,
    ]);

    $this->actingAs($employee)
        ->get(route('admin.weeklyDebrief'))
        ->assertForbidden();
});

it('generates and caches an AI team summary for the week', function () {
    Config::set('services.openai.key', 'sk-test');
    Config::set('services.openai.model', 'gpt-4o-mini');

    $organization = Organization::factory()->create();
    $admin = User::factory()->forOrganization($organization)->create([
        'role' => UserRole::Admin,
    ]);
    $employee = User::factory()->forOrganization($organization)->create([
        'role' => UserRole::Employee,
        'first_name' => 'Jan',
        'last_name' => 'Jansen',
    ]);
    $monday = CarbonImmutable::now()->startOfWeek(CarbonImmutable::MONDAY);

    WeeklyStatusUpdate::factory()->for($employee)->create([
        'week_start' => $monday->toDateString(),
        'difficult_this_week' => 'API-integratie',
        'plans_next_week' => 'Tests afronden',
    ]);

    $markdown = "## Deze week in het kort\nTeam werkte aan API.\n\n## Aandachtspunten voor lead\nJan heeft hulp nodig.";

    Http::fake([
        'api.openai.com/v1/chat/completions' => Http::response([
            'choices' => [
                ['message' => ['content' => $markdown]],
            ],
        ]),
    ]);

    $this->actingAs($admin)
        ->post(route('admin.weeklyDebrief.summarize'), ['week' => $monday->toDateString()])
        ->assertRedirect(route('admin.weeklyDebrief', ['week' => $monday->toDateString()]));

    expect(WeeklyDebriefSummary::query()->count())->toBe(1);

    $this->actingAs($admin)
        ->get(route('admin.weeklyDebrief', ['week' => $monday->toDateString()]))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('aiConfigured', true)
            ->where('canGenerateSummary', true)
            ->where('summary.content', $markdown)
            ->where('summary.submitted_count', 1));
});

it('rejects summary generation without openai key', function () {
    Config::set('services.openai.key', null);

    $organization = Organization::factory()->create();
    $admin = User::factory()->forOrganization($organization)->create([
        'role' => UserRole::Admin,
    ]);
    $employee = User::factory()->forOrganization($organization)->create();
    $monday = CarbonImmutable::now()->startOfWeek(CarbonImmutable::MONDAY);

    WeeklyStatusUpdate::factory()->for($employee)->create([
        'week_start' => $monday->toDateString(),
    ]);

    $this->actingAs($admin)
        ->post(route('admin.weeklyDebrief.summarize'), ['week' => $monday->toDateString()])
        ->assertSessionHasErrors('summary');
});

it('rejects summary generation when nobody submitted', function () {
    Config::set('services.openai.key', 'sk-test');

    $organization = Organization::factory()->create();
    $admin = User::factory()->forOrganization($organization)->create([
        'role' => UserRole::Admin,
    ]);
    User::factory()->forOrganization($organization)->create();
    $monday = CarbonImmutable::now()->startOfWeek(CarbonImmutable::MONDAY);

    $this->actingAs($admin)
        ->post(route('admin.weeklyDebrief.summarize'), ['week' => $monday->toDateString()])
        ->assertSessionHasErrors('summary');

    Http::assertNothingSent();
});

it('forbids employees from generating a summary', function () {
    Config::set('services.openai.key', 'sk-test');

    $organization = Organization::factory()->create();
    $employee = User::factory()->forOrganization($organization)->create([
        'role' => UserRole::Employee,
    ]);
    $monday = CarbonImmutable::now()->startOfWeek(CarbonImmutable::MONDAY);

    $this->actingAs($employee)
        ->post(route('admin.weeklyDebrief.summarize'), ['week' => $monday->toDateString()])
        ->assertForbidden();
});
