import { getUserInitials } from '@/lib/user-display';
import { cn } from '@/lib/utils';
import type { User } from '@/types/auth';

type UserAvatarProps = {
    user: User | null;
    className?: string;
    textClassName?: string;
    title?: string;
};

export function UserAvatar({ user, className, textClassName, title }: UserAvatarProps) {
    const src = user?.avatar;
    const initials = getUserInitials(user);
    const ring = 'shrink-0 rounded-full ring-1 ring-gray-200/80 shadow-sm';

    if (src !== undefined && src !== null && src !== '') {
        return (
            <span className="inline-flex" title={title}>
                <img
                    src={src}
                    alt=""
                    className={cn(ring, 'object-cover', className)}
                    decoding="async"
                    draggable={false}
                    aria-hidden
                />
            </span>
        );
    }

    return (
        <span className="inline-flex" title={title}>
            <div
                className={cn(
                    ring,
                    'flex items-center justify-center bg-violet-600 font-semibold tracking-tight text-white',
                    textClassName,
                    className,
                )}
                aria-hidden
            >
                {initials}
            </div>
        </span>
    );
}
