export const PASSWORD_MIN_LENGTH = 10;

export type PasswordChecks = {
    minLength: boolean;
    uppercase: boolean;
    digit: boolean;
    special: boolean;
};

export const PASSWORD_RULES = [
    { key: 'minLength', label: 'Minimaal 10 tekens' },
    { key: 'uppercase', label: 'Minimaal één hoofdletter' },
    { key: 'digit', label: 'Minimaal één cijfer' },
    { key: 'special', label: 'Minimaal één speciaal teken' },
] as const satisfies ReadonlyArray<{
    key: keyof PasswordChecks;
    label: string;
}>;

export type PasswordStrength = {
    score: number;
    checks: PasswordChecks;
};

export function getPasswordStrength(password: string): PasswordStrength {
    const checks: PasswordChecks = {
        minLength: password.length >= PASSWORD_MIN_LENGTH,
        uppercase: /[A-Z]/.test(password),
        digit: /\d/.test(password),
        special: /[^A-Za-z0-9]/.test(password),
    };

    const score = Object.values(checks).filter(Boolean).length;

    return { score, checks };
}

export function passwordStrengthBarClass(score: number): string {
    if (score <= 1) {
        return 'bg-red-500';
    }

    if (score <= 3) {
        return 'bg-orange-500';
    }

    return 'bg-green-500';
}
