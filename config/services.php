<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'token' => env('POSTMARK_TOKEN', env('POSTMARK_API_KEY')),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'incoming_webhook_url' => env('SLACK_INCOMING_WEBHOOK_URL'),
        'app_id' => env('SLACK_APP_ID'),
        'client_id' => env('SLACK_CLIENT_ID'),
        'client_secret' => env('SLACK_CLIENT_SECRET'),
        'signing_secret' => env('SLACK_SIGNING_SECRET'),
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    'openai' => [
        'key' => env('OPENAI_API_KEY'),
        'model' => env('OPENAI_MODEL', 'gpt-4o-mini'),
    ],

    'activitywatch' => [
        'export_path' => env('ACTIVITYWATCH_EXPORT_PATH'),
    ],

    'timesheets' => [
        'timezone' => env('TIMESHEETS_TIMEZONE', 'Europe/Brussels'),
    ],

    'weekly_debrief' => [
        'reminder_weekday' => (int) env('WEEKLY_DEBRIEF_REMINDER_WEEKDAY', 5),
        'reminder_time' => env('WEEKLY_DEBRIEF_REMINDER_TIME', '15:00'),
    ],

    'timetraq' => [
        'tracker_download_url' => env('TIMETRAQ_TRACKER_DOWNLOAD_URL'),
    ],
    'google' => [
        'client_id' => env('GOOGLE_CLIENT_ID'),
        'client_secret' => env('GOOGLE_CLIENT_SECRET'),
        'redirect' => env('GOOGLE_REDIRECT_URI'),
    ],

];
