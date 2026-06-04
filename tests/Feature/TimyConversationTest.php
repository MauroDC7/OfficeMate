<?php

use App\Models\Organization;
use App\Models\TimyConversation;
use App\Models\TimyMessage;
use App\Models\User;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Http;

beforeEach(function () {
    Config::set('services.openai.key', null);
});

function timyUser(): User
{
    $organization = Organization::factory()->create();

    return User::factory()->forOrganization($organization)->create();
}

it('requires authentication for timy routes', function () {
    $conversation = TimyConversation::factory()->create();

    $this->getJson(route('timy.conversations.index'))->assertUnauthorized();
    $this->postJson(route('timy.conversations.store'))->assertUnauthorized();
    $this->getJson(route('timy.conversations.show', $conversation))->assertUnauthorized();
    $this->postJson(route('timy.conversations.messages.store', $conversation), [
        'content' => 'Hallo',
    ])->assertUnauthorized();
});

it('lists conversations with a preview of the latest message', function () {
    $user = timyUser();
    $conversation = TimyConversation::factory()->for($user)->create();
    TimyMessage::factory()->for($conversation, 'conversation')->assistant()->create([
        'content' => 'Laatste bericht voor preview',
    ]);

    $this->actingAs($user)
        ->getJson(route('timy.conversations.index'))
        ->assertOk()
        ->assertJsonPath('conversations.0.preview', 'Laatste bericht voor preview');
});

it('creates a conversation with a welcome message from timy', function () {
    $user = timyUser();

    $response = $this->actingAs($user)
        ->postJson(route('timy.conversations.store'));

    $response->assertCreated()
        ->assertJsonPath('messages.0.role', 'assistant')
        ->assertJsonStructure([
            'conversation' => ['id', 'title', 'updated_at'],
            'messages' => [['id', 'role', 'content', 'actions', 'created_at']],
        ]);

    expect(TimyConversation::query()->where('user_id', $user->id)->count())->toBe(1);
    expect(TimyMessage::query()->count())->toBe(1);
});

it('forbids viewing another users conversation', function () {
    $owner = timyUser();
    $other = timyUser();
    $conversation = TimyConversation::factory()->for($owner)->create();

    $this->actingAs($other)
        ->getJson(route('timy.conversations.show', $conversation))
        ->assertForbidden();
});

it('answers about weekly hours using the fallback responder', function () {
    $user = timyUser();

    $conversation = TimyConversation::factory()->for($user)->create();
    TimyMessage::factory()->for($conversation, 'conversation')->assistant()->create([
        'content' => 'Welkom',
    ]);

    $response = $this->actingAs($user)
        ->postJson(route('timy.conversations.messages.store', $conversation), [
            'content' => 'Hoeveel uur heb ik deze week geboekt?',
            'page_path' => '/timesheets',
        ]);

    $response->assertOk()
        ->assertJsonCount(2, 'messages')
        ->assertJsonPath('messages.0.role', 'user')
        ->assertJsonPath('messages.1.role', 'assistant');

    $assistantText = (string) $response->json('messages.1.content');
    expect($assistantText)->toContain('week');
});

it('returns context tips for the current page', function () {
    $user = timyUser();

    $this->actingAs($user)
        ->getJson(route('timy.context', ['page_path' => '/timesheets']))
        ->assertOk()
        ->assertJsonStructure(['tips', 'page', 'ai_configured'])
        ->assertJsonPath('page', 'timesheets');
});

it('generates a weekly debrief draft when asked', function () {
    Config::set('services.openai.key', 'sk-test');
    Config::set('services.openai.model', 'gpt-4o-mini');

    Http::fake([
        'api.openai.com/v1/chat/completions' => Http::response([
            'choices' => [
                [
                    'message' => [
                        'content' => json_encode([
                            'difficult_this_week' => 'Veel meetings.',
                            'plans_next_week' => 'Meer focus op development.',
                        ], JSON_THROW_ON_ERROR),
                    ],
                ],
            ],
        ]),
    ]);

    $user = timyUser();
    $conversation = TimyConversation::factory()->for($user)->create();

    $response = $this->actingAs($user)
        ->postJson(route('timy.conversations.messages.store', $conversation), [
            'content' => 'Genereer een weekstatus-concept',
            'page_path' => '/projects',
        ]);

    $response->assertOk();
    expect((string) $response->json('messages.1.content'))->toContain('Wat ging lastig');
});

it('uses openai when configured and returns structured actions', function () {
    Config::set('services.openai.key', 'sk-test');
    Config::set('services.openai.model', 'gpt-4o-mini');

    Http::fake([
        'api.openai.com/v1/chat/completions' => Http::response([
            'choices' => [
                [
                    'message' => [
                        'content' => json_encode([
                            'message' => 'Je uren staan op Timesheets.',
                            'actions' => [
                                ['label' => 'Timesheets', 'href' => '/timesheets'],
                            ],
                        ], JSON_THROW_ON_ERROR),
                    ],
                ],
            ],
        ]),
    ]);

    $user = timyUser();
    $conversation = TimyConversation::factory()->for($user)->create();

    $response = $this->actingAs($user)
        ->postJson(route('timy.conversations.messages.store', $conversation), [
            'content' => 'Waar boek ik uren?',
            'page_path' => '/dashboard',
        ]);

    $response->assertOk()
        ->assertJsonPath('messages.1.actions.0.href', '/timesheets');
});
