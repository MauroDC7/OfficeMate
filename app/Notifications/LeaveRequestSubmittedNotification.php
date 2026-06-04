<?php

namespace App\Notifications;

use App\Models\LeaveRequest;
use App\Notifications\Concerns\FormatsLeaveRequestDetails;
use App\Notifications\Concerns\SendsWebPushFromDatabasePayload;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use NotificationChannels\WebPush\WebPushChannel;

final class LeaveRequestSubmittedNotification extends Notification
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
        return route('admin.leaveRequests');
    }

    public function toMail(object $notifiable): MailMessage
    {
        $employeeName = $this->leaveRequestEmployeeName($this->leaveRequest);
        $period = $this->leaveRequestPeriodLabel($this->leaveRequest);
        $typeLabel = $this->leaveRequest->type->label();

        return (new MailMessage)
            ->subject('Nieuwe verlofaanvraag van '.$employeeName)
            ->line($employeeName.' heeft verlof aangevraagd ('.$typeLabel.', '.$period.').')
            ->action('Verlof beheren', route('admin.leaveRequests'))
            ->line('Je kunt de aanvraag goedkeuren of afwijzen in TimeTraq.');
    }

    /**
     * @return array{title: string, message: string}
     */
    public function toArray(object $notifiable): array
    {
        $employeeName = $this->leaveRequestEmployeeName($this->leaveRequest);
        $period = $this->leaveRequestPeriodLabel($this->leaveRequest);

        return [
            'title' => 'Nieuwe verlofaanvraag',
            'message' => $employeeName.' — '.$this->leaveRequest->type->label().' ('.$period.')',
        ];
    }
}
