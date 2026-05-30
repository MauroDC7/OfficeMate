<?php

namespace App\Http\Requests\Concerns;

use App\Enums\LeaveType;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Validation\Rule;

trait ValidatesLeaveRequestPayload
{
    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    protected function leaveRequestRules(): array
    {
        return [
            'type' => ['required', Rule::enum(LeaveType::class)],
            'starts_on' => ['required', 'date'],
            'ends_on' => ['required', 'date', 'after_or_equal:starts_on'],
            'notes' => ['nullable', 'string', 'max:2000'],
        ];
    }

    protected function prepareLeaveRequestNotes(): void
    {
        $notes = $this->input('notes');

        $this->merge([
            'notes' => is_string($notes) && trim($notes) !== '' ? trim($notes) : null,
        ]);
    }
}
