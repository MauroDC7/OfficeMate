<?php

namespace App\Services;

final class TrackerBlocklistMatcher
{
    /**
     * @param  list<string>  $blocklist
     */
    public function matches(array $blocklist, string ...$values): bool
    {
        if ($blocklist === []) {
            return false;
        }

        $normalizedValues = array_values(array_filter(array_map(
            fn (string $value): string => mb_strtolower(trim($value)),
            $values,
        ), fn (string $value): bool => $value !== ''));

        if ($normalizedValues === []) {
            return false;
        }

        foreach ($this->normalizeBlocklist($blocklist) as $pattern) {
            foreach ($normalizedValues as $value) {
                if (str_contains($value, $pattern)) {
                    return true;
                }
            }
        }

        return false;
    }

    /**
     * @return list<string>
     */
    public function normalizeBlocklist(mixed $value): array
    {
        if (! is_array($value)) {
            return [];
        }

        $items = [];

        foreach ($value as $entry) {
            if (! is_string($entry)) {
                continue;
            }

            $trimmed = trim($entry);

            if ($trimmed === '' || mb_strlen($trimmed) > 200) {
                continue;
            }

            $items[] = mb_strtolower($trimmed);
        }

        return array_values(array_unique($items));
    }
}
