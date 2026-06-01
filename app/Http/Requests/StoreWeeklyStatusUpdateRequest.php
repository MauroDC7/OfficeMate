<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

final class StoreWeeklyStatusUpdateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /**
     * @return array<string, list<string>>
     */
    public function rules(): array
    {
        return [
            'week_start' => ['required', 'date'],
            'difficult_this_week' => ['required', 'string', 'max:5000'],
            'plans_next_week' => ['required', 'string', 'max:5000'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'difficult_this_week.required' => 'Vul in wat deze week moeilijk was.',
            'plans_next_week.required' => 'Vul in wat je volgende week gaat doen.',
        ];
    }
}
