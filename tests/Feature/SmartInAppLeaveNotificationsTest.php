<?php

declare(strict_types=1);

use App\Enums\InAppNotificationKind;
use App\Enums\LeaveType;
use App\Enums\UserRole;
use App\Events\InAppNotificationChanged;
use App\Models\LeaveRequest;
use App\Models\Organization;
use App\Models\User;
use App\Notifications\LeaveRequestApprovedNotification;
use App\Notifications\LeaveRequestSubmittedNotification;
use App\Services\LeaveRequestNotifier;
use App\Services\SmartInAppNotificationCopy;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Http;
use NotificationChannels\WebPush\WebPushChannel;

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

it('notifies admins in real time when an employee submits leave', function () {
    Config::set('services.openai.key', null);
    Event::fake([InAppNotificationChanged::class]);

    $organization = Organization::factory()->create();
    $admin = User::factory()->forOrganization($organization)->create(['role' => UserRole::Admin]);
    $employee = User::factory()->forOrganization($organization)->create();
    $monday = CarbonImmutable::now()->startOfWeek(CarbonImmutable::MONDAY);

    $this->actingAs($employee)
        ->post(route('leaveRequests.store'), [
            'type' => LeaveType::Vacation->value,
            'starts_on' => $monday->addDays(14)->toDateString(),
            'ends_on' => $monday->addDays(16)->toDateString(),
        ])
        ->assertRedirect(route('leaveRequests'));

    Event::assertDispatched(InAppNotificationChanged::class, fn (InAppNotificationChanged $event): bool => $event->userId === $admin->id);

    expect($admin->notifications()->count())->toBe(1);
});

it('broadcasts once when leave is approved and enhances in-app copy inline', function () {
    Config::set('services.openai.key', 'sk-test');
    Config::set('services.openai.model', 'gpt-4o-mini');

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
    $admin = User::factory()->forOrganization($organization)->create(['role' => UserRole::Admin]);
    $employee = User::factory()->forOrganization($organization)->create(['first_name' => 'Mauro']);
    $leaveRequest = LeaveRequest::factory()->for($employee)->pending()->create();

    $this->actingAs($admin)
        ->post(route('leaveRequests.approve', $leaveRequest))
        ->assertRedirect(route('admin.leaveRequests'));

    Event::assertDispatched(InAppNotificationChanged::class, fn (InAppNotificationChanged $event): bool => $event->userId === $employee->id);

    $databaseNotification = $employee->notifications()->first();

    expect($databaseNotification)->not->toBeNull()
        ->and($databaseNotification->data['title'])->toBe('Goed nieuws')
        ->and($databaseNotification->data['message'])->toBe('Mauro, je aanvraag is binnen.');
});

it('enhances database notification copy when listener runs', function () {
    Config::set('services.openai.key', 'sk-test');
    Config::set('services.openai.model', 'gpt-4o-mini');

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
        ->and($databaseNotification->data['title'])->toBe('Goed nieuws');

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

it('sends database notifications before mail so mail failures do not block in-app copy', function () {
    $leaveRequest = LeaveRequest::factory()->create();
    $notification = new LeaveRequestSubmittedNotification($leaveRequest);
    $admin = User::factory()->create();

    expect($notification->via($admin))->toBe([
        'database',
        'mail',
        WebPushChannel::class,
    ]);
});

it('broadcasts for admins from the leave notifier', function () {
    Config::set('services.openai.key', null);
    Event::fake([InAppNotificationChanged::class]);

    $organization = Organization::factory()->create();
    $admin = User::factory()->forOrganization($organization)->create(['role' => UserRole::Admin]);
    $employee = User::factory()->forOrganization($organization)->create();
    $leaveRequest = LeaveRequest::factory()->for($employee)->create();

    app(LeaveRequestNotifier::class)->notifyAdminsOfSubmission($leaveRequest);

    Event::assertDispatched(InAppNotificationChanged::class, fn (InAppNotificationChanged $event): bool => $event->userId === $admin->id);
});

it('uses leave approved kind for smart copy', function () {
    Config::set('services.openai.key', null);

    $leaveRequest = LeaveRequest::factory()->create();
    $notification = new LeaveRequestApprovedNotification($leaveRequest);

    expect($notification->smartInAppNotificationKind())->toBe(InAppNotificationKind::LeaveApproved);
    expect(app(SmartInAppNotificationCopy::class)->isConfigured())->toBeFalse();
});
