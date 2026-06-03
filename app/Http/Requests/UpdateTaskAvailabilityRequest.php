<?php

namespace App\Http\Requests;

use App\Enums\TaskAvailability;
use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

final class UpdateTaskAvailabilityRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();

        return $user instanceof User && $user->organization_id !== null;
    }

    /**
     * @return array<string, list<mixed>>
     */
    public function rules(): array
    {
        return [
            'task_availability' => ['required', Rule::enum(TaskAvailability::class)],
        ];
    }
}
