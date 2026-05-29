import { cn } from '@/lib/utils';
import type { OrganizationTeamOption } from '@/types/projects';

type TeamPickerProps = {
    teams: OrganizationTeamOption[];
    selectedIds: number[];
    onChange: (ids: number[]) => void;
    disabled?: boolean;
};

export function TeamPicker({ teams, selectedIds, onChange, disabled = false }: TeamPickerProps) {
    function toggleTeam(teamId: number) {
        if (selectedIds.includes(teamId)) {
            onChange(selectedIds.filter((id) => id !== teamId));

            return;
        }

        onChange([...selectedIds, teamId]);
    }

    if (teams.length === 0) {
        return (
            <p className="text-sm text-gray-500">
                Maak eerst een team aan om het aan dit project te koppelen.
            </p>
        );
    }

    return (
        <div>
            <p className="text-sm font-medium text-gray-800">Teams</p>
            <ul className="mt-2 flex flex-wrap gap-2">
                {teams.map((team) => {
                    const selected = selectedIds.includes(team.id);
                    const department = team.department?.trim();

                    return (
                        <li key={team.id}>
                            <button
                                type="button"
                                disabled={disabled}
                                onClick={() => toggleTeam(team.id)}
                                className={cn(
                                    'rounded-full border px-3 py-1.5 text-xs font-medium transition disabled:opacity-50',
                                    selected
                                        ? 'border-gray-900 bg-gray-900 text-white'
                                        : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400',
                                )}
                            >
                                {team.name}
                                {department ? ` · ${department}` : ''}
                            </button>
                        </li>
                    );
                })}
            </ul>
            {selectedIds.map((id) => (
                <input key={id} type="hidden" name="team_ids[]" value={id} />
            ))}
        </div>
    );
}
