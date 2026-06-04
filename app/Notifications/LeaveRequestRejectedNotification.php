<?php

namespace App\Notifications;

use App\Enums\InAppNotificationKind;
use App\Models\LeaveRequest;
use App\Notifications\Concerns\FormatsLeaveRequestDetails;
use App\Notifications\Concerns\SendsWebPushFromDatabasePayload;
use App\Notifications\Contracts\ProvidesSmartInAppNotificationEnhancement;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use NotificationChannels\WebPush\WebPushChannel;

final class LeaveRequestRejectedNotification extends Notification implements ProvidesSmartInAppNotificationEnhancement
{
    use FormatsLeaveRequestDetails;
    use Queueable;
    use SendsWebPushFromDatabasePayload;

    public function __construct(public LeaveRequest $leaveRequest) {}

    /**
     * @return list<string>
     */
    public function via(object $notifiable): array
    {
        return ['mail', 'database', WebPushChannel::class];
    }

    public function smartInAppNotificationKind(): InAppNotificationKind
    {
        return InAppNotificationKind::LeaveRejected;
    }

    /**
     * @return array<string, string|null>
     */
    public function smartInAppNotificationContext(object $notifiable): array
    {
        $reason = $this->leaveRequest->rejection_reason;

        return [
            'leave_type' => $this->leaveRequest->type->label(),
            'period' => $this->leaveRequestPeriodLabel($this->leaveRequest),
            'rejection_reason' => is_string($reason) && trim($reason) !== '' ? trim($reason) : null,
        ];
    }

    /**
     * @return array{title: string, message: string}
     */
    public function defaultInAppNotificationPayload(): array
    {
        $period = $this->leaveRequestPeriodLabel($this->leaveRequest);
        $message = $this->leaveRequest->type->label().' ('.$period.')';

        if (is_string($this->leaveRequest->rejection_reason) && trim($this->leaveRequest->rejection_reason) !== '') {
            $message .= '. Reden: '.$this->leaveRequest->rejection_reason;
        }

        return [
            'title' => 'Verlof afgewezen',
            'message' => $message,
        ];
    }

    protected function webPushUrl(object $notifiable): string
    {
        return route('leaveRequests');
    }

    public function toMail(object $notifiable): MailMessage
    {
        $period = $this->leaveRequestPeriodLabel($this->leaveRequest);
        $typeLabel = $this->leaveRequest->type->label();

        $mail = (new MailMessage)
            ->subject('Verlofaanvraag afgewezen')
            ->line('Je verlofaanvraag ('.$typeLabel.', '.$period.') is afgewezen.');

        if (is_string($this->leaveRequest->rejection_reason) && trim($this->leaveRequest->rejection_reason) !== '') {
            $mail->line('Reden: '.$this->leaveRequest->rejection_reason);
        }

        return $mail
            ->action('Mijn verlof', route('leaveRequests'))
            ->line('Je kunt de aanvraag bekijken in TimeTraq.');
    }

    /**
     * @return array{title: string, message: string}
     */
    protected function webPushNotificationPayload(object $notifiable): array
    {
        return $this->defaultInAppNotificationPayload();
    }

    /**
     * @return array{title: string, message: string}
     */
    public function toArray(object $notifiable): array
    {
        return $this->defaultInAppNotificationPayload();
    }
}
