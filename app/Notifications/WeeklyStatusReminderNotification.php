<?php

namespace App\Notifications;

use App\Mail\WeeklyDebriefReminderMail;
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
        return ['mail'];
    }

    public function toMail(object $notifiable): WeeklyDebriefReminderMail
    {
        return (new WeeklyDebriefReminderMail(
            firstName: $notifiable->first_name,
            projectsUrl: route('projects'),
        ))->to($notifiable->routeNotificationFor('mail'));
    }
}
