'use server';

import axios from '@/app/(core)/utils/axios.utils';
import { HttpStatusCode } from 'axios';
import { ValiError, flatten, parse } from 'valibot';
import { revalidatePath } from 'next/cache';
import { Post } from '@/app/(core)/store/types/post.types';
import { UserReactionTypeEnum } from '@/app/(core)/store/types/user-reaction-type.types';
import { PostReaction } from '@/app/(core)/store/types/post-reaction.types';
import { getAuthInfo } from '@/app/(core)/actions/auth.actions';
import { PostCommentReaction } from '@/app/(core)/store/types/post-comment-reaction.types';
import { PostComment } from '@/app/(core)/store/types/post-comment.types';
import { PostDonation } from '@/app/(core)/store/types/post-donation.types';
import {
  CreatePostCommentSchema,
  UpdatePostCommentSchema,
} from '@/app/(core)/validation/schemas/post/post-comment.schema';
import { PostCategory } from '@/app/(core)/store/types/post-category.types';
import {
  CreatePostSchema,
  UpdatePostSchema,
} from '@/app/(core)/validation/schemas/post/post.schema';
import { ApplicationRoutes } from '@/app/(core)/utils/routes.utils';
import { resolveUrl } from '@/app/(core)/utils/app.utils';

export const getAllPosts = async (options?: unknown): Promise<Post[]> => {
  try {
    const response = await axios.get(resolveUrl(`/posts`, options));

    if (response.status === HttpStatusCode.Ok) {
      return response.data;
    }
  } catch (error) {
    console.log(error);
  }

  return [];
};

export const addPostReaction = async (
  postId: string,
  reaction: UserReactionTypeEnum,
): Promise<{ error?: string; data: PostReaction | null }> => {
  try {
    const authenticatedUser = await getAuthInfo();

    if (authenticatedUser) {
      const response = await axios.post(`/post-comments/${postId}/reactions`, {
        userId: authenticatedUser.id,
        reaction,
      });

      if (response.status === HttpStatusCode.Created) {
        return { data: response.data };
      }
    }
  } catch (error: any) {
    console.log(error);
    return { error: error.response.data.message, data: null };
  }

  return { error: 'Cannot add reaction to the post', data: null };
};

export const removePostReaction = async (
  postId: string,
): Promise<{ error?: string; data: PostReaction | null }> => {
  try {
    const authenticatedUser = await getAuthInfo();

    if (authenticatedUser) {
      const response = await axios.delete(`/posts/${postId}/reactions`);

      if (response.status === HttpStatusCode.Ok) {
        return { data: response.data };
      }
    }
  } catch (error: any) {
    console.log(error);
    return { error: error.response.data.message, data: null };
  }

  return { error: 'Cannot remove reaction from the post', data: null };
};

export const addPostCommentReaction = async (
  postCommentId: string,
  reaction: UserReactionTypeEnum,
): Promise<{ error?: string; data: PostCommentReaction | null }> => {
  try {
    const authenticatedUser = await getAuthInfo();

    if (authenticatedUser) {
      const response = await axios.post(`/post-comments/${postCommentId}/reactions`, {
        reaction,
      });

      if (response.status === HttpStatusCode.Created) {
        return { data: response.data };
      }
    }
  } catch (error: any) {
    console.log(error);
    return { error: error.response.data.message, data: null };
  }

  return { error: 'Cannot add reaction to the post comment', data: null };
};

export const removePostCommentReaction = async (
  postCommentId: string,
): Promise<{ error?: string; data: PostCommentReaction | null }> => {
  try {
    const authenticatedUser = await getAuthInfo();

    if (authenticatedUser) {
      const response = await axios.delete(`/post-comments/${postCommentId}/reactions`);

      if (response.status === HttpStatusCode.Ok) {
        return { data: response.data };
      }
    }
  } catch (error: any) {
    console.log(error);
    return { error: error.response.data.message, data: null };
  }

  return { error: 'Cannot remove reaction from the post comment', data: null };
};

export const removePost = async (
  postId: string,
): Promise<{ error?: string; data: Post | null }> => {
  try {
    const response = await axios.delete(`/posts/${postId}`);

    if (response.status === HttpStatusCode.Ok) {
      return { data: response.data };
    }
  } catch (error: any) {
    console.log(error);
    return { error: error.response.data.message, data: null };
  }

  return { error: 'Cannot remove post. Please, try again later', data: null };
};

export const removePostComment = async (
  postCommentId: string,
): Promise<{ error?: string; data: PostComment | null }> => {
  try {
    const response = await axios.delete(`/post-comments/${postCommentId}`);

    if (response.status === HttpStatusCode.Ok) {
      return { data: response.data };
    }
  } catch (error: any) {
    console.log(error);
    return { error: error.response.data.message, data: null };
  }

  return { error: 'Cannot remove post comments. Please, try again later', data: null };
};

export const getPost = async (id: string, options?: unknown): Promise<Post | null> => {
  try {
    const response = await axios.get(resolveUrl(`/posts/${id}`, options));

    if (response.status === HttpStatusCode.Ok) {
      return response.data;
    }
  } catch (error) {
    console.log(error);
  }

  return null;
};

export const donate = async (
  id: string,
  amount: number,
  details: string,
): Promise<{ error?: string; data: PostDonation | null }> => {
  try {
    const response = await axios.post(`/posts/${id}/donations`, { amount, details });

    if (response.status === HttpStatusCode.Created) {
      return { data: response.data };
    }
  } catch (error: any) {
    console.log(error);
    return { error: error.response.data.message, data: null };
  }

  return { error: 'Cannot make a donation to the post', data: null };
};

export const createPaymentCharge = async (
  amount: number,
): Promise<{ error?: string; data: { clientSecret: string; id: string } | null }> => {
  try {
    const authenticatedUser = await getAuthInfo();

    if (authenticatedUser) {
      const response = await axios.post('/payments/charge', { amount });

      if (response.status === HttpStatusCode.Created) {
        return { data: response.data };
      }
    }
  } catch (error: any) {
    console.log(error);
    return { error: error.response.data.message, data: null };
  }

  return { error: 'Cannot proceed the action. Please, try again later', data: null };
};

export const addPostComment = async (state: any, postId: string, formData: FormData) => {
  const { attachments, ...data } = Object.fromEntries(formData) as any;

  try {
    const authenticatedUser = await getAuthInfo();

    if (authenticatedUser) {
      const comment = await parse(CreatePostCommentSchema, data);

      const attachmentsErrors = {} as any;
      formData.getAll('attachments').forEach((_, i) => {
        const filename = (formData.get(`attachments[${i}][filename]`) || '') as string;
        if (!filename?.trim()) {
          attachmentsErrors[i] = ['Filename cannot be empty'];
        }
      });

      if (Object.entries(attachmentsErrors).length > 0) {
        return {
          ...state,
          errors: {
            nested: {
              attachments: attachmentsErrors,
            },
          },
        };
      }

      formData.delete('comment');
      formData.set('content', comment.comment);
      formData.set('authorId', authenticatedUser.id);

      const response = await axios.post(
        resolveUrl(`/posts/${postId}/comments`, {
          include: {
            author: true,
            attachments: true,
            parentComment: { include: { author: true } },
          },
        }),
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        },
      );

      if (response.status === HttpStatusCode.Created) {
        return { ...state, errors: {}, createdComment: response.data };
      }
    }
  } catch (error: any) {
    console.log(error);
    if (error instanceof ValiError) {
      return {
        ...state,
        errors: flatten(error.issues),
      };
    }

    if (error.response?.status === HttpStatusCode.Unauthorized) {
      return {
        ...state,
        errors: {
          global: error.response?.data?.message || 'Internal server error.',
        },
      };
    }
  }

  return {
    ...state,
    errors: {
      global: 'Internal server error.',
    },
  };
};

export const editPostComment = async (state: any, commentId: string, formData: FormData) => {
  const { attachments, ...data } = Object.fromEntries(formData) as any;

  try {
    const authenticatedUser = await getAuthInfo();

    if (authenticatedUser) {
      const comment = await parse(UpdatePostCommentSchema, data);

      const attachmentsErrors = {} as any;
      formData.getAll('attachments').forEach((_, i) => {
        const filename = (formData.get(`attachments[${i}][filename]`) || '') as string;
        if (!filename?.trim()) {
          attachmentsErrors[i] = ['Filename cannot be empty'];
        }
      });

      if (Object.entries(attachmentsErrors).length > 0) {
        return {
          ...state,
          errors: {
            nested: {
              attachments: attachmentsErrors,
            },
          },
        };
      }

      formData.delete('comment');
      formData.set('content', comment.comment);

      const response = await axios.put(
        resolveUrl(`/post-comments/${commentId}`, {
          include: {
            author: true,
            attachments: true,
            parentComment: { include: { author: true } },
          },
        }),
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        },
      );

      if (response.status === HttpStatusCode.Ok) {
        return { ...state, errors: {}, editedComment: response.data };
      }
    }
  } catch (error: any) {
    console.log(error);
    if (error instanceof ValiError) {
      return {
        ...state,
        errors: flatten(error.issues),
      };
    }

    if (error.response?.status === HttpStatusCode.Unauthorized) {
      return {
        ...state,
        errors: {
          global: error.response?.data?.message || 'Internal server error.',
        },
      };
    }
  }

  return {
    ...state,
    errors: {
      global: 'Internal server error.',
    },
  };
};

export const getAllPostCategories = async (): Promise<PostCategory[]> => {
  try {
    const response = await axios.get('/post-categories');

    if (response.status === HttpStatusCode.Ok) {
      return response.data;
    }
  } catch (error) {
    console.log(error);
  }

  return [];
};

export const createPost = async (state: any, formData: FormData) => {
  const { attachments, categories, ...data } = Object.fromEntries(formData) as any;

  try {
    const authenticatedUser = await getAuthInfo();

    if (authenticatedUser) {
      data.fundsToBeRaised = Number(data.fundsToBeRaised);
      data.isDraft = data.isDraft === 'true';
      const post = await parse(CreatePostSchema, data);

      const attachmentsErrors = {} as any;
      formData.getAll('attachments').forEach((_, i) => {
        const filename = (formData.get(`attachments[${i}][filename]`) || '') as string;
        if (!filename?.trim()) {
          attachmentsErrors[i] = ['Filename cannot be empty'];
        }
      });

      if (Object.entries(attachmentsErrors).length > 0) {
        return {
          ...state,
          errors: {
            nested: {
              attachments: attachmentsErrors,
            },
          },
        };
      }

      const response = await axios.postForm('/posts', formData);

      if (response.status === HttpStatusCode.Created) {
        revalidatePath(ApplicationRoutes.Home);
        return { ...state, errors: {} };
      }
    }
  } catch (error: any) {
    if (error instanceof ValiError) {
      return {
        ...state,
        errors: flatten(error.issues),
      };
    }

    if (error.response?.status === HttpStatusCode.Unauthorized) {
      return {
        ...state,
        errors: {
          global: error.response?.data?.message || 'Internal server error.',
        },
      };
    }
  }

  return {
    ...state,
    errors: {
      global: 'Internal server error.',
    },
  };
};

export const updatePost = async (state: any, postId: string, formData: FormData) => {
  const { attachments, categories, ...data } = Object.fromEntries(formData) as any;

  try {
    data.fundsToBeRaised = Number(data.fundsToBeRaised);
    data.isDraft = data.isDraft === 'true';
    const post = await parse(UpdatePostSchema, data);

    const attachmentsErrors = {} as any;
    formData.getAll('attachments').forEach((_, i) => {
      const filename = (formData.get(`attachments[${i}][filename]`) || '') as string;
      if (!filename?.trim()) {
        attachmentsErrors[i] = ['Filename cannot be empty'];
      }
    });

    if (Object.entries(attachmentsErrors).length > 0) {
      return {
        ...state,
        errors: {
          nested: {
            attachments: attachmentsErrors,
          },
        },
      };
    }

    const response = await axios.putForm(`/posts/${postId}`, formData);

    if (response.status === HttpStatusCode.Ok) {
      revalidatePath(ApplicationRoutes.Home);
      return { ...state, errors: {} };
    }
  } catch (error: any) {
    console.log(error);
    if (error instanceof ValiError) {
      return {
        ...state,
        errors: flatten(error.issues),
      };
    }

    if (error.response?.status === HttpStatusCode.Unauthorized) {
      return {
        ...state,
        errors: {
          global: error.response?.data?.message || 'Internal server error.',
        },
      };
    }
  }

  return {
    ...state,
    errors: {
      global: 'Internal server error.',
    },
  };
};
