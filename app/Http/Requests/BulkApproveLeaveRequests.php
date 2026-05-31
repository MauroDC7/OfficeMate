<?php

namespace App\Http\Requests;

use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class BulkApproveLeaveRequests extends FormRequest
{
    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'leave_request_ids' => ['required', 'array', 'min:1'],
            'leave_request_ids.*' => ['integer', 'distinct', Rule::exists('leave_requests', 'id')],
        ];
    }

    public function authorize(): bool
    {
        $user = $this->user();

        return $user instanceof User
            && $user->role === UserRole::Admin
            && $user->organization_id !== null;
    }
}
