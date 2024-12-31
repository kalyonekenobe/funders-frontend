import { NotificationAction } from '@/app/(core)/store/actions/notification.action';
import { PayloadAction } from '@/app/(core)/store/types/app.types';
import { Notification } from '@/app/(core)/store/types/notification.types';

export interface NotificationReducerState {
  notifications: Notification[];
}

export const initialState: NotificationReducerState = {
  notifications: [],
};

export default (state = initialState, action: PayloadAction): NotificationReducerState => {
  switch (action.type) {
    case NotificationAction.Create:
      return { notifications: [...state.notifications, action.payload.notification] };
    case NotificationAction.Remove:
      return {
        notifications: state.notifications.filter(
          notification => notification.id !== action.payload.id,
        ),
      };
    case NotificationAction.Deactivate:
      return {
        notifications: state.notifications.map(notification =>
          notification.id === action.payload.id
            ? { ...notification, isActive: false }
            : notification,
        ),
      };
    default:
      return state;
  }
};
