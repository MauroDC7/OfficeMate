<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

final class WeeklyDebriefReminderMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public string $firstName,
        public string $projectsUrl,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Weekstatus invullen',
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'mail.weekly-debrief-reminder',
        );
    }
}
