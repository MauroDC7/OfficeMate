<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreDesktopActivitiesRequest;
use App\Models\DesktopActivity;
use Illuminate\Http\Response;

class DesktopActivityController extends Controller
{
    public function store(StoreDesktopActivitiesRequest $request): Response
    {
        $user = $request->user();
        $now = now();

        $rows = collect($request->validated('activities'))
            ->map(fn (array $activity): array => [
                'user_id' => $user->id,
                'app_name' => $activity['app_name'],
                'window_title' => $activity['window_title'],
                'browser_url' => $activity['browser_url'] ?? null,
                'browser_domain' => $activity['browser_domain'] ?? null,
                'browser_tab_title' => $activity['browser_tab_title'] ?? null,
                'started_at' => $activity['started_at'],
                'ended_at' => $activity['ended_at'],
                'duration_seconds' => $activity['duration_seconds'],
                'created_at' => $now,
                'updated_at' => $now,
            ])
            ->all();

        foreach (array_chunk($rows, 500) as $chunk) {
            DesktopActivity::query()->insert($chunk);
        }

        return response()->noContent();
    }
}
