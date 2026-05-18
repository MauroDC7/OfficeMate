<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\StoreDesktopActivitiesRequest;
use App\Models\DesktopActivity;
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
        $userId = $request->user()->id;
        $now = Carbon::now()->toDateTimeString();

        $rows = array_map(
            static fn (array $activity): array => [
                'user_id' => $userId,
                'app_name' => $activity['app_name'],
                // Geen titel beschikbaar (bv. Finder bureaublad)? Val terug op app_name
                // zodat het rapportoverzicht nog steeds leesbaar is.
                'window_title' => $activity['window_title']
                    ?? $activity['app_name'],
                'browser_url' => $activity['browser_url'] ?? null,
                'browser_domain' => $activity['browser_domain'] ?? null,
                'browser_tab_title' => $activity['browser_tab_title'] ?? null,
                'started_at' => Carbon::parse($activity['started_at'])->toDateTimeString(),
                'ended_at' => Carbon::parse($activity['ended_at'])->toDateTimeString(),
                'duration_seconds' => $activity['duration_seconds'],
                'created_at' => $now,
                'updated_at' => $now,
            ],
            $request->validated('activities'),
        );

        DesktopActivity::query()->insert($rows);

        return response()->noContent();
    }
}
