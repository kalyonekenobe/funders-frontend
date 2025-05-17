'use client';

import { useAuth } from '@/app/(core)/hooks/auth.hooks';
import { useChatStorage } from '@/app/(core)/hooks/chat.hooks';
import { useSocket } from '@/app/(core)/hooks/socket.hooks';
import ChatDetailsFallback from '@/app/(routes)/(pages)/(main)/chats/[id]/ChatDetailsFallback';
import ChatList from '@/app/(routes)/(pages)/(main)/chats/page';
import ChatsLoading from '@/app/(routes)/(pages)/(main)/chats/ChatsLoading';
import * as _ from 'lodash';
import { usePathname } from 'next/navigation';
import { FC, ReactNode, Suspense, useEffect, useState } from 'react';

const defaultChatsPromise: Promise<void> = new Promise(() => {});

const Layout: FC<{ children: ReactNode }> = ({ children }) => {
  const { fetchUserChatList, chat } = useChatStorage();
  const { authenticatedUser } = useAuth();
  const { socket, connectSocket, setSocketInStorage } = useSocket();
  const [isPageLoaded, setIsPageLoaded] = useState(false);
  const [chatsPromise, setChatsPromise] = useState(defaultChatsPromise);
  const pathname = usePathname();

  useEffect(() => {
    if (isPageLoaded && authenticatedUser) {
      setChatsPromise(fetchUserChatList());
    } else {
      setIsPageLoaded(true);
    }
  }, [isPageLoaded, authenticatedUser]);

  useEffect(() => {
    if (isPageLoaded && authenticatedUser) {
      connectSocket(authenticatedUser.id);
    }
  }, [isPageLoaded, authenticatedUser]);

  useEffect(() => {
    return () => {
      socket?.disconnect();
      setSocketInStorage(null);
    };
  }, []);

  return (
    <div className='flex flex-col px-5 flex-1 relative'>
      <div className='flex items-center justify-between gap-5'>
        <h2 className='font-bold text-3xl my-10'>Chats</h2>
      </div>
      <div className='flex flex-1 bg-white relative shadow rounded-lg border border-primary-200 mb-5 overflow-hidden'>
        <div className='flex flex-col relative max-w-xs w-full border-r border-primary-200'>
          <div className='flex flex-col flex-1'>
            <Suspense fallback={<ChatsLoading />}>
              <ChatList className='flex flex-1 w-full relative' chatsPromise={chatsPromise} />
            </Suspense>
          </div>
        </div>
        <div className='flex flex-col flex-1 bg-primary-50'>
          {/* {children} */}
          {/* {!chat && <ChatDetailsFallback />} */}
        </div>
      </div>
    </div>
  );
};

export default Layout;
