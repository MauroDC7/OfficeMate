<?php

namespace App\Http\Controllers;

use App\Http\Requests\DraftWeeklyStatusUpdateRequest;
use App\Http\Requests\StoreWeeklyStatusUpdateRequest;
use App\Models\User;
use App\Models\WeeklyStatusUpdate;
use App\Services\WeeklyDebriefDraftGenerator;
use Carbon\CarbonImmutable;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use RuntimeException;

final class WeeklyStatusController extends Controller
{
    public function __construct(
        private readonly WeeklyDebriefDraftGenerator $weeklyDebriefDraftGenerator,
    ) {}

    public function draft(DraftWeeklyStatusUpdateRequest $request): JsonResponse
    {
        $user = $request->user();
        abort_unless($user instanceof User, 401);

        $weekStart = CarbonImmutable::parse($request->validated('week_start'))
            ->startOfWeek(CarbonImmutable::MONDAY);

        try {
            $draft = $this->weeklyDebriefDraftGenerator->generate($user, $weekStart);
        } catch (RuntimeException $exception) {
            return response()->json([
                'message' => $exception->getMessage(),
            ], 422);
        }

        return response()->json($draft);
    }

    public function store(StoreWeeklyStatusUpdateRequest $request): RedirectResponse
    {
        $user = $request->user();
        abort_unless($user instanceof User, 401);

        $weekStart = $request->validated('week_start');
        $attributes = $request->safe()->only([
            'difficult_this_week',
            'plans_next_week',
        ]);

        $existing = WeeklyStatusUpdate::query()
            ->where('user_id', $user->id)
            ->whereDate('week_start', $weekStart)
            ->first();

        if ($existing !== null) {
            $existing->update($attributes);
        } else {
            WeeklyStatusUpdate::query()->create([
                'user_id' => $user->id,
                'week_start' => $weekStart,
                ...$attributes,
            ]);
        }

        return redirect()
            ->route('projects')
            ->with('status', 'Je weekly debrief is opgeslagen.');
    }
}
