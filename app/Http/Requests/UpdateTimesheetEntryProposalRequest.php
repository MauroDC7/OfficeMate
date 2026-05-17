<?php

namespace App\Http\Requests;

use App\Models\TimesheetEntryProposal;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class UpdateTimesheetEntryProposalRequest extends FormRequest
{
    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:10000'],
            'client_name' => ['nullable', 'string', 'max:255'],
            'worked_on' => ['required', 'date'],
            'start_minutes' => ['required', 'integer', 'min:0', 'max:1439'],
            'end_minutes' => ['required', 'integer', 'min:1', 'max:1440'],
        ];
    }

    public function authorize(): bool
    {
        $user = $this->user();
        $proposal = $this->route('timesheet_entry_proposal');

        return $user !== null
            && $proposal instanceof TimesheetEntryProposal
            && $user->id === $proposal->user_id;
    }

    protected function prepareForValidation(): void
    {
        $description = $this->input('description');
        $clientName = $this->input('client_name');

        $this->merge([
            'description' => is_string($description) && trim($description) !== '' ? trim($description) : null,
            'client_name' => is_string($clientName) && trim($clientName) !== '' ? trim($clientName) : null,
        ]);
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            if ($validator->errors()->isNotEmpty()) {
                return;
            }

            $start = (int) $this->input('start_minutes');
            $end = (int) $this->input('end_minutes');

            if ($end <= $start) {
                $validator->errors()->add('end_minutes', 'De eindtijd moet na de starttijd liggen.');
            }
        });
    }
}
