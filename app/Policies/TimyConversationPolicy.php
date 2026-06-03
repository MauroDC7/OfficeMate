<?php

namespace App\Policies;

use App\Models\TimyConversation;
use App\Models\User;

class TimyConversationPolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, TimyConversation $timyConversation): bool
    {
        return $timyConversation->user_id === $user->id;
    }

    public function create(User $user): bool
    {
        return true;
    }

    public function update(User $user, TimyConversation $timyConversation): bool
    {
        return $timyConversation->user_id === $user->id;
    }
}
