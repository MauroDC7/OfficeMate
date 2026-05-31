import { cn } from '@/lib/utils';

export type TeamsAdminTab = 'teams' | 'people';

const TABS: { value: TeamsAdminTab; label: string }[] = [
    { value: 'teams', label: 'Teams' },
    { value: 'people', label: 'People' },
];

type TeamsAdminTabsProps = {
    activeTab: TeamsAdminTab;
    onTabChange: (tab: TeamsAdminTab) => void;
};

export function TeamsAdminTabs({ activeTab, onTabChange }: TeamsAdminTabsProps) {
    return (
        <div className="mt-5 border-b border-gray-200" role="tablist" aria-label="Teams weergave">
            <div className="flex gap-1">
                {TABS.map(({ value, label }) => {
                    const active = activeTab === value;

                    return (
                        <button
                            key={value}
                            type="button"
                            role="tab"
                            aria-selected={active}
                            onClick={() => onTabChange(value)}
                            className={cn(
                                '-mb-px border-b-2 px-4 py-2.5 text-sm font-medium transition',
                                active
                                    ? 'border-gray-900 text-gray-900'
                                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700',
                            )}
                        >
                            {label}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
