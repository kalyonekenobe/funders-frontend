'use client';

import {
  Check,
  ChevronLeft,
  Copy,
  Paperclip,
  Pencil,
  Pin,
  PinOff,
  Reply,
  SendHorizonal,
  Trash2,
  User,
  X,
} from 'lucide-react';
import MessageImageGallery from './MessageImageGallery';
import {
  ChangeEvent,
  FC,
  FormEvent,
  HTMLAttributes,
  use,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import { ChatMessageAttachment } from '@/app/(core)/types/chat/chat-message-attachment.types';
import { ChatMessage } from '@/app/(core)/types/chat/chat-message.types';
import { useOutsideClick } from '@/app/(core)/hooks/dom.hooks';
import { useSocket } from '@/app/(core)/hooks/socket.hooks';
import { useChatStorage } from '@/app/(core)/hooks/chat.hooks';
import { useChatMessageStorage } from '@/app/(core)/hooks/chat-message.hooks';
import { useAuth } from '@/app/(core)/hooks/auth.hooks';
import { SocketEvents } from '@/app/(core)/types/socket/socket.types';
import { ChatMessageStatuses } from '@/app/(core)/enums/chat.enum';
import Modal from '@/app/(core)/ui/Modal/Modal';
import { resolveImage, resolveImageUrl } from '@/app/(core)/utils/app.utils';
import Link from 'next/link';
import { getChatAttachmentUrl } from '@/app/(core)/utils/chat.utils';

// Adding interface for temporary attachments
interface TempChatMessageAttachment extends ChatMessageAttachment {
  tempUrl?: string;
}

// Update the ChatMessage interface to include the temporary attachments
interface TempChatMessage extends Omit<ChatMessage, 'attachments'> {
  attachments?: TempChatMessageAttachment[];
}

export interface ChatProps extends HTMLAttributes<HTMLDivElement> {
  chatDetailsPromise: Promise<void>;
}

interface ContextMenuVisibleState {
  messageId: string;
  x: number;
  y: number;
}

interface PinnedMessagesState {
  messages: ChatMessage[];
  selected: number;
}

const Chat: FC<ChatProps> = ({ chatDetailsPromise, ...props }) => {
  use(chatDetailsPromise);

  const [isPageLoaded, setIsPageLoaded] = useState(false);
  const [editedMessage, setEditedMessage] = useState<ChatMessage | null>(null);
  const [repliedMessage, setRepliedMessage] = useState<ChatMessage | null>(null);
  const [pinnedMessagesState, setPinnedMessagesState] = useState<PinnedMessagesState>({
    messages: [],
    selected: 0,
  });
  const [contextMenuVisibleForMessage, setContextMenuVisibleForMessage] =
    useState<ContextMenuVisibleState | null>(null);
  const [removeMessageModalVisibleForMessage, setRemoveModalVisibleForMessage] =
    useState<ChatMessage | null>(null);
  const [attachments, setAttachments] = useState<File[]>([]);
  const numberFormatter = useMemo(() => new Intl.NumberFormat('en-US'), []);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const sendMessageFormRef = useRef<HTMLFormElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const messageContextMenuRef = useOutsideClick(() => setContextMenuVisibleForMessage(null));

  const { socket } = useSocket();
  const { authenticatedUser } = useAuth();
  const { chat, chatList, setSelectedChatInStorage, setChatListInStorage } = useChatStorage();
  const {
    chatMessages,
    fetchAllChatMessages,
    createChatMessage,
    updateChatMessage,
    setChatMessagesInStorage,
  } = useChatMessageStorage();

  const handleInput = (event: ChangeEvent<HTMLTextAreaElement>) => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${event.target.scrollHeight}px`;
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (
      ((textareaRef.current && textareaRef.current.value?.trim()) || attachments.length > 0) &&
      authenticatedUser &&
      chat
    ) {
      if (
        editedMessage &&
        textareaRef.current &&
        textareaRef.current.value.trim() !== editedMessage.content
      ) {
        const formData = new FormData();
        formData.set('content', textareaRef.current.value.trim());

        return updateChatMessage(editedMessage.id, formData, {
          onSuccess: (data: ChatMessage) => {
            textareaRef.current!.value = '';
            textareaRef.current!.style.height = 'auto';
            setAttachments([]);

            if (messagesContainerRef.current) {
              messagesContainerRef.current.scrollTop = 0;
            }

            if (socket) {
              socket.emit(SocketEvents.EditMessage, data);
            }

            setChatListInStorage(
              chatList
                .map(c =>
                  c.id === data.chatId
                    ? {
                        ...c,
                        messages: c.messages?.map(m => (m.id === data.id ? data : m)),
                      }
                    : c,
                )
                .sort(
                  (cA, cB) =>
                    new Date(cB.messages?.[0]?.createdAt || cB.createdAt).getTime() -
                    new Date(cA.messages?.[0]?.createdAt || cA.createdAt).getTime(),
                ),
            );
            setEditedMessage(null);
          },
        });
      }

      const formData = new FormData();

      formData.set('authorId', authenticatedUser.id);
      formData.set('chatId', chat.id);
      formData.set('content', textareaRef.current?.value.trim() || '');

      if (repliedMessage) {
        formData.set('parentMessageId', repliedMessage.id);
      }

      // Add attachments to the form data
      attachments.forEach(file => {
        formData.append('attachments', file);
      });

      // Create a placeholder message with temporary URLs for attachments
      const createTempAttachments = async () => {
        if (attachments.length === 0) {
          // No attachments, proceed with regular message creation
          sendMessage(formData);
          return;
        }

        // Generate temporary URLs for attachments for local preview
        const tempAttachments: TempChatMessageAttachment[] = attachments.map((file, index) => ({
          id: `temp-${index}`,
          messageId: 'temp-message',
          location: URL.createObjectURL(file),
          filename: file.name,
          createdAt: new Date(),
          updatedAt: new Date(),
          tempUrl: URL.createObjectURL(file), // Add tempUrl for preview
        }));

        // Create a unique ID for the temporary message
        const tempId = `temp-${Date.now()}`;

        // Create and display a placeholder message while the real one is being sent
        const tempMessage: TempChatMessage = {
          id: tempId,
          chatId: chat.id,
          authorId: authenticatedUser.id,
          parentMessageId: repliedMessage?.id || null,
          content: textareaRef.current?.value.trim() || '',
          isPinned: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          removedAt: null as unknown as Date,
          status: ChatMessageStatuses.Sent,
          author: authenticatedUser,
          parentMessage: repliedMessage,
          attachments: tempAttachments,
        };

        // Only add temp message to UI temporarily, it will be replaced by the real one
        setChatMessagesInStorage([tempMessage as unknown as ChatMessage, ...chatMessages]);

        // Send the actual message
        sendMessage(formData, tempMessage as unknown as ChatMessage);
      };

      createTempAttachments();
    }
  };

  const sendMessage = (formData: FormData, tempMessage?: ChatMessage) => {
    createChatMessage(formData, {
      onSuccess: (data: ChatMessage) => {
        if (textareaRef.current) {
          textareaRef.current.value = '';
          textareaRef.current.style.height = 'auto';
        }

        if (messagesContainerRef.current) {
          messagesContainerRef.current.scrollTop = 0;
        }

        setRepliedMessage(null);
        setAttachments([]);

        if (socket) {
          socket.emit(SocketEvents.CreateMessage, data);
        }

        if (tempMessage) {
          // Replace the temporary message with the real one
          setChatMessagesInStorage(
            chatMessages.map(m => {
              if (m.id === tempMessage.id) {
                // Cast to access tempUrl
                const tempAttachments = (tempMessage as unknown as TempChatMessage).attachments;
                return {
                  ...data,
                  attachments: data.attachments?.map((att, i) => ({
                    ...att,
                    tempUrl: tempAttachments?.[i]?.tempUrl, // Preserve tempUrl for UI consistency
                  })) as unknown as ChatMessageAttachment[],
                };
              }
              return m;
            }),
          );
        }

        setChatListInStorage(
          chatList
            .map(c =>
              c.id === data.chatId ? { ...c, messages: [data, ...(c.messages || [])] } : c,
            )
            .sort(
              (cA, cB) =>
                new Date(cB.messages?.[0]?.createdAt || cB.createdAt).getTime() -
                new Date(cA.messages?.[0]?.createdAt || cA.createdAt).getTime(),
            ),
        );
      },
    });
  };

  const handleAttachmentClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      // Convert FileList to array and add to attachments
      const newFiles = Array.from(files);
      setAttachments(prev => [...prev, ...newFiles]);

      // Clear the input
      event.target.value = '';
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleTextareaKeyDown: React.KeyboardEventHandler<HTMLTextAreaElement> = event => {
    if (event.key === 'Enter') {
      if (event.shiftKey) {
        if (textareaRef.current) {
          const start = textareaRef.current.selectionStart;
          const end = textareaRef.current.selectionEnd;
          textareaRef.current.value =
            textareaRef.current.value.substring(0, start) +
            '\n' +
            textareaRef.current.value.substring(end);
          textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + 1;

          if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
            textareaRef.current.scrollTop = textareaRef.current.scrollHeight;
          }
          event.preventDefault();
        }
      } else {
        event.preventDefault();

        if (sendMessageFormRef.current) {
          sendMessageFormRef.current.dispatchEvent(
            new Event('submit', { cancelable: true, bubbles: true }),
          );
        }
      }
    }
  };

  const handlePinMessage = (message: ChatMessage) => {
    const formData = new FormData();
    formData.set('isPinned', message.isPinned ? 'false' : 'true');

    updateChatMessage(message.id, formData, {
      onSuccess: data => {
        if (socket) {
          socket.emit(SocketEvents.PinMessage, data);
        }
      },
    });
  };

  const handleRemoveMessage = (message: ChatMessage) => {
    const formData = new FormData();
    formData.set('removedAt', new Date().toISOString().slice(0, 19));

    updateChatMessage(message.id, formData, {
      onSuccess: data => {
        if (socket) {
          socket.emit(SocketEvents.RemoveMessage, data);

          if (data.isPinned) {
            socket.emit(SocketEvents.PinMessage, { ...data, isPinned: false });
          }
        }

        setChatMessagesInStorage(
          chatMessages
            .filter(message => message.id !== data.id)
            .map(message =>
              message.parentMessageId === data.id ? { ...message, parentMessage: data } : message,
            ),
        );

        setChatListInStorage(
          chatList
            .map(chat =>
              chat.id === data.chatId
                ? {
                    ...chat,
                    messages: chat.messages
                      ?.filter((m: ChatMessage) => m.id !== data.id)
                      .map(m =>
                        m.parentMessageId === data.id ? { ...m, parentMessage: data } : m,
                      ),
                  }
                : chat,
            )
            .sort(
              (cA, cB) =>
                new Date(cB.messages?.[0]?.createdAt || cB.createdAt).getTime() -
                new Date(cA.messages?.[0]?.createdAt || cA.createdAt).getTime(),
            ),
        );

        setRemoveModalVisibleForMessage(null);
      },
    });
  };

  const handleVisibilityChange = useCallback(
    (messageId: string) => {
      const message = chatMessages.find(message => message.id === messageId);

      if (
        message &&
        authenticatedUser &&
        message.status !== ChatMessageStatuses.Read &&
        message.authorId !== authenticatedUser.id
      ) {
        socket?.emit(SocketEvents.ReadMessage, { authenticatedUser, message });

        setChatMessagesInStorage(
          chatMessages.map(m =>
            m.id === message.id ? { ...m, status: ChatMessageStatuses.Read } : m,
          ),
        );
        setChatListInStorage(
          chatList.map(chat =>
            chat.id === message.chatId
              ? { ...chat, totalUnreadMessages: chat.totalUnreadMessages - 1 }
              : chat,
          ),
        );
      }
    },
    [authenticatedUser, chatMessages, socket],
  );

  const observeMessages = useCallback(
    (node: HTMLDivElement | null) => {
      if (node) {
        if (observerRef.current) {
          observerRef.current.disconnect();
        }

        const options = {
          root: messagesContainerRef.current,
          threshold: 0.001,
        };

        const observer = new IntersectionObserver(entries => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              const messageId = entry.target.getAttribute('data-id');

              if (messageId) {
                handleVisibilityChange(messageId);
              }
            }
          });
        }, options);

        observerRef.current = observer;

        node.querySelectorAll<HTMLDivElement>('[data-id]').forEach(messageNode => {
          observer.observe(messageNode);
        });
      }
    },
    [updateChatMessage, chatMessages, authenticatedUser],
  );

  useEffect(() => {
    observeMessages(messagesContainerRef.current);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [observeMessages]);

  useEffect(() => {
    if (socket) {
      // Clean up previous listeners to avoid duplicates
      socket.off(SocketEvents.ReceiveCreatedMessage);
      socket.off(SocketEvents.ReceivePinnedMessage);
      socket.off(SocketEvents.ReceiveEditedMessage);
      socket.off(SocketEvents.ReceiveRemovedMessage);

      // Set up new listeners with latest state
      socket.on(SocketEvents.ReceiveCreatedMessage, payload =>
        handleSocketReceiveCreatedMessage(payload),
      );
      socket.on(SocketEvents.ReceivePinnedMessage, payload =>
        handleSocketReceivePinnedMessage(payload),
      );
      socket.on(SocketEvents.ReceiveEditedMessage, payload =>
        handleSocketReceiveUpdatedMessage(payload),
      );
      socket.on(SocketEvents.ReceiveRemovedMessage, payload =>
        handleSocketReceiveRemovedMessage(payload),
      );
    }

    return () => {
      if (socket) {
        socket.off(SocketEvents.ReceiveCreatedMessage);
        socket.off(SocketEvents.ReceivePinnedMessage);
        socket.off(SocketEvents.ReceiveEditedMessage);
        socket.off(SocketEvents.ReceiveRemovedMessage);
      }
    };
  }, [chatMessages, chatList, socket, authenticatedUser, chat, setChatMessagesInStorage]);

  useEffect(() => {
    if (!isPageLoaded) {
      return setIsPageLoaded(true);
    }

    if (chat && isPageLoaded) {
      fetchAllChatMessages(
        {
          where: { chatId: chat.id, removedAt: { equals: 'null' } },
          orderBy: {
            createdAt: 'desc',
          },
          include: {
            attachments: true,
            parentMessage: {
              include: {
                author: {
                  include: {
                    userProfile: { select: { firstName: true, lastName: true, image: true } },
                  },
                },
              },
            },
            author: {
              include: {
                userProfile: { select: { firstName: true, lastName: true, image: true } },
              },
            },
          },
        },
        {
          onSuccess: data => {
            setPinnedMessagesState({
              ...pinnedMessagesState,
              messages: data
                .filter((message: ChatMessage) => message.isPinned)
                .sort(
                  (messageA: ChatMessage, messageB: ChatMessage) =>
                    new Date(messageB.createdAt).getTime() - new Date(messageA.createdAt).getTime(),
                ),
            });
          },
        },
      ).catch(console.error);
    }
  }, [chat, isPageLoaded]);

  const handleSocketReceiveCreatedMessage = (payload: { message: ChatMessage }): void => {
    const { message } = payload;

    // Only add the message if:
    // 1. It wasn't created by the current user
    // 2. It's for the current chat
    // 3. It doesn't already exist in the messages list
    if (message.authorId !== authenticatedUser?.id) {
      if (chat?.id === message.chatId && !chatMessages.some(m => m.id === message.id)) {
        setChatMessagesInStorage([
          message,
          ...chatMessages.map(m =>
            m.id === message.parentMessageId
              ? { ...m, replies: [message, ...(m.replies || [])] }
              : m,
          ),
        ]);
      }

      if (!chatList.find(chat => chat.id === message.chatId) && message.chat) {
        setChatListInStorage([
          { ...message.chat, messages: [message], totalUnreadMessages: 1 },
          ...chatList,
        ]);
      } else {
        setChatListInStorage(
          chatList
            .map(chat =>
              chat.id === message.chatId
                ? {
                    ...chat,
                    messages: [message, ...chat.messages],
                    totalUnreadMessages: chat.totalUnreadMessages + 1,
                  }
                : chat,
            )
            .sort(
              (cA, cB) =>
                new Date(cB.messages?.[0]?.createdAt || cB.createdAt).getTime() -
                new Date(cA.messages?.[0]?.createdAt || cA.createdAt).getTime(),
            ),
        );
      }

      if (messagesContainerRef.current && messagesContainerRef.current.scrollTop > -200) {
        messagesContainerRef.current.scrollTop = 0;
      }
    }
  };

  const handleSocketReceivePinnedMessage = (payload: { message: ChatMessage }): void => {
    const { message } = payload;

    if (message.chatId === chat?.id) {
      setChatMessagesInStorage(chatMessages.map(m => (m.id === message.id ? message : m)));
      setPinnedMessagesState(prevState => ({
        ...prevState,
        messages: (message.isPinned
          ? [...prevState.messages, message]
          : prevState.messages.filter(m => m.id !== message.id)
        ).sort(
          (messageA, messageB) =>
            new Date(messageB.createdAt).getTime() - new Date(messageA.createdAt).getTime(),
        ),
      }));
      setPinnedMessagesState(prevState => ({
        ...prevState,
        selected:
          prevState.messages.length === 1 ? 0 : prevState.selected % prevState.messages.length,
      }));
    }
  };

  const handleSocketReceiveUpdatedMessage = (payload: { message: ChatMessage }): void => {
    const { message } = payload;

    if (message.chatId === chat?.id) {
      setChatMessagesInStorage(
        chatMessages.map(m =>
          m.id === message.id
            ? message
            : message?.replies?.find((r: ChatMessage) => r.id === m.id)
            ? { ...m, parentMessage: message }
            : m,
        ),
      );
    }
  };

  const handleSocketReceiveRemovedMessage = (payload: { message: ChatMessage }): void => {
    const { message } = payload;

    if (message.authorId !== authenticatedUser?.id && message.chatId === chat?.id) {
      setChatMessagesInStorage(
        chatMessages
          .filter(m => m.id !== message.id)
          .map(m => (m.parentMessageId === message.id ? { ...m, parentMessage: message } : m)),
      );
    }
  };

  return (
    chat && (
      <>
        {removeMessageModalVisibleForMessage &&
          createPortal(
            <Modal
              title={'Remove message'}
              onClose={() => setRemoveModalVisibleForMessage(null)}
              className='max-w-xl'
            >
              <div className='px-5 py-4'>
                <p className='text-mono'>
                  Are you sure you want to delete selected message? This action is irreversible.
                </p>
                <div className='mt-4 flex gap-4'>
                  <button
                    type='button'
                    className='cursor-pointer inline-flex text-center justify-center items-center bg-red-500 hover:bg-red-400 text-primary-100 rounded-lg transition-all duration-300 py-1 px-5 font-sans font-medium'
                    onClick={() => handleRemoveMessage(removeMessageModalVisibleForMessage)}
                  >
                    Delete
                  </button>
                  <button
                    type='button'
                    className='cursor-pointer inline-flex text-center justify-center items-center text-primary-700 border-2 border-primary-900 hover:text-primary-900 hover:bg-primary-100 rounded-lg transition-all duration-300 py-1 px-5 font-sans font-medium'
                    onClick={() => setRemoveModalVisibleForMessage(null)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </Modal>,
            document.querySelector('body')!,
          )}
        <div {...props} className={`flex flex-col flex-1 ${props.className}`}>
          <div className='flex bg-white p-3 border-b border-primary-200 gap-3'>
            <div className='flex'>
              <div className='rounded-md overflow-hidden w-[38px]'>
                <img
                  src={resolveImageUrl(chat.image || '')}
                  alt={`Image of chat with id ${chat.id}`}
                  className='object-cover aspect-square'
                  onError={event => {
                    event.currentTarget.src = resolveImage(null, 'post-image-placeholder');
                    event.currentTarget.onerror = null;
                    event.currentTarget.classList.add('scale-150');
                  }}
                />
              </div>
            </div>
            <div className='flex flex-1'>
              <div className='flex flex-col'>
                <h3 className='text-sm font-bold text-primary-600'>{chat.name || chat.id}</h3>
                <span className='text-xs text-primary-600'>
                  {numberFormatter.format(Number(chat._count.usersToChats || 0))}{' '}
                  {Number(chat._count.usersToChats || 0) === 1 ? 'member' : 'members'}
                </span>
              </div>
            </div>
            <div className='flex'>
              <Link
                type='button'
                className='inline-flex items-center gap-0.5 cursor-pointer text-primary-600 font-medium text-sm px-3 hover:text-primary-800 transition-all duration-300'
                href={'/chats'}
                onClick={() => setSelectedChatInStorage(null)}
              >
                <ChevronLeft className='size-4' />
                Back
              </Link>
            </div>
          </div>
          {pinnedMessagesState.messages.length > 0 && (
            <div
              className='flex items-center justify-between px-3 py-1 border-b border-primary-200 bg-white gap-3 cursor-pointer hover:bg-primary-50 transition-all duration-300'
              onClick={() => {
                if (messagesContainerRef.current) {
                  const messageElement = messagesContainerRef.current.querySelector(
                    `.message[data-id="${
                      pinnedMessagesState.messages[
                        (pinnedMessagesState.selected + 1) % pinnedMessagesState.messages.length
                      ].id
                    }"]`,
                  ) as HTMLElement | null;

                  if (messageElement) {
                    messagesContainerRef.current.scrollTop = messageElement.offsetTop;
                  }
                }
                setPinnedMessagesState({
                  ...pinnedMessagesState,
                  selected:
                    (pinnedMessagesState.selected + 1) % pinnedMessagesState.messages.length,
                });
              }}
            >
              <div className='flex gap-3 items-center'>
                <Pin className='size-5 text-stone-600' />
                <div className='flex flex-col'>
                  <h6 className='font-semibold text-xs mb-0.5 text-stone-700'>
                    Pinned message #{pinnedMessagesState.selected + 1} of{' '}
                    {pinnedMessagesState.messages.length}
                  </h6>
                  <span
                    className='text-xs text-stone-600 whitespace-pre-wrap'
                    style={{
                      display: '-webkit-box',
                      WebkitLineClamp: 1,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {pinnedMessagesState.messages[pinnedMessagesState.selected].content}
                  </span>
                </div>
              </div>
            </div>
          )}
          <div className='flex flex-col flex-1 relative'>
            <div className='absolute top-0 left-0 right-0 bottom-0'>
              <div
                ref={messagesContainerRef}
                className='h-full overflow-y-auto flex flex-col-reverse gap-1 p-5'
              >
                {chatMessages.map((message, index) => (
                  <div
                    className={`flex flex-col message ${
                      message.authorId !== chatMessages[index + 1]?.authorId &&
                      new Date(message.createdAt).getDate() ===
                        new Date(chatMessages[index + 1]?.createdAt).getDate()
                        ? 'mt-5'
                        : ''
                    }`}
                    key={message.id}
                    data-id={message.id}
                  >
                    {new Date(message.createdAt).getDate() !==
                      new Date(chatMessages[index + 1]?.createdAt).getDate() && (
                      <div className='flex items-center justify-center my-5 border-b border-primary-100'>
                        <span className='translate-y-1/2 rounded-full text-[12px] font-medium text-primary-400 px-3 py-0.5 bg-primary-50'>
                          {new Intl.DateTimeFormat('en-US', { dateStyle: 'long' }).format(
                            new Date(message.createdAt),
                          )}
                        </span>
                      </div>
                    )}
                    <div
                      className={`flex items-end gap-2 w-full ${
                        message.authorId === authenticatedUser?.id ? 'flex-row-reverse' : ''
                      }`}
                    >
                      {message.authorId !== chatMessages[index - 1]?.authorId ||
                      new Date(message.createdAt).getDate() !==
                        new Date(chatMessages[index - 1]?.createdAt).getDate() ? (
                        <div className='flex aspect-square'>
                          {message.author?.image ? (
                            <div className='rounded-full overflow-hidden w-[32px]'>
                              <img
                                src={resolveImageUrl(message.author?.image || '')}
                                alt={`Image of user with id ${message.authorId}`}
                                className='object-cover aspect-square'
                                onError={event => {
                                  event.currentTarget.src = resolveImage(
                                    null,
                                    'post-image-placeholder',
                                  );
                                  event.currentTarget.onerror = null;
                                  event.currentTarget.classList.add('scale-150');
                                }}
                              />
                            </div>
                          ) : (
                            <span className='inline-flex items-center justify-center bg-primary-100 w-[32px] rounded-full aspect-square'>
                              <User className='size-4' />
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className='opacity-0 invisible inline-flex items-center justify-center bg-transparent w-[32px] aspect-square'>
                          <User className='size-4' />
                        </span>
                      )}
                      <div
                        className={`flex relative p-2 max-w-xs text-sm gap-2 cursor-default ${
                          message.authorId === authenticatedUser?.id
                            ? `bg-primary-900 text-primary-100 rounded-tl-lg rounded-bl-lg rounded-br-md ${
                                message.authorId !== chatMessages[index + 1]?.authorId
                                  ? 'rounded-tr-lg'
                                  : 'rounded-tr-md'
                              }`
                            : `bg-primary-100 rounded-tr-lg rounded-br-lg rounded-bl-md ${
                                message.authorId !== chatMessages[index + 1]?.authorId
                                  ? 'rounded-tl-lg'
                                  : 'rounded-tl-md'
                              }`
                        }`}
                        onContextMenu={event => {
                          event.preventDefault();
                          setContextMenuVisibleForMessage({
                            messageId: message.id,
                            x: event.clientX,
                            y: event.clientY,
                          });
                        }}
                      >
                        {contextMenuVisibleForMessage?.messageId === message.id && (
                          <div
                            ref={messageContextMenuRef}
                            className='flex flex-col bg-white shadow-[0_0_15px_-7px_silver] min-w-[100px] rounded-md fixed -mt-1.5 z-10 p-1 text-primary-900 text-xs'
                            style={{
                              left: contextMenuVisibleForMessage.x,
                              top: contextMenuVisibleForMessage.y,
                            }}
                          >
                            <div className='flex flex-col gap-0.5'>
                              {message.authorId === authenticatedUser?.id && (
                                <>
                                  <span
                                    className='px-2 py-1 inline-flex items-center rounded-md hover:bg-primary-100 transition-all duration-300 cursor-pointer font-medium gap-2'
                                    onClick={() => {
                                      setRepliedMessage(null);
                                      setEditedMessage(message);
                                      if (textareaRef.current) {
                                        textareaRef.current.focus();
                                        textareaRef.current.value = message.content;
                                        setContextMenuVisibleForMessage(null);
                                      }
                                    }}
                                  >
                                    <Pencil className='size-3' />
                                    <span>Edit</span>
                                  </span>
                                  <span
                                    className='px-2 py-1 inline-flex items-center rounded-md hover:bg-primary-100 transition-all duration-300 cursor-pointer font-medium gap-2'
                                    onClick={() => setRemoveModalVisibleForMessage(message)}
                                  >
                                    <Trash2 className='size-3' />
                                    <span>Remove</span>
                                  </span>
                                </>
                              )}
                              <span
                                className='px-2 py-1 inline-flex items-center rounded-md hover:bg-primary-100 transition-all duration-300 cursor-pointer font-medium gap-2'
                                onClick={() => {
                                  navigator.clipboard.writeText(message.content);
                                  setContextMenuVisibleForMessage(null);
                                }}
                              >
                                <Copy className='size-3 text-primary-600' />
                                <span>Copy</span>
                              </span>
                              <span
                                className='px-2 py-1 inline-flex items-center rounded-md hover:bg-primary-100 transition-all duration-300 cursor-pointer font-medium gap-2'
                                onClick={() => {
                                  handlePinMessage(message);
                                  setContextMenuVisibleForMessage(null);
                                }}
                              >
                                {!message.isPinned ? (
                                  <>
                                    <Pin className='size-3 text-primary-600' />
                                    <span>Pin</span>
                                  </>
                                ) : (
                                  <>
                                    <PinOff className='size-3 text-primary-600' />
                                    <span>Unpin</span>
                                  </>
                                )}
                              </span>
                              <span
                                className='px-2 py-1 inline-flex items-center rounded-md hover:bg-primary-100 transition-all duration-300 cursor-pointer font-medium gap-2'
                                onClick={() => {
                                  setEditedMessage(null);
                                  setRepliedMessage(message);
                                  if (textareaRef.current) {
                                    textareaRef.current.focus();
                                    setContextMenuVisibleForMessage(null);
                                  }
                                }}
                              >
                                <Reply className='size-3' />
                                <span>Reply</span>
                              </span>
                            </div>
                          </div>
                        )}
                        <div className='whitespace-pre-wrap flex flex-col'>
                          {message.content}

                          {/* Display image gallery for messages with attachments */}
                          {message.attachments && message.attachments.length > 0 && (
                            <div className='mt-2'>
                              <MessageImageGallery
                                attachments={message.attachments}
                                isPending={false}
                              />
                            </div>
                          )}

                          {message.parentMessage && (
                            <span
                              className={`flex flex-col whitespace-pre-wrap relative text-xs mt-1 p-1 rounded w-full border-l-4 cursor-pointer ${
                                message.authorId === authenticatedUser?.id
                                  ? `bg-primary-600 border-primary-700`
                                  : `bg-primary-300 border-primary-400`
                              }`}
                              onClick={() => {
                                if (messagesContainerRef.current) {
                                  const messageNode = messagesContainerRef.current.querySelector(
                                    `.message[data-id="${message.parentMessageId}"]`,
                                  ) as HTMLElement | null;

                                  if (messageNode) {
                                    messagesContainerRef.current.scrollTop = messageNode.offsetTop;
                                  }
                                }
                              }}
                            >
                              <span className='relative'>
                                <span className='text-transparent'>.</span>
                                <span className='absolute left-0 right-0'>
                                  <h6 className='font-medium mb-1 whitespace-nowrap truncate'>
                                    {message.parentMessage?.author?.firstName &&
                                      message.parentMessage?.author?.lastName &&
                                      `${message.parentMessage.author.firstName} ${message.parentMessage.author.lastName}`}
                                  </h6>
                                </span>
                              </span>
                              {message.parentMessage?.removedAt !== null ? (
                                <span className='italic'>Deleted message</span>
                              ) : (
                                <span>{message.parentMessage?.content}</span>
                              )}

                              {/* Display thumbnails for parent message attachments */}
                              {message.parentMessage?.attachments &&
                                message.parentMessage.attachments.length > 0 && (
                                  <div className='mt-1 flex'>
                                    <img
                                      src={getChatAttachmentUrl(
                                        message.parentMessage.attachments[0],
                                      )}
                                      alt=''
                                      className='w-8 h-8 object-cover rounded'
                                    />
                                    {message.parentMessage.attachments.length > 1 && (
                                      <span className='ml-1 text-xs flex items-center'>
                                        +{message.parentMessage.attachments.length - 1} more
                                      </span>
                                    )}
                                  </div>
                                )}
                            </span>
                          )}
                        </div>
                        <div className='flex flex-col justify-between items-end'>
                          <span className='text-[10px] leading-4 whitespace-nowrap'>
                            {new Intl.DateTimeFormat('en-US', { timeStyle: 'short' }).format(
                              new Date(message.createdAt),
                            )}
                          </span>
                          <div className='inline-flex gap-1 items-center'>
                            {message.updatedAt !== null &&
                              new Date(message.updatedAt).getTime() !==
                                new Date(message.createdAt).getTime() && (
                                <span className='text-[11px] font-medium'>edited</span>
                              )}
                            {message.authorId === authenticatedUser?.id && (
                              <span className='text-primary-100'>
                                <span className='flex'>
                                  <Check className='size-3.5' />
                                </span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className='flex border-t border-primary-200 bg-white'>
            <form
              className='flex flex-col rounded-b-lg w-full'
              onSubmit={handleSubmit}
              ref={sendMessageFormRef}
            >
              {(editedMessage || repliedMessage) && (
                <div
                  className='flex items-center justify-between px-3 py-1 border-b border-primary-200 bg-white gap-3 cursor-pointer hover:bg-primary-50 transition-all duration-300'
                  onClick={() => {
                    if (messagesContainerRef.current) {
                      const messageNode = messagesContainerRef.current.querySelector(
                        `.message[data-id="${
                          editedMessage ? editedMessage.id : repliedMessage ? repliedMessage.id : ''
                        }"]`,
                      ) as HTMLElement | null;

                      if (messageNode) {
                        messagesContainerRef.current.scrollTop = messageNode.offsetTop;
                      }
                    }
                  }}
                >
                  <div className='flex gap-3 items-center'>
                    {editedMessage ? <Pencil className='size-4' /> : <Reply className='size-4' />}
                    <div className='flex flex-col'>
                      <h6 className='font-semibold text-xs mb-0.5 text-primary-700'>
                        {editedMessage
                          ? 'Edit message'
                          : `Reply to ${
                              repliedMessage?.author?.firstName &&
                              repliedMessage?.author?.lastName &&
                              `${repliedMessage?.author?.firstName} ${repliedMessage?.author?.lastName}`
                            }`}
                      </h6>
                      <span
                        className='text-xs text-primary-600 whitespace-pre-wrap'
                        style={{
                          display: '-webkit-box',
                          WebkitLineClamp: 1,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                      >
                        {editedMessage
                          ? editedMessage.content
                          : repliedMessage
                          ? repliedMessage.content
                          : ''}
                      </span>
                    </div>
                  </div>
                  <div className='flex'>
                    <button
                      type='button'
                      className='p-1 hover:bg-primary-100 cursor-pointer rounded-md transition-all duration-300'
                      onClick={() => {
                        setEditedMessage(null);
                        setRepliedMessage(null);
                        if (textareaRef.current) {
                          textareaRef.current.value = '';
                        }
                      }}
                    >
                      <X className='size-4 text-primary-600' />
                    </button>
                  </div>
                </div>
              )}

              {/* Display attachments preview */}
              {attachments.length > 0 && (
                <div className='flex items-center p-2 gap-2 overflow-x-auto border-b border-primary-200 bg-white'>
                  {attachments.map((file, index) => (
                    <div key={index} className='relative'>
                      <div className='w-16 h-16 rounded-lg overflow-hidden'>
                        <img
                          src={URL.createObjectURL(file)}
                          alt={`Attachment ${index}`}
                          className='w-full h-full object-cover'
                        />
                      </div>
                      <button
                        type='button'
                        className='absolute -top-2 -right-2 bg-primary-200 rounded-full p-0.5 text-primary-600 hover:bg-primary-300'
                        onClick={() => removeAttachment(index)}
                      >
                        <X className='size-3' />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className='flex w-full items-center'>
                <button
                  type='button'
                  className='p-3 cursor-pointer text-primary-600'
                  onClick={handleAttachmentClick}
                >
                  <Paperclip className='size-5' />
                </button>
                <textarea
                  ref={textareaRef}
                  rows={1}
                  className='resize-none my-3 max-h-[100px] overflow-y-auto outline-none text-primary-600 placeholder:text-primary-400 !ring-0 !border-none w-full whitespace-pre-wrap'
                  placeholder='Write a message...'
                  onInput={handleInput}
                  onKeyDown={handleTextareaKeyDown}
                  autoFocus
                />
                <button type='submit' className='p-3 cursor-pointer text-primary-600'>
                  <SendHorizonal className='size-5' />
                </button>
              </div>
            </form>

            {/* Hidden file input */}
            <input
              type='file'
              ref={fileInputRef}
              className='hidden'
              onChange={handleFileChange}
              accept='image/*'
              multiple
            />
          </div>
        </div>
      </>
    )
  );
};

export default Chat;
