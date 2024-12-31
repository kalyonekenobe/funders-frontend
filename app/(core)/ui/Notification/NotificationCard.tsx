'use client';

import useNotification from '@/app/(core)/hooks/notifications.hooks';
import { Notification } from '@/app/(core)/store/types/notification.types';
import {
  CloseIcon,
  ErrorIcon,
  InfoIcon,
  SuccessIcon,
  WarningIcon,
} from '@/app/(core)/ui/Icons/Icons';
import { NotificationType } from '@/app/(core)/utils/notifications.utils';
import { FC, useMemo } from 'react';

export interface NotificationCardProps {
  notification: Notification;
}

const NotificationCard: FC<NotificationCardProps> = ({ notification }) => {
  const { deactivateNotification } = useNotification();

  const styles = useMemo(() => {
    switch (notification.type) {
      case NotificationType.Success:
        return 'border-l-[0.75rem] border-emerald-500';
      case NotificationType.Info:
        return 'border-l-[0.75rem] border-blue-500';
      case NotificationType.Warning:
        return 'border-l-[0.75rem] border-yellow-500';
      case NotificationType.Error:
        return 'border-l-[0.75rem] border-red-500';
      default:
        return 'border-l-[0.75rem] border-slate-200';
    }
  }, [notification]);

  return (
    <div className={`flex bg-white rounded-xl shadow-xl w-full px-3 py-2 min-h-[75px] ${styles}`}>
      <div className='flex items-center justify-center'>
        {notification.type === NotificationType.Success && (
          <SuccessIcon className='size-10 text-emerald-500' />
        )}
        {notification.type === NotificationType.Info && (
          <InfoIcon className='size-10 text-blue-500' />
        )}
        {notification.type === NotificationType.Warning && (
          <WarningIcon className='size-10 text-yellow-500' />
        )}
        {notification.type === NotificationType.Error && (
          <ErrorIcon className='size-10 text-red-500' />
        )}
      </div>
      <div className='flex flex-col ms-3 flex-1'>
        <h3 className='font-semibold text text-gray-700 mb-0.5'>{notification.type}</h3>
        <span className='text-sm'>{notification.message}</span>
      </div>
      <div className='flex justify-end py-1'>
        <CloseIcon
          className='size-5 cursor-pointer'
          onClick={() => deactivateNotification(notification.id)}
        />
      </div>
    </div>
  );
};

export default NotificationCard;
