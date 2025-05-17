import { ChatMessageAttachment } from '@/app/(core)/types/chat/chat-message-attachment.types';

export const getChatAttachmentUrl = (attachment: ChatMessageAttachment) => {
  const realUrl = attachment.location.startsWith('blob:')
    ? attachment.location
    : `https://aljshowzwfryjtexdczf.supabase.co/storage/v1/object/public/Funders/${attachment.location}`;

  return realUrl;
};
