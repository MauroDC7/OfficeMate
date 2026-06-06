<?php

namespace App\Services;

use App\Models\User;

final class RecentInAppNotifications
{
    /**
     * @return list<array{id: string, title: string, message: string, created_at: string}>
     */
    public function forUser(User $user): array
    {
        return $user->notifications()
            ->latest()
            ->limit(5)
            ->get()
            ->map(fn ($notification): array => [
                'id' => $notification->id,
                'title' => $notification->data['title'] ?? 'Melding',
                'message' => $notification->data['message'] ?? '',
                'created_at' => $notification->created_at?->toIso8601String() ?? '',
            ])
            ->values()
            ->all();
    }
}
