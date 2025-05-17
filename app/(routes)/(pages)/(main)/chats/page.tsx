'use client';

import { useChatStorage } from '@/app/(core)/hooks/chat.hooks';
import { useSocket } from '@/app/(core)/hooks/socket.hooks';
import { SocketEvents } from '@/app/(core)/types/socket/socket.types';
import { resolveImage, resolveImageUrl } from '@/app/(core)/utils/app.utils';
import { ApplicationRoutes } from '@/app/(core)/utils/routes.utils';
import { useRouter } from 'next/navigation';
import { FC, HTMLAttributes, use, useEffect, useMemo, useState } from 'react';

export interface ChatListProps extends HTMLAttributes<HTMLDivElement> {
  chatsPromise: Promise<void>;
}

const ChatList: FC<ChatListProps> = ({ chatsPromise, ...props }) => {
  use(chatsPromise);

  const { chatList, chat: selectedChat } = useChatStorage();
  const router = useRouter();
  const { socket } = useSocket();
  const [isPageLoaded, setIsPageLoaded] = useState(false);
  const datetimeFormatter = useMemo(
    () => new Intl.DateTimeFormat('sv-SE', { timeStyle: 'short' }),
    [],
  );

  useEffect(() => {
    if (!isPageLoaded) {
      return setIsPageLoaded(true);
    }

    if (isPageLoaded && socket) {
      chatList.forEach(chat => socket.emit(SocketEvents.JoinChat, chat.id));
    }
  }, [socket, isPageLoaded]);

  return (
    <div {...props}>
      <div className='flex flex-col flex-1 relative'>
        <div className='absolute top-0 left-0 right-0 bottom-0'>
          <div className='overflow-y-auto h-full'>
            {chatList.map(chat => (
              <div
                key={chat.id}
                className={`flex p-3 gap-3 cursor-pointer border-b transition-all duration-300 ${
                  chat.id === selectedChat?.id ? 'bg-zinc-900' : 'border-zinc-50 hover:bg-zinc-50'
                }`}
                onClick={() =>
                  router.replace(ApplicationRoutes.ChatDetails.replace(':id', chat.id))
                }
              >
                <div className='flex'>
                  <div className='rounded-md overflow-hidden w-[40px]'>
                    <img
                      src={resolveImageUrl(chat.image || '')}
                      alt={`Image of chat with id ${chat.id}`}
                      className='object-cover aspect-square'
                      onError={event => {
                        event.currentTarget.src = resolveImage(null, 'post-image-placeholder');
                        event.currentTarget.onerror = null;
                        event.currentTarget.classList.add('scale-150');
                      }}
                    />
                  </div>
                </div>
                <div className='flex flex-col flex-1 gap-2'>
                  <div className='flex justify-between'>
                    <div className='flex flex-1 relative'>
                      <div className='absolute left-0 right-0'>
                        <h3
                          className={`truncate overflow-hidden text-sm font-semibold ${
                            chat.id === selectedChat?.id ? 'text-zinc-200' : 'text-zinc-600'
                          }`}
                        >
                          {chat.name || chat.id}
                        </h3>
                      </div>
                    </div>
                    {chat.messages?.[0]?.createdAt ? (
                      <span
                        className={`text-xs ms-2 ${
                          chat.id === selectedChat?.id ? 'text-zinc-50' : 'text-zinc-700'
                        }`}
                      >
                        {datetimeFormatter.format(new Date(chat.messages[0].createdAt))}
                      </span>
                    ) : (
                      <span className='text-xs text-transparent'>.</span>
                    )}
                  </div>
                  <div className='flex justify-between'>
                    <div className='flex flex-1 relative'>
                      <div className='absolute left-0 right-0 top-0 bottom-0 flex items-center'>
                        {chat.messages?.[0]?.content && (
                          <span
                            className={`text-xs whitespace-nowrap truncate overflow-hidden ${
                              chat.id === selectedChat?.id ? 'text-zinc-200' : 'text-zinc-600'
                            }`}
                          >
                            {chat.messages[0].content}
                          </span>
                        )}
                      </div>
                    </div>
                    {chat.totalUnreadMessages ? (
                      <span
                        className={`inline-flex min-w-[16px] text-center justify-center ms-2 text-[8px] px-1 py-0.5 font-medium rounded-full  ${
                          chat.id === selectedChat?.id
                            ? 'text-zinc-900 bg-zinc-50'
                            : 'bg-zinc-900 text-zinc-50'
                        }`}
                      >
                        {chat.totalUnreadMessages}
                      </span>
                    ) : (
                      <span className='text-transparent inline-flex text-[8px] w-0'>.</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatList;
