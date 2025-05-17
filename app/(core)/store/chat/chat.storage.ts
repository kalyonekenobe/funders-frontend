'use client';

import { ActionCreatorOptions } from '@/app/(core)/store/types/app.types';
import { ChatMessage } from '@/app/(core)/types/chat/chat-message.types';
import { Chat, ChatListItem, ChatStorageErrors } from '@/app/(core)/types/chat/chat.types';
import { resolveUrl } from '@/app/(core)/utils/app.utils';
import api from '@/app/(core)/utils/client-axios.utils';
import { HttpStatusCode } from 'axios';
import { atom } from 'jotai';

export const chatStorageErrorsAtom = atom<ChatStorageErrors>({
  fetchAllChats: null,
  fetchOneChat: null,
  fetchChatsUnreadMessagesCount: null,
});

export const chatsAtom = atom<Chat[]>([]);
export const chatListAtom = atom<ChatListItem[]>([]);
export const selectedChatAtom = atom<Chat | null>(null);
export const chatMessagesAtom = atom<ChatMessage[]>([]);

export const fetchAllChatsAtom = atom(
  get => get(chatsAtom),
  async (
    get,
    set,
    queryParams?: Record<string, unknown>,
    options?: ActionCreatorOptions,
  ): Promise<void> => {
    set(chatStorageErrorsAtom, { ...get(chatStorageErrorsAtom), fetchAllChats: null });

    try {
      const response = await api.get(resolveUrl(`chats`, queryParams));

      if (response.status === HttpStatusCode.Ok) {
        options?.onSuccess?.(response.data);
        set(chatsAtom, response.data);
      }
    } catch (error: any) {
      set(chatStorageErrorsAtom, {
        ...get(chatStorageErrorsAtom),
        fetchAllChats: 'Cannot fetch the list of chats',
      });
    }
  },
);

export const fetchUserChatListAtom = atom(
  get => get(chatListAtom),
  async (
    get,
    set,
    queryParams?: Record<string, unknown>,
    options?: ActionCreatorOptions,
  ): Promise<void> => {
    set(chatStorageErrorsAtom, { ...get(chatStorageErrorsAtom), fetchAllChats: null });

    try {
      const response = await api.get(resolveUrl(`chats/list`, queryParams));

      if (response.status === HttpStatusCode.Ok) {
        options?.onSuccess?.(response.data);
        set(chatListAtom, response.data);
      }
    } catch (error: any) {
      set(chatStorageErrorsAtom, {
        ...get(chatStorageErrorsAtom),
        fetchAllChats: 'Cannot fetch the list of chats',
      });
    }
  },
);

export const fetchChatByIdAtom = atom(
  get => get(selectedChatAtom),
  async (
    get,
    set,
    id: Chat['id'],
    queryParams?: Record<string, unknown>,
    options?: ActionCreatorOptions,
  ): Promise<void> => {
    set(chatStorageErrorsAtom, { ...get(chatStorageErrorsAtom), fetchOneChat: null });

    try {
      const response = await api.get(resolveUrl(`chats/${id}`, queryParams));

      if (response.status === HttpStatusCode.Ok) {
        options?.onSuccess?.(response.data);
        set(selectedChatAtom, response.data);
      }
    } catch (error: any) {
      set(chatStorageErrorsAtom, {
        ...get(chatStorageErrorsAtom),
        fetchOneChat: 'Cannot fetch the chat by id',
      });
    }
  },
);
