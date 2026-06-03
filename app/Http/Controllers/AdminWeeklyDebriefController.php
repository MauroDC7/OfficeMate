<?php

namespace App\Http\Controllers;

use App\Enums\UserRole;
use App\Models\User;
use App\Services\OrganizationContext;
use App\Services\WeeklyDebriefOverview;
use App\Services\WeeklyDebriefSchedule;
use App\Services\WeeklyDebriefSummarizer;
use Carbon\CarbonImmutable;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use RuntimeException;

final class AdminWeeklyDebriefController extends Controller
{
    public function __construct(
        private readonly OrganizationContext $organizationContext,
        private readonly WeeklyDebriefOverview $weeklyDebriefOverview,
        private readonly WeeklyDebriefSummarizer $weeklyDebriefSummarizer,
        private readonly WeeklyDebriefSchedule $weeklyDebriefSchedule,
    ) {}

    public function index(Request $request): Response
    {
        $user = $request->user();
        abort_unless($user instanceof User && $user->role === UserRole::Admin, 403);

        $organization = $this->organizationContext->forUserOrFail($user);
        $payload = $this->weeklyDebriefOverview->forOrganization($organization, $request);

        $weekStart = $payload['weekStart'];
        $summary = $this->weeklyDebriefSummarizer->findCached($organization, $weekStart);

        return Inertia::render('admin/weeklyDebrief', [
            ...$payload,
            'aiConfigured' => $this->weeklyDebriefSummarizer->isConfigured(),
            'canGenerateSummary' => $payload['submittedCount'] > 0 && $this->weeklyDebriefSummarizer->isConfigured(),
            'summary' => $summary === null ? null : [
                'content' => $summary->content,
                'generated_at' => $summary->updated_at?->toIso8601String(),
                'submitted_count' => $summary->submitted_count,
                'total_members' => $summary->total_members,
            ],
        ]);
    }

    public function summarize(Request $request): RedirectResponse
    {
        $user = $request->user();
        abort_unless($user instanceof User && $user->role === UserRole::Admin, 403);

        $organization = $this->organizationContext->forUserOrFail($user);

        $validated = $request->validate([
            'week' => ['required', 'date'],
        ]);

        $timezone = $this->weeklyDebriefSchedule->timezone();
        $weekStart = CarbonImmutable::parse($validated['week'], $timezone)->startOfWeek(CarbonImmutable::MONDAY);

        try {
            $this->weeklyDebriefSummarizer->summarize($organization, $weekStart);
        } catch (RuntimeException $e) {
            throw ValidationException::withMessages([
                'summary' => $e->getMessage(),
            ]);
        }

        return redirect()
            ->route('admin.weeklyDebrief', ['week' => $weekStart->toDateString()])
            ->with('status', 'Teamsamenvatting gegenereerd.');
    }
}
