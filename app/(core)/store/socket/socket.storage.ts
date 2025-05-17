import { ActionCreatorOptions } from '@/app/(core)/store/types/app.types';
import { User } from '@/app/(core)/store/types/user.types';
import { SocketStorageErrors } from '@/app/(core)/types/socket/socket.types';
import { createSocketInstance } from '@/app/(core)/utils/socket';
import { atom } from 'jotai';
import { Socket } from 'socket.io-client';

export const socketAtom = atom<Socket | null>(null);

export const socketStorageErrorsAtom = atom<SocketStorageErrors>({
  connectSocket: null,
});

export const connectSocketAtom = atom(
  get => get(socketAtom),
  async (get, set, userId: User['id'], options?: ActionCreatorOptions): Promise<void> => {
    set(socketStorageErrorsAtom, { ...get(socketStorageErrorsAtom), connectSocket: null });

    const socket = createSocketInstance(userId);

    socket.on('connect', () => {
      options?.onSuccess?.(socket);
      set(socketAtom, socket);
    });

    socket.on('connect_error', error => {
      options?.onError?.(error);
      set(socketStorageErrorsAtom, {
        ...get(socketStorageErrorsAtom),
        connectSocket: 'Cannot connect the socket user',
      });
    });
  },
);
