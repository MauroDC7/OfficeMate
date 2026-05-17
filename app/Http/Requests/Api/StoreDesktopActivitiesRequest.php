<?php

namespace App\Http\Requests\Api;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class StoreDesktopActivitiesRequest extends FormRequest
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
            'activities' => ['required', 'array', 'min:1', 'max:100'],
            'activities.*.app_name' => ['required', 'string', 'max:255'],
            // Sommige vensters (Finder bureaublad, menubar) hebben geen titel.
            // We accepteren leeg en vullen de controller in op app_name.
            'activities.*.window_title' => ['nullable', 'string', 'max:2000'],
            'activities.*.browser_url' => ['nullable', 'string', 'max:2000'],
            'activities.*.browser_domain' => ['nullable', 'string', 'max:255'],
            'activities.*.browser_tab_title' => ['nullable', 'string', 'max:2000'],
            'activities.*.started_at' => ['required', 'date'],
            'activities.*.ended_at' => ['required', 'date', 'after_or_equal:activities.*.started_at'],
            'activities.*.duration_seconds' => ['required', 'integer', 'min:0', 'max:86400'],
        ];
    }
}
