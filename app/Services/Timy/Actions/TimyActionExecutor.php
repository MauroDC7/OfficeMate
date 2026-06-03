<?php

namespace App\Services\Timy\Actions;

use App\Models\User;
use RuntimeException;

final class TimyActionExecutor
{
    public function __construct(
        private readonly CreateLeaveRequestAction $createLeaveRequestAction,
    ) {}

    /**
     * @param  array<string, mixed>  $params
     * @return array{message: string, result: array<string, mixed>}
     */
    public function execute(User $user, string $type, array $params): array
    {
        return match ($type) {
            'create_leave_request' => $this->executeCreateLeaveRequest($user, $params),
            default => throw new RuntimeException('Deze actie wordt nog niet ondersteund.'),
        };
    }

    /**
     * @param  array<string, mixed>  $params
     * @return array{message: string, result: array<string, mixed>}
     */
    private function executeCreateLeaveRequest(User $user, array $params): array
    {
        /** @var array{type: string, starts_on: string, ends_on: string, notes?: string|null} $typed */
        $typed = $params;

        $result = $this->createLeaveRequestAction->execute($user, $typed);

        return [
            'message' => $result['message'],
            'result' => ['leave_request_id' => $result['leave_request_id']],
        ];
    }
}
