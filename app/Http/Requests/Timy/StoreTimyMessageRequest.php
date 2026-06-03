<?php

namespace App\Http\Requests\Timy;

use Illuminate\Foundation\Http\FormRequest;

class StoreTimyMessageRequest extends FormRequest
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
            'content' => ['required', 'string', 'max:4000'],
            'page_path' => ['nullable', 'string', 'max:500'],
        ];
    }
}
