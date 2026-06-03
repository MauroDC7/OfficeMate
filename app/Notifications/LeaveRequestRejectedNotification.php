<?php

namespace App\Notifications;

use App\Models\LeaveRequest;
use App\Notifications\Concerns\FormatsLeaveRequestDetails;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

final class LeaveRequestRejectedNotification extends Notification
{
    use FormatsLeaveRequestDetails;
    use Queueable;

    public function __construct(public LeaveRequest $leaveRequest) {}

    /**
     * @return list<string>
     */
    public function via(object $notifiable): array
    {
        return ['mail', 'database'];
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
    public function toArray(object $notifiable): array
    {
        $period = $this->leaveRequestPeriodLabel($this->leaveRequest);
        $message = $this->leaveRequest->type->label().' ('.$period.')';

        if (is_string($this->leaveRequest->rejection_reason) && trim($this->leaveRequest->rejection_reason) !== '') {
            $message .= ' — '.$this->leaveRequest->rejection_reason;
        }

        return [
            'title' => 'Verlof afgewezen',
            'message' => $message,
        ];
    }
}
