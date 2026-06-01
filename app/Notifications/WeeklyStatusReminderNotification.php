<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

final class WeeklyStatusReminderNotification extends Notification
{
    use Queueable;

    /**
     * @return list<string>
     */
    public function via(object $notifiable): array
    {
        return ['database'];
    }

    /**
     * @return array{title: string, message: string}
     */
    public function toDatabase(object $notifiable): array
    {
        return [
            'title' => 'Weekly debrief invullen',
            'message' => 'Wat was deze week moeilijk en wat ga je volgende week doen?',
        ];
    }
}
