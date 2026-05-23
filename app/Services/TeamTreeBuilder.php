<?php

namespace App\Services;

use App\Models\Organization;
use App\Models\Team;
use Illuminate\Support\Collection;

final class TeamTreeBuilder
{
    /**
     * @return list<array{
     *     id: int,
     *     name: string,
     *     parent_id: int|null,
     *     depth: int
     * }>
     */
    public function flatList(Organization $organization): array
    {
        $teams = Team::query()
            ->where('organization_id', $organization->id)
            ->orderBy('name')
            ->get();

        $byParent = $teams->groupBy(fn (Team $team): string => (string) ($team->parent_id ?? 'root'));

        return $this->flattenBranch($byParent, 'root', 0);
    }

    /**
     * @param  Collection<string, Collection<int, Team>>  $byParent
     * @return list<array{id: int, name: string, parent_id: int|null, depth: int}>
     */
    private function flattenBranch(Collection $byParent, string $parentKey, int $depth): array
    {
        $branch = $byParent->get($parentKey, collect());
        $rows = [];

        foreach ($branch as $team) {
            $rows[] = [
                'id' => $team->id,
                'name' => $team->name,
                'parent_id' => $team->parent_id,
                'depth' => $depth,
            ];

            $rows = array_merge(
                $rows,
                $this->flattenBranch($byParent, (string) $team->id, $depth + 1),
            );
        }

        return $rows;
    }
}
