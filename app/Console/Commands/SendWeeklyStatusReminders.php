<?php

namespace App\Console\Commands;

use App\Models\User;
use App\Models\WeeklyStatusUpdate;
use App\Notifications\WeeklyStatusReminderNotification;
use App\Services\WeeklyDebriefSchedule;
use Carbon\CarbonImmutable;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Cache;

final class SendWeeklyStatusReminders extends Command
{
    /**
     * @var string
     */
    protected $signature = 'weekly-status:send-reminders';

    /**
     * @var string
     */
    protected $description = 'Stuur e-mailherinneringen voor de weekly debrief';

    public function __construct(
        private readonly WeeklyDebriefSchedule $weeklyDebriefSchedule,
    ) {
        parent::__construct();
    }

    public function handle(): int
    {
        $now = CarbonImmutable::now($this->weeklyDebriefSchedule->timezone());

        if (! $this->weeklyDebriefSchedule->isReminderSendMinute($now)) {
            $this->info('Geen herinneringsmoment — geen e-mails verstuurd.');

            return self::SUCCESS;
        }

        $weekStart = $now->startOfWeek(CarbonImmutable::MONDAY)->toDateString();
        $sent = 0;

        User::query()
            ->whereNotNull('organization_id')
            ->whereNotNull('email_verified_at')
            ->orderBy('id')
            ->chunkById(100, function ($users) use ($weekStart, $now, &$sent): void {
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

                    $user->notify(new WeeklyStatusReminderNotification);
                    Cache::put($cacheKey, true, $now->endOfWeek());
                    $sent++;
                }
            });

        $this->info("{$sent} e-mailherinnering(en) verstuurd.");

        return self::SUCCESS;
    }
}
