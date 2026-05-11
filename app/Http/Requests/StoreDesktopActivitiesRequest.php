<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class StoreDesktopActivitiesRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'activities' => ['required', 'array', 'min:1', 'max:1000'],
            'activities.*.app_name' => ['required', 'string', 'max:255'],
            'activities.*.window_title' => ['required', 'string', 'max:2000'],
            'activities.*.browser_url' => ['nullable', 'string', 'max:4000'],
            'activities.*.browser_domain' => ['nullable', 'string', 'max:255'],
            'activities.*.browser_tab_title' => ['nullable', 'string', 'max:2000'],
            'activities.*.started_at' => ['required', 'date'],
            'activities.*.ended_at' => ['required', 'date'],
            'activities.*.duration_seconds' => ['required', 'integer', 'min:0'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            $activities = $this->input('activities', []);

            if (! is_array($activities)) {
                return;
            }

            foreach ($activities as $index => $row) {
                if (! is_array($row)) {
                    continue;
                }

                $started = $row['started_at'] ?? null;
                $ended = $row['ended_at'] ?? null;

                if ($started === null || $ended === null) {
                    continue;
                }

                if (strtotime((string) $ended) < strtotime((string) $started)) {
                    $validator->errors()->add(
                        "activities.{$index}.ended_at",
                        'Het eindtijdstip moet op of na het starttijdstip liggen.',
                    );
                }
            }
        });
    }
}
