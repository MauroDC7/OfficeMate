export function ChatbotTypingIndicator() {
    return (
        <div className="flex items-end gap-2.5">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-gray-200/80 bg-white p-1 shadow-sm">
                <img
                    src="/img/logoTransparent.png"
                    alt=""
                    aria-hidden
                    className="size-full object-contain"
                    width={24}
                    height={24}
                    decoding="async"
                    draggable={false}
                />
            </span>
            <div
                className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3.5 py-3 shadow-sm"
                aria-label="Timy typt"
                role="status"
            >
                <span className="size-1.5 animate-bounce rounded-full bg-gray-400 [animation-delay:0ms]" />
                <span className="size-1.5 animate-bounce rounded-full bg-gray-400 [animation-delay:150ms]" />
                <span className="size-1.5 animate-bounce rounded-full bg-gray-400 [animation-delay:300ms]" />
            </div>
        </div>
    );
}
