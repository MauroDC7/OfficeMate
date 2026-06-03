<?php

namespace App\Http\Requests;

use App\Enums\UserRole;
use Illuminate\Foundation\Http\FormRequest;

final class DraftWeeklyStatusUpdateRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();

        return $user !== null && $user->role === UserRole::Employee;
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
