<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

final class WelcomeVerifyEmail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public string $firstName,
        public string $verificationUrl,
        public int $expireMinutes,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Welkom bij TimeTraq — bevestig je e-mailadres',
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'mail.welcome-verify',
        );
    }
}
