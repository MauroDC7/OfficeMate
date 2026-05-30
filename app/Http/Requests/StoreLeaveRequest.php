<?php

namespace App\Http\Requests;

use App\Http\Requests\Concerns\ValidatesLeaveRequestPayload;
use App\Models\LeaveRequest;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class StoreLeaveRequest extends FormRequest
{
    use ValidatesLeaveRequestPayload;

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            ...$this->leaveRequestRules(),
            ...$this->medicalCertificateRules(),
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            $this->validateSickLeaveCertificate($validator);
            $this->validateLeaveRequestOverlap($validator);
        });
    }

    public function authorize(): bool
    {
        return $this->user()?->can('create', LeaveRequest::class) ?? false;
    }

    protected function prepareForValidation(): void
    {
        $this->prepareLeaveRequestNotes();
    }
}
