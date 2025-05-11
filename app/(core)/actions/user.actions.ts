'use server';

import axios from '@/app/(core)/utils/axios.utils';
import { HttpStatusCode } from 'axios';
import { ValiError, flatten, parse } from 'valibot';
import { cookies } from 'next/headers';
import { User } from '@/app/(core)/store/types/user.types';
import { Following } from '@/app/(core)/store/types/following.types';
import { getAuthInfo, setCookies } from '@/app/(core)/actions/auth.actions';
import { UserUpdateSchema } from '@/app/(core)/validation/schemas/user/user.schema';
import { resolveUrl } from '@/app/(core)/utils/app.utils';

export const getUserFriendsAndSuggestions = async (userId: string, limit: number = 10) => {
  let result = {
    friends: [],
    suggestions: [],
  };

  try {
    const followingsResponse = await axios.get(`/users/${userId}/followings`);

    if (followingsResponse.status === HttpStatusCode.Ok) {
      const friendsResponse = await axios.get(
        resolveUrl(`/users/${userId}/followers`, {
          where: {
            followerId: {
              in: followingsResponse.data.map((following: User) => following.id),
            },
          },
          select: { userId: true },
          take: limit,
        }),
      );

      if (friendsResponse.status === HttpStatusCode.Ok) {
        result.friends = friendsResponse.data;

        const suggestionsRepsponse = await axios.get(
          resolveUrl(`/users`, {
            where: {
              id: {
                notIn: [...followingsResponse.data.map((following: User) => following.id), userId],
              },
            },
            take: limit,
          }),
        );

        if (suggestionsRepsponse.status === HttpStatusCode.Ok) {
          result.suggestions = suggestionsRepsponse.data;
        }
      }
    }
  } catch (error) {
    console.log(error);
  }

  return result;
};

export const getAllUsers = async (options?: unknown): Promise<User[]> => {
  try {
    const response = await axios.get(resolveUrl(`/users`, options));

    if (response.status === HttpStatusCode.Ok) {
      return response.data;
    }
  } catch (error) {
    console.log(error);
  }

  return [];
};

export const getUser = async (id: string, options?: unknown): Promise<User | null> => {
  try {
    const response = await axios.get(resolveUrl(`/users/${id}`, options));

    if (response.status === HttpStatusCode.Ok) {
      return response.data;
    }
  } catch (error) {
    console.log(error);
  }

  return null;
};

export const followUser = async (
  id: string,
): Promise<{ error?: string; data: Following | null }> => {
  try {
    const authenticatedUser = await getAuthInfo();

    if (authenticatedUser) {
      const response = await axios.post(`/users/${id}/followers/${authenticatedUser.id}`, {});

      if (response.status === HttpStatusCode.Created) {
        return { data: response.data };
      }
    }
  } catch (error: any) {
    console.log(error);
    return { error: error.response.data.message, data: null };
  }

  return { error: 'Cannot follow this user', data: null };
};

export const unfollowUser = async (
  id: string,
): Promise<{ error?: string; data: Following | null }> => {
  try {
    const authenticatedUser = await getAuthInfo();

    if (authenticatedUser) {
      const response = await axios.delete(`/users/${id}/followers/${authenticatedUser.id}`);

      if (response.status === HttpStatusCode.Ok) {
        return { data: response.data };
      }
    }
  } catch (error: any) {
    console.log(error);
    return { error: error.response.data.message, data: null };
  }

  return { error: 'Cannot unfollow this user', data: null };
};

export const updateUser = async (state: any, formData: FormData) => {
  let { id, confirmPassword, image, ...data } = Object.fromEntries(formData) as any;
  const cookieStore = await cookies();

  try {
    if (data.birthDate) data.birthDate = new Date(data.birthDate);
    if (data.phone === '') data.phone = null;
    if (data.bio === '') data.bio = null;

    const user = (await parse(UserUpdateSchema, data)) as any;

    if (confirmPassword !== data.password) {
      throw new ValiError([
        {
          kind: 'schema',
          type: '',
          input: undefined,
          expected: null,
          received: '',
          message: '',
        },
      ]);
    }

    if (user.phone === null) user.phone = '';
    if (user.bio === null) user.bio = '';

    if (image !== undefined) {
      user.image = image === '' ? null : image;
    }

    const userFormData = new FormData();
    Object.entries(user).forEach(([key, value]: [string, unknown]) => {
      userFormData.set(key, !value ? '' : (value as string | Blob));
    });

    const response = await axios.putForm(`/users/${id}`, userFormData);

    if (response.status === HttpStatusCode.Ok) {
      return { ...state, errors: {} };
    }
  } catch (error: any) {
    console.log(error);
    if (error instanceof ValiError) {
      if (confirmPassword !== data.password) {
        error = {
          ...error,
          issues: [
            ...error.issues,
            {
              reason: 'any',
              context: 'confirm_password',
              input: confirmPassword,
              expected: data.password,
              received: confirmPassword,
              message: 'Passwords are different.',
              path: [
                {
                  type: 'object',
                  origin: 'value',
                  input: confirmPassword,
                  key: 'confirmPassword',
                  value: confirmPassword,
                },
              ],
            },
          ].filter(issue => issue.context !== '') as any,
        };
      }

      return {
        ...state,
        errors: flatten(error),
      };
    }

    if (error.response?.status === HttpStatusCode.Unauthorized) {
      return {
        errors: {
          ...state,
          global: 'The provided data is invalid. Please, try again.',
        },
      };
    }
  }

  return {
    errors: {
      ...state,
      global: 'Internal server error.',
    },
  };
};
