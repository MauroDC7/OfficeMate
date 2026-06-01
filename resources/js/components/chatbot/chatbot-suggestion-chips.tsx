import { cn } from '@/lib/utils';

const SUGGESTIONS = [
    'Hoe boek ik uren deze week?',
    'Hoe vraag ik verlof aan?',
    'Welke projecten heb ik open?',
] as const;

type ChatbotSuggestionChipsProps = {
    onSelect: (text: string) => void;
    className?: string;
};

export function ChatbotSuggestionChips({ onSelect, className }: ChatbotSuggestionChipsProps) {
    return (
        <div className={cn('flex flex-wrap gap-2', className)}>
            {SUGGESTIONS.map((suggestion) => (
                <button
                    key={suggestion}
                    type="button"
                    onClick={() => onSelect(suggestion)}
                    className="rounded-full border border-gray-200 bg-white px-3 py-1.5 text-left text-xs font-medium text-gray-700 shadow-sm transition hover:border-gray-300 hover:bg-gray-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900"
                >
                    {suggestion}
                </button>
            ))}
        </div>
    );
}
