import { useEffect, useState } from 'react';

/**
 * Tracks whether the given CSS media query currently matches.
 *
 * Returns `false` on the server (no `window`) so the first client render
 * matches SSR output; clients reconcile on the first effect tick.
 */
export function useMediaQuery(query: string): boolean {
    const [matches, setMatches] = useState(false);

    useEffect(() => {
        if (typeof window === 'undefined') {
            return;
        }

        const mediaQuery = window.matchMedia(query);
        setMatches(mediaQuery.matches);

        function onChange(event: MediaQueryListEvent): void {
            setMatches(event.matches);
        }

        mediaQuery.addEventListener('change', onChange);

        return () => mediaQuery.removeEventListener('change', onChange);
    }, [query]);

    return matches;
}

/** Matches Tailwind's `md` breakpoint (≥ 768px is "not mobile"). */
export function useIsMobileViewport(): boolean {
    return useMediaQuery('(max-width: 767px)');
}
