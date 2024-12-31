import NotificationContext from '@/app/(core)/contexts/NotificationContext';
import { useContext } from 'react';

const useNotification = () => {
  const context = useContext(NotificationContext);

  if (!context) {
    throw new Error('useNotification hook must be used within NotificationContext');
  }

  return context;
};

export default useNotification;
