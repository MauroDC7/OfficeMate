<?php

namespace App\Http\Controllers;

use App\Enums\UserRole;
use App\Models\TimesheetEntry;
use App\Models\TimesheetEntryProposal;
use App\Models\User;
use App\Services\EmployeeDashboardStats;
use App\Services\OrganizationContext;
use App\Services\TimesheetEntryWindowTitlesResolver;
use Carbon\CarbonImmutable;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

final class AppPageController extends Controller
{
    public function dashboard(Request $request, EmployeeDashboardStats $dashboardStats): Response
    {
        $user = $request->user();

        if ($user !== null && $user->role === UserRole::Admin) {
            return Inertia::render('admin/dashboard');
        }

        if (! $user instanceof User) {
            abort(401);
        }

        return Inertia::render('dashboard', $dashboardStats->forUser($user));
    }

    public function timesheets(
        Request $request,
        TimesheetEntryWindowTitlesResolver $windowTitlesResolver,
    ): Response {
        $user = $request->user();

        if (! $user instanceof User) {
            abort(401);
        }

        $monday = $this->resolveTimesheetWeekMonday($request);
        $weekEnd = $monday->addDays(6);
        $proposalWeekEnd = $weekEnd;

        $entries = TimesheetEntry::query()
            ->where('user_id', $user->id)
            ->whereBetween('worked_on', [$monday->toDateString(), $weekEnd->toDateString()])
            ->orderBy('worked_on')
            ->orderBy('start_minutes')
            ->get();

        $trackerTitlesByEntryId = $windowTitlesResolver->forEntries($user, $entries);

        $entriesByDay = $entries
            ->groupBy(fn (TimesheetEntry $e) => $e->worked_on->format('Y-m-d'))
            ->map(
                fn ($group) => $group->values()->map(function (TimesheetEntry $e) use ($trackerTitlesByEntryId): array {
                    return [
                        'id' => $e->id,
                        'title' => $e->title,
                        'description' => $e->description,
                        'client_name' => $e->client_name,
                        'worked_on' => $e->worked_on->format('Y-m-d'),
                        'start_minutes' => $e->start_minutes,
                        'end_minutes' => $e->end_minutes,
                        'tracker_window_titles' => $trackerTitlesByEntryId[$e->id] ?? [],
                    ];
                })->all(),
            )
            ->all();

        $recentActivity = TimesheetEntry::query()
            ->where('user_id', $user->id)
            ->orderByDesc('updated_at')
            ->limit(12)
            ->get()
            ->map(fn (TimesheetEntry $e): array => [
                'id' => $e->id,
                'title' => $e->title,
                'worked_on' => $e->worked_on->format('Y-m-d'),
                'start_minutes' => $e->start_minutes,
                'end_minutes' => $e->end_minutes,
                'created_at' => $e->created_at?->toIso8601String() ?? '',
                'updated_at' => $e->updated_at?->toIso8601String() ?? '',
                'kind' => $e->created_at !== null && $e->updated_at !== null
                    && abs($e->created_at->diffInSeconds($e->updated_at)) <= 1
                    ? 'created'
                    : 'updated',
            ])
            ->all();

        $proposals = TimesheetEntryProposal::query()
            ->where('user_id', $user->id)
            ->whereBetween('worked_on', [$monday->toDateString(), $proposalWeekEnd->toDateString()])
            ->orderBy('worked_on')
            ->orderBy('start_minutes')
            ->get()
            ->map(fn (TimesheetEntryProposal $p): array => [
                'id' => $p->id,
                'title' => $p->title,
                'description' => $p->description,
                'client_name' => $p->client_name,
                'worked_on' => $p->worked_on->format('Y-m-d'),
                'start_minutes' => $p->start_minutes,
                'end_minutes' => $p->end_minutes,
            ])
            ->all();

        $rawEntry = $request->query('entry');
        $openEntryId = is_scalar($rawEntry) ? (filter_var($rawEntry, FILTER_VALIDATE_INT) ?: null) : null;

        return Inertia::render('timesheets', [
            'weekStart' => $monday->toDateString(),
            'entriesByDay' => $entriesByDay,
            'recentActivity' => $recentActivity,
            'proposals' => $proposals,
            'openEntryId' => $openEntryId,
        ]);
    }

    private function resolveTimesheetWeekMonday(Request $request): CarbonImmutable
    {
        $week = $request->query('week');

        if (! is_string($week) || $week === '') {
            return CarbonImmutable::now()->startOfWeek(CarbonImmutable::MONDAY);
        }

        try {
            return CarbonImmutable::parse($week)->startOfWeek(CarbonImmutable::MONDAY);
        } catch (\Throwable) {
            return CarbonImmutable::now()->startOfWeek(CarbonImmutable::MONDAY);
        }
    }

    public function projects(): Response
    {
        return Inertia::render('projects');
    }

    public function leaveRequests(): Response
    {
        return Inertia::render('leaveRequests');
    }

    public function shiftPlanning(): Response
    {
        return Inertia::render('shiftPlanning');
    }

    public function settings(Request $request, OrganizationContext $organizationContext): Response
    {
        $user = $request->user();
        abort_unless($user instanceof User, 401);

        $org = $organizationContext->forUser($user);

        return Inertia::render('settings', [
            'organization' => $org !== null
                ? ['id' => $org->id, 'name' => $org->name]
                : null,
            'canRedeemInvite' => $user->role !== UserRole::Admin && $user->organization_id === null,
            'organizationInviteCode' => $request->session()->get('organizationInviteCode'),
            'status' => $request->session()->get('status'),
        ]);
    }
}
