<?php

namespace App\Services;

use Carbon\CarbonImmutable;

final class WeeklyDebriefSchedule
{
    public function timezone(): string
    {
        return config('services.timesheets.timezone', 'Europe/Brussels');
    }

    public function reminderWeekday(): int
    {
        return (int) config('services.weekly_debrief.reminder_weekday', 5);
    }

    public function reminderTime(): string
    {
        $time = config('services.weekly_debrief.reminder_time', '15:00');

        return CarbonImmutable::parse((string) $time)->format('H:i');
    }

    public function isReminderDue(?CarbonImmutable $now = null): bool
    {
        $now ??= CarbonImmutable::now($this->timezone());

        return $now->dayOfWeek === $this->reminderWeekday()
            && $now->format('H:i') >= $this->reminderTime();
    }

    public function isReminderSendMinute(?CarbonImmutable $now = null): bool
    {
        $now ??= CarbonImmutable::now($this->timezone());

        return $now->dayOfWeek === $this->reminderWeekday()
            && $now->format('H:i') === $this->reminderTime();
    }

    public function label(): string
    {
        $weekdays = [
            0 => 'zondag',
            1 => 'maandag',
            2 => 'dinsdag',
            3 => 'woensdag',
            4 => 'donderdag',
            5 => 'vrijdag',
            6 => 'zaterdag',
        ];

        $day = $weekdays[$this->reminderWeekday()] ?? 'vrijdag';

        return ucfirst($day).' om '.$this->reminderTime();
    }
}
