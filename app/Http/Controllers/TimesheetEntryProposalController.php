<?php

namespace App\Http\Controllers;

use App\Events\TimesheetEntryChanged;
use App\Http\Requests\UpdateTimesheetEntryProposalRequest;
use App\Models\TimesheetEntry;
use App\Models\TimesheetEntryProposal;
use App\Models\User;
use App\Services\TimesheetProposalGenerator;
use Carbon\CarbonImmutable;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

final class TimesheetEntryProposalController extends Controller
{
    public function __construct(
        private readonly TimesheetProposalGenerator $generator,
    ) {}

    /**
     * Generate fresh proposals for a single day (default: today).
     *
     * We bewust beperkt tot één dag: dat houdt de OpenAI-call licht (kleinere
     * prompt, kortere wachttijd, lagere kosten) en past binnen de standaard
     * PHP-execution-time op shared hosting.
     *
     * Bestaande voorstellen op die dag worden in één transactie vervangen.
     */
    public function store(Request $request): RedirectResponse
    {
        $user = $request->user();
        abort_unless($user instanceof User, 401);

        $validated = $request->validate([
            'date' => ['nullable', 'date'],
        ]);

        $day = ! empty($validated['date'])
            ? CarbonImmutable::parse($validated['date'])
            : CarbonImmutable::now();

        $result = $this->generator->generateForDay($user, $day);
        $weekMonday = $day->startOfWeek(CarbonImmutable::MONDAY);

        return redirect()
            ->route('timesheets', ['week' => $weekMonday->toDateString()])
            ->with('proposalsStatus', $result['status'])
            ->with('proposalsMessage', $result['message']);
    }

    public function update(
        UpdateTimesheetEntryProposalRequest $request,
        TimesheetEntryProposal $timesheetEntryProposal,
    ): RedirectResponse {
        $timesheetEntryProposal->update($request->safe()->only([
            'title',
            'description',
            'project_id',
            'client_name',
            'worked_on',
            'start_minutes',
            'end_minutes',
        ]));

        return $this->redirectToWeek($timesheetEntryProposal->worked_on->toDateString());
    }

    /**
     * Promote the proposal to a real timesheet entry on the calendar.
     */
    public function approve(Request $request, TimesheetEntryProposal $timesheetEntryProposal): RedirectResponse
    {
        $user = $request->user();
        abort_unless($user instanceof User && $user->id === $timesheetEntryProposal->user_id, 403);

        $workedOnYmd = $timesheetEntryProposal->worked_on->toDateString();

        if ($timesheetEntryProposal->worked_on->isWeekend()) {
            throw ValidationException::withMessages([
                'worked_on' => 'Voorstellen voor weekenddagen kunnen niet worden goedgekeurd.',
            ]);
        }

        if (
            TimesheetEntry::overlapsForUserDay(
                $user->id,
                $workedOnYmd,
                $timesheetEntryProposal->start_minutes,
                $timesheetEntryProposal->end_minutes,
            )
        ) {
            throw ValidationException::withMessages([
                'start_minutes' => 'Dit voorstel overlapt met een bestaande registratie. Pas het eerst aan.',
            ]);
        }

        DB::transaction(function () use ($user, $timesheetEntryProposal): void {
            $user->timesheetEntries()->create([
                'worked_on' => $timesheetEntryProposal->worked_on->toDateString(),
                'title' => $timesheetEntryProposal->title,
                'description' => $timesheetEntryProposal->description,
                'project_id' => $timesheetEntryProposal->project_id,
                'client_name' => $timesheetEntryProposal->client_name,
                'start_minutes' => $timesheetEntryProposal->start_minutes,
                'end_minutes' => $timesheetEntryProposal->end_minutes,
            ]);

            $timesheetEntryProposal->delete();
        });

        TimesheetEntryChanged::dispatch($user->id);

        return $this->redirectToWeek($workedOnYmd);
    }

    public function destroy(Request $request, TimesheetEntryProposal $timesheetEntryProposal): RedirectResponse
    {
        $user = $request->user();
        abort_unless($user instanceof User && $user->id === $timesheetEntryProposal->user_id, 403);

        $workedOn = $timesheetEntryProposal->worked_on->toDateString();
        $timesheetEntryProposal->delete();

        return $this->redirectToWeek($workedOn);
    }

    private function redirectToWeek(string $workedOnYmd): RedirectResponse
    {
        $week = CarbonImmutable::parse($workedOnYmd)
            ->startOfWeek(CarbonImmutable::MONDAY)
            ->toDateString();

        return redirect()->route('timesheets', ['week' => $week]);
    }
}
