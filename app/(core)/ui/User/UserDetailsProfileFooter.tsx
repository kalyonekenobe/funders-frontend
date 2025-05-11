'use client';

import { updateUser } from '@/app/(core)/actions/user.actions';
import useNotification from '@/app/(core)/hooks/notifications.hooks';
import { AuthInfo } from '@/app/(core)/store/types/app.types';
import { Following } from '@/app/(core)/store/types/following.types';
import { UserRoleEnum } from '@/app/(core)/store/types/user-role.types';
import { User } from '@/app/(core)/store/types/user.types';
import ToggleFollowButton from '@/app/(core)/ui/Controls/ToggleFollowButton';
import {
  BoltIcon,
  EditIcon,
  FollowIcon,
  MessageIcon,
  UnfollowIcon,
} from '@/app/(core)/ui/Icons/Icons';
import Modal from '@/app/(core)/ui/Modal/Modal';
import UserListItem from '@/app/(core)/ui/User/UserListItem';
import { NotificationType } from '@/app/(core)/utils/notifications.utils';
import { ApplicationRoutes } from '@/app/(core)/utils/routes.utils';
import Link from 'next/link';
import { FC, HTMLAttributes, useState } from 'react';
import { createPortal } from 'react-dom';

export interface UserDetailsProfileFooterProps extends HTMLAttributes<HTMLDivElement> {
  user: User;
  authenticatedUser: User;
}

export interface UserDetailsProfileFooterState {
  followers: Following[];
  followings: Following[];
  isFollowed: boolean;
  isFollowersListVisible: boolean;
  isFollowingsListVisible: boolean;
  isConfirmUpgradeProfileModalVisible: boolean;
}

const initialState: UserDetailsProfileFooterState = {
  followers: [],
  followings: [],
  isFollowed: false,
  isFollowersListVisible: false,
  isFollowingsListVisible: false,
  isConfirmUpgradeProfileModalVisible: false,
};

const UserDetailsProfileFooter: FC<UserDetailsProfileFooterProps> = ({
  user,
  authenticatedUser,
  ...props
}) => {
  const [state, setState] = useState({
    ...initialState,
    isFollowed: Boolean(
      user.followers?.find((follower: Following) => {
        return follower.followerId === authenticatedUser?.id;
      }),
    ),
    followers: user.followers || [],
    followings: user.followings || [],
  });
  const { createNotification } = useNotification();

  return (
    <>
      {state.isConfirmUpgradeProfileModalVisible &&
        createPortal(
          <Modal
            className='max-w-xl'
            title={'Upgrade to a Volunteer'}
            buttons={[
              {
                type: 'accept',
                name: 'Confirm',
                variant: 'primary',
                action: async () => {
                  const formData = new FormData();
                  formData.set('id', user.id);
                  formData.set('role', UserRoleEnum.Volunteer);
                  const response = await updateUser({}, formData);

                  if (response?.errors?.nested?.length > 0 || response?.errors?.global) {
                    createNotification({
                      type: NotificationType.Error,
                      message: 'Cannot update current user to a Volunteer. Please, try again later',
                    });
                  } else {
                    createNotification({
                      type: NotificationType.Success,
                      message: 'The user was successfully updated to a Volunteer',
                    });
                  }

                  setState({ ...state, isConfirmUpgradeProfileModalVisible: false });
                },
              },
              {
                type: 'close',
                name: 'Close',
                action: () => setState({ ...state, isConfirmUpgradeProfileModalVisible: false }),
              },
            ]}
          >
            <div className='flex flex-col gap-1 p-3'>
              <p className='text-gray-500'>
                Are you sure you want to upgrade your account to a Volunteer? This action cannot be
                undone.
              </p>
            </div>
          </Modal>,
          document.querySelector('body')!,
        )}
      {state.isFollowersListVisible &&
        createPortal(
          <Modal
            className='max-w-xl'
            title={`${user.firstName} ${user.lastName}'s followers`}
            buttons={[
              {
                type: 'close',
                name: 'Close',
                action: () => setState({ ...state, isFollowersListVisible: false }),
              },
            ]}
          >
            <div className='flex flex-col gap-1 p-3'>
              {state.followers.map(follower => (
                <UserListItem
                  key={follower.followerId}
                  id={follower.followerId}
                  firstName={follower.follower?.firstName || ''}
                  lastName={follower.follower?.lastName || ''}
                  image={follower.follower?.image || null}
                  className='inline-flex items-center rounded p-1 hover:bg-slate-100 transition-[0.3s_ease]'
                />
              ))}
              {!state.followers.length && (
                <div className='min-h-[50px] flex items-center justify-center rounded border-[3px] border-dashed'>
                  <h3 className='text-gray-400 font-semibold text-center'>
                    {user.firstName} {user.lastName} does not have any followers yet
                  </h3>
                </div>
              )}
            </div>
          </Modal>,
          document.querySelector('body')!,
        )}
      {state.isFollowingsListVisible &&
        createPortal(
          <Modal
            className='max-w-xl'
            title={`${user.firstName} ${user.lastName}'s followings`}
            buttons={[
              {
                type: 'close',
                name: 'Close',
                action: () => setState({ ...state, isFollowingsListVisible: false }),
              },
            ]}
          >
            <div className='flex flex-col gap-1 p-3'>
              {state.followings.map(following => (
                <UserListItem
                  key={following.userId}
                  id={following.userId}
                  firstName={following.user?.firstName || ''}
                  lastName={following.user?.lastName || ''}
                  image={following.user?.image || null}
                  className='inline-flex items-center rounded p-1 hover:bg-slate-100 transition-[0.3s_ease]'
                />
              ))}
              {!state.followings.length && (
                <div className='min-h-[50px] flex items-center justify-center rounded border-[3px] border-dashed'>
                  <h3 className='text-gray-400 font-semibold text-center'>
                    {user.firstName} {user.lastName} does not follow any users
                  </h3>
                </div>
              )}
            </div>
          </Modal>,
          document.querySelector('body')!,
        )}
      <div {...props}>
        <div className='flex w-full gap-3'>
          <span
            className='text-gray-500 cursor-pointer hover:text-gray-700 transition-[0.3s_ease]'
            onClick={() => setState({ ...state, isFollowersListVisible: true })}
          >
            {state.followers.length} followers
          </span>
          <span
            className='text-gray-500 cursor-pointer hover:text-gray-700 transition-[0.3s_ease]'
            onClick={() => setState({ ...state, isFollowingsListVisible: true })}
          >
            {state.followings.length} followings
          </span>
        </div>
        <div className='grid grid-cols-2 gap-3 mt-3'>
          {authenticatedUser.id === user.id ? (
            <>
              <a
                href={ApplicationRoutes.ProfileEdit}
                className='inline-flex items-center justify-center text-center rounded bg-amber-500 font-medium text-white text-xs px-2 sm:text-sm sm:px-5 py-1.5 hover:bg-amber-600 transition-[0.3s_ease]'
              >
                <EditIcon className='size-4 stroke-2 me-2' />
                Edit information
              </a>
              {user.role === UserRoleEnum.User && (
                <button
                  type='button'
                  className='inline-flex items-center justify-center text-center rounded bg-violet-500 font-medium text-white text-xs px-2 sm:text-sm sm:px-5 py-1.5 hover:bg-violet-600 transition-[0.3s_ease] cursor-pointer'
                  onClick={() => setState({ ...state, isConfirmUpgradeProfileModalVisible: true })}
                >
                  <BoltIcon className='size-4 stroke-2 me-2' />
                  Upgrade to a Volunteer
                </button>
              )}
            </>
          ) : (
            <>
              <ToggleFollowButton
                followClassName='inline-flex p-1 text-center justify-center items-center rounded bg-blue-500 text-white font-medium text-sm hover:ring-2 hover:ring-blue-500 hover:ring-inset hover:text-blue-500 hover:bg-transparent transition-[0.3s_ease]'
                userId={user.id}
                unfollowClassName='inline-flex p-1 text-center justify-center items-center rounded bg-rose-500 text-white font-medium text-sm hover:ring-2 hover:ring-rose-500 hover:ring-inset hover:text-rose-500 hover:bg-transparent transition-[0.3s_ease]'
                followContent={
                  <>
                    <FollowIcon className='size-4 stroke-2 me-1.5' />
                    Follow
                  </>
                }
                unfollowContent={
                  <>
                    <UnfollowIcon className='size-4 stroke-2 me-1.5' />
                    Unfollow
                  </>
                }
                isFollowed={Boolean(
                  state.followers.find(
                    (follower: Following) => follower.followerId === authenticatedUser?.id,
                  ),
                )}
                updateFollowers={follower =>
                  setState({
                    ...state,
                    followers: follower
                      ? [
                          {
                            followerId: authenticatedUser.id,
                            userId: user.id,
                            follower: {
                              ...authenticatedUser,
                              id: authenticatedUser.id,
                            } as any,
                          },
                          ...state.followers,
                        ]
                      : state.followers.filter(
                          follower => follower.followerId !== authenticatedUser.id,
                        ),
                  })
                }
              />
              <Link
                href={''}
                className='inline-flex bg-slate-100 ring-[1px] ring-inset ring-gray-300 text-slate-600 rounded px-5 min-[425px]:px-10 py-1.5 text-center justify-center items-center font-medium text-sm hover:bg-slate-200 hover:text-slate-700 transition-[0.3s_ease]'
              >
                <MessageIcon className='size-4 stroke-2 me-1.5' />
                Message
              </Link>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default UserDetailsProfileFooter;
