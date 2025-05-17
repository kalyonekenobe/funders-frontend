import { ChatMessage } from "@/app/(core)/types/chat/chat-message.types";


export interface ChatMessageAttachment {
  id: string;
  messageId: ChatMessage['id'];
  location: string;
  filename: string | null;
  createdAt: Date;
  updatedAt: Date;
  chatMessage?: ChatMessage;
}
