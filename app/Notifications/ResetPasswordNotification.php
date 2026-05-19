<?php

namespace App\Notifications;

use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Notifications\Messages\MailMessage;

class ResetPasswordNotification extends ResetPassword
{
    /**
     * @param  mixed  $notifiable
     */
    protected function buildMailMessage($url): MailMessage
    {
        $expire = config('auth.passwords.'.config('auth.defaults.passwords').'.expire');

        return (new MailMessage)
            ->subject('Wachtwoord resetten')
            ->line('Je ontvangt deze e-mail omdat we een verzoek hebben ontvangen om je wachtwoord te resetten.')
            ->action('Nieuw wachtwoord instellen', $url)
            ->line("Deze link is {$expire} minuten geldig.")
            ->line('Als je geen reset hebt aangevraagd, hoef je niets te doen.');
    }
}
