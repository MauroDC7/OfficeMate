<?php

namespace App\Http\Controllers;

use App\Enums\UserRole;
use App\Http\Requests\Timy\StoreTimyMessageRequest;
use App\Models\TimyConversation;
use App\Models\TimyMessage;
use App\Models\User;
use App\Services\Timy\TimyAssistant;
use App\Services\Timy\TimyLeaveRequestProposer;
use App\Services\Timy\TimyUserContext;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;

final class TimyConversationController extends Controller
{
    public function __construct(
        private readonly TimyAssistant $timyAssistant,
        private readonly TimyUserContext $timyUserContext,
        private readonly TimyLeaveRequestProposer $timyLeaveRequestProposer,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        abort_unless($user instanceof User, 401);

        $conversations = TimyConversation::query()
            ->where('user_id', $user->id)
            ->with([
                'latestMessage' => fn ($query) => $query->select(
                    'timy_messages.id',
                    'timy_messages.timy_conversation_id',
                    'timy_messages.content',
                    'timy_messages.role',
                    'timy_messages.created_at',
                ),
            ])
            ->orderByDesc('updated_at')
            ->limit(20)
            ->get();

        return response()->json([
            'conversations' => $conversations->map(fn (TimyConversation $conversation): array => [
                'id' => $conversation->id,
                'title' => $conversation->title,
                'updated_at' => $conversation->updated_at?->toIso8601String(),
                'preview' => Str::limit((string) $conversation->latestMessage?->content, 80),
            ]),
            'ai_configured' => $this->timyAssistant->isConfigured(),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $user = $request->user();
        abort_unless($user instanceof User, 401);

        $pagePath = (string) $request->query('page_path', '/');

        $conversation = TimyConversation::query()->create([
            'user_id' => $user->id,
        ]);

        $firstName = trim($user->first_name) !== '' ? trim($user->first_name) : '';

        $welcome = TimyMessage::query()->create([
            'timy_conversation_id' => $conversation->id,
            'role' => 'assistant',
            'content' => TimyAssistant::welcomeContent($firstName),
            'actions' => null,
        ]);

        return response()->json([
            'conversation' => $this->conversationPayload($conversation),
            'messages' => [$this->messagePayload($welcome)],
            ...$this->contextPayload($user, $pagePath),
        ], 201);
    }

    public function show(Request $request, TimyConversation $timyConversation): JsonResponse
    {
        $user = $request->user();
        abort_unless($user instanceof User, 401);
        $this->authorize('view', $timyConversation);

        $messages = $timyConversation->messages()
            ->orderBy('created_at')
            ->get();

        $pagePath = (string) $request->query('page_path', '/');

        return response()->json([
            'conversation' => $this->conversationPayload($timyConversation),
            'messages' => $messages->map(fn (TimyMessage $message): array => $this->messagePayload($message))->all(),
            ...$this->contextPayload($user, $pagePath),
        ]);
    }

    public function storeMessage(
        StoreTimyMessageRequest $request,
        TimyConversation $timyConversation,
    ): JsonResponse {
        $user = $request->user();
        abort_unless($user instanceof User, 401);
        $this->authorize('view', $timyConversation);

        $validated = $request->validated();
        $content = trim($validated['content']);
        $pagePath = (string) ($validated['page_path'] ?? '/');

        $userMessage = TimyMessage::query()->create([
            'timy_conversation_id' => $timyConversation->id,
            'role' => 'user',
            'content' => $content,
        ]);

        if ($timyConversation->title === null) {
            $timyConversation->update([
                'title' => Str::limit($content, 60),
            ]);
        }

        $history = $timyConversation->messages()
            ->where('id', '<', $userMessage->id)
            ->orderBy('created_at')
            ->get();

        $reply = $this->buildAssistantReply($user, $content, $history, $pagePath);

        $assistantMessage = TimyMessage::query()->create([
            'timy_conversation_id' => $timyConversation->id,
            'role' => 'assistant',
            'content' => $reply['content'],
            'actions' => $reply['actions'] !== [] ? $reply['actions'] : null,
            'pending_action' => $reply['pending_action'] ?? null,
        ]);

        $timyConversation->touch();

        return response()->json([
            'messages' => [
                $this->messagePayload($userMessage),
                $this->messagePayload($assistantMessage),
            ],
            ...$this->contextPayload($user, $pagePath),
        ]);
    }

    /**
     * @param  Collection<int, TimyMessage>  $history
     * @return array{content: string, actions: list<array{label: string, href: string}>, pending_action?: array<string, mixed>|null}
     */
    private function buildAssistantReply(
        User $user,
        string $content,
        Collection $history,
        string $pagePath,
    ): array {
        $pending = $this->timyLeaveRequestProposer->tryPropose($user, $content);

        if ($pending !== null) {
            return [
                'content' => 'Ik stel voor om dit verlof in te dienen: '.$pending['summary'].'. Klopt dit? Bevestig hieronder.',
                'actions' => [
                    ['label' => 'Verlofoverzicht', 'href' => route('leaveRequests')],
                ],
                'pending_action' => $pending,
            ];
        }

        if ($user->role === UserRole::Employee && $this->timyLeaveRequestProposer->looksLikeLeaveIntentWithoutDates($content)) {
            return [
                'content' => $this->timyLeaveRequestProposer->missingDatesHelpMessage(),
                'actions' => [
                    ['label' => 'Naar verlof', 'href' => route('leaveRequests')],
                ],
                'pending_action' => null,
            ];
        }

        $reply = $this->timyAssistant->reply($user, $content, $history, $pagePath);

        return [
            ...$reply,
            'pending_action' => null,
        ];
    }

    /**
     * @return array{tips: list<string>, page: string, ai_configured: bool}
     */
    private function contextPayload(User $user, string $pagePath): array
    {
        $context = $this->timyUserContext->build($user, $pagePath);

        return [
            'tips' => $context['tips'],
            'page' => $context['page'],
            'ai_configured' => $this->timyAssistant->isConfigured(),
        ];
    }

    /**
     * @return array{id: int, title: string|null, updated_at: string|null}
     */
    private function conversationPayload(TimyConversation $conversation): array
    {
        return [
            'id' => $conversation->id,
            'title' => $conversation->title,
            'updated_at' => $conversation->updated_at?->toIso8601String(),
        ];
    }

    /**
     * @return array{
     *     id: int,
     *     role: string,
     *     content: string,
     *     actions: list<array{label: string, href: string}>|null,
     *     pending_action: array<string, mixed>|null,
     *     created_at: string|null,
     * }
     */
    private function messagePayload(TimyMessage $message): array
    {
        return [
            'id' => $message->id,
            'role' => $message->role,
            'content' => $message->content,
            'actions' => $message->actions,
            'pending_action' => $message->pending_action,
            'created_at' => $message->created_at?->toIso8601String(),
        ];
    }
}
