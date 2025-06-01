import { ChatMessageReactions } from "@/app/(core)/enums/chat.enum";
import { User } from "@/app/(core)/store/types/user.types";
import { ChatMessage } from "@/app/(core)/types/chat/chat-message.types";

export interface ChatMessageReaction {
  messageId: ChatMessage['id'];
  userId: User['id'];
  reaction: ChatMessageReactions;
  createdAt: Date;
  updatedAt: Date;
  chatMessage?: ChatMessage;
  user?: User;
}
