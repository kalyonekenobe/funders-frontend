'use client';

import { atom } from 'jotai';
import { HttpStatusCode } from 'axios';
import { ActionCreatorOptions } from '@/app/(core)/store/types/app.types';
import api from '@/app/(core)/utils/client-axios.utils';
import { resolveUrl } from '@/app/(core)/utils/app.utils';
import { ChatMessage, ChatMessageStorageErrors } from '@/app/(core)/types/chat/chat-message.types';

export const chatMessageStorageErrorsAtom = atom<ChatMessageStorageErrors>({
  fetchAllChatMessages: null,
  fetchOneChatMessage: null,
  createChatMessage: null,
  updateChatMessage: null,
  removeChatMessage: null,
});

export const chatMessagesAtom = atom<ChatMessage[]>([]);
export const selectedChatMessageAtom = atom<ChatMessage | null>(null);

export const fetchAllChatMessagesAtom = atom(
  get => get(chatMessagesAtom),
  async (
    get,
    set,
    queryParams?: Record<string, unknown>,
    options?: ActionCreatorOptions,
  ): Promise<void> => {
    set(chatMessageStorageErrorsAtom, {
      ...get(chatMessageStorageErrorsAtom),
      fetchAllChatMessages: null,
    });

    try {
      const response = await api.get(resolveUrl(`chat-messages`, queryParams));

      if (response.status === HttpStatusCode.Ok) {
        options?.onSuccess?.(response.data);
        set(chatMessagesAtom, response.data);
      }
    } catch (error: any) {
      set(chatMessageStorageErrorsAtom, {
        ...get(chatMessageStorageErrorsAtom),
        fetchAllChatMessages: 'Cannot fetch the list of chat messages',
      });
    }
  },
);

export const fetchChatMessageByIdAtom = atom(
  get => get(selectedChatMessageAtom),
  async (
    get,
    set,
    id: ChatMessage['id'],
    queryParams?: Record<string, unknown>,
    options?: ActionCreatorOptions,
  ): Promise<void> => {
    set(chatMessageStorageErrorsAtom, {
      ...get(chatMessageStorageErrorsAtom),
      fetchOneChatMessage: null,
    });

    try {
      const response = await api.get(resolveUrl(`chat-messages/${id}`, queryParams));

      if (response.status === HttpStatusCode.Ok) {
        options?.onSuccess?.(response.data);
        set(selectedChatMessageAtom, response.data);
      }
    } catch (error: any) {
      set(chatMessageStorageErrorsAtom, {
        ...get(chatMessageStorageErrorsAtom),
        fetchOneChatMessage: 'Cannot fetch the chat message by id',
      });
    }
  },
);

export const createChatMessageAtom = atom(
  null,
  async (get, set, formData: FormData, options?: ActionCreatorOptions): Promise<void> => {
    set(chatMessageStorageErrorsAtom, {
      ...get(chatMessageStorageErrorsAtom),
      createChatMessage: null,
    });

    try {
      const response = await api.postForm(resolveUrl(`chat-messages`), formData);

      if (response.status === HttpStatusCode.Created) {
        options?.onSuccess?.(response.data);
        set(chatMessagesAtom, [response.data, ...get(chatMessagesAtom)]);
      }
    } catch (error: any) {
      set(chatMessageStorageErrorsAtom, {
        ...get(chatMessageStorageErrorsAtom),
        createChatMessage: 'Cannot create the new chat message',
      });
    }
  },
);

export const updateChatMessageAtom = atom(
  null,
  async (
    get,
    set,
    id: ChatMessage['id'],
    formData: FormData,
    options?: ActionCreatorOptions,
  ): Promise<void> => {
    set(chatMessageStorageErrorsAtom, {
      ...get(chatMessageStorageErrorsAtom),
      updateChatMessage: null,
    });

    try {
      const response = await api.putForm(resolveUrl(`chat-messages/${id}`), formData);

      if (response.status === HttpStatusCode.Ok) {
        options?.onSuccess?.(response.data);
        set(
          chatMessagesAtom,
          get(chatMessagesAtom).map(message =>
            message.id === response.data.id ? response.data : message,
          ),
        );
      }
    } catch (error: any) {
      set(chatMessageStorageErrorsAtom, {
        ...get(chatMessageStorageErrorsAtom),
        updateChatMessage: 'Cannot update the new chat message',
      });
    }
  },
);

export const removeChatMessageAtom = atom(
  null,
  async (get, set, id: ChatMessage['id'], options?: ActionCreatorOptions): Promise<void> => {
    set(chatMessageStorageErrorsAtom, {
      ...get(chatMessageStorageErrorsAtom),
      removeChatMessage: null,
    });

    try {
      const response = await api.delete(resolveUrl(`chat-messages/${id}`));

      if (response.status === HttpStatusCode.Ok) {
        options?.onSuccess?.(response.data);
        set(
          chatMessagesAtom,
          get(chatMessagesAtom).filter(message => message.id !== response.data.id),
        );
      }
    } catch (error: any) {
      set(chatMessageStorageErrorsAtom, {
        ...get(chatMessageStorageErrorsAtom),
        removeChatMessage: 'Cannot remove the new chat message',
      });
    }
  },
);
