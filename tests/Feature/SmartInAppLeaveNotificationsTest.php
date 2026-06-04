<?php

declare(strict_types=1);

use App\Enums\InAppNotificationKind;
use App\Enums\UserRole;
use App\Events\InAppNotificationChanged;
use App\Jobs\EnhanceDatabaseInAppNotification;
use App\Models\LeaveRequest;
use App\Models\Organization;
use App\Models\User;
use App\Notifications\LeaveRequestApprovedNotification;
use App\Services\SmartInAppNotificationCopy;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Queue;

it('stores fallback in-app copy immediately without calling openai', function () {
    Config::set('services.openai.key', 'sk-test');
    Config::set('services.openai.model', 'gpt-4o-mini');
    Http::fake();

    $organization = Organization::factory()->create();
    $employee = User::factory()->forOrganization($organization)->create(['first_name' => 'Mauro']);
    $leaveRequest = LeaveRequest::factory()->for($employee)->create();

    $payload = (new LeaveRequestApprovedNotification($leaveRequest))->toArray($employee);

    expect($payload['title'])->toBe('Verlof goedgekeurd');
    Http::assertNothingSent();
});

it('dispatches ai enhancement and broadcast when leave is approved', function () {
    Config::set('services.openai.key', 'sk-test');
    Event::fake([InAppNotificationChanged::class]);
    Queue::fake();

    $organization = Organization::factory()->create();
    $admin = User::factory()->forOrganization($organization)->create(['role' => UserRole::Admin]);
    $employee = User::factory()->forOrganization($organization)->create();
    $leaveRequest = LeaveRequest::factory()->for($employee)->pending()->create();

    $this->actingAs($admin)
        ->post(route('leaveRequests.approve', $leaveRequest))
        ->assertRedirect(route('admin.leaveRequests'));

    Event::assertDispatched(InAppNotificationChanged::class, fn (InAppNotificationChanged $event): bool => $event->userId === $employee->id);

    Queue::assertPushed(EnhanceDatabaseInAppNotification::class, fn (EnhanceDatabaseInAppNotification $job): bool => $job->recipientId === $employee->id);
});

it('updates database notification copy via enhancement job', function () {
    Config::set('services.openai.key', 'sk-test');
    Config::set('services.openai.model', 'gpt-4o-mini');
    Queue::fake();

    Http::fake([
        'api.openai.com/v1/chat/completions' => Http::response([
            'choices' => [
                [
                    'message' => [
                        'content' => json_encode([
                            'title' => 'Goed nieuws',
                            'message' => 'Mauro, je aanvraag is binnen.',
                        ], JSON_THROW_ON_ERROR),
                    ],
                ],
            ],
        ], 200),
    ]);

    Event::fake([InAppNotificationChanged::class]);

    $organization = Organization::factory()->create();
    $employee = User::factory()->forOrganization($organization)->create(['first_name' => 'Mauro']);
    $leaveRequest = LeaveRequest::factory()->for($employee)->create();

    $employee->notify(new LeaveRequestApprovedNotification($leaveRequest));

    $databaseNotification = $employee->notifications()->first();
    expect($databaseNotification)->not->toBeNull()
        ->and($databaseNotification->data['title'])->toBe('Verlof goedgekeurd');

    $queuedJob = null;

    Queue::assertPushed(EnhanceDatabaseInAppNotification::class, function (EnhanceDatabaseInAppNotification $job) use (&$queuedJob): bool {
        $queuedJob = $job;

        return true;
    });

    expect($queuedJob)->toBeInstanceOf(EnhanceDatabaseInAppNotification::class);

    $queuedJob->handle(app(SmartInAppNotificationCopy::class));

    $databaseNotification->refresh();

    expect($databaseNotification->data['title'])->toBe('Goed nieuws')
        ->and($databaseNotification->data['message'])->toBe('Mauro, je aanvraag is binnen.');

    Event::assertDispatched(InAppNotificationChanged::class);
});

it('keeps static copy for web push', function () {
    $organization = Organization::factory()->create();
    $employee = User::factory()->forOrganization($organization)->create();
    $leaveRequest = LeaveRequest::factory()->for($employee)->create();

    $notification = new LeaveRequestApprovedNotification($leaveRequest);

    expect($notification->toArray($employee)['title'])->toBe('Verlof goedgekeurd');

    $webPush = $notification->toWebPush($employee, $notification);

    expect($webPush->toArray()['title'])->toBe('Verlof goedgekeurd');
});
