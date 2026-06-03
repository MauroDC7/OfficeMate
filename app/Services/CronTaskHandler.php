<?php

namespace App\Services;

use Illuminate\Support\Facades\Artisan;

/**
 * HTTP entry point for Combell cron (public/jobs/task.php).
 */
final class CronTaskHandler
{
    public function isSecretConfigured(): bool
    {
        $secret = config('services.cron.secret');

        return is_string($secret) && $secret !== '';
    }

    public function isAuthorized(?string $providedToken): bool
    {
        $configured = config('services.cron.secret');

        if (! is_string($configured) || $configured === '') {
            return false;
        }

        if (! is_string($providedToken) || $providedToken === '') {
            return false;
        }

        return hash_equals($configured, $providedToken);
    }

    public function runScheduler(): int
    {
        return Artisan::call('schedule:run');
    }
}
