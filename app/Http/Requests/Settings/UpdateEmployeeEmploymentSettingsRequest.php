<?php

namespace App\Http\Requests\Settings;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateEmployeeEmploymentSettingsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'mode' => ['required', 'string', Rule::in(['organization_default', 'profile', 'custom'])],
            'employment_profile_id' => [
                'nullable',
                'integer',
                Rule::requiredIf(fn (): bool => $this->input('mode') === 'profile'),
                Rule::exists('employment_profiles', 'id'),
            ],
            'weekly_work_hours' => [
                'nullable',
                'integer',
                'min:1',
                'max:60',
                Rule::requiredIf(fn (): bool => $this->input('mode') === 'custom'),
            ],
            'annual_leave_days' => [
                'nullable',
                'integer',
                'min:0',
                'max:365',
                Rule::requiredIf(fn (): bool => $this->input('mode') === 'custom'),
            ],
        ];
    }
}
