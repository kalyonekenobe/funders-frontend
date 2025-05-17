'use client';

import { useChatStorage } from '@/app/(core)/hooks/chat.hooks';
import Chat from '@/app/(routes)/(pages)/(main)/chats/[id]/Chat';
import ChatDetailsLoading from '@/app/(routes)/(pages)/(main)/chats/[id]/ChatDetailsLoading';
import * as _ from 'lodash';
import { useParams } from 'next/navigation';
import { FC, Suspense, useEffect, useState } from 'react';

const defaultChatDetailsPromise: Promise<void> = new Promise(() => {});

const ChatDetails: FC = () => {
  const { fetchChatById, setSelectedChatInStorage } = useChatStorage();
  const [isPageLoaded, setIsPageLoaded] = useState(false);
  const [chatDetailsPromise, setChatDetailsPromise] = useState(defaultChatDetailsPromise);
  const { id } = useParams();

  console.log(id);

  useEffect(() => {
    console.log(id);
    if (isPageLoaded && id) {
      console.log(123);
      const queryParams = { include: { _count: { select: { chatsToUsers: true } } } };

      setChatDetailsPromise(fetchChatById(id as string, queryParams));
    } else {
      setIsPageLoaded(true);
    }
  }, []);

  useEffect(() => {
    return () => {
      setSelectedChatInStorage(null);
    };
  }, []);

  return (
    <div className='flex flex-col flex-1 relative'>
      <div className='flex flex-col flex-1 bg-primary-50'>
        <Suspense fallback={<ChatDetailsLoading />}>
          <Chat chatDetailsPromise={chatDetailsPromise} />
        </Suspense>
      </div>
    </div>
  );
};

export default ChatDetails;
