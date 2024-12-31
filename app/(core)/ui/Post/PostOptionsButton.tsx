'use client';

import { ButtonHTMLAttributes, FC, useState } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AuthInfo } from '@/app/(core)/store/types/app.types';
import { Post } from '@/app/(core)/store/types/post.types';
import { useOutsideClick } from '@/app/(core)/hooks/dom.hooks';
import useNotification from '@/app/(core)/hooks/notifications.hooks';
import Modal from '@/app/(core)/ui/Modal/Modal';
import { removePost } from '@/app/(core)/actions/post.actions';
import { NotificationType } from '@/app/(core)/utils/notifications.utils';
import { EditIcon, FlagIcon, RemoveIcon } from '@/app/(core)/ui/Icons/Icons';
import { ApplicationRoutes } from '@/app/(core)/utils/routes.utils';

export interface PostOptionsButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  post: Post;
  authenticatedUser: AuthInfo;
}

export interface PostOptionsButtonState {
  isPostOptionsDropdownVisible: boolean;
  isRemovePostModalVisible: boolean;
}

const initialState: PostOptionsButtonState = {
  isPostOptionsDropdownVisible: false,
  isRemovePostModalVisible: false,
};

const PostOptionsButton: FC<PostOptionsButtonProps> = ({
  post,
  authenticatedUser,
  children,
  ...props
}) => {
  const [state, setState] = useState(initialState);
  const ref = useOutsideClick(() => setState({ ...state, isPostOptionsDropdownVisible: false }));
  const { createNotification } = useNotification();
  const router = useRouter();

  return (
    <>
      {state.isRemovePostModalVisible &&
        createPortal(
          <Modal
            className='max-w-xl'
            title={'Delete post'}
            buttons={[
              {
                type: 'accept',
                name: 'Confirm',
                variant: 'danger',
                action: async () => {
                  const response = await removePost(post.id);

                  if (response?.error) {
                    createNotification({
                      type: NotificationType.Error,
                      message:
                        response?.error || 'Cannot delete this post. Please, try again later',
                    });
                  } else {
                    createNotification({
                      type: NotificationType.Success,
                      message: 'The post was successfully deleted',
                    });
                  }

                  setState({ ...state, isRemovePostModalVisible: false });
                  router.refresh();
                },
              },
              {
                type: 'close',
                name: 'Close',
                action: () => setState({ ...state, isRemovePostModalVisible: false }),
              },
            ]}
          >
            <div className='flex flex-col gap-1 p-5'>
              <p className='text-gray-500'>
                Are you sure you want to delete this post: "{post.title}"? This action cannot be
                undone.
              </p>
            </div>
          </Modal>,
          document.querySelector('body')!,
        )}
      <div className='relative'>
        <button
          {...props}
          onClick={() => setState({ ...state, isPostOptionsDropdownVisible: true })}
        >
          {children}
        </button>
        {state.isPostOptionsDropdownVisible && (
          <div
            ref={ref}
            className='absolute flex flex-col bg-white z-40 p-1 right-0 shadow-lg border rounded mt-2 text-gray-600'
          >
            <button
              type='button'
              className='w-full ps-2 pe-7 py-1 rounded hover:bg-slate-100 font-medium text-sm text-start inline-flex items-center'
            >
              <FlagIcon className='size-3 stroke-2 me-2' />
              Report
            </button>
            {authenticatedUser.userId === post.author?.id && (
              <>
                <Link
                  href={ApplicationRoutes.PostEdit.replace(':id', post.id)}
                  className='w-full ps-2 pe-7 py-1 rounded hover:bg-slate-100 font-medium text-sm text-start inline-flex items-center'
                >
                  <EditIcon className='size-3 stroke-2 me-2' />
                  Edit
                </Link>
                <button
                  type='button'
                  className='w-full ps-2 pe-7 py-1 rounded hover:bg-slate-100 font-medium text-sm text-start inline-flex items-center'
                  onClick={() =>
                    setState({
                      ...state,
                      isPostOptionsDropdownVisible: false,
                      isRemovePostModalVisible: true,
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

export default PostOptionsButton;
