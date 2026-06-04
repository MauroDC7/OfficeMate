<?php

namespace App\Jobs;

use App\Enums\InAppNotificationKind;
use App\Events\InAppNotificationChanged;
use App\Models\User;
use App\Services\SmartInAppNotificationCopy;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Notifications\DatabaseNotification;
use Illuminate\Queue\SerializesModels;

final class EnhanceDatabaseInAppNotification implements ShouldQueue
{
    use Queueable, SerializesModels;

    /**
     * @param  array<string, string|null>  $context
     * @param  array{title: string, message: string}  $fallback
     */
    public function __construct(
        public string $databaseNotificationId,
        public int $recipientId,
        public InAppNotificationKind $kind,
        public array $context,
        public array $fallback,
    ) {}

    public function handle(SmartInAppNotificationCopy $copy): void
    {
        if (! $copy->isConfigured()) {
            return;
        }

        $databaseNotification = DatabaseNotification::query()->find($this->databaseNotificationId);

        if ($databaseNotification === null) {
            return;
        }

        $recipient = User::query()->find($this->recipientId);

        if (! $recipient instanceof User) {
            return;
        }

        $payload = $copy->generate(
            $this->kind,
            $recipient,
            $this->context,
            $this->fallback,
        );

        if ($payload === $this->fallback) {
            return;
        }

        $databaseNotification->forceFill(['data' => $payload])->save();

        InAppNotificationChanged::dispatch($this->recipientId);
    }
}
