<?php

namespace App\Http\Requests;

use App\Http\Requests\Concerns\NormalizesTimesheetProject;
use App\Http\Requests\Concerns\ValidatesTimesheetEntryColor;
use App\Models\TimesheetEntry;
use Carbon\CarbonImmutable;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class UpdateTimesheetEntryRequest extends FormRequest
{
    use NormalizesTimesheetProject;
    use ValidatesTimesheetEntryColor;

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:10000'],
            ...$this->timesheetColorRules(),
            ...$this->timesheetProjectRules(),
            'client_name' => ['nullable', 'string', 'max:255'],
            'worked_on' => ['required', 'date', 'before_or_equal:today'],
            'start_minutes' => ['required', 'integer', 'min:0', 'max:1439'],
            'end_minutes' => ['required', 'integer', 'min:1', 'max:1440'],
        ];
    }

    public function authorize(): bool
    {
        $user = $this->user();
        $entry = $this->route('timesheet_entry');

        return $user !== null && $entry instanceof TimesheetEntry && $user->id === $entry->user_id;
    }

    protected function prepareForValidation(): void
    {
        $description = $this->input('description');

        $this->merge([
            'description' => is_string($description) && trim($description) !== '' ? trim($description) : null,
        ]);

        $this->mergeTimesheetProjectFields();
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            if ($validator->errors()->isNotEmpty()) {
                return;
            }

            $entry = $this->route('timesheet_entry');

            if (! $entry instanceof TimesheetEntry) {
                return;
            }

            $workedOn = (string) $this->input('worked_on');
            $start = (int) $this->input('start_minutes');
            $end = (int) $this->input('end_minutes');

            if ($end <= $start) {
                $validator->errors()->add('end_minutes', 'De eindtijd moet na de starttijd liggen.');

                return;
            }

            $day = CarbonImmutable::parse($workedOn);

            if ($day->isWeekend()) {
                $validator->errors()->add('worked_on', 'Selecteer een werkdag (maandag t/m vrijdag).');

                return;
            }

            $user = $this->user();

            if ($user === null) {
                return;
            }

            if (TimesheetEntry::overlapsForUserDay($user->id, $day->toDateString(), $start, $end, $entry->id)) {
                $validator->errors()->add('start_minutes', 'Deze periode overlapt met een bestaande registratie.');
            }
        });
    }
}
