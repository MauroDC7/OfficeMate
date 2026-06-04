<?php

namespace App\Listeners;

use App\Events\InAppNotificationChanged;
use App\Jobs\EnhanceDatabaseInAppNotification;
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

        if (! $notification instanceof ProvidesSmartInAppNotificationEnhancement) {
            return;
        }

        if (! $this->smartInAppNotificationCopy->isConfigured()) {
            return;
        }

        if (! $event->response instanceof DatabaseNotification) {
            return;
        }

        EnhanceDatabaseInAppNotification::dispatch(
            databaseNotificationId: $event->response->id,
            recipientId: $event->notifiable->id,
            kind: $notification->smartInAppNotificationKind(),
            context: $notification->smartInAppNotificationContext($event->notifiable),
            fallback: $notification->defaultInAppNotificationPayload(),
        );
    }
}
