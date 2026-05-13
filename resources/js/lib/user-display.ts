import type { User } from '@/types/auth';

type UserNameFields = Pick<User, 'first_name' | 'last_name' | 'name'>;

/**
 * Volledige weergavenaam: voor- en achternaam met één spatie ertussen (zoals op de server).
 */
export function getUserDisplayFullName(user: UserNameFields | null | undefined): string {
    if (!user) {
        return '';
    }

    const first = user.first_name?.trim() ?? '';
    const last = user.last_name?.trim() ?? '';

    if (first !== '' || last !== '') {
        return [first, last].filter(Boolean).join(' ');
    }

    return user.name?.trim() ?? '';
}

/**
 * Initialen: eerste letter van elk woord (gescheiden door spaties), bv. "Mauro De Cleen" → "MDC".
 */
export function getUserInitials(user: UserNameFields | null | undefined): string {
    const fullName = getUserDisplayFullName(user);

    if (fullName === '') {
        return '?';
    }

    const initials = fullName
        .split(/\s+/)
        .filter((word) => word.length > 0)
        .map((word) => word.charAt(0).toUpperCase())
        .join('');

    return initials === '' ? '?' : initials.slice(0, 3);
}

/**
 * Voornaam voor o.a. begroeting; valt terug op het eerste woord van `name` als `first_name` leeg is.
 */
export function getUserFirstName(user: UserNameFields | null | undefined): string {
    if (!user) {
        return '';
    }

    const first = user.first_name?.trim();

    if (first !== undefined && first !== '') {
        return first;
    }

    const fromName = user.name?.trim().split(/\s+/).at(0);

    return fromName ?? '';
}
