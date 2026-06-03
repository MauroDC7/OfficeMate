<?php

namespace App\Http\Requests\Concerns;

use App\Models\User;
use App\Services\TimesheetProjectNormalizer;
use Illuminate\Validation\ValidationException;

trait NormalizesTimesheetProject
{
    /**
     * @return array<string, mixed>
     */
    protected function timesheetProjectRules(): array
    {
        return [
            'project_id' => ['nullable', 'integer'],
        ];
    }

    protected function mergeTimesheetProjectFields(): void
    {
        $user = $this->user();

        if (! $user instanceof User) {
            return;
        }

        try {
            $normalized = app(TimesheetProjectNormalizer::class)->normalize(
                $user,
                $this->input('project_id'),
            );
        } catch (ValidationException $exception) {
            $message = $exception->validator->errors()->first('project_id');

            throw ValidationException::withMessages([
                'project_id' => $message !== null && $message !== ''
                    ? $message
                    : 'Dit project is niet beschikbaar.',
            ]);
        }

        $this->merge($normalized);
    }
}
