import { ChatTypes } from '@/app/(core)/enums/chat.enum';
import { UserToChat } from '@/app/(core)/store/types/user.types';
import { ChatMessage } from '@/app/(core)/types/chat/chat-message.types';

export interface Chat {
  id: string;
  name: string | null;
  type: ChatTypes;
  image: string | null;
  description: string | null;
  orderId: string | null;
  createdAt: Date;
  updatedAt: Date;
  usersToChats?: UserToChat[];
  messages?: ChatMessage[];
  [key: string]: any;
}

export interface ChatListItem {
  id: string;
  name: string | null;
  type: ChatTypes;
  image: string | null;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
  messages: ChatMessage[];
  totalUnreadMessages: number;
  [key: string]: any;
}

export interface ChatStorageErrors {
  fetchAllChats: string | null;
  fetchOneChat: string | null;
  fetchChatsUnreadMessagesCount: string | null;
}
