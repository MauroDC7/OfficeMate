<?php

namespace App\Console\Commands;

use App\Models\User;
use App\Models\WeeklyStatusUpdate;
use App\Notifications\WeeklyStatusReminderNotification;
use Carbon\CarbonImmutable;
use Illuminate\Console\Command;

final class SendWeeklyStatusReminders extends Command
{
    /**
     * @var string
     */
    protected $signature = 'weekly-status:send-reminders';

    /**
     * @var string
     */
    protected $description = 'Stuur vrijdag om 15u herinneringen voor de weekly debrief';

    public function handle(): int
    {
        $timezone = config('services.timesheets.timezone', 'Europe/Brussels');
        $now = CarbonImmutable::now($timezone);

        if (! $now->isFriday()) {
            $this->info('Geen vrijdag — geen herinneringen verstuurd.');

            return self::SUCCESS;
        }

        $weekStart = $now->startOfWeek(CarbonImmutable::MONDAY)->toDateString();
        $sent = 0;

        User::query()
            ->whereNotNull('email_verified_at')
            ->orderBy('id')
            ->chunkById(100, function ($users) use ($weekStart, &$sent): void {
                $submittedUserIds = WeeklyStatusUpdate::query()
                    ->whereDate('week_start', $weekStart)
                    ->whereIn('user_id', $users->pluck('id'))
                    ->pluck('user_id');

                foreach ($users as $user) {
                    if ($submittedUserIds->contains($user->id)) {
                        continue;
                    }

                    if ($user->notifications()
                        ->where('type', WeeklyStatusReminderNotification::class)
                        ->whereDate('created_at', today())
                        ->exists()) {
                        continue;
                    }

                    $user->notify(new WeeklyStatusReminderNotification);
                    $sent++;
                }
            });

        $this->info("{$sent} herinnering(en) verstuurd.");

        return self::SUCCESS;
    }
}
