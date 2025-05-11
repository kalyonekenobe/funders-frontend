'use client';

import { FC, FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import useNotification from '@/app/(core)/hooks/notifications.hooks';
import { NotificationType } from '@/app/(core)/utils/notifications.utils';
import { extractAccountCompletionMetadata, signUp } from '@/app/(core)/actions/auth.actions';
import { HttpStatusCode } from 'axios';
import { useWallet } from '@solana/wallet-adapter-react';
import { SolanaIcon } from '@/app/(core)/ui/Icons/Icons';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { ApplicationRoutes } from '@/app/(core)/utils/routes.utils';
import _ from 'lodash';

export interface AccountCompletionFormState {
  isWalletConnecting: boolean;
  selectedWallet?: string;
  isLoaded: boolean;
  errors: any;
}

interface AccountCompletionFormMetadataState {
  isLoaded: boolean;
  email: string | null;
  provider: string | null;
}

const initialState: AccountCompletionFormState = {
  errors: {},
  isWalletConnecting: false,
  isLoaded: false,
};

const initialMetadataState: AccountCompletionFormMetadataState = {
  isLoaded: false,
  email: null,
  provider: null,
};

const AccountCompletionForm: FC = () => {
  const { createNotification } = useNotification();
  const [state, setState] = useState(initialState);
  const [metadata, setMetadata] = useState(initialMetadataState);
  const router = useRouter();
  const wallet = useWallet();
  const walletModal = useWalletModal();

  useEffect(() => {
    setMetadata({ ...metadata, isLoaded: true });
    setState({ ...state, isLoaded: true });
  }, []);

  useEffect(() => {
    if (state.isLoaded && wallet.publicKey && !state.isWalletConnecting) {
      wallet.publicKey = null;
      localStorage.removeItem('walletName');
      wallet.disconnect();
    }
  }, [state.isLoaded, wallet.publicKey, state.isWalletConnecting]);

  useEffect(() => {
    if (wallet.publicKey && state.isWalletConnecting) {
      setState({
        ...state,
        selectedWallet: wallet.publicKey.toBase58(),
        errors: {
          ...state.errors,
          nested: Object.fromEntries(
            Object.entries(state.errors.nested || {}).filter(([key, _]) => key !== 'walletPublicKey'),
          ),
        },
        isWalletConnecting: false,
      });
    }
  }, [state.isWalletConnecting, wallet.publicKey]);

  useEffect(() => {
    if (metadata.isLoaded) {
      const request = async () => {
        const response = await extractAccountCompletionMetadata();

        if (response.notify) {
          const type =
            response.status === HttpStatusCode.Created
              ? NotificationType.Success
              : NotificationType.Error;
          const message =
            response.status === HttpStatusCode.Created
              ? response.data.message || 'The user was successfully registered'
              : response.data.error ||
                'Cannot load account completion form due to the server error';

          createNotification({ type, message });
        }

        if (response.status === HttpStatusCode.TemporaryRedirect) {
          router.push(response.data.redirectUrl || ApplicationRoutes.SignUp);
        }

        if (response.status === HttpStatusCode.Created) {
          setMetadata({
            ...metadata,
            email: response.data.email,
            provider: response.data.provider,
          });
        }
      };

      request().catch(console.error);
    }
  }, [metadata.isLoaded]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await submit(new FormData(event.target as HTMLFormElement));
  };

  const submit = async (formData: FormData) => {
    if (metadata.isLoaded && metadata.email && metadata.provider) {
      formData.append('email', metadata.email);
      formData.append('registrationMethod', _.capitalize(metadata.provider));
      const response = await signUp(state, formData);
      setState(response);

      if (response.errors.global) {
        createNotification({
          type: NotificationType.Error,
          message: response.errors.global,
        });
      }

      if (!response.errors.global && !response.errors.nested) {
        createNotification({
          type: NotificationType.Success,
          message: 'The user was successfully authorized',
        });
        router.push(ApplicationRoutes.Home);
      }
    }
  };

  return (
    <form className='flex flex-col max-w-md w-full p-3' onSubmit={handleSubmit}>
      <h3 className='text-center font-semibold text-gray-500 text-2xl'>Account completion</h3>
      <p className='text-gray-400 text-sm mt-5'>
        We need to know a little more information about you, so please fill in the following fields
      </p>
      <div className='flex flex-col mt-5'>
        <div className='flex flex-col gap-y-3'>
          <div className='flex flex-col'>
            <label
              htmlFor='account-completion-first-name'
              className='text-gray-500 font-medium text-sm mb-1'
            >
              First name:
            </label>
            <input
              type='text'
              name='firstName'
              id='account-completion-first-name'
              placeholder='John'
              className={`border p-3 rounded-lg text-gray-700 font-medium ${
                state.errors.nested?.firstName ? `border-red-500` : ``
              }`}
              onChange={() =>
                setState({
                  ...state,
                  errors: {
                    ...state.errors,
                    nested: Object.fromEntries(
                      Object.entries(state.errors.nested || {}).filter(
                        ([key, _]) => key !== 'firstName',
                      ),
                    ),
                  },
                })
              }
            />
            {state.errors.nested?.firstName?.map((error: string, index: number) => (
              <span key={index} className='text-red-500 text-xs font-medium mt-1 text-justify'>
                {error}
              </span>
            ))}
          </div>
          <div className='flex flex-col'>
            <label
              htmlFor='account-completion-last-name'
              className='text-gray-500 font-medium text-sm mb-1'
            >
              Last name:
            </label>
            <input
              type='text'
              name='lastName'
              id='account-completion-last-name'
              placeholder='Doe'
              className={`border p-3 rounded-lg text-gray-700 font-medium ${
                state.errors.nested?.lastName ? `border-red-500` : ``
              }`}
              onChange={() =>
                setState({
                  ...state,
                  errors: {
                    ...state.errors,
                    nested: Object.fromEntries(
                      Object.entries(state.errors.nested || {}).filter(
                        ([key, _]) => key !== 'lastName',
                      ),
                    ),
                  },
                })
              }
            />
            {state.errors.nested?.lastName?.map((error: string, index: number) => (
              <span key={index} className='text-red-500 text-xs font-medium mt-1 text-justify'>
                {error}
              </span>
            ))}
          </div>
          <div className='flex flex-col'>
            <label
              htmlFor='account-completion-birth-date'
              className='text-gray-500 font-medium text-sm mb-1'
            >
              Birth date:
            </label>
            <input
              type='date'
              name='birthDate'
              id='account-completion-birth-date'
              placeholder='John'
              className={`border p-3 rounded-lg text-gray-700 font-medium ${
                state.errors.nested?.birthDate ? `border-red-500` : ``
              }`}
              onChange={() =>
                setState({
                  ...state,
                  errors: {
                    ...state.errors,
                    nested: Object.fromEntries(
                      Object.entries(state.errors.nested || {}).filter(
                        ([key, _]) => key !== 'birthDate',
                      ),
                    ),
                  },
                })
              }
            />
            {state.errors.nested?.birthDate?.map((error: string, index: number) => (
              <span key={index} className='text-red-500 text-xs font-medium mt-1 text-justify'>
                {error}
              </span>
            ))}
          </div>
          <div className='flex flex-col sm:col-span-2'>
            <label
              htmlFor='sign-up-confirm-password'
              className='text-gray-500 font-medium text-sm mb-1'
            >
              Wallet:
            </label>
            <div className='flex gap-3'>
              <input
                defaultValue={state.selectedWallet}
                type='text'
                name='walletPublicKey'
                readOnly
                id='sign-up-wallet'
                placeholder='EDFVK31PPpHM7nnv6NUSMTGko46v1u5j8TXnXje1CMPw'
                className={`border p-3 rounded-lg flex-1 text-gray-700 read-only:text-gray-500 font-medium ${
                  state.errors.nested?.walletPublicKey ? `border-red-500` : ``
                }`}
              />
              <button
                type='button'
                className='inline-flex px-5 justify-center items-center border rounded-lg p-2.5 font-medium text-gray-500 text-center hover:bg-slate-100 transition-[0.3s_ease]'
                onClick={() => {
                  setState({ ...state, selectedWallet: undefined, isWalletConnecting: true });
                  walletModal.setVisible(true);
                }}
              >
                <SolanaIcon className='size-5 me-3' />
                Connect
              </button>
            </div>
            {state.errors.nested?.walletPublicKey?.map((error: string, index: number) => (
              <span key={index} className='text-red-500 text-xs font-medium mt-1 text-justify'>
                {error}
              </span>
            ))}
          </div>
          <div className='flex flex-col my-2'>
            <button className='rounded-lg p-2.5 bg-pos-0 text-white font-medium bg-red-500 hover:bg-rose-500 transition-[0.3s_ease]'>
              Create account
            </button>
          </div>
          <div className='flex flex-col items-center'>
            <p className='text-sm'>
              Already have an account?{' '}
              <Link
                href={ApplicationRoutes.SignIn}
                className='font-medium text-blue-500 cursor-pointer hover:text-blue-700 transition-[0.3s_ease]'
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </form>
  );
};

export default AccountCompletionForm;
