export interface SocketStorageErrors {
  connectSocket: string | null;
}

export enum SocketEvents {
  JoinChat = 'join-chat',
  CreateMessage = 'create-message',
  EditMessage = 'edit-message',
  RemoveMessage = 'remove-message',
  PinMessage = 'pin-message',
  ReadMessages = 'read-messages',
  ReadMessage = 'read-message',
  JoinChats = 'join-chats',
  ReceiveCreatedMessage = 'receive-created-message',
  ReceiveEditedMessage = 'receive-edited-message',
  ReceiveRemovedMessage = 'receive-removed-message',
  ReceivePinnedMessage = 'receive-pinned-message',
}
