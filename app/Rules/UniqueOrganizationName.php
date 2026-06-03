<?php

namespace App\Rules;

use App\Models\Organization;
use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

final class UniqueOrganizationName implements ValidationRule
{
    public function __construct(
        private readonly ?int $ignoreOrganizationId = null,
    ) {}

    /**
     * @param  Closure(string, ?string=): void  $fail
     */
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (! is_string($value) || trim($value) === '') {
            return;
        }

        $query = Organization::query()
            ->where('name_normalized', Organization::normalizedName($value));

        if ($this->ignoreOrganizationId !== null) {
            $query->whereKeyNot($this->ignoreOrganizationId);
        }

        if ($query->exists()) {
            $fail('Deze bedrijfsnaam is al in gebruik. Log in met het account dat bij dat bedrijf hoort, of vraag een uitnodiging aan je beheerder.');
        }
    }
}
