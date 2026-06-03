<?php

use App\Services\Timy\TimyFallbackResponder;
use App\Services\Timy\TimyUserContext;

it('explains weekly hours from employee context', function () {
    $responder = new TimyFallbackResponder;

    $reply = $responder->reply('Hoeveel uur deze week?', [
        'user' => ['name' => 'Jan', 'first_name' => 'Jan', 'role' => 'employee'],
        'page' => 'timesheets',
        'organization' => true,
        'employee' => [
            'hoursThisWeekMinutes' => 240,
            'pendingTimesheetCount' => 0,
            'pendingLeaveRequestCount' => 0,
            'openLeaveDays' => 0,
            'activeProjects' => [],
        ],
        'admin' => null,
        'weekly_debrief' => null,
        'tips' => [],
        'quick_links' => [],
    ]);

    expect($reply['content'])->toContain('4 u');
    expect($reply['actions'][0]['href'])->toContain('timesheets');
});

it('formats minutes via timy user context helper', function () {
    expect(TimyUserContext::formatMinutes(90))->toBe('1 u 30 min');
});
