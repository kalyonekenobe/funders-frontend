'use client';

import { Notification } from '@/app/(core)/store/types/notification.types';
import { createContext } from 'react';

export interface NotificationContextValueType {
  notifications: Notification[];
  createNotification: (
    notification: Omit<Notification, 'id' | 'isActive'>,
    duration?: number,
  ) => Notification['id'];
  deactivateNotification: (id: Notification['id'], duration?: number) => void;
}

const NotificationContext = createContext<NotificationContextValueType>({
  notifications: [],
  createNotification: () => '',
  deactivateNotification: () => {},
});

export default NotificationContext;
