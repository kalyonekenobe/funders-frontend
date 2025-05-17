import { MessageSquare } from 'lucide-react';
import { FC } from 'react';

const ChatDetailsFallback: FC = () => {
  return (
    <div className='flex flex-col items-center justify-center h-full p-4 space-y-4 text-center'>
      <MessageSquare className='size-15 text-primary-300' />
      <h2 className='text-2xl text-primary-500 font-bold'>No Chat Selected</h2>
      <p className='text-primary-400 max-w-md'>
        Choose an existing conversation from the sidebar or start a new chat to begin.
      </p>
    </div>
  );
};

export default ChatDetailsFallback;
