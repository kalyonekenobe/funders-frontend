import {
  fetchAllChatsAtom,
  fetchChatByIdAtom,
  selectedChatAtom,
  chatsAtom,
  chatStorageErrorsAtom,
  fetchUserChatListAtom,
  chatListAtom,
} from '@/app/(core)/store/chat/chat.storage';
import { useAtom } from 'jotai';

export const useChatStorage = () => {
  const [chats, setChatsInStorage] = useAtom(chatsAtom);
  const [chatList, setChatListInStorage] = useAtom(chatListAtom);
  const [chat, setSelectedChatInStorage] = useAtom(selectedChatAtom);
  const [_chats, fetchAllChats] = useAtom(fetchAllChatsAtom);
  const [_chatList, fetchUserChatList] = useAtom(fetchUserChatListAtom);
  const [_chat, fetchChatById] = useAtom(fetchChatByIdAtom);
  const [errors, setErrorsInStorage] = useAtom(chatStorageErrorsAtom);

  return {
    chats,
    chatList,
    chat,
    errors,
    fetchUserChatList,
    fetchAllChats,
    fetchChatById,
    setChatListInStorage,
    setErrorsInStorage,
    setChatsInStorage,
    setSelectedChatInStorage,
  };
};
