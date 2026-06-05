<?php

namespace App\Http\Requests;

use App\Models\Project;
use App\Models\Team;
use App\Models\User;
use App\Services\TimesheetReport\TimesheetReportFilters;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class AdminTimesheetReportRequest extends FormRequest
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
        return [
            'starts_on' => ['required', 'date'],
            'ends_on' => ['required', 'date', 'after_or_equal:starts_on'],
            'user_id' => ['nullable', 'integer'],
            'project_id' => ['nullable', 'integer'],
            'team_id' => ['nullable', 'integer'],
            'format' => ['nullable', 'string', 'in:csv'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            $user = $this->user();

            if (! $user instanceof User || $user->organization_id === null) {
                return;
            }

            $organizationId = $user->organization_id;

            $userId = $this->input('user_id');
            if (is_numeric($userId) && ! User::query()
                ->whereKey((int) $userId)
                ->where('organization_id', $organizationId)
                ->exists()) {
                $validator->errors()->add('user_id', 'Deze medewerker hoort niet bij je organisatie.');
            }

            $projectId = $this->input('project_id');
            if (is_numeric($projectId) && ! Project::query()
                ->whereKey((int) $projectId)
                ->where('organization_id', $organizationId)
                ->exists()) {
                $validator->errors()->add('project_id', 'Dit project hoort niet bij je organisatie.');
            }

            $teamId = $this->input('team_id');
            if (is_numeric($teamId) && ! Team::query()
                ->whereKey((int) $teamId)
                ->where('organization_id', $organizationId)
                ->exists()) {
                $validator->errors()->add('team_id', 'Dit team hoort niet bij je organisatie.');
            }
        });
    }

    public function filters(): TimesheetReportFilters
    {
        return TimesheetReportFilters::fromValidated($this->validated());
    }

    public function exportFormat(): string
    {
        return (string) ($this->validated('format') ?? 'csv');
    }
}
