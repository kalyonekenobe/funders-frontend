import {
  authenticatedUserAtom,
  authErrorsAtom,
  fetchAuthenticatedUserAtom,
  loginWithCredentialsAtom,
  logoutAtom,
  refreshAtom,
} from '@/app/(core)/store/auth/auth.storage';
import { useAtom } from 'jotai';

export const useAuth = () => {
  const [authenticatedUser, setAuthenticatedUserInStorage] = useAtom(authenticatedUserAtom);
  const [_authenticatedUser, fetchAuthenticatedUser] = useAtom(fetchAuthenticatedUserAtom);
  const [_loginWithCredentials, loginWithCredentials] = useAtom(loginWithCredentialsAtom);
  const [_refresh, refresh] = useAtom(refreshAtom);
  const [_logout, logout] = useAtom(logoutAtom);
  const [errors, setAuthErrorsInStorage] = useAtom(authErrorsAtom);

  return {
    authenticatedUser,
    errors,
    fetchAuthenticatedUser,
    loginWithCredentials,
    refresh,
    logout,
    setAuthErrorsInStorage,
    setAuthenticatedUserInStorage,
  };
};
