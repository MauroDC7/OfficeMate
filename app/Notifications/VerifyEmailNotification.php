<?php

namespace App\Notifications;

use App\Mail\WelcomeVerifyEmail;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\URL;

final class VerifyEmailNotification extends Notification
{
    use Queueable;

    /**
     * @return list<string>
     */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): WelcomeVerifyEmail
    {
        $expireMinutes = (int) Config::get('auth.verification.expire', 60);

        return (new WelcomeVerifyEmail(
            firstName: $notifiable->first_name,
            verificationUrl: $this->verificationUrl($notifiable),
            expireMinutes: $expireMinutes,
        ))->to($notifiable->routeNotificationFor('mail'));
    }

    protected function verificationUrl(object $notifiable): string
    {
        return URL::temporarySignedRoute(
            'verification.verify',
            now()->addMinutes((int) Config::get('auth.verification.expire', 60)),
            [
                'id' => $notifiable->getKey(),
                'hash' => sha1($notifiable->getEmailForVerification()),
            ],
        );
    }
}
