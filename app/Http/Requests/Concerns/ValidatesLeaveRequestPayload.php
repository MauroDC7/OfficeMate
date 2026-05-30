<?php

namespace App\Http\Requests\Concerns;

use App\Enums\LeaveType;
use App\Models\LeaveRequest;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

trait ValidatesLeaveRequestPayload
{
    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    protected function leaveRequestRules(): array
    {
        return [
            'type' => ['required', Rule::enum(LeaveType::class)],
            'starts_on' => ['required', 'date'],
            'ends_on' => ['required', 'date', 'after_or_equal:starts_on'],
            'notes' => ['nullable', 'string', 'max:2000'],
        ];
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    protected function medicalCertificateRules(): array
    {
        return [
            'medical_certificate' => ['nullable', 'file', 'mimes:pdf,jpg,jpeg,png', 'max:5120'],
        ];
    }

    protected function prepareLeaveRequestNotes(): void
    {
        $notes = $this->input('notes');

        $this->merge([
            'notes' => is_string($notes) && trim($notes) !== '' ? trim($notes) : null,
        ]);
    }

    protected function validateSickLeaveCertificate(Validator $validator, ?LeaveRequest $existing = null): void
    {
        if ($validator->errors()->isNotEmpty()) {
            return;
        }

        $type = $this->input('type');

        if (! is_string($type) || LeaveType::tryFrom($type) !== LeaveType::Sick) {
            return;
        }

        $hasExisting = $existing?->attachments()->exists() ?? false;

        if ($this->hasFile('medical_certificate') || $hasExisting) {
            return;
        }

        $validator->errors()->add(
            'medical_certificate',
            'Upload een doktersbrief (PDF of afbeelding).',
        );
    }
}
