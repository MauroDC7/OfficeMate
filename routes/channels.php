<?php

use App\Models\User;
use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('user.{userId}', function (User $user, string|int $userId): bool {
    return (int) $user->id === (int) $userId;
});
