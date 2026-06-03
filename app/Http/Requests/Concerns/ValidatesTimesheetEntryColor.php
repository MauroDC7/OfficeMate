<?php

namespace App\Http\Requests\Concerns;

trait ValidatesTimesheetEntryColor
{
    /**
     * @return array<string, list<string>>
     */
    protected function timesheetColorRules(): array
    {
        return [
            'color' => ['required', 'string', 'regex:/^#[0-9A-Fa-f]{6}$/'],
        ];
    }
}
