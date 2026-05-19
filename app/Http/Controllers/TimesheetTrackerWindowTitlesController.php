<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Services\TimesheetEntryWindowTitlesResolver;
use Carbon\CarbonImmutable;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class TimesheetTrackerWindowTitlesController extends Controller
{
    public function __invoke(
        Request $request,
        TimesheetEntryWindowTitlesResolver $resolver,
    ): JsonResponse {
        $user = $request->user();
        abort_unless($user instanceof User, 401);

        $validated = $request->validate([
            'worked_on' => ['required', 'date'],
            'start_minutes' => ['required', 'integer', 'min:0', 'max:1439'],
            'end_minutes' => ['required', 'integer', 'min:1', 'max:1440', 'gt:start_minutes'],
        ]);

        $titles = $resolver->forSlot(
            $user,
            CarbonImmutable::parse($validated['worked_on'])->toDateString(),
            (int) $validated['start_minutes'],
            (int) $validated['end_minutes'],
        );

        return response()->json(['titles' => $titles]);
    }
}
