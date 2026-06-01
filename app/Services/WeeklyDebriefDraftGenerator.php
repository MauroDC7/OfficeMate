<?php

namespace App\Services;

use App\Models\TimesheetEntry;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use RuntimeException;

/**
 * Stelt een concept-weekly debrief op basis van goedgekeurde timesheet-uren.
 *
 * @phpstan-type DraftPayload array{
 *     difficult_this_week: string,
 *     plans_next_week: string,
 * }
 */
final class WeeklyDebriefDraftGenerator
{
    private const int MAX_TOKENS = 500;

    private const int MAX_ENTRIES = 40;

    private const int MAX_TITLE_CHARS = 120;

    public function isConfigured(): bool
    {
        return ! blank(config('services.openai.key'));
    }

    /**
     * @return DraftPayload
     */
    public function generate(User $user, CarbonImmutable $weekStart): array
    {
        if (! $this->isConfigured()) {
            throw new RuntimeException('AI-voorstellen zijn niet beschikbaar. Vraag je beheerder om een OpenAI-sleutel in te stellen.');
        }

        if ($user->organization_id === null) {
            throw new RuntimeException('Je bent nog niet gekoppeld aan een organisatie.');
        }

        $weekStart = $weekStart->startOfWeek(CarbonImmutable::MONDAY);
        $weekEnd = $weekStart->addDays(6);

        $entries = TimesheetEntry::query()
            ->where('user_id', $user->id)
            ->whereDate('worked_on', '>=', $weekStart->toDateString())
            ->whereDate('worked_on', '<=', $weekEnd->toDateString())
            ->with('project:id,name')
            ->orderBy('worked_on')
            ->orderBy('start_minutes')
            ->limit(self::MAX_ENTRIES)
            ->get();

        $weekLabel = $weekStart->format('d-m-Y').' – '.$weekEnd->format('d-m-Y');

        $loggedWork = $entries->map(function (TimesheetEntry $entry): array {
            $minutes = max(0, $entry->end_minutes - $entry->start_minutes);

            return [
                'date' => $entry->worked_on->format('Y-m-d'),
                'title' => Str::limit((string) $entry->title, self::MAX_TITLE_CHARS),
                'project' => $entry->project?->name,
                'minutes' => $minutes,
            ];
        })->values()->all();

        $response = Http::openai()
            ->post('/chat/completions', [
                'model' => config('services.openai.model'),
                'temperature' => 0.3,
                'max_tokens' => self::MAX_TOKENS,
                'response_format' => ['type' => 'json_object'],
                'messages' => [
                    ['role' => 'system', 'content' => $this->systemPrompt()],
                    ['role' => 'user', 'content' => json_encode([
                        'week' => $weekLabel,
                        'employee' => $user->name,
                        'logged_work' => $loggedWork,
                        'has_logged_work' => $loggedWork !== [],
                    ], JSON_THROW_ON_ERROR | JSON_UNESCAPED_UNICODE)],
                ],
            ])
            ->throw();

        $content = $response->json('choices.0.message.content');

        if (! is_string($content) || trim($content) === '') {
            throw new RuntimeException('Er kwam geen voorstel terug. Probeer het opnieuw of vul handmatig in.');
        }

        try {
            $decoded = json_decode($content, true, flags: JSON_THROW_ON_ERROR);
        } catch (\JsonException $e) {
            throw new RuntimeException('Het AI-voorstel kon niet worden gelezen. Probeer het opnieuw.');
        }

        $difficult = trim((string) ($decoded['difficult_this_week'] ?? ''));
        $plans = trim((string) ($decoded['plans_next_week'] ?? ''));

        if ($difficult === '' || $plans === '') {
            throw new RuntimeException('Het AI-voorstel was onvolledig. Probeer het opnieuw of vul handmatig in.');
        }

        return [
            'difficult_this_week' => Str::limit($difficult, 5000),
            'plans_next_week' => Str::limit($plans, 5000),
        ];
    }

    private function systemPrompt(): string
    {
        return <<<'PROMPT'
Je helpt een Nederlandstalige medewerker een korte weekly debrief in te vullen op basis van geregistreerde werkuren.

Antwoord ALLEEN als JSON-object met exact deze keys:
- "difficult_this_week": string
- "plans_next_week": string

Regels:
- Schrijf in het Nederlands, informeel maar professioneel, in de ik-vorm.
- Per veld: 2 tot 4 korte regels, elk beginnend met "- " (bullet).
- "difficult_this_week": wat was lastig of traag deze week, gebaseerd op de uren (projecten, taken). Geen verzinsels buiten de data.
- "plans_next_week": logische vervolgstappen voor volgende week op basis van lopend werk. Als weinig context: algemene vervolgstappen (afronden, afstemmen met team).
- Als has_logged_work false is: schrijf voorzichtige placeholders die de gebruiker zelf kan aanpassen.
- Geen markdown-koppen, geen extra keys, geen lange alinea's.
PROMPT;
    }
}
