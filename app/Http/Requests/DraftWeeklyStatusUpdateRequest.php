<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

final class DraftWeeklyStatusUpdateRequest extends FormRequest
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
        ];
    }
}
