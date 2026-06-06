<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\StoreDesktopActivitiesRequest;
use App\Models\DesktopActivity;
use App\Services\TrackerBlocklistMatcher;
use Illuminate\Http\Response;
use Illuminate\Support\Carbon;

final class DesktopActivityController extends Controller
{
    /**
     * Bewaar één of meer activity-rijen voor de ingelogde tracker-gebruiker.
     * Het user_id wordt altijd uit het Sanctum-token gehaald, nooit uit de body.
     */
    public function store(StoreDesktopActivitiesRequest $request): Response
    {
        $user = $request->user();

        if (! ($user->tracker_tracking_enabled ?? true)) {
            return response()->noContent();
        }

        $matcher = app(TrackerBlocklistMatcher::class);
        $blocklist = $matcher->normalizeBlocklist($user->tracker_blocklist);
        $userId = $user->id;
        $now = Carbon::now()->toDateTimeString();
        $rows = [];

        foreach ($request->validated('activities') as $activity) {
            if ($matcher->matches(
                $blocklist,
                (string) $activity['app_name'],
                (string) ($activity['window_title'] ?? ''),
                (string) ($activity['browser_tab_title'] ?? ''),
                (string) ($activity['browser_domain'] ?? ''),
            )) {
                continue;
            }

            $rows[] = [
                'user_id' => $userId,
                'app_name' => $activity['app_name'],
                'window_title' => $activity['window_title'] ?? $activity['app_name'],
                'browser_url' => $activity['browser_url'] ?? null,
                'browser_domain' => $activity['browser_domain'] ?? null,
                'browser_tab_title' => $activity['browser_tab_title'] ?? null,
                'started_at' => Carbon::parse($activity['started_at'])->toDateTimeString(),
                'ended_at' => Carbon::parse($activity['ended_at'])->toDateTimeString(),
                'duration_seconds' => $activity['duration_seconds'],
                'created_at' => $now,
                'updated_at' => $now,
            ];
        }

        if ($rows === []) {
            return response()->noContent();
        }

        DesktopActivity::query()->insert($rows);

        return response()->noContent();
    }
}
