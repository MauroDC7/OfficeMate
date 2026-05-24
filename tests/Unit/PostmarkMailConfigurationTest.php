<?php

declare(strict_types=1);

it('configures the postmark mailer with message stream support', function (): void {
    expect(config('mail.mailers.postmark.transport'))->toBe('postmark')
        ->and(config('mail.mailers.postmark.message_stream_id'))->toBeString()->not->toBe('');
});
