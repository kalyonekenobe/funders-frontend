import { FC, HTMLAttributes } from 'react';
import Image from 'next/image';
import { getAuthInfo } from '@/app/(core)/actions/auth.actions';
import { resolveImage } from '@/app/(core)/utils/app.utils';
import { UserRoleEnum } from '@/app/(core)/store/types/user-role.types';
import UserFooter from '@/app/(core)/ui/User/UserFooter';
import { User as UserType } from '@/app/(core)/store/types/user.types';

export interface UserProps extends HTMLAttributes<HTMLDivElement> {
  user: UserType;
}

const fetchData = async () => {
  const authenticatedUser = await getAuthInfo();

  return { authenticatedUser };
};

const User: FC<UserProps> = async ({ user, ...props }) => {
  const { authenticatedUser } = await fetchData();

  return (
    <div {...props}>
      <div className='flex flex-1 flex-col justify-between'>
        <header className='flex flex-col items-center w-full'>
          <div className='flex flex-1 w-full max-w-[128px] relative overflow-hidden rounded aspect-square'>
            <Image
              src={resolveImage(user.avatar, 'default-profile-image')}
              alt={`${user.firstName} ${user.lastName}'s profile image`}
              sizes='100%, 100%'
              className='object-cover'
              fill={true}
              priority={true}
            />
          </div>
          <h3 className='text-gray-600 mt-2 font-bold text-xl text-center'>
            {user.firstName} {user.lastName}
          </h3>
          <span
            className={`text-xs font-semibold text-white px-2 rounded-full mt-0.5 ${
              user.role === UserRoleEnum.Default
                ? 'bg-emerald-500'
                : user.role === UserRoleEnum.Volunteer
                ? 'bg-violet-500'
                : 'bg-rose-500'
            }`}
          >
            {user.role === UserRoleEnum.Default ? 'Member' : user.role}
          </span>
        </header>
        <UserFooter
          user={user}
          authenticatedUser={authenticatedUser!}
          className='flex flex-col gap-1.5 w-full'
        />
      </div>
    </div>
  );
};

export default User;
