<?php

namespace App\Http\Controllers;

use App\Http\Requests\Timy\ExecuteTimyActionRequest;
use App\Models\User;
use App\Services\Timy\Actions\TimyActionExecutor;
use Illuminate\Http\JsonResponse;
use RuntimeException;

final class TimyActionController extends Controller
{
    public function __construct(
        private readonly TimyActionExecutor $timyActionExecutor,
    ) {}

    public function store(ExecuteTimyActionRequest $request): JsonResponse
    {
        $user = $request->user();
        abort_unless($user instanceof User, 401);

        $validated = $request->validated();

        try {
            $result = $this->timyActionExecutor->execute(
                $user,
                (string) $validated['type'],
                (array) $validated['params'],
            );
        } catch (RuntimeException $exception) {
            return response()->json([
                'message' => $exception->getMessage(),
            ], 422);
        }

        return response()->json([
            'message' => $result['message'],
            'result' => $result['result'],
        ]);
    }
}
