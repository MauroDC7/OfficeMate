<?php

namespace App\Http\Requests\Settings;

use App\Models\User;
use App\Rules\UniqueOrganizationName;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class UpdateOrganizationRequest extends FormRequest
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
        $user = $this->user();
        $ignoreOrganizationId = $user instanceof User ? $user->organization_id : null;

        return [
            'name' => [
                'required',
                'string',
                'max:255',
                new UniqueOrganizationName($ignoreOrganizationId),
            ],
        ];
    }
}
