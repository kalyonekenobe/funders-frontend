import { NotificationType } from '@/app/(core)/utils/notifications.utils';

export interface Notification {
  id: string;
  message: string;
  type: NotificationType;
  isActive: boolean;
}
