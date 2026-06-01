import { UserAvatar, type UserAvatarFields } from '@/components/user-avatar';
import { cn } from '@/lib/utils';

export type ChatMessageRole = 'user' | 'assistant';

type ChatbotMessageBubbleProps = {
    role: ChatMessageRole;
    content: string;
    user: UserAvatarFields | null;
    isWelcome?: boolean;
};

function AssistantAvatar() {
    return (
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
    );
}

export function ChatbotMessageBubble({
    role,
    content,
    user,
    isWelcome = false,
}: ChatbotMessageBubbleProps) {
    const isUser = role === 'user';

    return (
        <div
            className={cn(
                'flex gap-2.5',
                isUser ? 'flex-row-reverse' : 'flex-row',
            )}
        >
            {isUser ? (
                <UserAvatar user={user} className="size-8" textClassName="text-[10px]" />
            ) : (
                <AssistantAvatar />
            )}

            <div
                className={cn(
                    'flex min-w-0 max-w-[calc(100%-2.75rem)] flex-col gap-1',
                    isUser ? 'items-end' : 'items-start',
                )}
            >
                {!isUser ? (
                    <span className="px-0.5 text-[11px] font-medium tracking-wide text-gray-400 uppercase">
                        Timy
                    </span>
                ) : null}
                <div
                    className={cn(
                        'rounded-xl px-3.5 py-2.5 text-sm leading-relaxed',
                        isUser
                            ? 'rounded-tr-md bg-gray-900 text-white shadow-sm'
                            : cn(
                                  'rounded-tl-md border border-gray-200 bg-white text-gray-800 shadow-sm',
                                  isWelcome && 'border-gray-200/90 bg-gradient-to-b from-white to-gray-50/80',
                              ),
                    )}
                >
                    <p className="text-pretty whitespace-pre-wrap">{content}</p>
                </div>
            </div>
        </div>
    );
}
