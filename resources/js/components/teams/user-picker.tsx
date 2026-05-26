import { useMemo, useRef, useState } from 'react';

import { UserAvatar } from '@/components/user-avatar';
import { cn } from '@/lib/utils';
import { getUserDisplayFullName } from '@/lib/user-display';
import type { OrganizationUserOption } from '@/types/teams';

type UserPickerProps = {
    users: OrganizationUserOption[];
    selectedIds: number[];
    onChange: (ids: number[]) => void;
    disabled?: boolean;
};

export function UserPicker({ users, selectedIds, onChange, disabled = false }: UserPickerProps) {
    const [query, setQuery] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const selectedUsers = useMemo(
        () => users.filter((user) => selectedIds.includes(user.id)),
        [users, selectedIds],
    );

    const filteredUsers = useMemo(() => {
        const needle = query.trim().toLowerCase();

        if (needle === '') {
            return users.filter((user) => !selectedIds.includes(user.id));
        }

        return users.filter((user) => {
            if (selectedIds.includes(user.id)) {
                return false;
            }

            const name = getUserDisplayFullName(user).toLowerCase();
            const email = user.email.toLowerCase();

            return name.includes(needle) || email.includes(needle);
        });
    }, [users, query, selectedIds]);

    function toggleUser(userId: number) {
        if (selectedIds.includes(userId)) {
            onChange(selectedIds.filter((id) => id !== userId));

            return;
        }

        onChange([...selectedIds, userId]);
    }

    function removeUser(userId: number) {
        onChange(selectedIds.filter((id) => id !== userId));
    }

    return (
        <div ref={containerRef} className="relative">
            <label className="text-xs font-medium text-gray-700">Teamleden</label>

            {selectedUsers.length > 0 ? (
                <ul className="mt-2 flex flex-wrap gap-2">
                    {selectedUsers.map((user) => (
                        <li
                            key={user.id}
                            className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-gray-50 py-1 ps-1 pe-2 text-xs font-medium text-gray-800"
                        >
                            <UserAvatar user={user} className="size-6" textClassName="text-[10px]" />
                            <span className="max-w-[10rem] truncate">
                                {getUserDisplayFullName(user)}
                            </span>
                            <button
                                type="button"
                                disabled={disabled}
                                onClick={() => removeUser(user.id)}
                                className="rounded-full px-1 text-gray-500 hover:bg-gray-200 hover:text-gray-800 disabled:opacity-50"
                                aria-label={`${getUserDisplayFullName(user)} verwijderen`}
                            >
                                ×
                            </button>
                        </li>
                    ))}
                </ul>
            ) : null}

            <div className="relative mt-2">
                <input
                    type="search"
                    value={query}
                    disabled={disabled}
                    placeholder="Zoek op naam of e-mail…"
                    onChange={(event) => {
                        setQuery(event.target.value);
                        setIsOpen(true);
                    }}
                    onFocus={() => setIsOpen(true)}
                    onBlur={() => {
                        window.setTimeout(() => setIsOpen(false), 150);
                    }}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-900/10 disabled:bg-gray-50"
                />

                {isOpen && filteredUsers.length > 0 ? (
                    <ul
                        className="absolute z-20 mt-1 max-h-48 w-full overflow-y-auto rounded-lg border border-gray-200 bg-white py-1 shadow-lg"
                        role="listbox"
                    >
                        {filteredUsers.map((user) => (
                            <li key={user.id} role="option">
                                <button
                                    type="button"
                                    className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm hover:bg-gray-50"
                                    onMouseDown={(event) => event.preventDefault()}
                                    onClick={() => {
                                        toggleUser(user.id);
                                        setQuery('');
                                        setIsOpen(false);
                                    }}
                                >
                                    <UserAvatar
                                        user={user}
                                        className="size-8"
                                        textClassName="text-xs"
                                    />
                                    <span className="min-w-0 flex-1">
                                        <span className="block truncate font-medium text-gray-900">
                                            {getUserDisplayFullName(user)}
                                        </span>
                                        <span className="block truncate text-xs text-gray-500">
                                            {user.email}
                                        </span>
                                    </span>
                                    <span className="text-xs font-medium text-gray-700">
                                        Toevoegen
                                    </span>
                                </button>
                            </li>
                        ))}
                    </ul>
                ) : null}

                {isOpen && query.trim() !== '' && filteredUsers.length === 0 ? (
                    <p className="absolute z-20 mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-500 shadow-lg">
                        Geen gebruikers gevonden.
                    </p>
                ) : null}
            </div>

            {selectedIds.map((id) => (
                <input key={id} type="hidden" name="member_ids[]" value={id} />
            ))}

            <p className="mt-1.5 text-xs text-gray-500">
                {users.length === 0
                    ? 'Er zijn nog geen collega’s in je organisatie.'
                    : 'Kies collega’s uit de lijst; ze worden direct als lid toegevoegd.'}
            </p>
        </div>
    );
}

export function MemberAvatarStack({
    members,
    memberCount,
    className,
}: {
    members: OrganizationUserOption[];
    memberCount: number;
    className?: string;
}) {
    const overflow = Math.max(0, memberCount - members.length);

    return (
        <div className={cn('flex items-center', className)}>
            <div className="flex -space-x-2">
                {members.map((member) => (
                    <UserAvatar
                        key={member.id}
                        user={member}
                        title={getUserDisplayFullName(member)}
                        className="size-8 ring-2 ring-white"
                        textClassName="text-xs"
                    />
                ))}
                {overflow > 0 ? (
                    <span
                        className="flex size-8 items-center justify-center rounded-full bg-gray-100 text-xs font-semibold text-gray-600 ring-2 ring-white"
                        title={`${overflow} extra leden`}
                    >
                        +{overflow}
                    </span>
                ) : null}
            </div>
        </div>
    );
}
