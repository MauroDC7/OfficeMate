<?php

use App\Models\TimesheetEntry;
use App\Models\TimesheetEntryProposal;
use App\Models\User;

it('updates a proposal owned by the authenticated user', function () {
    $user = User::factory()->create();

    $proposal = TimesheetEntryProposal::factory()->for($user)->create([
        'worked_on' => '2026-05-11',
        'title' => 'Origineel',
        'start_minutes' => 9 * 60,
        'end_minutes' => 10 * 60,
    ]);

    $response = $this->actingAs($user)->patch("/timesheets/proposals/{$proposal->id}", [
        'title' => 'Bijgewerkt voorstel',
        'description' => 'Nieuwe beschrijving',
        'client_name' => 'Klant Z',
        'worked_on' => '2026-05-11',
        'start_minutes' => 9 * 60 + 30,
        'end_minutes' => 11 * 60,
    ]);

    $response->assertRedirect();

    expect($proposal->fresh())
        ->title->toBe('Bijgewerkt voorstel')
        ->description->toBe('Nieuwe beschrijving')
        ->client_name->toBe('Klant Z')
        ->start_minutes->toBe(9 * 60 + 30)
        ->end_minutes->toBe(11 * 60);
});

it('refuses to update a proposal that belongs to another user', function () {
    $owner = User::factory()->create();
    $intruder = User::factory()->create();

    $proposal = TimesheetEntryProposal::factory()->for($owner)->create();

    $this->actingAs($intruder)
        ->patch("/timesheets/proposals/{$proposal->id}", [
            'title' => 'Hack',
            'worked_on' => '2026-05-11',
            'start_minutes' => 9 * 60,
            'end_minutes' => 10 * 60,
        ])
        ->assertForbidden();
});

it('approves a proposal by creating a timesheet entry and deleting the proposal', function () {
    $user = User::factory()->create();

    $proposal = TimesheetEntryProposal::factory()->for($user)->create([
        'worked_on' => '2026-05-11',
        'title' => 'OfficeMate ontwikkeling',
        'description' => 'AI module',
        'client_name' => null,
        'start_minutes' => 9 * 60,
        'end_minutes' => 11 * 60,
    ]);

    $response = $this->actingAs($user)->post("/timesheets/proposals/{$proposal->id}/approve");

    $response->assertRedirect();

    expect(TimesheetEntryProposal::query()->whereKey($proposal->id)->exists())->toBeFalse()
        ->and(TimesheetEntry::query()->where('user_id', $user->id)->count())->toBe(1);

    $entry = TimesheetEntry::query()->where('user_id', $user->id)->first();
    expect($entry->title)->toBe('OfficeMate ontwikkeling')
        ->and($entry->description)->toBe('AI module')
        ->and($entry->worked_on->format('Y-m-d'))->toBe('2026-05-11')
        ->and($entry->start_minutes)->toBe(9 * 60)
        ->and($entry->end_minutes)->toBe(11 * 60);
});

it('redirects to the monday of the worked-on week after approval', function () {
    $user = User::factory()->create();

    $proposal = TimesheetEntryProposal::factory()->for($user)->create([
        'worked_on' => '2026-05-13', // Wednesday — should redirect to Monday 2026-05-11
    ]);

    $this->actingAs($user)
        ->post("/timesheets/proposals/{$proposal->id}/approve")
        ->assertRedirect(route('timesheets', ['week' => '2026-05-11']));
});

it('blocks approval when the proposal overlaps an existing entry', function () {
    $user = User::factory()->create();

    TimesheetEntry::factory()->for($user)->create([
        'worked_on' => '2026-05-11',
        'start_minutes' => 9 * 60,
        'end_minutes' => 10 * 60,
    ]);

    $proposal = TimesheetEntryProposal::factory()->for($user)->create([
        'worked_on' => '2026-05-11',
        'start_minutes' => 9 * 60 + 30,
        'end_minutes' => 10 * 60 + 30,
    ]);

    $this->actingAs($user)
        ->from('/timesheets')
        ->post("/timesheets/proposals/{$proposal->id}/approve")
        ->assertSessionHasErrors('start_minutes');

    expect(TimesheetEntryProposal::query()->whereKey($proposal->id)->exists())->toBeTrue();
});

it('deletes a proposal owned by the authenticated user', function () {
    $user = User::factory()->create();
    $proposal = TimesheetEntryProposal::factory()->for($user)->create();

    $this->actingAs($user)
        ->delete("/timesheets/proposals/{$proposal->id}")
        ->assertRedirect();

    expect(TimesheetEntryProposal::query()->whereKey($proposal->id)->exists())->toBeFalse();
});
