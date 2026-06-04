<?php

namespace App\Console\Commands;

use App\Models\Organization;
use App\Models\User;
use App\Models\WeeklyStatusUpdate;
use App\Notifications\WeeklyStatusReminderNotification;
use App\Services\Slack\WeeklyDebriefSlackNotifier;
use App\Services\WeeklyDebriefSchedule;
use Carbon\CarbonImmutable;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Cache;

final class SendWeeklyStatusReminders extends Command
{
    /**
     * @var string
     */
    protected $signature = 'weekly-status:send-reminders
                            {--force : Verstuur nu (voor testen), negeer dag en tijd}
                            {--slack-only : Alleen Slack-samenvatting, geen e-mails}';

    /**
     * @var string
     */
    protected $description = 'Stuur e-mailherinneringen en optioneel een Slack-samenvatting voor de weekstatus';

    public function __construct(
        private readonly WeeklyDebriefSchedule $weeklyDebriefSchedule,
        private readonly WeeklyDebriefSlackNotifier $weeklyDebriefSlackNotifier,
    ) {
        parent::__construct();
    }

    public function handle(): int
    {
        $now = CarbonImmutable::now($this->weeklyDebriefSchedule->timezone());

        if (! $this->option('force') && ! $this->weeklyDebriefSchedule->isReminderSendMinute($now)) {
            $this->info('Geen herinneringsmoment — geen e-mails verstuurd.');
            $this->line('Gepland: '.$this->weeklyDebriefSchedule->label().' ('.$this->weeklyDebriefSchedule->timezone().').');
            $this->line('Test nu: php artisan weekly-status:send-reminders --force');
            $this->line('Alleen Slack: php artisan weekly-status:send-reminders --force --slack-only');

            return self::SUCCESS;
        }

        if ($this->option('force')) {
            $this->warn('Geforceerd versturen (--force): dag- en tijdcontrole overgeslagen.');
        }

        $weekStartMonday = $now->startOfWeek(CarbonImmutable::MONDAY);
        $weekStart = $weekStartMonday->toDateString();
        $sent = 0;
        $emailFailures = 0;
        $slackOnly = (bool) $this->option('slack-only');

        if ($slackOnly) {
            $this->info('Alleen Slack-samenvatting (--slack-only): e-mails overgeslagen.');
        }

        if (! $slackOnly) {
            User::query()
                ->whereNotNull('organization_id')
                ->whereNotNull('email_verified_at')
                ->orderBy('id')
                ->chunkById(100, function ($users) use ($weekStart, $now, &$sent, &$emailFailures): void {
                    $submittedUserIds = WeeklyStatusUpdate::query()
                        ->whereDate('week_start', $weekStart)
                        ->whereIn('user_id', $users->pluck('id'))
                        ->pluck('user_id');

                    foreach ($users as $user) {
                        if ($submittedUserIds->contains($user->id)) {
                            continue;
                        }

                        $cacheKey = "weekly-debrief-reminder:{$user->id}:{$weekStart}";

                        if (Cache::has($cacheKey)) {
                            continue;
                        }

                        if ($this->sendEmailReminder($user, $now, $cacheKey)) {
                            $sent++;
                        } else {
                            $emailFailures++;
                        }
                    }
                });
        }

        $slackDigests = 0;

        Organization::query()
            ->orderBy('id')
            ->each(function (Organization $organization) use ($weekStartMonday, &$slackDigests): void {
                if ($this->weeklyDebriefSlackNotifier->sendReminderDigest($organization, $weekStartMonday)) {
                    $slackDigests++;
                }
            });

        if (! $slackOnly) {
            $this->info("{$sent} e-mailherinnering(en) verstuurd.");

            if ($emailFailures > 0) {
                $this->warn("{$emailFailures} e-mail(s) mislukt (zie log). Slack-samenvatting wordt wel geprobeerd.");
            }
        }

        if ($this->weeklyDebriefSlackNotifier->isEnabled()) {
            $this->info("{$slackDigests} Slack-samenvatting(en) verstuurd.");
        } elseif ($slackOnly) {
            $this->warn('Slack niet geconfigureerd: zet SLACK_INCOMING_WEBHOOK_URL in .env.');
        }

        return self::SUCCESS;
    }

    private function sendEmailReminder(User $user, CarbonImmutable $now, string $cacheKey): bool
    {
        try {
            $user->notify(new WeeklyStatusReminderNotification);
        } catch (\Throwable $exception) {
            report($exception);

            return false;
        }

        Cache::put($cacheKey, true, $now->endOfWeek());

        return true;
    }
}
