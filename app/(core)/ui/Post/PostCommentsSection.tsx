'use client';

import { AuthInfo } from '@/app/(core)/store/types/app.types';
import { PostComment } from '@/app/(core)/store/types/post-comment.types';
import { Post } from '@/app/(core)/store/types/post.types';
import { PlusIcon } from '@/app/(core)/ui/Icons/Icons';
import AddPostCommentButton from '@/app/(core)/ui/Post/AddPostCommentButton';
import { flattenComments, prepareComments } from '@/app/(core)/utils/comments.utils';
import { FC, HTMLAttributes, useEffect, useState } from 'react';
import PostCommentComponent from '@/app/(core)/ui/Post/PostComment';
import { User } from '@/app/(core)/store/types/user.types';

export interface PostCommentsSectionProps extends HTMLAttributes<HTMLDivElement> {
  comments: PostComment[];
  post: Post;
  authenticatedUser: User;
}

export interface PostCommentsSectionState {
  comments: PostComment[];
}

const initialState: PostCommentsSectionState = {
  comments: [],
};

const PostCommentsSection: FC<PostCommentsSectionProps> = ({
  post,
  authenticatedUser,
  comments,
  ...props
}) => {
  const [state, setState] = useState(initialState);

  useEffect(() => {
    setState({ ...state, comments: prepareComments(comments) });
  }, []);

  return (
    <div {...props}>
      <div className='flex items-center justify-between mb-5'>
        <h4 className='text-gray-500 font-bold text-xl'>Comments</h4>
        <AddPostCommentButton
          post={post}
          replyTo={null}
          className='inline-flex text-center justify-center items-center rounded bg-rose-600 text-white font-medium text-sm px-2 py-1 hover:bg-rose-500 transition-[0.3s_ease]'
          onAddComment={(comment: PostComment) =>
            setState({
              ...state,
              comments: prepareComments([comment, ...flattenComments(state.comments)]),
            })
          }
        >
          <PlusIcon className='size-4 stroke-2 me-1' />
          Add comment
        </AddPostCommentButton>
      </div>
      {state.comments.length === 0 && (
        <h4 className='text-gray-500 font-medium text-center inline-flex justify-center items-center p-10 rounded border-[3px] border-dashed'>
          No comments have been added to this post yet
        </h4>
      )}
      {state.comments.map(comment => (
        <PostCommentComponent
          authenticatedUser={authenticatedUser}
          post={post}
          key={comment.id}
          comment={comment}
          onEdit={comment =>
            setState({
              ...state,
              comments: prepareComments(
                flattenComments(state.comments).map(c => (c.id === comment.id ? comment : c)),
              ),
            })
          }
          onRemove={comment =>
            setState({
              ...state,
              comments: prepareComments(
                flattenComments(state.comments).filter(c => c.id !== comment.id),
              ),
            })
          }
          onReply={(comment: PostComment) =>
            setState({
              ...state,
              comments: prepareComments([comment, ...flattenComments(state.comments)]),
            })
          }
        />
      ))}
    </div>
  );
};

export default PostCommentsSection;
