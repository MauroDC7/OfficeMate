<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Services\Timy\TimyAssistant;
use App\Services\Timy\TimyUserContext;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class TimyContextController extends Controller
{
    public function __construct(
        private readonly TimyUserContext $timyUserContext,
        private readonly TimyAssistant $timyAssistant,
    ) {}

    public function __invoke(Request $request): JsonResponse
    {
        $user = $request->user();
        abort_unless($user instanceof User, 401);

        $pagePath = (string) $request->query('page_path', '/');
        $context = $this->timyUserContext->build($user, $pagePath);

        return response()->json([
            'page' => $context['page'],
            'tips' => $context['tips'],
            'ai_configured' => $this->timyAssistant->isConfigured(),
        ]);
    }
}
