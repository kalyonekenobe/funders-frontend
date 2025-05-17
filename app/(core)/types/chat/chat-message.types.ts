import { ChatMessageStatuses } from "@/app/(core)/enums/chat.enum";
import { User } from "@/app/(core)/store/types/user.types";
import { ChatMessageAttachment } from "@/app/(core)/types/chat-message-attachment.types";
import { ChatMessageReaction } from "@/app/(core)/types/chat-message-reaction.types";
import { Chat } from "@/app/(core)/types/chat.types";

export interface ChatMessage {
  id: string;
  chatId: Chat['id'];
  authorId: User['id'];
  parentMessageId: ChatMessage['id'] | null;
  content: string;
  isPinned: boolean;
  status: ChatMessageStatuses;
  createdAt: Date;
  updatedAt: Date;
  removedAt: Date;
  chat?: Chat;
  author?: User;
  parentMessage?: ChatMessage | null;
  replies?: ChatMessage[];
  attachments?: ChatMessageAttachment[];
  reactions?: ChatMessageReaction[];
}

export interface ChatMessageStorageErrors {
  fetchAllChatMessages: string | null;
  fetchOneChatMessage: string | null;
  createChatMessage: string | null;
  updateChatMessage: string | null;
  removeChatMessage: string | null;
}
