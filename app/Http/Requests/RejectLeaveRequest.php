<?php

namespace App\Http\Requests;

use App\Models\LeaveRequest;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class RejectLeaveRequest extends FormRequest
{
    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'rejection_reason' => ['nullable', 'string', 'max:500'],
        ];
    }

    public function authorize(): bool
    {
        $leaveRequest = $this->route('leave_request');

        return $leaveRequest instanceof LeaveRequest
            && ($this->user()?->can('reject', $leaveRequest) ?? false);
    }

    protected function prepareForValidation(): void
    {
        $reason = $this->input('rejection_reason');

        $this->merge([
            'rejection_reason' => is_string($reason) && trim($reason) !== '' ? trim($reason) : null,
        ]);
    }
}
