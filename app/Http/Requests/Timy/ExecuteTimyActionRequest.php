<?php

namespace App\Http\Requests\Timy;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ExecuteTimyActionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'type' => ['required', 'string', Rule::in(['create_leave_request'])],
            'params' => ['required', 'array'],
            'params.type' => ['required_with:type', 'string'],
            'params.starts_on' => ['required_with:type', 'date'],
            'params.ends_on' => ['required_with:type', 'date'],
            'params.notes' => ['nullable', 'string', 'max:2000'],
        ];
    }
}
