import React, { useEffect, useRef } from 'react';

export const useOutsideClick = <T extends HTMLElement = HTMLDivElement>(
  callback: () => void,
): React.RefObject<T | null> => {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        ref.current &&
        !ref.current.contains(event.target as Node) &&
        !ref.current.classList.contains('modal') &&
        !(
          (event.target as HTMLElement).closest('.modal') &&
          ref.current !== event.target &&
          !(event.target as HTMLElement).closest('.modal-close')
        )
      ) {
        callback();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [callback]);

  return ref;
};
