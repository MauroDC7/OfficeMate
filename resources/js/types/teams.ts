export type TeamMembershipStatus = 'pending' | 'approved' | 'rejected';

export type TeamTreeRow = {
    id: number;
    name: string;
    parent_id: number | null;
    depth: number;
};

export type TeamMembershipRow = {
    id: number;
    status: TeamMembershipStatus;
    team: {
        id: number;
        name: string;
    };
};

export type PendingMembershipRow = TeamMembershipRow & {
    user: {
        id: number;
        name: string;
        email: string;
    };
};

export type OrganizationSummary = {
    id: number;
    name: string;
};

export type TeamsPageProps = {
    organization: OrganizationSummary | null;
    teams: TeamTreeRow[];
    myMemberships: TeamMembershipRow[];
    pendingMemberships: PendingMembershipRow[];
    isAdmin: boolean;
};
