<?php

namespace App\Notifications\Concerns;

use Illuminate\Notifications\Notification;
use NotificationChannels\WebPush\WebPushMessage;

trait SendsWebPushFromDatabasePayload
{
    abstract protected function webPushUrl(object $notifiable): string;

    public function toWebPush(object $notifiable, Notification $notification): WebPushMessage
    {
        /** @var array{title: string, message: string} $payload */
        $payload = $this->toArray($notifiable);

        return (new WebPushMessage)
            ->title($payload['title'])
            ->body($payload['message'])
            ->icon(asset('img/Logo.png'))
            ->data(['url' => $this->webPushUrl($notifiable)])
            ->options(['TTL' => 86400]);
    }
}
