<?php

namespace App\Services;

use App\Models\Organization;
use App\Models\User;
use App\Models\WeeklyDebriefSummary;
use App\Models\WeeklyStatusUpdate;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use RuntimeException;

final class WeeklyDebriefSummarizer
{
    private const int MAX_TOKENS = 1200;

    private const int MAX_CHARS_PER_FIELD = 500;

    public function isConfigured(): bool
    {
        return ! blank(config('services.openai.key'));
    }

    public function findCached(Organization $organization, string $weekStart): ?WeeklyDebriefSummary
    {
        return WeeklyDebriefSummary::query()
            ->where('organization_id', $organization->id)
            ->whereDate('week_start', $weekStart)
            ->first();
    }

    public function summarize(Organization $organization, CarbonImmutable $weekStart): WeeklyDebriefSummary
    {
        if (! $this->isConfigured()) {
            throw new RuntimeException('OPENAI_API_KEY ontbreekt. Voeg een sleutel toe in je .env.');
        }

        $members = User::query()
            ->where('organization_id', $organization->id)
            ->orderBy('first_name')
            ->orderBy('last_name')
            ->get(['id', 'first_name', 'last_name']);

        $submissions = WeeklyStatusUpdate::query()
            ->whereDate('week_start', $weekStart->toDateString())
            ->whereIn('user_id', $members->pluck('id'))
            ->get()
            ->keyBy('user_id');

        $submittedCount = $submissions->count();

        if ($submittedCount === 0) {
            throw new RuntimeException('Er zijn nog geen ingevulde debriefs voor deze week.');
        }

        $weekEnd = $weekStart->addDays(6);
        $weekLabel = $weekStart->format('d-m-Y').' – '.$weekEnd->format('d-m-Y');

        $debriefs = $members
            ->filter(fn (User $member): bool => $submissions->has($member->id))
            ->map(function (User $member) use ($submissions): array {
                $row = $submissions->get($member->id);

                return [
                    'name' => $member->name,
                    'difficult_this_week' => Str::limit((string) $row->difficult_this_week, self::MAX_CHARS_PER_FIELD),
                    'plans_next_week' => Str::limit((string) $row->plans_next_week, self::MAX_CHARS_PER_FIELD),
                ];
            })
            ->values()
            ->all();

        $response = Http::openai()
            ->post('/chat/completions', [
                'model' => config('services.openai.model'),
                'temperature' => 0.3,
                'max_tokens' => self::MAX_TOKENS,
                'messages' => [
                    ['role' => 'system', 'content' => $this->systemPrompt()],
                    ['role' => 'user', 'content' => json_encode([
                        'organization' => $organization->name,
                        'week' => $weekLabel,
                        'submitted_count' => $submittedCount,
                        'total_members' => $members->count(),
                        'debriefs' => $debriefs,
                    ], JSON_THROW_ON_ERROR | JSON_UNESCAPED_UNICODE)],
                ],
            ])
            ->throw();

        $content = $response->json('choices.0.message.content');

        if (! is_string($content) || trim($content) === '') {
            throw new RuntimeException('OpenAI gaf geen samenvatting terug.');
        }

        return WeeklyDebriefSummary::query()->updateOrCreate(
            [
                'organization_id' => $organization->id,
                'week_start' => $weekStart->toDateString(),
            ],
            [
                'content' => trim($content),
                'submitted_count' => $submittedCount,
                'total_members' => $members->count(),
            ],
        );
    }

    private function systemPrompt(): string
    {
        return <<<'PROMPT'
Je bent een assistent voor een Nederlands teamoverzicht. Je krijgt alle ingevulde weekly debriefs van één week (per collega: wat was moeilijk, wat staat volgende week gepland).

Schrijf een beknopte teamsamenvatting in het Nederlands als markdown met exact deze koppen (##):
## Deze week in het kort
## Waar het moeilijk was
## Volgende week (gepland)
## Aandachtspunten voor lead

Regels:
- Gebruik korte alinea's en bullets waar nuttig.
- Noem collega's bij naam als dat helpt bij actiepunten.
- Groepeer dubbele thema's; herhaal niet letterlijk elke debrief.
- Wees concreet; geen fluff.
- Als submitted_count lager is dan total_members, vermeld onder Aandachtspunten hoeveel nog niet hebben ingevuld.
- Geen andere koppen dan de vier hierboven.
PROMPT;
    }
}
