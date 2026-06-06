<?php

namespace App\Notifications\Concerns;

use Illuminate\Notifications\Notification;
use NotificationChannels\WebPush\WebPushMessage;

trait SendsWebPushFromDatabasePayload
{
    abstract protected function webPushUrl(object $notifiable): string;

    /**
     * @return array{title: string, message: string}
     */
    abstract protected function webPushNotificationPayload(object $notifiable): array;

    public function toWebPush(object $notifiable, Notification $notification): WebPushMessage
    {
        $payload = $this->webPushNotificationPayload($notifiable);

        return (new WebPushMessage)
            ->title($payload['title'])
            ->body($payload['message'])
            ->icon(asset('img/Logo.png'))
            ->data(['url' => $this->webPushUrl($notifiable)])
            ->options(['TTL' => 86400]);
    }
}
