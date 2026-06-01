<?php

namespace App\Services\Timy;

use App\Enums\LeaveType;
use App\Enums\UserRole;
use App\Models\LeaveRequest;
use App\Models\User;
use App\Services\Timy\Actions\CreateLeaveRequestAction;
use Carbon\CarbonImmutable;
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
            .'Voorbeeld: "Vraag vakantie aan van 2026-07-01 tot 2026-07-05". '
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

        return preg_match('/\d{4}-\d{2}-\d{2}|\d{1,2}-\d{1,2}-\d{4}/', $message) === 1;
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
        $dates = $this->extractDates($message);

        if ($type === null || count($dates) < 2) {
            return null;
        }

        [$startsOn, $endsOn] = $dates;

        return [
            'type' => $type->value,
            'starts_on' => $startsOn,
            'ends_on' => $endsOn,
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

    /**
     * @return list<string>
     */
    private function extractDates(string $message): array
    {
        preg_match_all('/\d{4}-\d{2}-\d{2}/', $message, $isoMatches);
        if (isset($isoMatches[0]) && count($isoMatches[0]) >= 2) {
            return array_values(array_slice($isoMatches[0], 0, 2));
        }

        preg_match_all('/\d{1,2}-\d{1,2}-\d{4}/', $message, $europeanMatches);
        if (! isset($europeanMatches[0]) || count($europeanMatches[0]) < 2) {
            return [];
        }

        $parsed = [];

        foreach (array_slice($europeanMatches[0], 0, 2) as $raw) {
            try {
                $parsed[] = CarbonImmutable::createFromFormat('d-m-Y', $raw)->toDateString();
            } catch (\Throwable) {
                return [];
            }
        }

        return $parsed;
    }
}
