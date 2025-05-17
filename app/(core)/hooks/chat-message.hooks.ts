import {
  fetchAllChatMessagesAtom,
  fetchChatMessageByIdAtom,
  selectedChatMessageAtom,
  chatMessagesAtom,
  chatMessageStorageErrorsAtom,
  createChatMessageAtom,
  updateChatMessageAtom,
  removeChatMessageAtom,
} from '@/app/(core)/store/chat/chat-message.storage';
import { useAtom } from 'jotai';

export const useChatMessageStorage = () => {
  const [chatMessages, setChatMessagesInStorage] = useAtom(chatMessagesAtom);
  const [chatMessage, setSelectedChatMessageInStorage] = useAtom(selectedChatMessageAtom);
  const [_chatMessages, fetchAllChatMessages] = useAtom(fetchAllChatMessagesAtom);
  const [_chatMessage, fetchChatMessageById] = useAtom(fetchChatMessageByIdAtom);
  const [_createMessage, createChatMessage] = useAtom(createChatMessageAtom);
  const [_updateMessage, updateChatMessage] = useAtom(updateChatMessageAtom);
  const [_removeMessage, removeChatMessage] = useAtom(removeChatMessageAtom);
  const [errors, setErrorsInStorage] = useAtom(chatMessageStorageErrorsAtom);

  return {
    chatMessages,
    chatMessage,
    errors,
    fetchAllChatMessages,
    fetchChatMessageById,
    createChatMessage,
    updateChatMessage,
    removeChatMessage,
    setErrorsInStorage,
    setChatMessagesInStorage,
    setSelectedChatMessageInStorage,
  };
};
