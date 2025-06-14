import { getAuthInfo } from '@/app/(core)/actions/auth.actions';
import { getUser } from '@/app/(core)/actions/user.actions';
import UserDetails from '@/app/(core)/ui/User/UserDetails';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { FC } from 'react';

export interface UserDetailsPageProps {
  params: any;
}

const fetchData = async (id: string) => {
  const user = await getUser(id, {
    include: {
      posts: {
        where: { isDraft: false },
        include: {
          donations: true,
          reactions: { include: { user: true }, orderBy: { createdAt: 'desc' } },
          comments: true,
          categoriesToPosts: true,
        },
      },
      followers: { include: { follower: true } },
      followings: { include: { user: true } },
    },
  });
  const authenticatedUser = await getAuthInfo();

  return { authenticatedUser, user };
};

export const generateMetadata = async ({ params }: UserDetailsPageProps): Promise<Metadata> => {
  const { id } = await params;
  const { user } = await fetchData(id);

  return {
    title: `${user?.firstName} ${user?.lastName} | Funders`,
    description: `Funders - User: ${user?.firstName} ${user?.lastName}`,
  };
};

const UserDetailsPage: FC<UserDetailsPageProps> = async ({ params }) => {
  const { id } = await params;
  const { user } = await fetchData(id);

  if (!user) {
    notFound();
  }

  return (
    <div className='flex flex-col h-full'>
      <UserDetails user={user} className='flex flex-col h-full' />
    </div>
  );
};

export default UserDetailsPage;
