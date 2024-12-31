import { FC, HTMLAttributes } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { getAuthInfo } from '@/app/(core)/actions/auth.actions';
import { Post as PostType } from '@/app/(core)/store/types/post.types';
import { ApplicationRoutes } from '@/app/(core)/utils/routes.utils';
import { resolveImage } from '@/app/(core)/utils/app.utils';
import PostOptionsButton from '@/app/(core)/ui/Post/PostOptionsButton';
import { GearIcon } from '@/app/(core)/ui/Icons/Icons';
import Progress from '@/app/(core)/ui/Progress/Progress';
import PostFooter from '@/app/(core)/ui/Post/PostFooter';

export interface PostProps extends HTMLAttributes<HTMLDivElement> {
  post: PostType;
}

const fetchData = async () => {
  const authenticatedUser = await getAuthInfo();

  return { authenticatedUser };
};

const Post: FC<PostProps> = async ({ post, ...props }) => {
  const intl = Intl.DateTimeFormat('en-US', { dateStyle: 'long', timeStyle: 'short' });
  const { authenticatedUser } = await fetchData();

  return (
    <article {...props}>
      <div className='flex flex-col p-5'>
        <header>
          <div className='flex justify-between items-center mb-5'>
            <Link
              href={ApplicationRoutes.UserDetails.replace(':id', post.authorId)}
              className='inline-flex'
            >
              <div className='flex items-center'>
                <div className='w-[35px] h-[35px] flex flex-1 aspect-square rounded relative me-3 overflow-hidden'>
                  <Image
                    src={resolveImage(post.author?.avatar, 'default-profile-image')}
                    alt={`${post.author?.firstName} ${post.author?.lastName}'s profile image`}
                    fill={true}
                    sizes='100%, 100%'
                    className='object-cover'
                  />
                </div>
                <div className='flex flex-col'>
                  <p className='text-blue-600 hover:text-blue-700 transition-[0.3s_ease] font-medium text-sm'>
                    {post.author?.firstName} {post.author?.lastName}
                  </p>
                  <p className='font-medium text-gray-500 text-xs mt-0.5'>
                    <span className='text-xs'>{intl.format(new Date(post.createdAt))}</span>
                  </p>
                </div>
              </div>
            </Link>
            <PostOptionsButton
              post={post}
              authenticatedUser={authenticatedUser!}
              className='rounded-full hover:bg-slate-100 aspect-square p-1.5 transition-[0.3s_ease]'
            >
              <GearIcon className='size-5 stroke-[1.5px] text-gray-700' />
            </PostOptionsButton>
          </div>
          <div className='flex relative aspect-video rounded overflow-hidden'>
            <Image
              src={resolveImage(post.image, 'post-image-placeholder')}
              className='object-cover'
              alt={post.title}
              fill={true}
              sizes='100%, 100%'
              priority={true}
            />
          </div>
          <h3 className='font-bold text-2xl mt-3'>
            {post.title}{' '}
            {post.isDraft && (
              <span className='ms-1 bg-neutral-200 px-2 py-0.5 rounded text-base align-middle font-medium text-slate-600'>
                Draft
              </span>
            )}
          </h3>
          <div className='flex gap-2 mt-1 flex-wrap'>
            {post.categories?.map(category => (
              <span
                key={category.category}
                className='bg-indigo-400 text-white font-medium text-xs px-2 py-0.5 rounded'
              >
                {category.category}
              </span>
            ))}
          </div>
        </header>
        <div className='flex flex-col w-full mt-5'>
          <Progress
            current={
              post.donations?.reduce(
                (previousValue, currentValue) => (previousValue += Number(currentValue.donation)),
                0,
              ) || 0
            }
            goal={Number(post.fundsToBeRaised)}
            height={16}
            measure='$'
          />
        </div>
      </div>
      <PostFooter post={post} authenticatedUser={authenticatedUser!} />
    </article>
  );
};

export default Post;
