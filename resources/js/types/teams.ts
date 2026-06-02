import type { PresenceEmployee, PresenceSummary } from '@/types/presence';

export type TeamMembershipStatus = 'pending' | 'approved' | 'rejected';

export type TeamMemberPreview = {
    id: number;
    name: string;
    email: string;
    first_name: string;
    last_name: string;
    avatar: string | null;
};

export type TeamCard = {
    id: number;
    name: string;
    department: string | null;
    member_count: number;
    members_preview: TeamMemberPreview[];
    my_status: TeamMembershipStatus | null;
    /** Alleen voor beheerders (team bewerken). */
    member_ids?: number[];
};

export type OrganizationUserOption = TeamMemberPreview;

export type PendingMembershipRow = {
    id: number;
    status: TeamMembershipStatus;
    team: {
        id: number;
        name: string;
    };
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

export type TeamShowPageProps = {
    team: {
        id: number;
        name: string;
        department: string | null;
        member_count: number;
    };
    members: TeamMemberPreview[];
    pendingMemberships: Array<{
        id: number;
        user: { id: number; name: string; email: string };
    }>;
    projects: Array<{ id: number; name: string }>;
    teamLeaveUpcoming: import('@/types/leave-requests').TeamLeaveItem[];
    isAdmin: boolean;
    canManage: boolean;
    myMembership: { id: number; status: TeamMembershipStatus } | null;
    organizationUsers: OrganizationUserOption[];
    member_ids: number[];
};

export type TeamsPageProps = {
    organization: OrganizationSummary | null;
    teamCards: TeamCard[];
    stats: {
        total_teams: number;
        total_members: number;
    };
    organizationUsers: OrganizationUserOption[];
    pendingMemberships: PendingMembershipRow[];
    isAdmin: boolean;
    awaitingOrganizationInvite: boolean;
    people: {
        summary: PresenceSummary;
        employees: PresenceEmployee[];
    } | null;
    initialTab: 'teams' | 'people';
};
