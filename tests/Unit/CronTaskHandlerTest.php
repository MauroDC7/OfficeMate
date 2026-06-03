<?php

declare(strict_types=1);

use App\Services\CronTaskHandler;
use Illuminate\Support\Facades\Artisan;

it('rejects requests when cron secret is not configured', function () {
    config(['services.cron.secret' => null]);

    $handler = app(CronTaskHandler::class);

    expect($handler->isSecretConfigured())->toBeFalse()
        ->and($handler->isAuthorized('anything'))->toBeFalse();
});

it('rejects requests with a missing or wrong token', function () {
    config(['services.cron.secret' => 'correct-secret']);

    $handler = app(CronTaskHandler::class);

    expect($handler->isSecretConfigured())->toBeTrue()
        ->and($handler->isAuthorized(null))->toBeFalse()
        ->and($handler->isAuthorized(''))->toBeFalse()
        ->and($handler->isAuthorized('wrong'))->toBeFalse()
        ->and($handler->isAuthorized('correct-secret'))->toBeTrue();
});

it('runs the Laravel scheduler when authorized', function () {
    config(['services.cron.secret' => 'correct-secret']);

    Artisan::shouldReceive('call')
        ->once()
        ->with('schedule:run')
        ->andReturn(0);

    $handler = app(CronTaskHandler::class);

    expect($handler->runScheduler())->toBe(0);
});
