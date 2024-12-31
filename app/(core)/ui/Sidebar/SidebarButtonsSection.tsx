'use client';

import { signOut } from '@/app/(core)/actions/auth.actions';
import { SignOutIcon } from '@/app/(core)/ui/Icons/Icons';
import { FC, HTMLAttributes } from 'react';

export interface SidebarButtonsSectionProps extends HTMLAttributes<HTMLDivElement> {}

const SidebarButtonsSection: FC<SidebarButtonsSectionProps> = ({ ...props }) => {
  return (
    <div {...props}>
      <button
        onClick={() => signOut()}
        className='inline-flex items-center p-3 md:px-5 md:py-3 font-medium hover:bg-slate-100 transition-[0.3s_ease] rounded-xl text-gray-500'
      >
        <SignOutIcon className='size-5 stroke-2 md:me-3' />
        <span className='hidden md:inline'>Sign out</span>
      </button>
    </div>
  );
};

export default SidebarButtonsSection;
