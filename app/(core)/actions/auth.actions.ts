'use server';

import { ValiError, flatten, parse } from 'valibot';
import axios from '@/app/(core)/utils/axios.utils';
import { HttpStatusCode } from 'axios';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import * as jose from 'jose';
import { NextRequest, NextResponse } from 'next/server';
import { SolanaSignInInput } from '@solana/wallet-standard-features';
import { AuthInfo } from '@/app/(core)/store/types/app.types';
import { LoginSchema, RegisterSchema } from '@/app/(core)/validation/schemas/auth/auth.schema';
import { UserRegistrationMethodEnum } from '@/app/(core)/store/types/user-registration-method.types';
import { UserRoleEnum } from '@/app/(core)/store/types/user-role.types';
import { AuthProviders } from '@/app/(core)/utils/auth.utils';
import { ApplicationRoutes } from '@/app/(core)/utils/routes.utils';
import { applySetRequestCookies, resolveUrl } from '@/app/(core)/utils/app.utils';
import { parseCookieString } from '@/app/(core)/utils/cookies.utils';
import crypto from 'crypto';
import { v4 as uuid } from 'uuid';
import _ from 'lodash';
import { User } from '@/app/(core)/store/types/user.types';

export const signIn = async (state: any, formData: FormData) => {
  try {
    const { email, password } = Object.fromEntries(formData);
    const credentials = await parse(LoginSchema, { email, password });

    const response = await axios.post('/auth/login/credentials', credentials);

    if (response.status === HttpStatusCode.Created) {
      return { ...state, errors: {} };
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
        errors: {
          ...state,
          global:
            'The provided credentials are invalid. Please verify your email and password and try again.',
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

export const signUp = async (state: any, formData: FormData) => {
  const { ACTION_ID, registrationMethod, confirmPassword, ...data } = Object.fromEntries(
    formData,
  ) as any;

  try {
    if (!data.password) {
      data.password = '#xxxxxx0';
    }

    data.birthDate = new Date(data.birthDate);
    const user = await parse(RegisterSchema, data);

    if (registrationMethod && registrationMethod !== UserRegistrationMethodEnum.Credentials) {
      delete data.password;
    }

    if (
      confirmPassword !== data.password &&
      registrationMethod === UserRegistrationMethodEnum.Credentials
    ) {
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

    let registrationUrl = '';

    switch (registrationMethod) {
      case UserRegistrationMethodEnum.Credentials:
        registrationUrl = '/auth/register/credentials';
        break;
      case UserRegistrationMethodEnum.Google:
        registrationUrl = '/auth/register/google';
        break;
      case UserRegistrationMethodEnum.Discord:
        registrationUrl = '/auth/register/discord';
        break;
      case UserRegistrationMethodEnum.SolanaWallet:
        registrationUrl = '/auth/register/wallet/solana';
        break;
    }

    const response = await axios.post(registrationUrl, user);

    if (response.status === HttpStatusCode.Created) {
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
        errors: flatten(error.issues),
      };
    }

    if (
      error.response?.status === HttpStatusCode.Conflict &&
      error.response.data?.message?.includes('email')
    ) {
      return {
        ...state,
        errors: {
          global: 'The user with such email already exists.',
        },
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

export const authWithSSO = async (provider: AuthProviders) => {
  return redirect(`/api/auth/${provider}`);
};

export const authWithSSOIfAuthTokenExist = async (): Promise<{
  notify: boolean;
  data: any;
  status: HttpStatusCode;
}> => {
  const cookieStore = await cookies();
  const authTokenCookie = cookieStore.get(process.env.NEXT_COOKIE_OAUTH2_TOKEN_NAME || '');

  if (!authTokenCookie) {
    return {
      notify: false,
      data: { error: 'The auth token is missing' },
      status: HttpStatusCode.Unauthorized,
    };
  }

  const payload = await jose.decodeJwt(authTokenCookie.value);
  const authTokenIsValid = await jose.jwtVerify(
    authTokenCookie.value,
    new TextEncoder().encode(process.env.NEXT_JWT_SECRET || ''),
  );

  cookieStore.delete(process.env.NEXT_COOKIE_OAUTH2_TOKEN_NAME || '');

  if (!authTokenIsValid || !payload) {
    return {
      notify: true,
      data: { error: 'The auth token is invalid or expired' },
      status: HttpStatusCode.Unauthorized,
    };
  }

  const { email, provider, accessToken, referer } = payload;

  try {
    const response = await axios.get(resolveUrl(`/users`, { where: { email } }));

    if (response.status !== HttpStatusCode.Ok) {
      throw new Error('Internal server error');
    }

    if (!response.data.length) {
      cookieStore.set(
        process.env.NEXT_COOKIE_ACCOUNT_COMPLETION_TOKEN_NAME ||
          'Funders-Account-Completion-Token-Name',
        await new jose.SignJWT({ email, provider, referer })
          .setProtectedHeader({ alg: 'HS256' })
          .sign(new TextEncoder().encode(process.env.NEXT_JWT_SECRET || '')),
        {
          httpOnly: true,
        },
      );

      return {
        notify: false,
        data: {
          error:
            'The user with such email is not registered. Please, complete the registration process',
          redirectUrl: `${process.env.FRONTEND_URL}/${ApplicationRoutes.AccountCompletion}`,
        },
        status: HttpStatusCode.TemporaryRedirect,
      };
    } else {
      await axios.post(`/auth/login/${provider}`, undefined, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
    }
  } catch (error: any) {
    return { notify: true, data: { error: error.toString() }, status: HttpStatusCode.Unauthorized };
  }

  return {
    notify: true,
    data: { message: 'The user was successfully authorized' },
    status: HttpStatusCode.Created,
  };
};

export const getWalletAuthMessage = async (address: string): Promise<string> => {
  const now = new Date();
  const uri = process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost';
  const currentUrl = new URL(uri);
  const domain = currentUrl.host;
  const currentDateTime = now.toISOString();
  const expiresAtDateTime = new Date(now.setMinutes(now.getMinutes() + 10)).toISOString();
  const notBeforeDateTime = currentDateTime;
  const nonce = crypto.randomBytes(16).toString('base64');
  const requestId = uuid();

  const data: SolanaSignInInput = {
    statement: `Clicking Sign or Approve only means you have proved this wallet is owned by you. This request will not trigger any blockchain transaction or cost any gas fee.`,
    version: '1',
    chainId: 'mainnet',
    issuedAt: currentDateTime,
    expirationTime: expiresAtDateTime,
    notBefore: notBeforeDateTime,
    resources: [uri, 'https://phantom.app/'],
    domain,
    nonce,
    requestId,
  };

  const resources =
    data.resources?.reduce((previous, current) => `${previous}- ${current}\n`, '') || '';

  const template = process.env.NEXT_AUTH_MESSAGE_TEMPLATE || '';

  return template
    .replace(':domain', data.domain || 'localhost')
    .replace(':address', address)
    .replace(':statement', data.statement || '')
    .replace(':uri', data.uri || '')
    .replace(':version', data.version || '')
    .replace(':chainId', data.chainId || '')
    .replace(':nonce', data.nonce || '')
    .replace(':issuedAt', data.issuedAt || '')
    .replace(':expirationTime', data.expirationTime || '')
    .replace(':notBefore', data.notBefore || '')
    .replace(':requestId', data.requestId || '')
    .replace(':resources', resources);
};

export const authWithSolanaWallet = async (
  accessToken: string,
): Promise<{
  notify: boolean;
  data: any;
  status: HttpStatusCode;
}> => {
  try {
    await axios.post(`/auth/login/wallet/solana`, { solanaWalletAccessToken: accessToken });
  } catch (error: any) {
    return { notify: true, data: { error: error.toString() }, status: HttpStatusCode.Unauthorized };
  }

  return {
    notify: true,
    data: { message: 'The user was successfully authorized' },
    status: HttpStatusCode.Created,
  };
};

export const extractAccountCompletionMetadata = async (): Promise<{
  notify: boolean;
  data: any;
  status: HttpStatusCode;
}> => {
  const cookieStore = await cookies();
  const accountCompletionToken = cookieStore.get(
    process.env.NEXT_COOKIE_ACCOUNT_COMPLETION_TOKEN_NAME || '',
  );

  if (!accountCompletionToken) {
    return {
      notify: true,
      data: {
        error: 'The account completion token is missing',
        redirectUrl: `${process.env.FRONTEND_URL}/${ApplicationRoutes.SignIn}`,
      },
      status: HttpStatusCode.TemporaryRedirect,
    };
  }

  const payload = (await jose.decodeJwt(accountCompletionToken.value)) as { [key: string]: any };
  const accountCompletionTokenIsValid = await jose.jwtVerify(
    accountCompletionToken.value,
    new TextEncoder().encode(process.env.NEXT_JWT_SECRET!),
  );

  cookieStore.delete(process.env.NEXT_COOKIE_ACCOUNT_COMPLETION_TOKEN_NAME || '');

  if (!accountCompletionTokenIsValid || !payload) {
    return {
      notify: true,
      data: {
        error: 'The account completion token is invalid or expired',
        redirectUrl: `${process.env.FRONTEND_URL}/${ApplicationRoutes.SignIn}`,
      },
      status: HttpStatusCode.TemporaryRedirect,
    };
  }

  const { email, provider, referer } = payload;

  if (!email || !provider) {
    return {
      notify: true,
      data: {
        error: `An error occurred when receiving data from ${_.capitalize(
          provider || 'auth provider',
        )}`,
        redirectUrl: referer,
      },
      status: HttpStatusCode.TemporaryRedirect,
    };
  }

  return {
    notify: false,
    data: { email, provider },
    status: HttpStatusCode.Created,
  };
};

export const getAuthInfo = async (): Promise<User> => {
  const response = await axios.get('/auth/user');

  return response.data;
};

export const signOut = async () => {
  const cookieStore = await cookies();
  cookieStore.delete(process.env.NEXT_COOKIE_ACCESS_TOKEN_NAME || 'Funders-Access-Token');
  cookieStore.delete(process.env.NEXT_COOKIE_REFRESH_TOKEN_NAME || 'Funders-Refresh-Token');

  return redirect(ApplicationRoutes.SignIn);
};

export const setCookies = async (cookiesToUpdate: string[]) => {
  const cookieStore = await cookies();
  cookiesToUpdate.forEach(cookieString => {
    const { name, value, ...options } = parseCookieString(cookieString);
    cookieStore.set(name, value, options);
  });
};

export const removeCookies = async (cookiesToRemove: string[]) => {
  const cookieStore = await cookies();

  cookiesToRemove.forEach(cookie => {
    cookieStore.delete(cookie);
  });
};

export const updateSession = async (request: NextRequest, response: NextResponse) => {
  try {
    const cookieStore = await cookies();
    let authenticatedUserResponse = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/user`,
      {
        method: 'GET',
        credentials: 'include',
        cache: 'no-cache',
        headers: {
          'Cache-Control': 'no-cache',
          Cookie: cookieStore.toString(),
        },
      },
    );

    if (authenticatedUserResponse.status === HttpStatusCode.Unauthorized) {
      const refreshResponse = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
        cache: 'no-cache',
        headers: {
          'Cache-Control': 'no-cache',
          Cookie: cookieStore.toString(),
        },
      });

      (refreshResponse.headers.getSetCookie()?.[0]?.split(',') || []).forEach(cookieString => {
        const { name, value, ...options } = parseCookieString(cookieString);
        response.cookies.set(name, value, options);
      });

      applySetRequestCookies(request, response);

      authenticatedUserResponse = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/user`, {
        method: 'GET',
        credentials: 'include',
        cache: 'no-cache',
        headers: {
          'Cache-Control': 'no-cache',
          Cookie: response.cookies.toString(),
        },
      });
    }

    if (authenticatedUserResponse.status === HttpStatusCode.Ok) {
      return { authenticatedUser: await authenticatedUserResponse.json() };
    }
  } catch (error) {
    console.log(error);
  }

  return { authenticatedUser: null };
};
