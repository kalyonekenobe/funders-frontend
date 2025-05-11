'use client';

import { FC, FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { authWithSSOIfAuthTokenExist, signUp } from '@/app/(core)/actions/auth.actions';
import { useRouter } from 'next/navigation';
import useNotification from '@/app/(core)/hooks/notifications.hooks';
import { NotificationType } from '@/app/(core)/utils/notifications.utils';
import { HttpStatusCode } from 'axios';
import { UserRegistrationMethodEnum } from '@/app/(core)/store/types/user-registration-method.types';
import { SolanaIcon } from '@/app/(core)/ui/Icons/Icons';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { useWallet } from '@solana/wallet-adapter-react';
import { ApplicationRoutes } from '@/app/(core)/utils/routes.utils';
import PasswordInput from '@/app/(core)/ui/Controls/PasswordInput';
import SSOAuthenticationButtons from '@/app/(core)/ui/Auth/SSOAuthenticationButtons';

export interface SignUpFormProps {}
export interface SignUpFormState {
  isLoaded: boolean;
  isWalletConnecting: boolean;
  selectedWallet?: string;
  errors: any;
}

const initialState: SignUpFormState = {
  isLoaded: false,
  isWalletConnecting: false,
  errors: {},
};

const SignUpForm: FC<SignUpFormProps> = () => {
  const [state, setState] = useState(initialState);
  const { createNotification } = useNotification();
  const router = useRouter();
  const walletModal = useWalletModal();
  const wallet = useWallet();

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await submit(new FormData(event.target as HTMLFormElement));
  };

  const submit = async (formData: FormData) => {
    formData.set('registrationMethod', UserRegistrationMethodEnum.Credentials);
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
        message: 'The user was successfully registered',
      });
      router.push(ApplicationRoutes.Home);
    }
  };

  useEffect(() => {
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
            Object.entries(state.errors.nested || {}).filter(
              ([key, _]) => key !== 'walletPublicKey',
            ),
          ),
        },
        isWalletConnecting: false,
      });
    }
  }, [state.isWalletConnecting, wallet.publicKey]);

  useEffect(() => {
    if (state.isLoaded) {
      const request = async () => {
        const response = await authWithSSOIfAuthTokenExist();

        if (response.notify) {
          const type =
            response.status === HttpStatusCode.Created
              ? NotificationType.Success
              : NotificationType.Error;
          const message =
            response.status === HttpStatusCode.Created
              ? response.data.message || 'The user was successfully registered'
              : response.data.error || 'Cannot register the user due to the server error';

          createNotification({ type, message });
        }

        if (response.status === HttpStatusCode.TemporaryRedirect) {
          router.push(response.data.redirectUrl || ApplicationRoutes.SignUp);
        }

        if (response.status === HttpStatusCode.Created) {
          router.push(ApplicationRoutes.Home);
        }
      };

      request().catch(console.error);
    }
  }, [state.isLoaded]);

  return (
    <form className='flex flex-col max-w-xl w-full p-3' onSubmit={handleSubmit}>
      <h3 className='text-center font-semibold text-gray-500 text-2xl'>Sign up</h3>
      <div className='flex flex-col mt-5'>
        <div className='grid sm:grid-cols-2 gap-3'>
          <div className='flex flex-col'>
            <label htmlFor='sign-up-first-name' className='text-gray-500 font-medium text-sm mb-1'>
              First name:
            </label>
            <input
              type='text'
              name='firstName'
              id='sign-up-first-name'
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
            <label htmlFor='sign-up-last-name' className='text-gray-500 font-medium text-sm mb-1'>
              Last name:
            </label>
            <input
              type='text'
              name='lastName'
              id='sign-up-last-name'
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
            <label htmlFor='sign-up-birth-date' className='text-gray-500 font-medium text-sm mb-1'>
              Birth date:
            </label>
            <input
              type='date'
              name='birthDate'
              id='sign-up-birth-date'
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
          <div className='flex flex-col'>
            <label htmlFor='sign-up-email' className='text-gray-500 font-medium text-sm mb-1'>
              Email:
            </label>
            <input
              type='email'
              name='email'
              id='sign-up-email'
              placeholder='example@example.com'
              className={`border p-3 rounded-lg text-gray-700 font-medium ${
                state.errors.nested?.email ? `border-red-500` : ``
              }`}
              onChange={() =>
                setState({
                  ...state,
                  errors: {
                    ...state.errors,
                    nested: Object.fromEntries(
                      Object.entries(state.errors.nested || {}).filter(
                        ([key, _]) => key !== 'email',
                      ),
                    ),
                  },
                })
              }
            />
            {state.errors.nested?.email?.map((error: string, index: number) => (
              <span key={index} className='text-red-500 text-xs font-medium mt-1 text-justify'>
                {error}
              </span>
            ))}
          </div>
          <div className='flex flex-col'>
            <label htmlFor='sign-up-password' className='text-gray-500 font-medium text-sm mb-1'>
              Password:
            </label>
            <PasswordInput
              id='sign-up-password'
              name='password'
              placeholder='Password'
              className={`border p-3 rounded-lg text-gray-700 font-medium w-full ${
                state.errors.nested?.password ? `border-red-500` : ``
              }`}
              onChange={() =>
                setState({
                  ...state,
                  errors: {
                    ...state.errors,
                    nested: Object.fromEntries(
                      Object.entries(state.errors.nested || {}).filter(
                        ([key, _]) => key !== 'password' && key !== 'confirmPassword',
                      ),
                    ),
                  },
                })
              }
            />
            {state.errors.nested?.password?.map((error: string, index: number) => (
              <span key={index} className='text-red-500 text-xs font-medium mt-1 text-justify'>
                {error}
              </span>
            ))}
          </div>
          <div className='flex flex-col'>
            <label
              htmlFor='sign-up-confirm-password'
              className='text-gray-500 font-medium text-sm mb-1'
            >
              Confirm password:
            </label>
            <PasswordInput
              id='sign-up-confirm-password'
              name='confirmPassword'
              placeholder='Confirm password'
              className={`border p-3 rounded-lg text-gray-700 font-medium w-full ${
                state.errors.nested?.confirmPassword ? `border-red-500` : ``
              }`}
              onChange={() =>
                setState({
                  ...state,
                  errors: {
                    ...state.errors,
                    nested: Object.fromEntries(
                      Object.entries(state.errors.nested || {}).filter(
                        ([key, _]) => key !== 'password' && key !== 'confirmPassword',
                      ),
                    ),
                  },
                })
              }
            />
            {state.errors.nested?.confirmPassword?.map((error: string, index: number) => (
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
          <div className='flex flex-col my-2 sm:col-span-2'>
            <button className='rounded-lg p-2.5 bg-pos-0 text-white font-medium bg-red-500 hover:bg-rose-500 transition-[0.3s_ease]'>
              Sign Up
            </button>
          </div>
          <div className='flex flex-col items-center sm:col-span-2'>
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
        <div className='flex items-center justify-center my-6 h-[2px] bg-slate-200 rounded-lg'>
          <span className='bg-white px-2 rounded-full text-sm text-slate-400 font-medium text-center'>
            OR
          </span>
        </div>
        <div className='flex flex-col gap-y-2'>
          <SSOAuthenticationButtons type='sign-up' />
        </div>
      </div>
    </form>
  );
};

export default SignUpForm;
