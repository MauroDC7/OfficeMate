<?php

use App\Models\TimesheetEntry;
use App\Models\User;

it('returns back for inertia timesheet entry updates', function () {
    $user = User::factory()->create();
    $entry = TimesheetEntry::factory()->for($user)->create([
        'worked_on' => '2026-06-02',
        'start_minutes' => 540,
        'end_minutes' => 600,
    ]);

    $this->actingAs($user)
        ->from(route('timesheets', ['week' => '2026-06-02']))
        ->patch(route('timesheets.entries.update', $entry), [
            'title' => $entry->title,
            'description' => null,
            'project_id' => $entry->project_id,
            'worked_on' => '2026-06-02',
            'start_minutes' => 600,
            'end_minutes' => 660,
        ], [
            'X-Inertia' => 'true',
            'X-Inertia-Version' => '',
        ])
        ->assertRedirect(route('timesheets', ['week' => '2026-06-02']));
});
