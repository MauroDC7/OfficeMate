<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;

final class TrackerSettingsController extends Controller
{
    /**
     * Voorkeuren voor de desktop tracker (polling na login / sync).
     */
    public function show(): JsonResponse
    {
        $user = request()->user();
        abort_unless($user instanceof User, 401);

        return response()->json([
            'tracking_enabled' => (bool) ($user->tracker_tracking_enabled ?? true),
            'use_ai_for_proposals' => (bool) ($user->tracker_use_ai_for_proposals ?? true),
        ]);
    }
}
