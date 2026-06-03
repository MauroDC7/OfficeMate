<?php

namespace App\Http\Middleware;

use App\Models\User;
use App\Services\RecordOfficePresence as RecordOfficePresenceService;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

final class RecordOfficePresence
{
    public function __construct(
        private readonly RecordOfficePresenceService $recordOfficePresence,
    ) {}

    /**
     * @param  Closure(Request): Response  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        $user = $request->user();

        if ($user instanceof User) {
            $this->recordOfficePresence->forUser($user, $request->ip());
        }

        return $response;
    }
}
