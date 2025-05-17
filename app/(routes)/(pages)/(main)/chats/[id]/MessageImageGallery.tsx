'use client';

import React, { useEffect, useState } from 'react';
import { LoaderCircle } from 'lucide-react';
import { ChatMessageAttachment } from '@/app/(core)/types/chat/chat-message-attachment.types';
import { getChatAttachmentUrl } from '@/app/(core)/utils/chat.utils';
import { resolveImage } from '@/app/(core)/utils/app.utils';

// Extend the ChatMessageAttachment type to include tempUrl
interface ExtendedChatMessageAttachment extends ChatMessageAttachment {
  tempUrl?: string;
}

interface MessageImageGalleryProps {
  attachments: ExtendedChatMessageAttachment[];
  isPending?: boolean;
  className?: string;
}

const MessageImageGallery: React.FC<MessageImageGalleryProps> = ({ attachments, isPending }) => {
  const [ratios, setRatios] = useState<number[]>([]);
  const [isCalculating, setIsCalculating] = useState(true);

  useEffect(() => {
    const calculateRatios = async () => {
      setIsCalculating(true);
      const newRatios = await Promise.all(
        attachments.map(attachment => {
          return new Promise<number>(resolve => {
            const img = new Image();
            const url = attachment.tempUrl || getChatAttachmentUrl(attachment);
            img.src = url;
            img.onload = () => resolve(img.width / img.height);
            img.onerror = () => resolve(1);
          });
        }),
      );
      setRatios(newRatios);
      setIsCalculating(false);
    };

    calculateRatios();
  }, [attachments]);

  if (isCalculating) {
    return (
      <div className='w-full max-w-[600px] !min-w-48 h-48 rounded-lg overflow-hidden relative bg-gray-800'>
        <div className='absolute inset-0 z-10 flex items-center justify-center'>
          <LoaderCircle />
        </div>
      </div>
    );
  }

  const getImageUrl = (attachment: ExtendedChatMessageAttachment, index: number) => {
    // Prefer tempUrl (blob) if available
    if (attachments[index]?.tempUrl) {
      return attachments[index].tempUrl;
    }

    // Otherwise use the location from Supabase
    return getChatAttachmentUrl(attachment);
  };

  const handleImageError = (attachment: ExtendedChatMessageAttachment, index: number) => {
    // If blob URL fails, force using the Supabase URL
    if (attachments[index]?.tempUrl) {
      // Update the src directly to the Supabase URL
      const imgElement = document.getElementById(
        `img-${attachment.id || index}`,
      ) as HTMLImageElement;
      if (imgElement) {
        imgElement.src = resolveImage(attachment.location);
      }
    }
  };

  const renderImage = (attachment: ExtendedChatMessageAttachment, index: number) => (
    <img
      id={`img-${attachment.id || index}`}
      src={getImageUrl(attachment, index)}
      alt=''
      className='object-cover w-full h-full rounded-lg'
      loading='lazy'
      onError={() => handleImageError(attachment, index)}
    />
  );

  return (
    <div className='w-full max-w-[600px] !min-w-48 rounded-lg overflow-hidden relative'>
      {isPending && (
        <div className='absolute inset-0 z-10 flex items-center justify-center bg-black/20'>
          <LoaderCircle />
        </div>
      )}
      {attachments.map((attachment, index) => {
        const ratio = ratios[index] || 1;

        // If it's a single image, render it differently
        if (attachments.length === 1) {
          return (
            <div key={index} className='w-full'>
              <div className='relative h-48'>{renderImage(attachment, index)}</div>
            </div>
          );
        }

        // Handle paired layout and last single image
        if (index % 2 === 0) {
          const nextIndex = index + 1;
          const isLastSingle = nextIndex === attachments.length;

          // If it's the last image and there's no pair
          if (isLastSingle) {
            return (
              <div key={index} className='w-full'>
                <div className='relative h-48'>{renderImage(attachment, index)}</div>
              </div>
            );
          }

          // Regular paired layout
          const nextRatio = ratios[nextIndex] || 1;
          return (
            <div key={index} className='flex gap-1.5'>
              <div className='relative h-48 overflow-hidden' style={{ flex: ratio }}>
                {renderImage(attachment, index)}
              </div>
              {attachments[nextIndex] && (
                <div className='relative h-48 overflow-hidden' style={{ flex: nextRatio }}>
                  {renderImage(attachments[nextIndex], nextIndex)}
                </div>
              )}
            </div>
          );
        }
        return null;
      })}
    </div>
  );
};

export default MessageImageGallery;
