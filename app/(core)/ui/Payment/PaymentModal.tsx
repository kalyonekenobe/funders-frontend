import { FC, useState } from 'react';
import Modal, { ModalProps } from '../Modal/Modal';
import { Post } from '../../store/types/post.types';
import { donate } from '../../actions/post.actions';
import useNotification from '../../hooks/notifications.hooks';
import { NotificationType } from '../../utils/notifications.utils';
import { useRouter } from 'next/navigation';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey, Transaction } from '@solana/web3.js';
import { createTransferInstruction, getAssociatedTokenAddress } from '@solana/spl-token';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';

export interface PaymentModalProps extends ModalProps {
  post: Post;
  onClose: () => void;
}

export interface PaymentModalState {
  stage: number;
  amount?: number;
  clientSecret: string;
  isLoading: boolean;
  errors: {
    amount?: string;
  };
}

const initialState: PaymentModalState = {
  stage: 1,
  errors: {},
  clientSecret: '',
  isLoading: false,
};

const PaymentModal: FC<PaymentModalProps> = ({ post, children, onClose, ...props }) => {
  const [state, setState] = useState(initialState);
  const wallet = useWallet();
  const { connection } = useConnection();
  const { createNotification } = useNotification();
  const router = useRouter();
  const modal = useWalletModal();

  const getButtonsByStage = (stage: number): ModalProps['buttons'] => {
    switch (stage) {
      case 1:
        return [
          {
            type: 'close',
            name: 'Close',
            action: () => onClose(),
          },
          {
            type: 'accept',
            name: 'Donate',
            variant: 'primary',
            disabled: state.isLoading,
            action: async () => {
              if (!state.amount) {
                setState({
                  ...state,
                  errors: {
                    amount: 'The donation amount is not chosen or is less than 0.01 USD',
                  },
                });

                return;
              }

              setState(prevState => ({ ...prevState, isLoading: true }));

              if (wallet.publicKey && wallet.sendTransaction) {
                try {
                  const associatedTokenAccountReceiver = await getAssociatedTokenAddress(
                    new PublicKey('Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr'),
                    new PublicKey('EDFVK31PPpHM7nnv6NUSMTGko46v1u5j8TXnXje1CMPw'),
                    true,
                  );
                  const associatedTokenAccountSender = await getAssociatedTokenAddress(
                    new PublicKey('Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr'),
                    wallet.publicKey,
                    true,
                  );

                  const latestBlockhash = await connection.getLatestBlockhash('finalized');

                  const transaction = new Transaction().add(
                    createTransferInstruction(
                      associatedTokenAccountSender,
                      associatedTokenAccountReceiver,
                      wallet.publicKey,
                      state.amount * 1_000_000,
                    ),
                  );

                  transaction.feePayer = wallet.publicKey;
                  transaction.recentBlockhash = latestBlockhash.blockhash;

                  await wallet.sendTransaction(transaction, connection);

                  const response = await donate(
                    post.id,
                    state.amount,
                    JSON.stringify({
                      wallet: wallet.publicKey.toBase58(),
                      amount: state.amount,
                      createdAt: Date.now(),
                    }),
                  );

                  if (response.error || !response.data) {
                    createNotification({
                      type: NotificationType.Error,
                      message:
                        'An error occurred while processing the request. Please, try again later',
                    });
                    setState(prevState => ({ ...prevState, isLoading: false }));
                  } else {
                    createNotification({
                      type: NotificationType.Success,
                      message: 'The donation was successfully created!',
                    });
                    setState(prevState => ({ ...prevState, isLoading: false }));
                    onClose?.();
                    router.refresh();
                  }
                } catch (error) {
                  console.log(error);
                  setState(prevState => ({ ...prevState, isLoading: false }));
                }
              } else {
                modal.setVisible(true);
                createNotification({
                  type: NotificationType.Error,
                  message:
                    'The wallet is disconnected. Please, connect the wallet to proceed the payment',
                });
                setState(prevState => ({ ...prevState, isLoading: false }));
              }
              setState(prevState => ({ ...prevState, isLoading: false }));
            },
          } as any,
        ];
      default:
        return [];
    }
  };

  return (
    <Modal {...props} buttons={getButtonsByStage(state.stage)} className='max-w-xl'>
      {state.stage === 1 && (
        <div className='flex flex-col p-5'>
          <h3 className='font-bold text-gray-600'>Choose the donation amount</h3>
          <p className='text-sm text-gray-500 mt-1 mb-3'>
            Choose the amount of money you would like to donate to the current post (in USDC)
          </p>
          <label htmlFor='payment-amout' className='text-gray-500 text-sm font-medium mb-0.5'>
            Amount (USDC):
          </label>
          <input
            type='number'
            placeholder='100'
            id='payment-amount'
            min={0.01}
            step={0.01}
            defaultValue={undefined}
            onChange={event =>
              setState({
                ...state,
                amount: event.target.value ? Number(event.target.value) : undefined,
                errors: Object.fromEntries(
                  Object.entries(state.errors).filter(([key, _]) => key !== 'amount'),
                ),
              })
            }
            className={`p-2 border rounded-lg font-medium text-gray-700 ${
              state.errors.amount ? 'border-red-500' : ''
            }`}
          />
          {state.errors.amount && (
            <span className='text-xs text-red-500 mt-1 font-medium'>{state.errors.amount}</span>
          )}
        </div>
      )}
    </Modal>
  );
};

export default PaymentModal;
