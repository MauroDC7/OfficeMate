<?php

use App\Models\TimesheetEntry;
use App\Models\User;

it('includes all entries in the requested month for month view', function () {
    $user = User::factory()->create();

    TimesheetEntry::factory()->for($user)->create([
        'worked_on' => '2026-05-02',
        'title' => 'Vroeg in de maand',
    ]);

    TimesheetEntry::factory()->for($user)->create([
        'worked_on' => '2026-05-28',
        'title' => 'Laat in de maand',
    ]);

    TimesheetEntry::factory()->for($user)->create([
        'worked_on' => '2026-06-01',
        'title' => 'Volgende maand',
    ]);

    $this->actingAs($user)
        ->get(route('timesheets', [
            'week' => '2026-05-04',
            'month' => '2026-05',
            'view' => 'month',
        ]))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('timesheets')
            ->where('month', '2026-05')
            ->has('entriesByDay.2026-05-02')
            ->has('entriesByDay.2026-05-28')
            ->missing('entriesByDay.2026-06-01')
            ->where('entriesByDay.2026-05-02.0.title', 'Vroeg in de maand')
            ->where('entriesByDay.2026-05-28.0.title', 'Laat in de maand'));
});

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
