<?php

namespace App\Notifications\Contracts;

use App\Enums\InAppNotificationKind;

interface ProvidesSmartInAppNotificationEnhancement
{
    public function smartInAppNotificationKind(): InAppNotificationKind;

    /**
     * @return array<string, string|null>
     */
    public function smartInAppNotificationContext(object $notifiable): array;

    /**
     * @return array{title: string, message: string}
     */
    public function defaultInAppNotificationPayload(): array;
}
