import type { ReactNode } from 'react';
import { useState } from 'react';

import { AuthField } from '@/components/auth-page';
import { PasswordStrengthBar } from '@/components/password-strength-bar';

type PasswordFieldWithHintsProps = {
    id?: string;
    label: string;
    error?: string;
    autoComplete?: string;
    placeholder?: string;
};

export function PasswordFieldWithHints({
    id = 'password',
    label,
    error,
    autoComplete = 'new-password',
    placeholder = '••••••••',
}: PasswordFieldWithHintsProps): ReactNode {
    const [password, setPassword] = useState('');
    const [focused, setFocused] = useState(false);

    return (
        <div>
            <AuthField
                id={id}
                label={label}
                type="password"
                autoComplete={autoComplete}
                placeholder={placeholder}
                error={error}
                onChange={setPassword}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                describedBy={focused ? 'password-hints' : undefined}
            />
            <PasswordStrengthBar password={password} visible={focused} />
        </div>
    );
}
