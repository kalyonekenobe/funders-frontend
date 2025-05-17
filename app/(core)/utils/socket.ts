import { io } from 'socket.io-client';

export const createSocketInstance = (userId: string) =>
  io(`${process.env.NEXT_PUBLIC_BACKEND_URL}/chats`, { query: { userId }, withCredentials: true });
