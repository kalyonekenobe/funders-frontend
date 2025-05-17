'use client';

import { atom } from 'jotai';
import { HttpStatusCode } from 'axios';
import { User } from '@/app/(core)/store/types/user.types';
import { AuthStorageErrors, LoginDto } from '@/app/(core)/types/auth/auth.types';
import { ActionCreatorOptions } from '@/app/(core)/store/types/app.types';
import api from '@/app/(core)/utils/client-axios.utils';

export const authenticatedUserAtom = atom<User | null>(null);

export const authErrorsAtom = atom<AuthStorageErrors>({
  fetchAuthenticatedUser: null,
  login: null,
  refresh: null,
  logout: null,
});

export const fetchAuthenticatedUserAtom = atom(
  get => get(authenticatedUserAtom),
  async (get, set, options?: ActionCreatorOptions): Promise<void> => {
    set(authErrorsAtom, { ...get(authErrorsAtom), fetchAuthenticatedUser: null });

    try {
      const authResponse = await api.get('auth/user');

      if (authResponse.status === HttpStatusCode.Ok) {
        options?.onSuccess?.(authResponse.data);
        set(authenticatedUserAtom, authResponse.data);
      }
    } catch (error: any) {
      options?.onError?.(error);
      set(authErrorsAtom, {
        ...get(authErrorsAtom),
        fetchAuthenticatedUser: 'Cannot fetch authenticated user',
      });
    }
  },
);

export const loginWithCredentialsAtom = atom(
  null,
  async (get, set, loginDto: LoginDto, options?: ActionCreatorOptions): Promise<void> => {
    set(authErrorsAtom, { ...get(authErrorsAtom), login: null });

    try {
      const response = await api.post('auth/login/credentials', loginDto);

      if (response.status === HttpStatusCode.Created) {
        options?.onSuccess?.(response.data);
        set(authenticatedUserAtom, response.data);
      }
    } catch (error: any) {
      options?.onError?.(error);
      set(authErrorsAtom, {
        ...get(authErrorsAtom),
        login: 'Cannot authorize the user with provided credentials.',
      });
    }
  },
);

export const refreshAtom = atom(
  null,
  async (get, set, options?: ActionCreatorOptions): Promise<void> => {
    set(authErrorsAtom, { ...get(authErrorsAtom), refresh: null });

    try {
      const response = await api.post('auth/refresh');

      if (response.status === HttpStatusCode.Created) {
        options?.onSuccess?.(response.data);
      }
    } catch (error: any) {
      options?.onError?.(error);
      set(authErrorsAtom, { ...get(authErrorsAtom), refresh: error?.response?.data });
    }
  },
);

export const logoutAtom = atom(
  null,
  async (get, set, options?: ActionCreatorOptions): Promise<void> => {
    set(authErrorsAtom, { ...get(authErrorsAtom), logout: null });

    try {
      const response = await api.post('auth/logout');

      if (response.status === HttpStatusCode.Created) {
        set(authenticatedUserAtom, null);
        options?.onSuccess?.(response.data);
      }
    } catch (error: any) {
      options?.onError?.(error);
      set(authErrorsAtom, { ...get(authErrorsAtom), logout: error?.response?.data });
    }
  },
);
