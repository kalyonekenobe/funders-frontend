export enum ApplicationRoutes {
  Root = '/',
  Any = '*',
  SignIn = '/sign-in',
  SignUp = '/sign-up',
  AccountCompletion = '/account-completion',
  Home = '/home',
  Dashboard = '/dashboard',
  Profile = '/profile',
  ProfileEdit = '/profile/edit',
  Users = '/users',
  UserDetails = '/users/:id',
  UserCreate = '/users/create',
  UserEdit = '/users/:id/edit',
  Posts = '/posts',
  PostDetails = '/posts/:id',
  PostCreate = '/posts/create',
  PostEdit = '/posts/:id/edit',
  Chats = '/chats',
  ChatDetails = '/chats/:id',
}

export const ProtectedRoutes: ApplicationRoutes[] = [
  ApplicationRoutes.Home,
  ApplicationRoutes.Dashboard,
  ApplicationRoutes.Profile,
  ApplicationRoutes.ProfileEdit,
  ApplicationRoutes.Users,
  ApplicationRoutes.UserDetails,
  ApplicationRoutes.UserCreate,
  ApplicationRoutes.UserEdit,
  ApplicationRoutes.Posts,
  ApplicationRoutes.PostDetails,
  ApplicationRoutes.PostCreate,
  ApplicationRoutes.PostEdit,
  ApplicationRoutes.Chats,
  ApplicationRoutes.ChatDetails,
];

export const RouteMatcher: { [key: string]: RegExp } = {
  [ApplicationRoutes.Home]: /(\/home|\/posts)((\/(\d|(a-z)){36, 36})?|(\/(a-z))*)/i,
  [ApplicationRoutes.Users]: /\/users((\/(\d|(a-z)){36, 36})?|(\/(a-z))*)/i,
  [ApplicationRoutes.Chats]: /\/chats((\/(\d|(a-z)){36, 36})?|(\/(a-z))*)/i,
  [ApplicationRoutes.Profile]: /\/profile(\/(a-z))*/i,
};
