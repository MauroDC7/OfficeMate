<?php

namespace App\Notifications;

use App\Models\LeaveRequest;
use App\Notifications\Concerns\FormatsLeaveRequestDetails;
use App\Notifications\Concerns\SendsWebPushFromDatabasePayload;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use NotificationChannels\WebPush\WebPushChannel;

final class LeaveRequestApprovedNotification extends Notification
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
    public function toArray(object $notifiable): array
    {
        $period = $this->leaveRequestPeriodLabel($this->leaveRequest);

        return [
            'title' => 'Verlof goedgekeurd',
            'message' => $this->leaveRequest->type->label().' ('.$period.')',
        ];
    }
}
