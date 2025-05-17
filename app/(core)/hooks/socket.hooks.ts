import {
  connectSocketAtom,
  socketAtom,
  socketStorageErrorsAtom,
} from '@/app/(core)/store/socket/socket.storage';
import { useAtom } from 'jotai';

export const useSocket = () => {
  const [socket, setSocketInStorage] = useAtom(socketAtom);
  const [_socket, connectSocket] = useAtom(connectSocketAtom);
  const [errors, setSocketErrorsInStorage] = useAtom(socketStorageErrorsAtom);

  return {
    socket,
    errors,
    connectSocket,
    setSocketErrorsInStorage,
    setSocketInStorage,
  };
};
