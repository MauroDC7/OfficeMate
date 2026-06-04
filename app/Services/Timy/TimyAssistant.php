<?php

namespace App\Services\Timy;

use App\Models\TimyMessage;
use App\Models\User;
use App\Services\WeeklyDebriefDraftGenerator;
use App\Services\WeeklyDebriefSchedule;
use Carbon\CarbonImmutable;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use JsonException;
use RuntimeException;

/**
 * @phpstan-import-type TimyContext from TimyUserContext
 * @phpstan-import-type TimyActionLink from TimyUserContext
 */
final class TimyAssistant
{
    private const int MAX_HISTORY = 12;

    private const int MAX_TOKENS = 700;

    public function __construct(
        private readonly TimyUserContext $timyUserContext,
        private readonly TimyFallbackResponder $timyFallbackResponder,
        private readonly WeeklyDebriefDraftGenerator $weeklyDebriefDraftGenerator,
        private readonly WeeklyDebriefSchedule $weeklyDebriefSchedule,
    ) {}

    public function isConfigured(): bool
    {
        return ! blank(config('services.openai.key'));
    }

    /**
     * @param  Collection<int, TimyMessage>  $history
     * @return array{content: string, actions: list<TimyActionLink>}
     */
    public function reply(User $user, string $userMessage, Collection $history, string $pagePath): array
    {
        $context = $this->timyUserContext->build($user, $pagePath);

        if ($this->isWeeklyDebriefDraftRequest($userMessage)) {
            return $this->weeklyDebriefDraftReply($user);
        }

        if (! $this->isConfigured()) {
            return $this->timyFallbackResponder->reply($userMessage, $context);
        }

        try {
            return $this->replyWithOpenAi($userMessage, $history, $context);
        } catch (RuntimeException) {
            return $this->timyFallbackResponder->reply($userMessage, $context);
        }
    }

    /**
     * @param  Collection<int, TimyMessage>  $history
     * @param  TimyContext  $context
     * @return array{content: string, actions: list<TimyActionLink>}
     */
    private function replyWithOpenAi(string $userMessage, Collection $history, array $context): array
    {
        $messages = [
            ['role' => 'system', 'content' => $this->systemPrompt()],
            [
                'role' => 'user',
                'content' => json_encode([
                    'context' => $context,
                    'instruction' => 'Gebruik alleen deze context voor feiten. Verzin geen cijfers of statussen.',
                ], JSON_THROW_ON_ERROR | JSON_UNESCAPED_UNICODE),
            ],
        ];

        foreach ($history->take(-self::MAX_HISTORY) as $message) {
            $messages[] = [
                'role' => $message->role === 'user' ? 'user' : 'assistant',
                'content' => $message->role === 'assistant'
                    ? json_encode([
                        'message' => $message->content,
                        'actions' => $message->actions ?? [],
                    ], JSON_THROW_ON_ERROR | JSON_UNESCAPED_UNICODE)
                    : $message->content,
            ];
        }

        $messages[] = ['role' => 'user', 'content' => $userMessage];

        $response = Http::openai()
            ->post('/chat/completions', [
                'model' => config('services.openai.model'),
                'temperature' => 0.4,
                'max_tokens' => self::MAX_TOKENS,
                'response_format' => ['type' => 'json_object'],
                'messages' => $messages,
            ])
            ->throw();

        $content = $response->json('choices.0.message.content');

        if (! is_string($content) || trim($content) === '') {
            throw new RuntimeException('Leeg antwoord van OpenAI.');
        }

        try {
            $decoded = json_decode($content, true, flags: JSON_THROW_ON_ERROR);
        } catch (JsonException $e) {
            throw new RuntimeException('OpenAI-antwoord kon niet worden gelezen.', 0, $e);
        }

        $text = trim((string) ($decoded['message'] ?? $decoded['content'] ?? ''));

        if ($text === '') {
            throw new RuntimeException('OpenAI-antwoord mist tekst.');
        }

        /** @var list<TimyActionLink> $actions */
        $actions = $this->normalizeActions($decoded['actions'] ?? [], $context);

        return [
            'content' => $text,
            'actions' => $actions,
        ];
    }

    private function systemPrompt(): string
    {
        return <<<'PROMPT'
Je bent Timy, de ingebouwde AI-hulp van TimeTraq (OfficeMate). Antwoord altijd in het Nederlands, kort en vriendelijk.

Regels:
- Gebruik alleen feiten uit de meegeleverde context (uren, verlof, projecten, admin-cijfers, tips).
- Verzin geen data. Bij onzekerheid: zeg dat je het niet weet en verwijs naar het juiste scherm.
- Fase A: uitleg, navigatie, status (uren/verlof), knoppen via "actions" met interne paden (href begint met /).
- Fase B: houd rekening met "page" in context; geef pagina-relevante hulp.
- Fase C: vermeld proactieve tips uit context als die passen; voer zelf nooit mutaties uit — geef alleen links of uitleg.

Antwoord uitsluitend als JSON:
{"message":"...","actions":[{"label":"...","href":"/pad"}]}
Maximaal 3 actions. Geen markdown in message.
PROMPT;
    }

    /**
     * @param  TimyContext  $context
     * @return list<TimyActionLink>
     */
    private function normalizeActions(mixed $raw, array $context): array
    {
        if (! is_array($raw)) {
            return array_slice($context['quick_links'] ?? [], 0, 2);
        }

        $actions = [];

        foreach ($raw as $item) {
            if (! is_array($item)) {
                continue;
            }

            $label = trim((string) ($item['label'] ?? ''));
            $href = trim((string) ($item['href'] ?? ''));

            if ($label === '' || $href === '' || ! str_starts_with($href, '/')) {
                continue;
            }

            $actions[] = ['label' => $label, 'href' => $href];
        }

        if ($actions === []) {
            return array_slice($context['quick_links'] ?? [], 0, 2);
        }

        return array_slice($actions, 0, 3);
    }

    public static function welcomeContent(string $firstName): string
    {
        $greeting = $firstName !== '' ? "Hoi {$firstName}!" : 'Hoi!';

        return "{$greeting} Ik ben Timy. Stel een vraag over timesheets, verlof, projecten of waar je iets vindt in TimeTraq.";
    }

    private function isWeeklyDebriefDraftRequest(string $message): bool
    {
        $normalized = Str::lower(trim($message));

        $wantsGeneration = Str::contains($normalized, [
            'genereer', 'maak', 'schrijf', 'help met', 'concept', 'voorstel', 'draft',
        ]);

        $aboutDebrief = Str::contains($normalized, [
            'debrief', 'weekstatus', 'weekly', 'week update', 'weekupdate',
        ]);

        return $wantsGeneration && $aboutDebrief;
    }

    /**
     * @return array{content: string, actions: list<TimyActionLink>}
     */
    private function weeklyDebriefDraftReply(User $user): array
    {
        if (! $this->weeklyDebriefDraftGenerator->isConfigured()) {
            return [
                'content' => 'Een AI-concept voor je weekstatus is nu niet beschikbaar. Vraag je beheerder om OPENAI_API_KEY in te stellen, of vul je weekstatus handmatig in op Projecten.',
                'actions' => [
                    ['label' => 'Naar projecten', 'href' => route('projects')],
                ],
            ];
        }

        try {
            $weekStart = CarbonImmutable::now($this->weeklyDebriefSchedule->timezone())
                ->startOfWeek(CarbonImmutable::MONDAY);

            $draft = $this->weeklyDebriefDraftGenerator->generate($user, $weekStart);

            $content = "Hier is een concept voor je weekstatus deze week:\n\n"
                ."Wat ging lastig:\n{$draft['difficult_this_week']}\n\n"
                ."Plannen volgende week:\n{$draft['plans_next_week']}\n\n"
                .'Kopieer dit naar het formulier op Projecten en pas het gerust aan.';

            return [
                'content' => $content,
                'actions' => [
                    ['label' => 'Weekstatus invullen', 'href' => route('projects')],
                ],
            ];
        } catch (RuntimeException $exception) {
            return [
                'content' => $exception->getMessage(),
                'actions' => [
                    ['label' => 'Naar projecten', 'href' => route('projects')],
                ],
            ];
        }
    }
}
