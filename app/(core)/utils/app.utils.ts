import { RequestCookies, ResponseCookies } from 'next/dist/compiled/@edge-runtime/cookies';
import { NextRequest, NextResponse } from 'next/server';
import qs from 'qs';

export const resolveUrl = (url: string, queryParams?: any) => {
  const queryString = qs.stringify(queryParams, {
    allowDots: true,
    parseArrays: true,
    comma: true,
  } as any);

  return `${url}${queryString ? `?${queryString}` : ``}`;
};

export const applySetRequestCookies = (request: NextRequest, res: NextResponse): void => {
  const cookiesToBeSet = new ResponseCookies(res.headers);
  const newRequestHeaders = new Headers(request.headers);
  const newRequestCookies = new RequestCookies(newRequestHeaders);
  cookiesToBeSet.getAll().forEach(cookie => newRequestCookies.set(cookie));
  NextResponse.next({ request: { headers: newRequestHeaders } }).headers.forEach((value, key) => {
    if (key === 'x-middleware-override-headers' || key.startsWith('x-middleware-request-')) {
      res.headers.set(key, value);
    }
  });
};

export const resolveImage = (
  path?: string | null,
  placeholder:
    | 'default-image-placeholder'
    | 'default-profile-image'
    | 'post-image-placeholder'
    | 'profile-background-placeholder'
    | 'profile-image-placeholder' = 'default-image-placeholder',
) => {
  if (path) {
    return `https://aljshowzwfryjtexdczf.supabase.co/storage/v1/object/public/Funders/${path}`;
  }

  switch (placeholder) {
    case 'default-image-placeholder':
      return (
        process.env.NEXT_PUBLIC_DEFAULT_IMAGE_PLACEHOLDER_PATH || '/default-image-placeholder.webp'
      );
    case 'default-profile-image':
      return process.env.NEXT_PUBLIC_DEFAULT_PROFILE_IMAGE_PATH || '/default-profile-image.webp';
    case 'post-image-placeholder':
      return process.env.NEXT_PUBLIC_POST_IMAGE_PLACEHOLDER_PATH || '/post-image-placeholder.webp';
    case 'profile-background-placeholder':
      return (
        process.env.NEXT_PUBLIC_PROFILE_BACKGROUND_PLACEHOLDER_PATH ||
        '/profile-background-placeholder.webp'
      );
    case 'profile-image-placeholder':
      return (
        process.env.NEXT_PUBLIC_PROFILE_IMAGE_PLACEHOLDER_PATH || '/profile-image-placeholder.webp'
      );
  }
};

export const resolveFilePath = (path: string) => {
  return `https://aljshowzwfryjtexdczf.supabase.co/storage/v1/object/public/Funders/${path}`;
};

export const getFileExtension = (source: string): unknown =>
  /[.]/.exec(source) ? /[^.]+$/.exec(source) : '';

export const fileWithExtension = (filename: string): string => {
  return `${filename}.${getFileExtension(filename) || ''}`;
};
