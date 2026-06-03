<?php

namespace App\Services\Timy;

use App\Enums\LeaveType;
use App\Enums\UserRole;
use App\Models\LeaveRequest;
use App\Models\User;
use App\Services\Timy\Actions\CreateLeaveRequestAction;
use Illuminate\Support\Str;

/**
 * @phpstan-type TimyPendingAction array{
 *     type: 'create_leave_request',
 *     params: array{type: string, starts_on: string, ends_on: string, notes?: string|null},
 *     summary: string,
 * }
 */
final class TimyLeaveRequestProposer
{
    public function __construct(
        private readonly TimyDutchDateRangeParser $dateRangeParser,
    ) {}

    public function tryPropose(User $user, string $message): ?array
    {
        if ($user->role !== UserRole::Employee || ! $user->can('create', LeaveRequest::class)) {
            return null;
        }

        if (! $this->looksLikeLeaveIntent($message)) {
            return null;
        }

        $params = $this->extractParams($message);

        if ($params === null) {
            return null;
        }

        return [
            'type' => 'create_leave_request',
            'params' => $params,
            'summary' => CreateLeaveRequestAction::summary($params),
        ];
    }

    public function missingDatesHelpMessage(): string
    {
        return 'Om verlof aan te vragen via Timy, noem het type (vakantie of overig) en de datums. '
            .'Voorbeeld: "Vraag verlof aan voor 7 juni tot 13 juni" of "vakantie van 01-07-2026 tot 05-07-2026". '
            .'Ziekteverlof met attest regel je via Verlof in het menu.';
    }

    public function looksLikeLeaveIntentWithoutDates(string $message): bool
    {
        return $this->mentionsLeave($message) && $this->extractParams($message) === null;
    }

    private function looksLikeLeaveIntent(string $message): bool
    {
        if (! $this->mentionsLeave($message)) {
            return false;
        }

        return $this->dateRangeParser->containsDateHint($message);
    }

    private function mentionsLeave(string $message): bool
    {
        $normalized = Str::lower($message);

        foreach (['verlof', 'vakantie', 'vrij nemen', 'vrijnemen', 'dag vrij', 'aanvragen', 'ziek'] as $verb) {
            if (str_contains($normalized, $verb)) {
                return true;
            }
        }

        return false;
    }

    /**
     * @return array{type: string, starts_on: string, ends_on: string, notes?: string|null}|null
     */
    private function extractParams(string $message): ?array
    {
        $type = $this->extractType($message);
        $range = $this->dateRangeParser->extractRange($message);

        if ($type === null || $range === null) {
            return null;
        }

        return [
            'type' => $type->value,
            'starts_on' => $range[0],
            'ends_on' => $range[1],
            'notes' => null,
        ];
    }

    private function extractType(string $message): ?LeaveType
    {
        $normalized = Str::lower($message);

        if (str_contains($normalized, 'ziek')) {
            return LeaveType::Sick;
        }

        if (str_contains($normalized, 'overig')) {
            return LeaveType::Other;
        }

        return LeaveType::Vacation;
    }
}
