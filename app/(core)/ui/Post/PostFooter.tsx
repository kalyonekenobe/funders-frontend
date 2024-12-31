'use client';

import { FC, HTMLAttributes, useState } from 'react';
import Link from 'next/link';
import { createPortal } from 'react-dom';
import { Post } from '@/app/(core)/store/types/post.types';
import { AuthInfo } from '@/app/(core)/store/types/app.types';
import { User } from '@/app/(core)/store/types/user.types';
import { PostComment } from '@/app/(core)/store/types/post-comment.types';
import useNotification from '@/app/(core)/hooks/notifications.hooks';
import { addPostReaction, removePostReaction } from '@/app/(core)/actions/post.actions';
import { UserReactionTypeEnum } from '@/app/(core)/store/types/user-reaction-type.types';
import { NotificationType } from '@/app/(core)/utils/notifications.utils';
import Modal from '@/app/(core)/ui/Modal/Modal';
import UserListItem from '@/app/(core)/ui/User/UserListItem';
import { ApplicationRoutes } from '@/app/(core)/utils/routes.utils';
import { BanknotesIcon, BookIcon, LikeIcon } from '@/app/(core)/ui/Icons/Icons';
import DonatePostButton from '@/app/(core)/ui/Post/DonatePostButton';

export interface PostFooterProps extends HTMLAttributes<HTMLDivElement> {
  post: Post;
  authenticatedUser: AuthInfo;
}

export interface PostFooterState {
  usersThatLikedPost: User[];
  comments: PostComment[];
  isLiked: boolean;
  isUserThatLikedPostListVisible: boolean;
}

const initialState: PostFooterState = {
  usersThatLikedPost: [],
  comments: [],
  isLiked: false,
  isUserThatLikedPostListVisible: false,
};

const PostFooter: FC<PostFooterProps> = ({ post, authenticatedUser, ...props }) => {
  const [state, setState] = useState({
    ...initialState,
    usersThatLikedPost: (post.reactions || []).map(reaction => reaction.user!),
    isLiked: Boolean(
      (post.reactions || []).find(reaction => reaction.userId === authenticatedUser.userId),
    ),
    comments: post.comments || [],
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
            { ...authenticatedUser, id: authenticatedUser.userId } as any,
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
            user => user.id !== authenticatedUser.userId,
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
                  avatar={user.avatar || null}
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
        <div className='px-5 mb-3 flex gap-3'>
          <span
            className='inline-flex text-gray-600 cursor-pointer hover:text-gray-800 transition-[0.3s_ease]'
            onClick={() => setState({ ...state, isUserThatLikedPostListVisible: true })}
          >
            {state.usersThatLikedPost.length} likes
          </span>
          <Link
            href={`${ApplicationRoutes.PostDetails.replace(':id', post.id)}#comments`}
            className='inline-flex text-gray-600 cursor-pointer hover:text-gray-800 transition-[0.3s_ease]'
          >
            {state.comments.length} comments
          </Link>
        </div>
        <div className='grid grid-cols-3 border-t'>
          <button
            type='button'
            className={`inline-flex justify-center items-center text-center font-medium p-2 hover:bg-slate-100 transition-[0.3s_ease] ${
              state.isLiked ? 'text-red-600' : 'text-gray-500'
            }`}
            onClick={() => handleLikeClick()}
          >
            <LikeIcon className='size-4 me-2 stroke-2' solid={state.isLiked} />
            {state.isLiked ? 'You liked' : 'Like'}
          </button>
          <Link
            href={ApplicationRoutes.PostDetails.replace(':id', post.id)}
            className='inline-flex justify-center items-center text-center text-gray-500 font-medium p-2 hover:bg-slate-100 transition-[0.3s_ease]'
          >
            <BookIcon className='size-4 me-2 stroke-2' />
            Read more
          </Link>
          <DonatePostButton
            post={post}
            className='inline-flex justify-center items-center text-center text-gray-500 font-medium p-2 hover:bg-slate-100 transition-[0.3s_ease]'
          >
            <BanknotesIcon className='size-4 me-2 stroke-2' />
            Donate
          </DonatePostButton>
        </div>
      </footer>
    </>
  );
};

export default PostFooter;
