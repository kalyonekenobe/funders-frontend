'use client';

import { followUser, unfollowUser } from '@/app/(core)/actions/user.actions';
import useNotification from '@/app/(core)/hooks/notifications.hooks';
import { NotificationType } from '@/app/(core)/utils/notifications.utils';
import { ButtonHTMLAttributes, FC, ReactNode, SyntheticEvent, useState } from 'react';

export interface ToggleFollowButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  userId: string;
  followClassName: string;
  unfollowClassName: string;
  followContent: ReactNode;
  unfollowContent: ReactNode;
  isFollowed: boolean;
  updateFollowers?: (follower: boolean) => void;
}

const ToggleFollowButton: FC<ToggleFollowButtonProps> = ({
  children,
  userId,
  followClassName,
  followContent,
  unfollowClassName,
  unfollowContent,
  isFollowed,
  updateFollowers,
  ...props
}) => {
  const [isActive, setIsActive] = useState(!isFollowed);
  const { createNotification } = useNotification();

  const handleClick = async (event: SyntheticEvent) => {
    const response = isActive ? await followUser(userId) : await unfollowUser(userId);

    if (!response.error) {
      updateFollowers?.(isActive);
      setIsActive(!isActive);
    } else {
      createNotification({
        type: NotificationType.Error,
        message: response.error || 'Cannot follow this user',
      });
    }
  };

  return (
    <button
      type='button'
      onClick={handleClick}
      className={isActive ? followClassName : unfollowClassName}
      {...props}
    >
      {isActive ? followContent : unfollowContent}
      {children}
    </button>
  );
};

export default ToggleFollowButton;
