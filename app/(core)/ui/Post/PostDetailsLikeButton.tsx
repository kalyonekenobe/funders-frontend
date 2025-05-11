'use client';

import { addPostReaction, removePostReaction } from '@/app/(core)/actions/post.actions';
import useNotification from '@/app/(core)/hooks/notifications.hooks';
import { AuthInfo } from '@/app/(core)/store/types/app.types';
import { Post } from '@/app/(core)/store/types/post.types';
import { UserReactionTypeEnum } from '@/app/(core)/store/types/user-reaction-type.types';
import { User } from '@/app/(core)/store/types/user.types';
import { LikeIcon } from '@/app/(core)/ui/Icons/Icons';
import Modal from '@/app/(core)/ui/Modal/Modal';
import UserListItem from '@/app/(core)/ui/User/UserListItem';
import { NotificationType } from '@/app/(core)/utils/notifications.utils';
import { FC, HTMLAttributes, useState } from 'react';
import { createPortal } from 'react-dom';

export interface PostDetailsLikeButtonProps extends HTMLAttributes<HTMLDivElement> {
  post: Post;
  authenticatedUser: User;
}

export interface PostDetailsLikeButtonState {
  usersThatLikedPost: User[];
  isLiked: boolean;
  isUserThatLikedPostListVisible: boolean;
}

const initialState: PostDetailsLikeButtonState = {
  usersThatLikedPost: [],
  isLiked: false,
  isUserThatLikedPostListVisible: false,
};

const PostDetailsLikeButton: FC<PostDetailsLikeButtonProps> = ({
  post,
  authenticatedUser,
  ...props
}) => {
  const [state, setState] = useState({
    ...initialState,
    usersThatLikedPost: (post.reactions || []).map(reaction => reaction.user!),
    isLiked: Boolean(
      (post.reactions || []).find(reaction => reaction.userId === authenticatedUser?.id),
    ),
  });
  const { createNotification } = useNotification();

  const handleLikeClick = async () => {
    if (!state.isLiked) {
      const response = await addPostReaction(post.id, UserReactionTypeEnum.Like);

      if (!response || response.error) {
        createNotification({
          type: NotificationType.Error,
          message: response.error || 'Cannot add reaction to the post',
        });
      } else {
        setState({
          ...state,
          isLiked: true,
          usersThatLikedPost: [
            { ...authenticatedUser, id: authenticatedUser.id } as any,
            ...state.usersThatLikedPost,
          ],
        });
      }
    } else {
      const response = await removePostReaction(post.id);

      if (!response || response.error) {
        createNotification({
          type: NotificationType.Error,
          message: response.error || 'Cannot remove reaction from the post',
        });
      } else {
        setState({
          ...state,
          isLiked: false,
          usersThatLikedPost: state.usersThatLikedPost.filter(
            user => user.id !== authenticatedUser.id,
          ),
        });
      }
    }
  };

  return (
    <>
      {state.isUserThatLikedPostListVisible &&
        createPortal(
          <Modal
            className='max-w-xl'
            title={`Likes`}
            buttons={[
              {
                type: 'close',
                name: 'Close',
                action: () => setState({ ...state, isUserThatLikedPostListVisible: false }),
              },
            ]}
          >
            <div className='flex flex-col gap-1 p-3'>
              {state.usersThatLikedPost.map(user => (
                <UserListItem
                  key={user.id}
                  id={user.id}
                  firstName={user.firstName || ''}
                  lastName={user.lastName || ''}
                  image={user.image || null}
                  className='inline-flex items-center rounded p-1 hover:bg-slate-100 transition-[0.3s_ease]'
                />
              ))}
              {!state.usersThatLikedPost.length && (
                <div className='min-h-[50px] flex items-center justify-center rounded border-[3px] border-dashed'>
                  <h3 className='text-gray-400 font-semibold text-center'>
                    Nobody has liked this post yet
                  </h3>
                </div>
              )}
            </div>
          </Modal>,
          document.querySelector('body')!,
        )}
      <footer {...props}>
        <div className='flex gap-3 mt-5'>
          <span
            className='inline-flex text-lg items-center text-gray-600 cursor-pointer hover:text-gray-800 transition-[0.3s_ease]'
            onClick={() => setState({ ...state, isUserThatLikedPostListVisible: true })}
          >
            {state.usersThatLikedPost.length} likes
          </span>
          <button
            type='button'
            className={`rounded inline-flex justify-center items-center text-center font-medium p-2 hover:bg-slate-100 transition-[0.3s_ease] ${
              state.isLiked ? 'text-red-600' : 'text-gray-500'
            }`}
            onClick={() => handleLikeClick()}
          >
            <LikeIcon className='size-5 me-2 stroke-2' solid={state.isLiked} />
            {state.isLiked ? 'You liked' : 'Like'}
          </button>
        </div>
      </footer>
    </>
  );
};

export default PostDetailsLikeButton;
