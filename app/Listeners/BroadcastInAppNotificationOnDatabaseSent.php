<?php

namespace App\Listeners;

use App\Events\InAppNotificationChanged;
use App\Models\User;
use App\Notifications\Contracts\ProvidesSmartInAppNotificationEnhancement;
use App\Services\SmartInAppNotificationCopy;
use Illuminate\Notifications\DatabaseNotification;
use Illuminate\Notifications\Events\NotificationSent;

final class BroadcastInAppNotificationOnDatabaseSent
{
    public function __construct(
        private readonly SmartInAppNotificationCopy $smartInAppNotificationCopy,
    ) {}

    public function handle(NotificationSent $event): void
    {
        if ($event->channel !== 'database') {
            return;
        }

        if (! $event->notifiable instanceof User) {
            return;
        }

        InAppNotificationChanged::dispatch($event->notifiable->id);

        $notification = $event->notification;

        if (
            ! $notification instanceof ProvidesSmartInAppNotificationEnhancement
            || ! $this->smartInAppNotificationCopy->isConfigured()
            || ! $event->response instanceof DatabaseNotification
        ) {
            return;
        }

        $fallback = $notification->defaultInAppNotificationPayload();
        $payload = $this->smartInAppNotificationCopy->generate(
            $notification->smartInAppNotificationKind(),
            $event->notifiable,
            $notification->smartInAppNotificationContext($event->notifiable),
            $fallback,
        );

        if ($payload === $fallback) {
            return;
        }

        $event->response->forceFill(['data' => $payload])->save();

        InAppNotificationChanged::dispatch($event->notifiable->id);
    }
}
