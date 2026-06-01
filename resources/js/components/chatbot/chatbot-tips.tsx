type ChatbotTipsProps = {
    tips: string[];
};

export function ChatbotTips({ tips }: ChatbotTipsProps) {
    if (tips.length === 0) {
        return null;
    }

    return (
        <div className="rounded-xl border border-amber-200/80 bg-amber-50/60 px-3.5 py-3">
            <p className="text-xs font-semibold tracking-wide text-amber-900 uppercase">
                Tip van Timy
            </p>
            <ul className="mt-2 space-y-1.5">
                {tips.map((tip) => (
                    <li key={tip} className="text-sm leading-snug text-amber-950/90">
                        {tip}
                    </li>
                ))}
            </ul>
        </div>
    );
}
