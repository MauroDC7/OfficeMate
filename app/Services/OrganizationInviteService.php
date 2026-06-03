<?php

namespace App\Services;

use App\Models\Organization;
use App\Models\OrganizationInvite;
use App\Models\User;
use App\Notifications\OrganizationInviteNotification;
use App\Services\Slack\SlackIncomingWebhook;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

final class OrganizationInviteService
{
    private const int EXPIRE_DAYS = 7;

    public function __construct(
        private readonly SlackIncomingWebhook $slackIncomingWebhook,
        private readonly EmployeeEmploymentAssigner $employmentAssigner,
    ) {}

    public function send(Organization $organization, User $createdBy, string $email): void
    {
        $email = strtolower(trim($email));

        if ($email === '') {
            throw ValidationException::withMessages([
                'email' => 'Voer een geldig e-mailadres in.',
            ]);
        }

        $existingUser = User::query()->where('email', $email)->first();

        if ($existingUser !== null && $existingUser->organization_id !== null) {
            throw ValidationException::withMessages([
                'email' => 'Dit e-mailadres hoort al bij een organisatie.',
            ]);
        }

        OrganizationInvite::query()
            ->where('organization_id', $organization->id)
            ->where('email', $email)
            ->whereNull('redeemed_at')
            ->delete();

        $token = Str::random(64);

        $invite = OrganizationInvite::query()->create([
            'organization_id' => $organization->id,
            'email' => $email,
            'token' => $token,
            'expires_at' => now()->addDays(self::EXPIRE_DAYS),
            'created_by_user_id' => $createdBy->id,
        ]);

        $invite->load('organization');

        Notification::route('mail', $email)
            ->notify(new OrganizationInviteNotification($invite, $token));

        $this->notifySlackInviteSent($invite->organization->name);
    }

    public function findValidInvite(string $rawToken): ?OrganizationInvite
    {
        $token = trim($rawToken);

        if ($token === '') {
            return null;
        }

        return OrganizationInvite::query()
            ->with('organization')
            ->where('token', $token)
            ->whereNull('redeemed_at')
            ->where('expires_at', '>', now())
            ->first();
    }

    public function accept(User $user, string $rawToken): Organization
    {
        if ($user->organization_id !== null) {
            throw ValidationException::withMessages([
                'email' => 'Je bent al gekoppeld aan een organisatie.',
            ]);
        }

        $invite = $this->findValidInvite($rawToken);

        if ($invite === null) {
            throw ValidationException::withMessages([
                'email' => 'Deze uitnodiging is ongeldig of verlopen.',
            ]);
        }

        if (strcasecmp($user->email, $invite->email) !== 0) {
            throw ValidationException::withMessages([
                'email' => 'Deze uitnodiging is bedoeld voor '.$invite->email.'.',
            ]);
        }

        $organization = DB::transaction(function () use ($user, $invite): Organization {
            $organization = $invite->organization()->firstOrFail();

            $user->forceFill([
                'organization_id' => $invite->organization_id,
                'organization_joined_at' => now(),
                'employment_setup_completed_at' => null,
            ])->save();

            $this->employmentAssigner->applyOrganizationDefaults($user->fresh(), $organization);

            $invite->update([
                'redeemed_at' => now(),
                'redeemed_by_user_id' => $user->id,
            ]);

            return $organization;
        });

        $this->notifySlackInviteAccepted($organization->name);

        return $organization;
    }

    public function tryAcceptFromSession(User $user): bool
    {
        $token = session('organization_invite_token');

        if (! is_string($token) || $token === '') {
            return false;
        }

        try {
            $this->accept($user, $token);
        } catch (ValidationException) {
            return false;
        }

        session()->forget('organization_invite_token');

        return true;
    }

    private function notifySlackInviteSent(string $organizationName): void
    {
        $label = config('app.name', 'TimeTraq');

        $this->slackIncomingWebhook->send(
            sprintf('*%s* — nieuwe uitnodiging verstuurd voor organisatie *%s*.', $label, $organizationName),
            username: $label,
        );
    }

    private function notifySlackInviteAccepted(string $organizationName): void
    {
        $label = config('app.name', 'TimeTraq');

        $this->slackIncomingWebhook->send(
            sprintf('*%s* — uitnodiging geaccepteerd voor organisatie *%s*.', $label, $organizationName),
            username: $label,
            iconEmoji: ':white_check_mark:',
        );
    }
}
