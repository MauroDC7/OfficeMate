<?php

namespace App\Http\Controllers;

use App\Enums\UserRole;
use App\Models\TimesheetEntry;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

final class AppPageController extends Controller
{
    public function dashboard(Request $request): Response
    {
        $user = $request->user();

        if ($user !== null && $user->role === UserRole::Admin) {
            return Inertia::render('admin/dashboard');
        }

        return Inertia::render('dashboard');
    }

    public function timesheets(Request $request): Response
    {
        $user = $request->user();

        if (! $user instanceof User) {
            abort(401);
        }

        $monday = $this->resolveTimesheetWeekMonday($request);
        $weekEnd = $monday->addDays(4);

        $entries = TimesheetEntry::query()
            ->where('user_id', $user->id)
            ->whereBetween('worked_on', [$monday->toDateString(), $weekEnd->toDateString()])
            ->orderBy('worked_on')
            ->orderBy('start_minutes')
            ->get();

        $entriesByDay = $entries
            ->groupBy(fn (TimesheetEntry $e) => $e->worked_on->format('Y-m-d'))
            ->map(
                fn ($group) => $group->values()->map(fn (TimesheetEntry $e): array => [
                    'id' => $e->id,
                    'title' => $e->title,
                    'description' => $e->description,
                    'client_name' => $e->client_name,
                    'worked_on' => $e->worked_on->format('Y-m-d'),
                    'start_minutes' => $e->start_minutes,
                    'end_minutes' => $e->end_minutes,
                ])->all(),
            )
            ->all();

        return Inertia::render('timesheets', [
            'weekStart' => $monday->toDateString(),
            'entriesByDay' => $entriesByDay,
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

    public function settings(): Response
    {
        return Inertia::render('settings');
    }
}
