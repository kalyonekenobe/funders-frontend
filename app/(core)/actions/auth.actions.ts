'use server';

import { ValiError, flatten, parse } from 'valibot';
import axios from '@/app/(core)/utils/axios.utils';
import { HttpStatusCode } from 'axios';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import * as jose from 'jose';
import { NextRequest, NextResponse } from 'next/server';
import { LoginSchema, RegisterSchema } from '@/app/(core)/validation/schemas/auth/auth.schema';
import { UserRegistrationMethodEnum } from '@/app/(core)/store/types/user-registration-method.types';
import { AuthProviders } from '@/app/(core)/utils/auth.utils';
import { ApplicationRoutes } from '@/app/(core)/utils/routes.utils';
import { applySetRequestCookies, resolveUrl } from '@/app/(core)/utils/app.utils';
import { parseCookieString } from '@/app/(core)/utils/cookies.utils';
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
  const { ACTION_ID, registrationMethod, confirmPassword, walletPublicKey, ...data } =
    Object.fromEntries(formData) as any;

  try {
    if (!data.password) {
      data.password = '#xxxxxx0';
    }

    if (walletPublicKey) {
      data.walletPublicKey = walletPublicKey;
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

    const response = await axios.post(registrationUrl, data);

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

export const authWithSSO = async (provider: AuthProviders, referer: string) => {
  const { status, data } = await axios.post(`/oauth2/${provider}`, { referer });

  if (status !== HttpStatusCode.Created) {
    throw new Error('Cannot generate OAuth2 link. Please, try again later');
  }

  return redirect(data.url);
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
          redirectUrl: `${process.env.NEXT_PUBLIC_FRONTEND_URL}/${ApplicationRoutes.AccountCompletion}`,
        },
        status: HttpStatusCode.TemporaryRedirect,
      };
    } else {
      let response = { data: {} };

      switch (provider) {
        case AuthProviders.Discord:
          response = await axios.post(`/auth/login/${provider}`, {
            discordAccessToken: accessToken,
          });
          break;
        case AuthProviders.Google:
          response = await axios.post(`/auth/login/${provider}`, {
            googleAccessToken: accessToken,
          });
          break;
      }

      return {
        notify: true,
        data: response.data,
        status: HttpStatusCode.Created,
      };
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
  const response = await axios.get(`/auth/login/wallet/solana/message?address=${address}`);

  return response.data.message;
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
        redirectUrl: `${process.env.NEXT_PUBLIC_FRONTEND_URL}/${ApplicationRoutes.SignIn}`,
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
        redirectUrl: `${process.env.NEXT_PUBLIC_FRONTEND_URL}/${ApplicationRoutes.SignIn}`,
      },
      status: HttpStatusCode.TemporaryRedirect,
    };
  }

  const { email, provider, referer } = payload;

  if (!email || !provider) {
    return {
      notify: true,
      data: {
        error: `An error occurred when receiving data from ${capitalize(
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

const capitalize = (str: string): string => {
  if (!str) {
    return str;
  }

  return str.charAt(0).toUpperCase() + str.slice(1);
};
