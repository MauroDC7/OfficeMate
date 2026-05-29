<?php

namespace App\Http\Requests\Projects;

use App\Enums\ProjectStatus;
use App\Enums\ProjectType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateProjectRequest extends FormRequest
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
            'type' => ['required', Rule::enum(ProjectType::class)],
            'status' => ['required', Rule::enum(ProjectStatus::class)],
            'client_name' => ['nullable', 'required_if:type,external', 'string', 'max:255'],
            'hours_budget' => ['nullable', 'integer', 'min:0', 'max:1000000'],
            'team_ids' => ['nullable', 'array'],
            'team_ids.*' => [
                'integer',
                'distinct',
                Rule::exists('teams', 'id')->where(
                    fn ($query) => $query->where('organization_id', $organizationId),
                ),
            ],
        ];
    }
}
