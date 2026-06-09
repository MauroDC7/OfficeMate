<?php

namespace App\Services;

use App\Models\TimesheetEntry;
use App\Models\TimesheetEntryProposal;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\RequestException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use RuntimeException;

/**
 * Turns desktop tracker work blocks into Dutch timesheet proposals via OpenAI.
 *
 * Bron-prioriteit:
 *  1. `desktop_activities` van deze user (TimeTraq Tracker)
 *  2. Lokale ActivityWatch JSON-export (fallback voor wanneer er nog geen
 *     tracker-data binnenkomt op deze machine)
 *
 * Statussen:
 *  - `ready`        — OpenAI heeft de blokken samengevat
 *  - `unconfigured` — OPENAI_API_KEY ontbreekt; ruwe fallback gebruikt
 *  - `error`        — OpenAI faalde; ruwe fallback gebruikt
 *  - `no_activity`  — geen bruikbare blokken in deze periode
 *
 * De generator houdt zelf geen state buiten de database vast: voor een gegeven
 * (user, range) worden bestaande voorstellen altijd vervangen binnen één
 * transactie. Goedgekeurde entries worden nooit aangeraakt.
 */
final class TimesheetProposalGenerator
{
    /**
     * Bovengrens aan werkblokken die naar OpenAI gaan in één call.
     * Houdt prompt-grootte, kosten en latency onder controle.
     */
    private const int MAX_BLOCKS_PER_CALL = 60;

    /**
     * Bovengrens op het antwoord van OpenAI. Ruim genoeg voor één werkdag
     * (max ~10 voorstellen), maar voorkomt token-explosies.
     */
    private const int OPENAI_MAX_TOKENS = 1500;

    public function __construct(
        private readonly DesktopActivityWorkBlockLoader $desktopLoader,
        private readonly ActivityWatchExportLoader $exportLoader,
    ) {}

    /**
     * @return array{
     *     status: 'ready'|'unconfigured'|'no_activity'|'error',
     *     proposals: list<TimesheetEntryProposal>,
     *     message: string|null
     * }
     */
    public function generateForDay(User $user, CarbonImmutable $day): array
    {
        return $this->generateForRange(
            $user,
            $day,
            $day,
            $this->loadBlocksForDay($user, $day),
        );
    }

    /**
     * Combineer beide loaders: tracker-data heeft prioriteit, anders AW-export.
     *
     * @return list<array<string, mixed>>
     */
    private function loadBlocksForDay(User $user, CarbonImmutable $day): array
    {
        $blocks = $this->desktopLoader->loadWorkBlocksForRange($user, $day, $day);

        if ($blocks !== []) {
            return $blocks;
        }

        return $this->exportLoader->loadWorkBlocksForRange($day, $day);
    }

    /**
     * @param  list<array<string, mixed>>  $blocks
     * @return array{
     *     status: 'ready'|'unconfigured'|'no_activity'|'error',
     *     proposals: list<TimesheetEntryProposal>,
     *     message: string|null
     * }
     */
    private function generateForRange(
        User $user,
        CarbonImmutable $rangeStart,
        CarbonImmutable $rangeEnd,
        array $blocks,
    ): array {
        if ($blocks === []) {
            return [
                'status' => 'no_activity',
                'proposals' => [],
                'message' => 'Geen tracker-activiteit gevonden voor deze periode.',
            ];
        }

        $hasKey = ! blank(config('services.openai.key'));
        $useAi = (bool) $user->tracker_use_ai_for_proposals;
        $status = 'ready';
        $normalised = [];

        if ($hasKey && $useAi) {
            try {
                $raw = $this->requestProposals($rangeStart, $rangeEnd, $blocks);
                $normalised = $this->normaliseAndFilterProposals($user, $rangeStart, $rangeEnd, $raw);
            } catch (ConnectionException|RequestException|RuntimeException $e) {
                Log::warning('Timesheet proposal generation failed, using fallback', [
                    'user_id' => $user->id,
                    'range_start' => $rangeStart->toDateString(),
                    'range_end' => $rangeEnd->toDateString(),
                    'error' => $e->getMessage(),
                ]);
                $status = 'error';
            }
        } elseif (! $hasKey) {
            $status = 'unconfigured';
        } else {
            $status = 'manual';
        }

        if ($normalised === []) {
            $normalised = $this->normaliseAndFilterProposals(
                $user,
                $rangeStart,
                $rangeEnd,
                $this->proposalsFromWorkBlocks($blocks),
            );
        }

        if ($normalised === []) {
            return [
                'status' => 'no_activity',
                'proposals' => [],
                'message' => 'Geen bruikbare werkblokken na filtering (overlap met bestaande timesheets?).',
            ];
        }

        $proposals = DB::transaction(function () use ($user, $rangeStart, $rangeEnd, $normalised): array {
            $this->clearExistingProposalsForRange($user, $rangeStart, $rangeEnd);

            return collect($normalised)
                ->map(fn (array $row): TimesheetEntryProposal => $user->timesheetEntryProposals()->create($row))
                ->all();
        });

        return [
            'status' => $status,
            'proposals' => $proposals,
            'message' => $this->messageFor($status, count($proposals)),
        ];
    }

    private function messageFor(string $status, int $count): string
    {
        return match ($status) {
            'ready' => $count.' AI-voorstel(len) aangemaakt.',
            'manual' => $count.' voorstel(len) gemaakt uit tracker-data (AI uitgeschakeld in instellingen).',
            'unconfigured' => 'OPENAI_API_KEY ontbreekt; '.$count.' voorstel(len) gemaakt uit ruwe tracker-data.',
            'error' => 'AI-oproep mislukt; '.$count.' voorstel(len) gemaakt uit ruwe tracker-data.',
            default => $count.' voorstel(len) aangemaakt.',
        };
    }

    private function clearExistingProposalsForRange(
        User $user,
        CarbonImmutable $rangeStart,
        CarbonImmutable $rangeEnd,
    ): void {
        $user->timesheetEntryProposals()
            ->whereBetween('worked_on', [
                $rangeStart->toDateString(),
                $rangeEnd->toDateString(),
            ])
            ->delete();
    }

    /**
     * @param  list<array<string, mixed>>  $blocks
     * @return list<array<string, mixed>>
     */
    private function requestProposals(
        CarbonImmutable $rangeStart,
        CarbonImmutable $rangeEnd,
        array $blocks,
    ): array {
        $cappedBlocks = array_slice($blocks, 0, self::MAX_BLOCKS_PER_CALL);

        $userPayload = [
            'range_start' => $rangeStart->toDateString(),
            'range_end' => $rangeEnd->toDateString(),
            'blocks' => array_map(
                fn (array $block): array => [
                    'date' => $block['worked_on'],
                    'start' => $block['start'],
                    'end' => $block['end'],
                    'duration_minutes' => $block['duration_minutes'],
                    'applications' => $block['applications'],
                ],
                $cappedBlocks,
            ),
        ];

        $response = Http::openai()
            ->post('/chat/completions', [
                'model' => config('services.openai.model'),
                'temperature' => 0.2,
                'max_tokens' => self::OPENAI_MAX_TOKENS,
                'response_format' => ['type' => 'json_object'],
                'messages' => [
                    [
                        'role' => 'system',
                        'content' => $this->systemPrompt(),
                    ],
                    [
                        'role' => 'user',
                        'content' => json_encode($userPayload, JSON_THROW_ON_ERROR | JSON_UNESCAPED_UNICODE),
                    ],
                ],
            ])
            ->throw();

        $content = $response->json('choices.0.message.content');

        if (! is_string($content) || trim($content) === '') {
            throw new RuntimeException('OpenAI gaf geen JSON-content terug.');
        }

        try {
            $decoded = json_decode($content, true, flags: JSON_THROW_ON_ERROR);
        } catch (\JsonException $e) {
            throw new RuntimeException('OpenAI JSON kon niet gelezen worden: '.$e->getMessage());
        }

        $proposals = $decoded['proposals'] ?? null;

        if (! is_array($proposals)) {
            throw new RuntimeException('OpenAI antwoord bevat geen "proposals" array.');
        }

        return array_values(array_filter($proposals, 'is_array'));
    }

    private function systemPrompt(): string
    {
        return <<<'PROMPT'
Je bent een assistent die ruwe desktop-tracker werkblokken samenvat tot duidelijke
Nederlandse timesheet-voorstellen. De input is een lijst van werkblokken
(datum + tijdsbereik + dominantste applicaties/vensters per blok).

Voor elk voorstel geef je terug:
- worked_on: ISO datum (YYYY-MM-DD), binnen het opgegeven datumbereik
- start: "HH:MM" 24-uurs
- end: "HH:MM" 24-uurs, altijd strikt na start
- title: korte zakelijke titel in het Nederlands (max 60 tekens)
- description: één tot drie heldere zinnen in het Nederlands over wát er gedaan is,
  gebaseerd op de window-titels en applicaties. Schrijf feitelijk en concreet.
  Geen waardeoordelen, geen "vermoedelijk".
- client_name: alleen invullen als duidelijk uit de window-titels (anders null)

Regels:
- Combineer aansluitende blokken aan hetzelfde project tot één voorstel zolang
  dat niet langer dan ~3 uur duurt; splits anders op een natuurlijk moment.
- Negeer overduidelijk niet-werkmateriaal (chat, social media, eigen ontspanning).
- Geen overlap tussen voorstellen op dezelfde dag.
- Rond start/end af op kwartieren wanneer dat de leesbaarheid helpt.
- Antwoord ALTIJD met exact deze JSON-structuur en niets anders:
  {"proposals":[{"worked_on":"YYYY-MM-DD","start":"HH:MM","end":"HH:MM","title":"…","description":"…","client_name":null}]}
PROMPT;
    }

    /**
     * @param  list<array<string, mixed>>  $raw
     * @return list<array{
     *     worked_on: string,
     *     title: string,
     *     description: string|null,
     *     client_name: string|null,
     *     start_minutes: int,
     *     end_minutes: int,
     *     source: string
     * }>
     */
    private function normaliseAndFilterProposals(
        User $user,
        CarbonImmutable $rangeStart,
        CarbonImmutable $rangeEnd,
        array $raw,
    ): array {
        $startDay = $rangeStart->startOfDay();
        $endDayExclusive = $rangeEnd->startOfDay()->addDay();

        $cleaned = [];

        foreach ($raw as $row) {
            $proposal = $this->normaliseRow($row, $startDay, $endDayExclusive);

            if ($proposal === null) {
                continue;
            }

            if ($this->overlapsApprovedEntry($user, $proposal)) {
                continue;
            }

            $cleaned[] = $proposal;
        }

        return $this->dedupeOnSameDay($cleaned);
    }

    /**
     * @param  array<string, mixed>  $row
     * @return array{
     *     worked_on: string,
     *     title: string,
     *     description: string|null,
     *     client_name: string|null,
     *     start_minutes: int,
     *     end_minutes: int,
     *     source: string
     * }|null
     */
    private function normaliseRow(array $row, CarbonImmutable $rangeStart, CarbonImmutable $rangeEndExclusive): ?array
    {
        $workedOn = $row['worked_on'] ?? null;
        $start = $row['start'] ?? null;
        $end = $row['end'] ?? null;
        $title = $row['title'] ?? null;

        if (! is_string($workedOn) || ! is_string($start) || ! is_string($end) || ! is_string($title)) {
            return null;
        }

        try {
            $day = CarbonImmutable::parse($workedOn)->startOfDay();
        } catch (\Throwable) {
            return null;
        }

        if ($day->lessThan($rangeStart) || $day->greaterThanOrEqualTo($rangeEndExclusive)) {
            return null;
        }

        $startMinutes = $this->toMinutes($start);
        $endMinutes = $this->toMinutes($end);

        if ($startMinutes === null || $endMinutes === null || $endMinutes <= $startMinutes) {
            return null;
        }

        $description = $row['description'] ?? null;
        $clientName = $row['client_name'] ?? null;

        return [
            'worked_on' => $day->toDateString(),
            'title' => mb_substr(trim($title), 0, 255),
            'description' => is_string($description) && trim($description) !== ''
                ? mb_substr(trim($description), 0, 10000)
                : null,
            'client_name' => is_string($clientName) && trim($clientName) !== ''
                ? mb_substr(trim($clientName), 0, 255)
                : null,
            'start_minutes' => $startMinutes,
            'end_minutes' => $endMinutes,
            'source' => 'desktop_tracker',
        ];
    }

    /**
     * @param  array{worked_on: string, start_minutes: int, end_minutes: int}  $proposal
     */
    private function overlapsApprovedEntry(User $user, array $proposal): bool
    {
        return TimesheetEntry::overlapsForUserDay(
            $user->id,
            $proposal['worked_on'],
            $proposal['start_minutes'],
            $proposal['end_minutes'],
        );
    }

    /**
     * Drop proposals that overlap another already-accepted proposal on the same day.
     *
     * @param  list<array{worked_on: string, start_minutes: int, end_minutes: int}>  $proposals
     * @return list<array{worked_on: string, start_minutes: int, end_minutes: int}>
     */
    private function dedupeOnSameDay(array $proposals): array
    {
        usort(
            $proposals,
            fn (array $a, array $b): int => [$a['worked_on'], $a['start_minutes']] <=> [$b['worked_on'], $b['start_minutes']],
        );

        $kept = [];

        foreach ($proposals as $proposal) {
            $overlaps = false;

            foreach ($kept as $existing) {
                if ($existing['worked_on'] !== $proposal['worked_on']) {
                    continue;
                }

                if (
                    $proposal['start_minutes'] < $existing['end_minutes']
                    && $proposal['end_minutes'] > $existing['start_minutes']
                ) {
                    $overlaps = true;
                    break;
                }
            }

            if (! $overlaps) {
                $kept[] = $proposal;
            }
        }

        return $kept;
    }

    /**
     * @param  list<array<string, mixed>>  $blocks
     * @return list<array<string, mixed>>
     */
    private function proposalsFromWorkBlocks(array $blocks): array
    {
        return array_map(fn (array $block): array => [
            'worked_on' => $block['worked_on'],
            'start' => $block['start'],
            'end' => $block['end'],
            'title' => $this->titleFromWorkBlock($block),
            'description' => $this->descriptionFromWorkBlock($block),
            'client_name' => null,
        ], $blocks);
    }

    /**
     * @param  array<string, mixed>  $block
     */
    private function titleFromWorkBlock(array $block): string
    {
        $applications = $block['applications'] ?? [];
        $primary = is_array($applications[0] ?? null) ? $applications[0] : null;

        if ($primary === null) {
            return 'Werkzaamheden';
        }

        $windowTitle = trim((string) ($primary['window_title'] ?? ''));
        $application = trim((string) ($primary['application'] ?? ''));

        if ($windowTitle !== '' && $windowTitle !== $application) {
            return mb_substr($windowTitle, 0, 60);
        }

        return mb_substr($application !== '' ? $application : 'Werkzaamheden', 0, 60);
    }

    /**
     * @param  array<string, mixed>  $block
     */
    private function descriptionFromWorkBlock(array $block): string
    {
        $applications = $block['applications'] ?? [];
        $parts = [];

        foreach (array_slice(is_array($applications) ? $applications : [], 0, 4) as $app) {
            if (! is_array($app)) {
                continue;
            }

            $name = trim((string) ($app['application'] ?? ''));
            $minutes = (int) ($app['minutes'] ?? 0);

            if ($name === '') {
                continue;
            }

            $parts[] = $minutes > 0 ? "{$name} ({$minutes} min)" : $name;
        }

        if ($parts === []) {
            return 'Geregistreerd via de desktop-tracker.';
        }

        return 'Werk in: '.implode(', ', $parts).'.';
    }

    private function toMinutes(string $hhmm): ?int
    {
        if (! preg_match('/^(\d{1,2}):(\d{2})$/', $hhmm, $matches)) {
            return null;
        }

        $hours = (int) $matches[1];
        $minutes = (int) $matches[2];

        if ($hours < 0 || $hours > 23 || $minutes < 0 || $minutes > 59) {
            return null;
        }

        return $hours * 60 + $minutes;
    }
}
