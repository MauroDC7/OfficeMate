<?php

use App\Enums\LeaveRequestStatus;
use App\Enums\UserRole;
use App\Models\LeaveRequest;
use App\Models\Organization;
use App\Models\TimyConversation;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\Http;

beforeEach(function () {
    CarbonImmutable::setTestNow(CarbonImmutable::parse('2026-06-01 10:00:00', 'Europe/Brussels'));
});

afterEach(function () {
    CarbonImmutable::setTestNow();
});

function timyEmployee(): User
{
    $organization = Organization::factory()->create();

    return User::factory()->forOrganization($organization)->create([
        'role' => UserRole::Employee,
    ]);
}

it('does not block informational leave questions with the missing-dates help message', function () {
    Config::set('services.openai.key', 'sk-test');
    Config::set('services.openai.model', 'gpt-4o-mini');

    Http::fake([
        'api.openai.com/v1/chat/completions' => Http::response([
            'choices' => [
                [
                    'message' => [
                        'content' => json_encode([
                            'message' => 'Ga naar Verlof en kies je datums.',
                            'actions' => [
                                ['label' => 'Verlof', 'href' => '/leave-requests'],
                            ],
                        ], JSON_THROW_ON_ERROR),
                    ],
                ],
            ],
        ]),
    ]);

    $user = timyEmployee();
    $conversation = TimyConversation::factory()->for($user)->create();

    $response = $this->actingAs($user)
        ->postJson(route('timy.conversations.messages.store', $conversation), [
            'content' => 'Hoe vraag ik verlof aan?',
            'page_path' => '/leave-requests',
        ]);

    $response->assertOk()
        ->assertJsonPath('messages.1.pending_action', null);

    expect((string) $response->json('messages.1.content'))
        ->not->toContain('noem het type (vakantie of overig) en de datums');
});

it('still guides employees who want to submit leave without dates', function () {
    $user = timyEmployee();
    $conversation = TimyConversation::factory()->for($user)->create();

    $response = $this->actingAs($user)
        ->postJson(route('timy.conversations.messages.store', $conversation), [
            'content' => 'Vraag verlof aan volgende week',
            'page_path' => '/leave-requests',
        ]);

    $response->assertOk()
        ->assertJsonPath('messages.1.pending_action', null)
        ->assertJsonPath('messages.1.content', fn (string $content): bool => str_contains($content, 'noem het type'));
});

it('proposes a leave request from dutch month names', function () {
    $user = timyEmployee();
    $conversation = TimyConversation::factory()->for($user)->create();

    $response = $this->actingAs($user)
        ->postJson(route('timy.conversations.messages.store', $conversation), [
            'content' => 'Vraag verlof aan voor 7 juni tot 13 juni',
            'page_path' => '/leave-requests',
        ]);

    $response->assertOk()
        ->assertJsonPath('messages.1.pending_action.type', 'create_leave_request')
        ->assertJsonPath('messages.1.pending_action.params.starts_on', '2026-06-07')
        ->assertJsonPath('messages.1.pending_action.params.ends_on', '2026-06-13');
});

it('proposes a leave request with pending confirmation', function () {
    $user = timyEmployee();
    $conversation = TimyConversation::factory()->for($user)->create();

    $response = $this->actingAs($user)
        ->postJson(route('timy.conversations.messages.store', $conversation), [
            'content' => 'Vraag vakantie aan van 2026-07-01 tot 2026-07-05',
            'page_path' => '/leave-requests',
        ]);

    $response->assertOk()
        ->assertJsonPath('messages.1.pending_action.type', 'create_leave_request')
        ->assertJsonPath('messages.1.pending_action.params.starts_on', '2026-07-01')
        ->assertJsonPath('messages.1.pending_action.params.ends_on', '2026-07-05');
});

it('creates a leave request when the pending action is confirmed', function () {
    $user = timyEmployee();

    $response = $this->actingAs($user)
        ->postJson(route('timy.actions.store'), [
            'type' => 'create_leave_request',
            'params' => [
                'type' => 'vacation',
                'starts_on' => '2026-07-01',
                'ends_on' => '2026-07-05',
                'notes' => null,
            ],
        ]);

    $response->assertOk();

    $leaveRequest = LeaveRequest::query()->where('user_id', $user->id)->first();

    expect($leaveRequest)->not->toBeNull()
        ->and($leaveRequest->status)->toBe(LeaveRequestStatus::Pending)
        ->and($leaveRequest->starts_on->format('Y-m-d'))->toBe('2026-07-01');
});

it('rejects sick leave via timy without medical certificate', function () {
    $user = timyEmployee();

    $this->actingAs($user)
        ->postJson(route('timy.actions.store'), [
            'type' => 'create_leave_request',
            'params' => [
                'type' => 'sick',
                'starts_on' => '2026-07-01',
                'ends_on' => '2026-07-02',
            ],
        ])
        ->assertUnprocessable();
});

it('forbids leave request actions for admins', function () {
    $organization = Organization::factory()->create();
    $admin = User::factory()->forOrganization($organization)->create([
        'role' => UserRole::Admin,
    ]);

    $this->actingAs($admin)
        ->postJson(route('timy.actions.store'), [
            'type' => 'create_leave_request',
            'params' => [
                'type' => 'vacation',
                'starts_on' => '2026-07-01',
                'ends_on' => '2026-07-05',
            ],
        ])
        ->assertUnprocessable();
});
