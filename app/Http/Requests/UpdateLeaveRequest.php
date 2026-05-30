<?php

namespace App\Http\Requests;

use App\Http\Requests\Concerns\ValidatesLeaveRequestPayload;
use App\Models\LeaveRequest;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class UpdateLeaveRequest extends FormRequest
{
    use ValidatesLeaveRequestPayload;

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return $this->leaveRequestRules();
    }

    public function authorize(): bool
    {
        $leaveRequest = $this->route('leave_request');

        return $leaveRequest instanceof LeaveRequest
            && ($this->user()?->can('update', $leaveRequest) ?? false);
    }

    protected function prepareForValidation(): void
    {
        $this->prepareLeaveRequestNotes();
    }
}
