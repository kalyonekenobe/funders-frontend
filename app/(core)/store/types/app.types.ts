export interface PayloadAction<T = any> {
  type: string;
  payload: T;
}

export interface AuthInfo {
  userId: string;
  firstName: string;
  lastName: string;
  permissions: number;
  image: string | null;
}

export interface ActionCreatorOptions {
  queryParams?: unknown;
  queryStringParams?: unknown;
  onSuccess?: (...args: any[]) => void;
  onError?: (...args: any[]) => void;
}
