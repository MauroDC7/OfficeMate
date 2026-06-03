<?php

declare(strict_types=1);

/**
 * Combell HTTP cron: roept Laravel's scheduler aan (weekly debrief, enz.).
 *
 * URL in Combell (elke minuut, bijv. alleen vrijdag):
 *   https://timetraq.be/jobs/task.php?token=JOUW_CRON_SECRET
 *
 * Zet CRON_SECRET in .env (zelfde waarde als ?token=...).
 */

use App\Services\CronTaskHandler;
use Illuminate\Contracts\Console\Kernel;
use Illuminate\Foundation\Application;

define('LARAVEL_START', microtime(true));

require __DIR__.'/../../vendor/autoload.php';

/** @var Application $app */
$app = require_once __DIR__.'/../../bootstrap/app.php';

/** @var Kernel $kernel */
$kernel = $app->make(Kernel::class);
$kernel->bootstrap();

header('Content-Type: text/plain; charset=UTF-8');

/** @var CronTaskHandler $handler */
$handler = $app->make(CronTaskHandler::class);

if (! $handler->isSecretConfigured()) {
    http_response_code(503);
    echo 'Cron secret not configured (set CRON_SECRET in .env).';

    exit;
}

$token = $_GET['token'] ?? null;
$token = is_string($token) ? $token : null;

if (! $handler->isAuthorized($token)) {
    http_response_code(403);
    echo 'Forbidden';

    exit;
}

$exitCode = $handler->runScheduler();

if ($exitCode !== 0) {
    http_response_code(500);
    echo 'Scheduler failed';

    exit;
}

http_response_code(200);
echo 'OK';
