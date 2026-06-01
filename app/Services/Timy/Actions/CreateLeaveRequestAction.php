<?php

namespace App\Services\Timy\Actions;

use App\Enums\LeaveRequestStatus;
use App\Enums\LeaveType;
use App\Enums\UserRole;
use App\Models\LeaveRequest;
use App\Models\User;
use App\Services\LeaveRequestOverlapChecker;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;
use RuntimeException;

/**
 * @phpstan-type LeaveRequestParams array{type: string, starts_on: string, ends_on: string, notes?: string|null}
 */
final class CreateLeaveRequestAction
{
    public function __construct(
        private readonly LeaveRequestOverlapChecker $overlapChecker,
    ) {}

    /**
     * @param  LeaveRequestParams  $params
     * @return array{message: string, leave_request_id: int}
     */
    public function execute(User $user, array $params): array
    {
        if ($user->role !== UserRole::Employee) {
            throw new RuntimeException('Alleen medewerkers kunnen verlof aanvragen via Timy.');
        }

        if (! $user->can('create', LeaveRequest::class)) {
            throw new RuntimeException('Je mag momenteel geen verlof aanvragen.');
        }

        $validated = $this->validate($params);

        $type = LeaveType::from($validated['type']);

        if ($type === LeaveType::Sick) {
            throw new RuntimeException(
                'Ziekteverlof met attest kan nog niet via Timy. Gebruik Verlof in het menu om een doktersbrief te uploaden.',
            );
        }

        if ($this->overlapChecker->overlapsForUser(
            $user->id,
            $validated['starts_on'],
            $validated['ends_on'],
        )) {
            throw new RuntimeException('Deze periode overlapt met een bestaande verlofaanvraag.');
        }

        $leaveRequest = $user->leaveRequests()->create([
            'starts_on' => $validated['starts_on'],
            'ends_on' => $validated['ends_on'],
            'type' => $type,
            'notes' => $validated['notes'] ?? null,
            'status' => LeaveRequestStatus::Pending,
        ]);

        return [
            'message' => sprintf(
                'Je verlofaanvraag (%s, %s t/m %s) is ingediend en wacht op goedkeuring.',
                $type->label(),
                $validated['starts_on'],
                $validated['ends_on'],
            ),
            'leave_request_id' => $leaveRequest->id,
        ];
    }

    /**
     * @param  LeaveRequestParams  $params
     * @return array{type: string, starts_on: string, ends_on: string, notes: string|null}
     */
    private function validate(array $params): array
    {
        $validator = Validator::make($params, [
            'type' => ['required', Rule::enum(LeaveType::class)],
            'starts_on' => ['required', 'date'],
            'ends_on' => ['required', 'date', 'after_or_equal:starts_on'],
            'notes' => ['nullable', 'string', 'max:2000'],
        ]);

        if ($validator->fails()) {
            throw new RuntimeException($validator->errors()->first());
        }

        /** @var array{type: string, starts_on: string, ends_on: string, notes?: string|null} $validated */
        $validated = $validator->validated();

        $notes = $validated['notes'] ?? null;

        return [
            'type' => $validated['type'],
            'starts_on' => $validated['starts_on'],
            'ends_on' => $validated['ends_on'],
            'notes' => is_string($notes) && trim($notes) !== '' ? trim($notes) : null,
        ];
    }

    /**
     * @param  LeaveRequestParams  $params
     */
    public static function summary(array $params): string
    {
        $type = LeaveType::tryFrom((string) ($params['type'] ?? ''));

        return sprintf(
            '%s van %s t/m %s',
            $type?->label() ?? 'Verlof',
            $params['starts_on'] ?? '?',
            $params['ends_on'] ?? '?',
        );
    }
}
