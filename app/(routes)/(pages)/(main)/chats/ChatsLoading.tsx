import { LoaderCircle } from 'lucide-react';
import { FC } from 'react';

const ChatsLoading: FC = () => {
  return (
    <div className='flex flex-col items-center justify-center flex-1 bg-white'>
      <div className='p-8 rounded-lg text-center'>
        <LoaderCircle className='size-24 mb-4 text-primary-800 animate-spin mx-auto' />
        <h1 className='text-2xl font-semibold mb-2'>Loading...</h1>
        <p className='text-primary-600'>Please wait while we prepare your content.</p>
      </div>
    </div>
  );
};

export default ChatsLoading;
