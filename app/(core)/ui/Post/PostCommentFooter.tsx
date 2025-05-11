'use client';

import {
  addPostCommentReaction,
  removePostCommentReaction,
} from '@/app/(core)/actions/post.actions';
import useNotification from '@/app/(core)/hooks/notifications.hooks';
import { AuthInfo } from '@/app/(core)/store/types/app.types';
import { PostComment } from '@/app/(core)/store/types/post-comment.types';
import { Post } from '@/app/(core)/store/types/post.types';
import { UserReactionTypeEnum } from '@/app/(core)/store/types/user-reaction-type.types';
import { User } from '@/app/(core)/store/types/user.types';
import { FileIcon, LikeIcon, ReplyIcon } from '@/app/(core)/ui/Icons/Icons';
import Modal from '@/app/(core)/ui/Modal/Modal';
import AddPostCommentButton from '@/app/(core)/ui/Post/AddPostCommentButton';
import UserListItem from '@/app/(core)/ui/User/UserListItem';
import { getFileExtension, resolveFilePath } from '@/app/(core)/utils/app.utils';
import { NotificationType } from '@/app/(core)/utils/notifications.utils';
import { FC, HTMLAttributes, useState } from 'react';
import { createPortal } from 'react-dom';

export interface PostCommentFooterProps extends HTMLAttributes<HTMLDivElement> {
  post: Post;
  postComment: PostComment;
  authenticatedUser: User;
  onReply?: (comment: PostComment) => void;
}

export interface PostCommentFooterState {
  usersThatLikedPostComment: User[];
  isLiked: boolean;
  isUserThatLikedPostCommentListVisible: boolean;
}

const initialState: PostCommentFooterState = {
  usersThatLikedPostComment: [],
  isLiked: false,
  isUserThatLikedPostCommentListVisible: false,
};

const PostCommentFooter: FC<PostCommentFooterProps> = ({
  post,
  postComment,
  authenticatedUser,
  onReply,
  ...props
}) => {
  const [state, setState] = useState({
    ...initialState,
    usersThatLikedPostComment: (postComment.reactions || []).map(reaction => reaction.user!),
    isLiked: Boolean(
      (postComment.reactions || []).find(reaction => reaction.userId === authenticatedUser?.id),
    ),
  });
  const { createNotification } = useNotification();

  const handleLikeClick = async () => {
    if (!state.isLiked) {
      const response = await addPostCommentReaction(postComment.id, UserReactionTypeEnum.Like);

      if (!response || response.error) {
        createNotification({
          type: NotificationType.Error,
          message: response.error || 'Cannot add reaction to the post comment',
        });
      } else {
        setState({
          ...state,
          isLiked: true,
          usersThatLikedPostComment: [
            { ...authenticatedUser, id: authenticatedUser.id } as any,
            ...state.usersThatLikedPostComment,
          ],
        });
      }
    } else {
      const response = await removePostCommentReaction(postComment.id);

      if (!response || response.error) {
        createNotification({
          type: NotificationType.Error,
          message: response.error || 'Cannot remove reaction from the post comment',
        });
      } else {
        setState({
          ...state,
          isLiked: false,
          usersThatLikedPostComment: state.usersThatLikedPostComment.filter(
            user => user.id !== authenticatedUser.id,
          ),
        });
      }
    }
  };

  return (
    <>
      {state.isUserThatLikedPostCommentListVisible &&
        createPortal(
          <Modal
            className='max-w-xl'
            title={`Likes`}
            buttons={[
              {
                type: 'close',
                name: 'Close',
                action: () => setState({ ...state, isUserThatLikedPostCommentListVisible: false }),
              },
            ]}
          >
            <div className='flex flex-col gap-1 p-3'>
              {state.usersThatLikedPostComment.map(user => (
                <UserListItem
                  key={user.id}
                  id={user.id}
                  firstName={user.firstName || ''}
                  lastName={user.lastName || ''}
                  image={user.image || null}
                  className='inline-flex items-center rounded p-1 hover:bg-slate-100 transition-[0.3s_ease]'
                />
              ))}
              {!state.usersThatLikedPostComment.length && (
                <div className='min-h-[50px] flex items-center justify-center rounded border-[3px] border-dashed'>
                  <h3 className='text-gray-400 font-semibold text-center'>
                    Nobody has liked this post comment yet
                  </h3>
                </div>
              )}
            </div>
          </Modal>,
          document.querySelector('body')!,
        )}
      <footer {...props}>
        {(postComment.attachments?.length || 0) > 0 && (
          <div className='flex gap-1 mt-2 mb-1 flex-wrap'>
            {postComment.attachments?.map(attachment => (
              <span
                onClick={() => {
                  fetch(resolveFilePath(attachment.location))
                    .then(response => response.blob())
                    .then(blob => {
                      const url = window.URL.createObjectURL(new Blob([blob]));
                      const link = document.createElement('a');
                      link.href = url;
                      link.setAttribute(
                        'download',
                        `${attachment.filename || attachment.location}${
                          getFileExtension(attachment.location)
                            ? `.${getFileExtension(attachment.location)}`
                            : ''
                        }`,
                      );
                      document.body.appendChild(link);
                      link.click();
                      link.parentNode?.removeChild(link);
                    });
                }}
                key={attachment.id}
                className='inline-flex text-center items-center justify-center border bg-slate-100 hover:bg-slate-200 px-2 py-0.5 rounded text-xs cursor-pointer transition-[0.3s_ease] text-slate-600 font-medium'
              >
                <FileIcon className='size-3 stroke-2 me-1' />
                {attachment.filename || attachment.location}
              </span>
            ))}
          </div>
        )}
        <div className='flex gap-1 mt-1'>
          <span
            className='inline-flex text-sm items-center text-gray-600 cursor-pointer hover:text-gray-800 transition-[0.3s_ease] me-2'
            onClick={() => setState({ ...state, isUserThatLikedPostCommentListVisible: true })}
          >
            {state.usersThatLikedPostComment.length} likes
          </span>
          <button
            type='button'
            className={`text-xs rounded inline-flex justify-center items-center text-center font-medium p-2 hover:bg-slate-100 transition-[0.3s_ease] ${
              state.isLiked ? 'text-red-600' : 'text-gray-500'
            }`}
            onClick={() => handleLikeClick()}
          >
            <LikeIcon className='size-3.5 me-2 stroke-2' solid={state.isLiked} />
            {state.isLiked ? 'You liked' : 'Like'}
          </button>
          <AddPostCommentButton
            post={post}
            replyTo={postComment}
            className='text-xs rounded inline-flex justify-center items-center text-center font-medium p-2 hover:bg-slate-100 transition-[0.3s_ease] text-gray-500'
            onAddComment={onReply}
          >
            <ReplyIcon className='size-3.5 stroke-2 me-2' />
            Reply
          </AddPostCommentButton>
        </div>
      </footer>
    </>
  );
};

export default PostCommentFooter;
