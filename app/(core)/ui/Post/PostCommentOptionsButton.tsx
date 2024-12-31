'use client';

import { removePostComment } from '@/app/(core)/actions/post.actions';
import { useOutsideClick } from '@/app/(core)/hooks/dom.hooks';
import useNotification from '@/app/(core)/hooks/notifications.hooks';
import { AuthInfo } from '@/app/(core)/store/types/app.types';
import { PostComment } from '@/app/(core)/store/types/post-comment.types';
import { EditIcon, FlagIcon, RemoveIcon } from '@/app/(core)/ui/Icons/Icons';
import Modal from '@/app/(core)/ui/Modal/Modal';
import EditPostCommentButton from '@/app/(core)/ui/Post/EditPostCommentButton';
import { NotificationType } from '@/app/(core)/utils/notifications.utils';
import { ButtonHTMLAttributes, FC, useState } from 'react';
import { createPortal } from 'react-dom';

export interface PostCommentOptionsButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  postComment: PostComment;
  authenticatedUser: AuthInfo;
  onRemove?: (comment: PostComment) => void;
  onEdit?: (comment: PostComment) => void;
}

export interface PostCommentOptionsButtonState {
  isPostCommentOptionsDropdownVisible: boolean;
  isRemovePostCommentModalVisible: boolean;
}

const initialState: PostCommentOptionsButtonState = {
  isPostCommentOptionsDropdownVisible: false,
  isRemovePostCommentModalVisible: false,
};

const PostCommentOptionsButton: FC<PostCommentOptionsButtonProps> = ({
  postComment,
  authenticatedUser,
  children,
  onRemove,
  onEdit,
  ...props
}) => {
  const [state, setState] = useState(initialState);
  const ref = useOutsideClick(() =>
    setState({ ...state, isPostCommentOptionsDropdownVisible: false }),
  );
  const { createNotification } = useNotification();

  return (
    <>
      {state.isRemovePostCommentModalVisible &&
        createPortal(
          <Modal
            className='max-w-xl'
            title={'Delete post comment'}
            buttons={[
              {
                type: 'accept',
                name: 'Confirm',
                variant: 'danger',
                action: async () => {
                  const response = await removePostComment(postComment.id);

                  if (response?.error) {
                    createNotification({
                      type: NotificationType.Error,
                      message:
                        response?.error ||
                        'Cannot delete this post comment. Please, try again later',
                    });
                  } else {
                    createNotification({
                      type: NotificationType.Success,
                      message: 'The post comment was successfully deleted',
                    });
                  }

                  setState({ ...state, isRemovePostCommentModalVisible: false });
                  onRemove?.(postComment);
                },
              },
              {
                type: 'close',
                name: 'Close',
                action: () => setState({ ...state, isRemovePostCommentModalVisible: false }),
              },
            ]}
          >
            <div className='flex flex-col gap-1 p-5'>
              <p className='text-gray-500'>
                Are you sure you want to delete this post comment? This action cannot be undone.
              </p>
            </div>
          </Modal>,
          document.querySelector('body')!,
        )}
      <div className='relative'>
        <button
          {...props}
          onClick={() => setState({ ...state, isPostCommentOptionsDropdownVisible: true })}
        >
          {children}
        </button>
        {state.isPostCommentOptionsDropdownVisible && (
          <div
            ref={ref}
            className='absolute flex flex-col bg-white z-50 p-1 right-0 shadow-lg border rounded mt-2 text-gray-600'
          >
            <button
              type='button'
              className='w-full ps-2 pe-7 py-1 rounded hover:bg-slate-100 font-medium text-sm text-start inline-flex items-center'
            >
              <FlagIcon className='size-3 stroke-2 me-2' />
              Report
            </button>
            {authenticatedUser.userId === postComment.author?.id && (
              <>
                <EditPostCommentButton
                  onEditComment={onEdit}
                  onModalClose={() =>
                    setState({ ...state, isPostCommentOptionsDropdownVisible: false })
                  }
                  comment={postComment}
                  type='button'
                  className='w-full ps-2 pe-7 py-1 rounded hover:bg-slate-100 font-medium text-sm text-start inline-flex items-center'
                >
                  <EditIcon className='size-3 stroke-2 me-2' />
                  Edit
                </EditPostCommentButton>
                <button
                  type='button'
                  className='w-full ps-2 pe-7 py-1 rounded hover:bg-slate-100 font-medium text-sm text-start inline-flex items-center'
                  onClick={() =>
                    setState({
                      ...state,
                      isPostCommentOptionsDropdownVisible: false,
                      isRemovePostCommentModalVisible: true,
                    })
                  }
                >
                  <RemoveIcon className='size-3 stroke-2 me-2' />
                  Remove
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </>
  );
};

export default PostCommentOptionsButton;
