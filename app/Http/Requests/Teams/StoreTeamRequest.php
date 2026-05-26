<?php

namespace App\Http\Requests\Teams;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreTeamRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $organizationId = $this->user()?->organization_id;

        return [
            'name' => ['required', 'string', 'max:255'],
            'department' => ['nullable', 'string', 'max:255'],
            'member_ids' => ['nullable', 'array'],
            'member_ids.*' => [
                'integer',
                'distinct',
                Rule::exists('users', 'id')->where(
                    fn ($query) => $query->where('organization_id', $organizationId),
                ),
            ],
        ];
    }
}
