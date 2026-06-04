<?php

namespace App\Services;

use App\Enums\InAppNotificationKind;
use App\Models\User;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

/**
 * Genereert menselijke in-app notificatieteksten (database channel) via OpenAI.
 *
 * @phpstan-type NotificationPayload array{title: string, message: string}
 */
final class SmartInAppNotificationCopy
{
    private const int MAX_TOKENS = 150;

    private const int MAX_TITLE_CHARS = 60;

    private const int MAX_MESSAGE_CHARS = 200;

    public function isConfigured(): bool
    {
        return ! blank(config('services.openai.key'));
    }

    /**
     * @param  array<string, string|null>  $context
     * @param  NotificationPayload  $fallback
     * @return NotificationPayload
     */
    public function generate(
        InAppNotificationKind $kind,
        User $recipient,
        array $context,
        array $fallback,
    ): array {
        if (! $this->isConfigured()) {
            return $fallback;
        }

        try {
            $response = Http::openai()
                ->post('/chat/completions', [
                    'model' => config('services.openai.model'),
                    'temperature' => 0.65,
                    'max_tokens' => self::MAX_TOKENS,
                    'response_format' => ['type' => 'json_object'],
                    'messages' => [
                        ['role' => 'system', 'content' => $this->systemPrompt($kind)],
                        ['role' => 'user', 'content' => json_encode([
                            'recipient_first_name' => $recipient->first_name,
                            'context' => $context,
                        ], JSON_THROW_ON_ERROR | JSON_UNESCAPED_UNICODE)],
                    ],
                ])
                ->throw();

            $content = $response->json('choices.0.message.content');

            if (! is_string($content) || trim($content) === '') {
                return $fallback;
            }

            $decoded = json_decode($content, true, flags: JSON_THROW_ON_ERROR);

            if (! is_array($decoded)) {
                return $fallback;
            }

            $title = $this->sanitizeLine($decoded['title'] ?? null);
            $message = $this->sanitizeLine($decoded['message'] ?? null);

            if ($title === null || $message === null) {
                return $fallback;
            }

            return [
                'title' => Str::limit($title, self::MAX_TITLE_CHARS, ''),
                'message' => Str::limit($message, self::MAX_MESSAGE_CHARS, ''),
            ];
        } catch (\Throwable $exception) {
            report($exception);

            return $fallback;
        }
    }

    private function systemPrompt(InAppNotificationKind $kind): string
    {
        $tone = match ($kind) {
            InAppNotificationKind::LeaveRejected => 'Empathisch en rustig, geen grappen. Help de ontvanger begrijpen wat er gebeurde.',
            InAppNotificationKind::LeaveSubmitted => 'Helder en uitnodigend om actie te nemen, alsof je een collega-admin een seintje geeft.',
            InAppNotificationKind::LeaveApproved => 'Oprecht blij en collegiaal, alsof je goed nieuws deelt in Slack.',
        };

        return implode("\n", [
            'Je schrijft korte in-app meldingen voor TimeTraq, een Nederlands HR/timesheet-product.',
            'Toon: '.$tone,
            'Schrijf als een collega in Slack: menselijk, warm, direct. Geen corporate jargon.',
            'Antwoord ALLEEN met JSON: {"title":"...","message":"..."}.',
            'title: maximaal één korte zin of fragment (geen punt nodig).',
            'message: één of twee korte zinnen met de feiten uit context. Geen marketing.',
            'Taal: uitsluitend Nederlands.',
            'Gebruik NOOIT het em-dash-teken (—) of het en-dash-teken (–). Gebruik komma\'s, punten of het woord "tot" voor periodes.',
            'Gebruik de voornaam van de ontvanger (recipient_first_name) waar dat natuurlijk is.',
            'Verzin geen feiten: gebruik alleen wat in context staat.',
        ]);
    }

    private function sanitizeLine(mixed $value): ?string
    {
        if (! is_string($value)) {
            return null;
        }

        $line = trim(preg_replace('/\s+/u', ' ', $value) ?? '');

        if ($line === '') {
            return null;
        }

        $line = str_replace(['—', '–'], ['', ' tot '], $line);
        $line = preg_replace('/\s+/u', ' ', $line) ?? $line;

        return trim($line) === '' ? null : trim($line);
    }
}
