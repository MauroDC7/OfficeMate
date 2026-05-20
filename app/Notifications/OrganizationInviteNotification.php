<?php

namespace App\Notifications;

use App\Models\OrganizationInvite;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class OrganizationInviteNotification extends Notification
{
    use Queueable;

    public function __construct(
        public OrganizationInvite $invite,
        public string $token,
    ) {}

    /**
     * @return list<string>
     */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $organizationName = $this->invite->organization->name;
        $url = route('organization-invite.show', ['token' => $this->token]);

        return (new MailMessage)
            ->subject('Uitnodiging voor '.$organizationName)
            ->line('Je bent uitgenodigd om deel te nemen aan '.$organizationName.' in OfficeMate.')
            ->action('Uitnodiging accepteren', $url)
            ->line('Deze link is 7 dagen geldig.')
            ->line('Als je deze uitnodiging niet verwachtte, kun je deze e-mail negeren.');
    }
}
