<?php

namespace App\Services;

use App\Models\Organization;
use App\Models\User;
use App\Models\WeeklyStatusUpdate;
use Carbon\CarbonImmutable;
use Illuminate\Http\Request;

final class WeeklyDebriefOverview
{
    public function __construct(
        private readonly WeeklyDebriefSchedule $weeklyDebriefSchedule,
    ) {}

    /**
     * @return array{
     *     organizationName: string,
     *     weekStart: string,
     *     weekLabel: string,
     *     previousWeek: string|null,
     *     nextWeek: string|null,
     *     submittedCount: int,
     *     rows: list<array{
     *         user: array{id: int, name: string, email: string, avatar: string|null},
     *         difficult_this_week: string|null,
     *         plans_next_week: string|null,
     *         submitted: bool,
     *         updated_at: string|null,
     *     }>,
     * }
     */
    public function forOrganization(Organization $organization, Request $request): array
    {
        $timezone = $this->weeklyDebriefSchedule->timezone();
        $currentMonday = CarbonImmutable::now($timezone)->startOfWeek(CarbonImmutable::MONDAY);

        $weekStart = $request->filled('week')
            ? CarbonImmutable::parse($request->string('week'), $timezone)->startOfWeek(CarbonImmutable::MONDAY)
            : $currentMonday;

        $members = User::query()
            ->where('organization_id', $organization->id)
            ->orderBy('first_name')
            ->orderBy('last_name')
            ->get(['id', 'first_name', 'last_name', 'email', 'avatar_path']);

        $submissions = WeeklyStatusUpdate::query()
            ->whereDate('week_start', $weekStart->toDateString())
            ->whereIn('user_id', $members->pluck('id'))
            ->get()
            ->keyBy('user_id');

        $weekEnd = $weekStart->addDays(6);
        $weekLabel = $weekStart->format('d-m-Y').' – '.$weekEnd->format('d-m-Y');

        $rows = $members
            ->map(function (User $member) use ($submissions): array {
                $submission = $submissions->get($member->id);

                return [
                    'user' => [
                        'id' => $member->id,
                        'name' => $member->name,
                        'email' => $member->email,
                        'avatar' => $member->avatar,
                    ],
                    'difficult_this_week' => $submission?->difficult_this_week,
                    'plans_next_week' => $submission?->plans_next_week,
                    'submitted' => $submission !== null,
                    'updated_at' => $submission?->updated_at?->toIso8601String(),
                ];
            })
            ->values()
            ->all();

        return [
            'organizationName' => $organization->name,
            'weekStart' => $weekStart->toDateString(),
            'weekLabel' => $weekLabel,
            'submittedCount' => collect($rows)->where('submitted', true)->count(),
            'previousWeek' => $weekStart->subWeek()->toDateString(),
            'nextWeek' => $weekStart->addWeek()->lte($currentMonday)
                ? $weekStart->addWeek()->toDateString()
                : null,
            'rows' => $rows,
        ];
    }
}
