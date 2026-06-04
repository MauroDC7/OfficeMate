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

final class LeaveRequestSubmittedNotification extends Notification implements ProvidesSmartInAppNotificationEnhancement
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
        return InAppNotificationKind::LeaveSubmitted;
    }

    /**
     * @return array<string, string|null>
     */
    public function smartInAppNotificationContext(object $notifiable): array
    {
        return [
            'employee_name' => $this->leaveRequestEmployeeName($this->leaveRequest),
            'leave_type' => $this->leaveRequest->type->label(),
            'period' => $this->leaveRequestPeriodLabel($this->leaveRequest),
        ];
    }

    /**
     * @return array{title: string, message: string}
     */
    public function defaultInAppNotificationPayload(): array
    {
        $employeeName = $this->leaveRequestEmployeeName($this->leaveRequest);
        $period = $this->leaveRequestPeriodLabel($this->leaveRequest);

        return [
            'title' => 'Nieuwe verlofaanvraag',
            'message' => $employeeName.', '.$this->leaveRequest->type->label().' ('.$period.')',
        ];
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
