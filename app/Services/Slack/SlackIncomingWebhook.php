<?php

declare(strict_types=1);

namespace App\Services\Slack;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Throwable;

/**
 * Sends messages using Slack Incoming Webhooks (classic Slack apps, Free workspaces).
 */
final class SlackIncomingWebhook
{
    private const string USER_AGENT = 'TimeTraq/1.0 (Laravel Incoming Webhook)';

    public function __construct(
        private readonly int $timeoutSeconds = 5,
    ) {}

    public function isConfigured(): bool
    {
        $url = config('services.slack.incoming_webhook_url');

        return is_string($url) && $url !== '';
    }

    public function send(string $text, ?string $username = null, ?string $iconEmoji = null): bool
    {
        $trimmed = trim($text);

        if ($trimmed === '' || ! $this->isConfigured()) {
            return false;
        }

        $url = config('services.slack.incoming_webhook_url');

        if (! is_string($url) || $url === '') {
            return false;
        }

        $payload = ['text' => $trimmed];

        if ($username !== null && $username !== '') {
            $payload['username'] = $username;
        }

        if ($iconEmoji !== null && $iconEmoji !== '') {
            $payload['icon_emoji'] = $iconEmoji;
        }

        try {
            $response = Http::timeout($this->timeoutSeconds)
                ->withHeaders(['User-Agent' => self::USER_AGENT])
                ->asJson()
                ->post($url, $payload);

            if (! $response->successful()) {
                Log::warning('Slack incoming webhook request failed', [
                    'status' => $response->status(),
                    'body' => Str::limit($response->body(), 500),
                ]);

                return false;
            }

            return true;
        } catch (Throwable $e) {
            Log::warning('Slack incoming webhook exception', [
                'exception' => $e->getMessage(),
            ]);

            return false;
        }
    }
}
