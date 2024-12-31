'use client';

import NotificationContext from '@/app/(core)/contexts/NotificationContext';
import { NotificationAction } from '@/app/(core)/store/actions/notification.action';
import notificationReducer, {
  initialState,
} from '@/app/(core)/store/reducers/notification.reducer';
import { Notification } from '@/app/(core)/store/types/notification.types';
import NotificationList from '@/app/(core)/ui/Notification/NotificationList';
import { FC, ReactNode, useReducer } from 'react';
import { v4 as uuid } from 'uuid';

export interface NotificationProviderProps {
  children: ReactNode | ReactNode[];
}

const NotificationProvider: FC<NotificationProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(notificationReducer, initialState);

  const createNotification = (
    notification: Omit<Notification, 'id' | 'isActive'>,
    duration: number | undefined = 5000,
  ) => {
    const id = uuid();

    dispatch({
      type: NotificationAction.Create,
      payload: {
        notification: {
          ...notification,
          isActive: true,
          id,
        },
      },
    });

    setTimeout(() => {
      deactivateNotification(id);
    }, duration);

    return id;
  };

  const deactivateNotification = (id: Notification['id'], duration: number | undefined = 1000) => {
    dispatch({ type: NotificationAction.Deactivate, payload: { id } });

    setTimeout(() => {
      removeNotification(id);
    }, duration);
  };

  const removeNotification = (id: Notification['id']) => {
    dispatch({ type: NotificationAction.Remove, payload: { id } });
  };

  return (
    <NotificationContext.Provider
      value={{ notifications: state.notifications, createNotification, deactivateNotification }}
    >
      <div className='w-full max-w-md fixed right-1/2 translate-x-1/2 md:translate-x-0 md:right-0 top-0 md:top-auto md:bottom-0 p-3 flex flex-col justify-end gap-3 z-[200]'>
        <NotificationList notifications={state.notifications} />
      </div>
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationProvider;
