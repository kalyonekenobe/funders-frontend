export interface LoginDto {
  email: string;
  password: string;
}

export interface AuthStorageErrors {
  fetchAuthenticatedUser: string | null;
  login: string | null;
  logout: string | null;
  refresh: string | null;
}
