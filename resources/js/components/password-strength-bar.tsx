import type { ReactNode } from 'react';

import {
    getPasswordStrength,
    PASSWORD_RULES,
    passwordStrengthBarClass,
} from '@/lib/password-strength';
import { cn } from '@/lib/utils';

type PasswordStrengthBarProps = {
    password: string;
    visible: boolean;
};

export function PasswordStrengthBar({
    password,
    visible,
}: PasswordStrengthBarProps): ReactNode {
    if (!visible) {
        return null;
    }

    const { score, checks } = getPasswordStrength(password);

    return (
        <div className="mt-2 space-y-2" id="password-hints">
            <ul className="space-y-1 text-xs text-gray-600" aria-label="Wachtwoordregels">
                {PASSWORD_RULES.map((rule) => (
                    <li
                        key={rule.key}
                        className={cn(
                            'flex items-center gap-2',
                            checks[rule.key] && 'font-medium text-green-600',
                        )}
                    >
                        <span aria-hidden className="w-3 shrink-0 text-center">
                            {checks[rule.key] ? '✓' : '·'}
                        </span>
                        {rule.label}
                    </li>
                ))}
            </ul>
            {password !== '' ? (
                <div
                    className="h-1.5 w-full overflow-hidden rounded-full bg-gray-200"
                    aria-hidden
                >
                    <div
                        className={cn(
                            'h-full rounded-full transition-all duration-300 ease-out',
                            passwordStrengthBarClass(score),
                        )}
                        style={{ width: `${(score / 4) * 100}%` }}
                    />
                </div>
            ) : null}
        </div>
    );
}
