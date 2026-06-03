<?php

use App\Models\TimesheetEntry;
use App\Models\User;

it('updates times when a timesheet entry is moved on the calendar', function () {
    $user = User::factory()->create();
    $entry = TimesheetEntry::factory()->for($user)->create([
        'worked_on' => '2026-06-02',
        'start_minutes' => 540,
        'end_minutes' => 600,
    ]);

    $this->actingAs($user)
        ->patch(route('timesheets.entries.update', $entry), [
            'title' => $entry->title,
            'description' => null,
            'project_id' => $entry->project_id,
            'worked_on' => '2026-06-02',
            'start_minutes' => 600,
            'end_minutes' => 660,
        ])
        ->assertSessionHasNoErrors()
        ->assertRedirect();

    expect($entry->fresh())
        ->start_minutes->toBe(600)
        ->end_minutes->toBe(660);
});

it('accepts fifteen minute time increments', function () {
    $user = User::factory()->create();
    $entry = TimesheetEntry::factory()->for($user)->create([
        'worked_on' => '2026-06-02',
        'start_minutes' => 540,
        'end_minutes' => 600,
    ]);

    $this->actingAs($user)
        ->patch(route('timesheets.entries.update', $entry), [
            'title' => $entry->title,
            'description' => null,
            'project_id' => $entry->project_id,
            'worked_on' => '2026-06-02',
            'start_minutes' => 545,
            'end_minutes' => 615,
        ])
        ->assertSessionHasNoErrors();

    expect($entry->fresh())
        ->start_minutes->toBe(545)
        ->end_minutes->toBe(615);
});

it('moves a timesheet entry to another weekday', function () {
    $user = User::factory()->create();
    $entry = TimesheetEntry::factory()->for($user)->create([
        'worked_on' => '2026-06-02',
        'start_minutes' => 540,
        'end_minutes' => 600,
    ]);

    $this->actingAs($user)
        ->patch(route('timesheets.entries.update', $entry), [
            'title' => $entry->title,
            'description' => null,
            'project_id' => $entry->project_id,
            'worked_on' => '2026-06-03',
            'start_minutes' => 540,
            'end_minutes' => 600,
        ])
        ->assertSessionHasNoErrors()
        ->assertRedirect();

    expect($entry->fresh())
        ->worked_on->toDateString()->toBe('2026-06-03');
});
