<?php

use App\Services\Slack\SlackIncomingWebhook;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Artisan::command('slack:webhook-test', function (): void {
    $slack = app(SlackIncomingWebhook::class);

    if (! $slack->isConfigured()) {
        $this->error('Zet SLACK_INCOMING_WEBHOOK_URL in je .env (zie .env.example).');

        return;
    }

    if ($slack->send(':white_check_mark: Testbericht — de Slack Incoming Webhook-koppeling werkt.', username: config('app.name'))) {
        $this->info('Bericht verstuurd. Controleer het gekoppelde Slack-kanaal.');
    } else {
        $this->error('Versturen mislukt. Bekijk '.storage_path('logs/laravel.log').' voor details.');
    }
})->purpose('Send a Slack test message via SLACK_INCOMING_WEBHOOK_URL');
