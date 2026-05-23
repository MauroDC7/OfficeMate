export type UserRole = 'admin' | 'employee';

export type User = {
    id: number;
    first_name: string;
    last_name: string;
    name: string;
    username: string | null;
    role: UserRole;
    email: string;
    avatar: string | null;
    email_verified_at: string | null;
    created_at: string;
    updated_at: string;
    [key: string]: unknown; // This allows for additional properties...
};

export type Auth = {
    user: User | null;
    isAdmin: boolean;
};
