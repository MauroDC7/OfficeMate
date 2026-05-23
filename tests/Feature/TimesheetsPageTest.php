<?php

use App\Models\TimesheetEntry;
use App\Models\User;

it('includes weekend entries in the timesheets week range', function () {
    $user = User::factory()->create();

    TimesheetEntry::factory()->for($user)->create([
        'worked_on' => '2026-05-11',
        'title' => 'Maandag',
    ]);

    TimesheetEntry::factory()->for($user)->create([
        'worked_on' => '2026-05-16',
        'title' => 'Zaterdag',
    ]);

    $this->actingAs($user)
        ->get(route('timesheets', ['week' => '2026-05-11', 'view' => 'week']))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('timesheets')
            ->has('entriesByDay.2026-05-11')
            ->has('entriesByDay.2026-05-16')
            ->where('entriesByDay.2026-05-11.0.title', 'Maandag')
            ->where('entriesByDay.2026-05-16.0.title', 'Zaterdag'));
});
