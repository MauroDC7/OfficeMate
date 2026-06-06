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

final class LeaveRequestApprovedNotification extends Notification implements ProvidesSmartInAppNotificationEnhancement
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
        return ['database', 'mail', WebPushChannel::class];
    }

    public function smartInAppNotificationKind(): InAppNotificationKind
    {
        return InAppNotificationKind::LeaveApproved;
    }

    /**
     * @return array<string, string|null>
     */
    public function smartInAppNotificationContext(object $notifiable): array
    {
        return [
            'leave_type' => $this->leaveRequest->type->label(),
            'period' => $this->leaveRequestPeriodLabel($this->leaveRequest),
        ];
    }

    /**
     * @return array{title: string, message: string}
     */
    public function defaultInAppNotificationPayload(): array
    {
        $period = $this->leaveRequestPeriodLabel($this->leaveRequest);

        return [
            'title' => 'Verlof goedgekeurd',
            'message' => $this->leaveRequest->type->label().' ('.$period.')',
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

        return (new MailMessage)
            ->subject('Verlofaanvraag goedgekeurd')
            ->line('Je verlofaanvraag ('.$typeLabel.', '.$period.') is goedgekeurd.')
            ->action('Mijn verlof', route('leaveRequests'))
            ->line('Je vindt de details in TimeTraq onder Verlof.');
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
