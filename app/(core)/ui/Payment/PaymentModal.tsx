import { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Modal, { ModalProps } from '../Modal/Modal';
import { Post } from '../../store/types/post.types';
import { createPaymentCharge, donate } from '../../actions/post.actions';
import useNotification from '../../hooks/notifications.hooks';
import { NotificationType } from '../../utils/notifications.utils';
import PaymentForm from './PaymentForm';
import { PaymentIntentResult } from '@stripe/stripe-js';
import { useRouter } from 'next/navigation';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { SolanaIcon } from '@/app/(core)/ui/Icons/Icons';
import { useOutsideClick } from '@/app/(core)/hooks/dom.hooks';
import { ChevronDown } from 'lucide-react';
import {
  AddressLookupTableAccount,
  Connection,
  LAMPORTS_PER_SOL,
  PublicKey,
  TransactionInstruction,
  TransactionMessage,
  VersionedTransaction,
} from '@solana/web3.js';
import { fetchDigitalAsset } from '@metaplex-foundation/mpl-token-metadata';
import { publicKey } from '@metaplex-foundation/umi';
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { createJupiterApiClient, Instruction } from '@jup-ag/api';
import {
  createAssociatedTokenAccountIdempotentInstruction,
  createTransferInstruction,
  getAssociatedTokenAddressSync,
  NATIVE_MINT,
} from '@solana/spl-token';

export interface PaymentModalProps extends ModalProps {
  post: Post;
  onClose: () => void;
}

export interface PaymentModalState {
  stage: number;
  amount?: number;
  clientSecret: string;
  selectedWallet?: string;
  selectedToken?: { symbol: string; address: string; amount: number; rawAmount: number };
  availableTokens: { symbol: string; address: string; amount: number; rawAmount: number }[];
  paymentOption: 'fiat' | 'crypto';
  isLoading: boolean;
  isWalletConnecting: boolean;
  errors: {
    amount?: string;
  };
}

const initialState: PaymentModalState = {
  stage: 1,
  errors: {},
  paymentOption: 'fiat',
  clientSecret: '',
  isLoading: false,
  availableTokens: [],
  isWalletConnecting: false,
};

const PaymentModal: FC<PaymentModalProps> = ({ post, children, onClose, ...props }) => {
  const [state, setState] = useState(initialState);
  const [isTokenDropdownVisible, setIsTokenDropdownVisible] = useState(false);
  const [amountInUsdc, setAmountInUsdc] = useState(0);
  const tokenDropdownRef = useOutsideClick(() => setIsTokenDropdownVisible(false));
  const { createNotification } = useNotification();
  const wallet = useWallet();
  const walletModal = useWalletModal();
  const router = useRouter();
  const paymentFormRef = useRef<HTMLFormElement>(null);

  const jupiter = useMemo(() => createJupiterApiClient(), []);
  const connection = useMemo(
    () => new Connection('https://dulcinea-6wxfqx-fast-mainnet.helius-rpc.com'),
    [],
  );

  const deserializeInstruction = useCallback((instruction: Instruction) => {
    return new TransactionInstruction({
      programId: new PublicKey(instruction.programId),
      keys: instruction.accounts.map(key => ({
        pubkey: new PublicKey(key.pubkey),
        isSigner: key.isSigner,
        isWritable: key.isWritable,
      })),
      data: Buffer.from(instruction.data, 'base64'),
    });
  }, []);

  const getAddressLookupTableAccounts = useCallback(
    async (keys: string[]): Promise<AddressLookupTableAccount[]> => {
      const addressLookupTableAccountInfos = await connection.getMultipleAccountsInfo(
        keys.map(key => new PublicKey(key)),
      );

      return addressLookupTableAccountInfos.reduce((acc, accountInfo, index) => {
        const addressLookupTableAddress = keys[index];
        if (accountInfo) {
          const addressLookupTableAccount = new AddressLookupTableAccount({
            key: new PublicKey(addressLookupTableAddress),
            state: AddressLookupTableAccount.deserialize(accountInfo.data),
          });
          acc.push(addressLookupTableAccount);
        }

        return acc;
      }, new Array<AddressLookupTableAccount>());
    },
    [],
  );

  useEffect(() => {
    if (
      state.selectedToken &&
      state.selectedToken.address !== 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'
    ) {
      const intervalCallback = async () => {
        const { outAmount } = await jupiter.quoteGet({
          amount: state.selectedToken!.rawAmount,
          inputMint: state.selectedToken!.address,
          outputMint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
          dynamicSlippage: true,
          swapMode: 'ExactIn',
        });

        setAmountInUsdc(Number(outAmount) / 1_000_000);
      };

      intervalCallback();
      const interval = setInterval(intervalCallback, 5000);

      return () => {
        clearInterval(interval);
      };
    }
  }, [jupiter, state.selectedToken]);

  useEffect(() => {
    if (
      wallet.publicKey &&
      state.isWalletConnecting &&
      wallet.publicKey.toBase58() !== state.selectedWallet
    ) {
      const connection = new Connection(
        'https://dulcinea-6wxfqx-fast-mainnet.helius-rpc.com',
        'confirmed',
      );

      connection
        .getParsedTokenAccountsByOwner(wallet.publicKey, {
          programId: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
        })
        .then(async tokenAccounts => {
          const balance = await connection.getBalance(wallet.publicKey!);

          setState(prevState => ({
            ...prevState,
            availableTokens: [
              ...prevState.availableTokens,
              {
                symbol: 'SOL',
                address: NATIVE_MINT.toBase58(),
                amount: balance / LAMPORTS_PER_SOL,
                rawAmount: balance,
              },
            ],
          }));

          for (const { account } of tokenAccounts.value) {
            const info = account.data.parsed.info;
            const mint = new PublicKey(info.mint);
            const amount = Number(info.tokenAmount.uiAmount);

            const umi = createUmi('https://dulcinea-6wxfqx-fast-mainnet.helius-rpc.com');
            const asset = await fetchDigitalAsset(umi, publicKey(info.mint));

            if (amount > 0) {
              setState(prevState => ({
                ...prevState,
                availableTokens: [
                  ...prevState.availableTokens,
                  {
                    symbol: asset.metadata.symbol,
                    address: mint.toBase58(),
                    amount,
                    rawAmount: Number(info.tokenAmount.amount),
                  },
                ],
              }));
            }
          }
        });

      setState({
        ...state,
        selectedWallet: wallet.publicKey.toBase58(),
        isWalletConnecting: false,
      });
    }
  }, [state.isWalletConnecting, wallet.publicKey]);

  const handleSubmitFiat = async (result: PaymentIntentResult) => {
    if (result.error) {
      createNotification({
        type: NotificationType.Error,
        message: 'An error occurred while processing the request. Please, try again later',
      });
    } else {
      const response = await donate(
        post.id,
        result.paymentIntent.amount / 100,
        JSON.stringify(result.paymentIntent),
      );

      if (response.error || !response.data) {
        createNotification({
          type: NotificationType.Error,
          message: 'An error occurred while processing the request. Please, try again later',
        });
      } else {
        createNotification({
          type: NotificationType.Success,
          message: 'The donation was successfully created!',
        });
        router.refresh();
      }
    }

    setState(prevState => ({ ...prevState, isLoading: false }));
    onClose();
  };

  const handleSubmitCrypto = async (
    amount: number,
    signature: string,
    inputToken: string,
    payer: string,
  ) => {
    const response = await donate(
      post.id,
      amount,
      JSON.stringify({
        amount,
        signature,
        inputToken,
        payer,
      }),
    );

    if (response.error || !response.data) {
      createNotification({
        type: NotificationType.Error,
        message: 'An error occurred while processing the request. Please, try again later',
      });
    } else {
      createNotification({
        type: NotificationType.Success,
        message: 'The donation was successfully created!',
      });
      router.refresh();
    }

    setState(prevState => ({ ...prevState, isLoading: false }));
    onClose();
  };

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
            name: 'Next',
            variant: 'primary',
            disabled: state.isLoading,
            action: () => {
              setState(prevState => ({ ...prevState, stage: 2 }));
            },
          } as any,
        ];
      case 2:
        return [
          {
            type: 'close',
            name: 'Close',
            action: () => onClose(),
          },
          {
            type: 'accept',
            name: 'Continue',
            variant: 'primary',
            disabled: state.isLoading || !state.amount,
            action: async () => {
              if (!state.amount) {
                setState({
                  ...state,
                  errors: { amount: 'The donation amount is not chosen or is less than 0.01 USD' },
                });

                return;
              }

              setState(prevState => ({ ...prevState, isLoading: true }));

              if (state.paymentOption === 'fiat') {
                const response = await createPaymentCharge(state.amount);

                if (!response.error && response.data) {
                  setState(prevState => ({
                    ...prevState,
                    clientSecret: response.data!.clientSecret,
                    stage: 3,
                  }));
                } else {
                  createNotification({
                    type: NotificationType.Error,
                    message: response.error ?? 'Cannot proceed the action. Please, try again later',
                  });
                }
              } else {
                if (wallet.publicKey && state.selectedToken && wallet.signTransaction) {
                  const instructions: TransactionInstruction[] = [];
                  let addressLookupTableAddresses: string[] = [];

                  const sourceAssociatedTokenAddress = getAssociatedTokenAddressSync(
                    new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'),
                    wallet.publicKey,
                  );

                  const destinationAssociatedTokenAddress = getAssociatedTokenAddressSync(
                    new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'),
                    new PublicKey('G5ZegMhe8wwnw257tzAdWfDdYWfE2SbVwK4VEpWTYN9A'),
                  );

                  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash(
                    'finalized',
                  );

                  if (
                    state.selectedToken.address !== 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'
                  ) {
                    const quote = await jupiter.quoteGet({
                      amount: Math.floor(state.amount * 1_000_000),
                      inputMint: state.selectedToken.address,
                      outputMint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
                      dynamicSlippage: true,
                      swapMode: 'ExactOut',
                    });

                    const {
                      otherInstructions,
                      computeBudgetInstructions,
                      setupInstructions,
                      swapInstruction,
                      cleanupInstruction,
                      addressLookupTableAddresses: jupiterAddressLookupTableAddresses,
                    } = await jupiter.swapInstructionsPost({
                      swapRequest: {
                        userPublicKey: wallet.publicKey.toBase58(),
                        dynamicSlippage: true,
                        wrapAndUnwrapSol: true,
                        quoteResponse: quote,
                      },
                    });

                    const transferIx = createTransferInstruction(
                      sourceAssociatedTokenAddress,
                      destinationAssociatedTokenAddress,
                      wallet.publicKey,
                      Math.floor(state.amount * 1_000_000),
                    );

                    instructions.push(
                      ...(otherInstructions || []).map(deserializeInstruction),
                      ...(computeBudgetInstructions || []).map(deserializeInstruction),
                      ...(setupInstructions || []).map(deserializeInstruction),
                      ...[swapInstruction].map(deserializeInstruction),
                      ...(cleanupInstruction ? [cleanupInstruction] : []).map(
                        deserializeInstruction,
                      ),
                      transferIx,
                    );

                    addressLookupTableAddresses = jupiterAddressLookupTableAddresses;
                  } else {
                    const instructions = [];

                    const createSourceATAIx = createAssociatedTokenAccountIdempotentInstruction(
                      wallet.publicKey,
                      sourceAssociatedTokenAddress,
                      wallet.publicKey!,
                      new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'),
                    );

                    const createDestinationATAIx =
                      createAssociatedTokenAccountIdempotentInstruction(
                        wallet.publicKey,
                        sourceAssociatedTokenAddress,
                        new PublicKey('G5ZegMhe8wwnw257tzAdWfDdYWfE2SbVwK4VEpWTYN9A'),
                        new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'),
                      );

                    const transferIx = createTransferInstruction(
                      sourceAssociatedTokenAddress,
                      destinationAssociatedTokenAddress,
                      wallet.publicKey,
                      Math.floor(state.amount * 1_000_000),
                    );

                    instructions.push(createSourceATAIx, createDestinationATAIx, transferIx);
                  }

                  const addressLookupTableAccounts: AddressLookupTableAccount[] = [];

                  addressLookupTableAccounts.push(
                    ...(await getAddressLookupTableAccounts(addressLookupTableAddresses)),
                  );

                  const messageV0 = new TransactionMessage({
                    payerKey: wallet.publicKey,
                    instructions,
                    recentBlockhash: blockhash,
                  }).compileToV0Message(addressLookupTableAccounts);

                  const versionedTransaction = new VersionedTransaction(messageV0);

                  try {
                    const signedTransaction = await wallet.signTransaction(versionedTransaction);

                    const signature = await connection.sendRawTransaction(
                      signedTransaction?.serialize(),
                    );

                    await connection.confirmTransaction(
                      {
                        blockhash,
                        lastValidBlockHeight,
                        signature,
                      },
                      'confirmed',
                    );

                    await handleSubmitCrypto(
                      state.amount,
                      signature,
                      state.selectedToken.address,
                      wallet.publicKey.toBase58(),
                    );
                  } catch (error) {
                    console.log(error);
                    createNotification({
                      type: NotificationType.Error,
                      message: 'Something went wrong during transaction sending. Please, try again',
                    });
                  }
                }
              }

              setState(prevState => ({ ...prevState, isLoading: false }));
            },
          } as any,
        ];
      case 3:
        return [
          {
            type: 'close',
            name: 'Close',
            action: () => onClose(),
          },
          {
            type: 'accept',
            name: 'Proceed',
            variant: 'primary',
            disabled: state.isLoading,
            action: () => {
              setState(prevState => ({ ...prevState, isLoading: true }));
              if (paymentFormRef.current) {
                paymentFormRef.current.dispatchEvent(
                  new Event('submit', { cancelable: true, bubbles: true }),
                );
              } else {
                createNotification({
                  type: NotificationType.Error,
                  message: 'Cannot submit the form. Please, try again later',
                });
                setState(prevState => ({ ...prevState, isLoading: false }));
              }
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
          <h3 className='font-bold text-gray-600'>Step 1: Choose the payment option</h3>
          <p className='text-sm text-gray-500 mt-1 mb-3'>Choose the payment option to continue</p>
          <div className='flex flex-col gap-2'>
            <button
              type='button'
              className={`inline-flex p-3 border ${
                state.paymentOption === 'fiat' ? `border-red-600` : `border`
              } rounded-lg gap-3 transition-all duration-300`}
              onClick={() => setState({ ...state, paymentOption: 'fiat' })}
            >
              <label className='relative flex items-center cursor-pointer'>
                <input
                  type='radio'
                  readOnly
                  className='peer h-4 w-4 cursor-pointer appearance-none rounded-full border border-slate-300 checked:border-red-400 transition-all'
                  checked={state.paymentOption === 'fiat'}
                />
                {state.paymentOption === 'fiat' && (
                  <span className='absolute bg-red-600 w-2.5 h-2.5 rounded-full opacity-0 peer-checked:opacity-100 transition-opacity duration-200 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2'></span>
                )}
              </label>
              Fiat
            </button>
            <button
              type='button'
              className={`inline-flex p-3 border ${
                state.paymentOption === 'crypto' ? `border-red-600` : `border`
              } rounded-lg gap-3 transition-all duration-300`}
              onClick={() => setState({ ...state, paymentOption: 'crypto' })}
            >
              <label className='relative flex items-center cursor-pointer'>
                <input
                  type='radio'
                  readOnly
                  className='peer h-4 w-4 cursor-pointer appearance-none rounded-full border border-slate-300 checked:border-red-400 transition-all'
                  checked={state.paymentOption === 'crypto'}
                />
                {state.paymentOption === 'crypto' && (
                  <span className='absolute bg-red-600 w-2.5 h-2.5 rounded-full opacity-0 peer-checked:opacity-100 transition-opacity duration-200 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2'></span>
                )}
              </label>
              Crypto
            </button>
          </div>
        </div>
      )}
      {state.stage === 2 &&
        (state.paymentOption === 'fiat' ? (
          <div className='flex flex-col p-5'>
            <h3 className='font-bold text-gray-600'>Step 2: Choose the donation amount</h3>
            <p className='text-sm text-gray-500 mt-1 mb-3'>
              Choose the amount of money you would like to donate to the current post (in USD)
            </p>
            <label htmlFor='payment-amout' className='text-gray-500 text-sm font-medium mb-0.5'>
              Amount (USD):
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
        ) : (
          <div className='flex flex-col p-5'>
            <h3 className='font-bold text-gray-600'>Step 2: Choose the donation amount</h3>
            <p className='text-sm text-gray-500 mt-1 mb-3'>
              Choose the amount of money you would like to donate (in USD) and token you would like
              to use for donation (will automatically swapped)
            </p>
            <div className='flex flex-col gap-2'>
              <div className='flex flex-col'>
                <label
                  htmlFor='payment-wallet'
                  className='text-gray-500 text-sm font-medium mb-0.5'
                >
                  Wallet:
                </label>
                <div className='flex gap-3'>
                  <input
                    defaultValue={state.selectedWallet}
                    type='text'
                    name='walletPublicKey'
                    readOnly
                    id='payment-modal-wallet'
                    placeholder='EDFVK31PPpHM7nnv6NUSMTGko46v1u5j8TXnXje1CMPw'
                    className={`border p-2 rounded-lg flex-1 text-gray-700 read-only:text-gray-600 font-medium`}
                  />
                  <button
                    type='button'
                    className='inline-flex cursor-pointer px-5 justify-center items-center border rounded-lg p-2 font-medium text-gray-500 text-center hover:bg-slate-100 transition-[0.3s_ease]'
                    onClick={() => {
                      setState({ ...state, selectedWallet: undefined, isWalletConnecting: true });
                      walletModal.setVisible(true);
                    }}
                  >
                    <SolanaIcon className='size-5 me-3' />
                    Connect
                  </button>
                </div>
              </div>
              {state.selectedWallet && (
                <div className='flex flex-col relative col-span-2'>
                  <label
                    htmlFor='payment-token'
                    className='text-gray-500 text-sm font-medium mb-0.5'
                  >
                    Token:
                  </label>
                  <span
                    id='payment-token'
                    className='select-none bg-slate-100 input-like border p-2 rounded-lg inline-flex justify-between items-center'
                    tabIndex={0}
                    onClick={() => setIsTokenDropdownVisible(true)}
                  >
                    {state.selectedToken
                      ? `${state.selectedToken.symbol} (balance: ${state.selectedToken.amount} ≈ $${
                          state.selectedToken.address ===
                          'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'
                            ? parseFloat(state.selectedToken.amount.toFixed(2))
                            : parseFloat(amountInUsdc.toFixed(2))
                        })`
                      : '-'}
                    <ChevronDown className='size-4' />
                  </span>
                  {isTokenDropdownVisible && (
                    <div
                      ref={tokenDropdownRef}
                      className='absolute flex z-100 flex-col w-full top-full mt-2 bg-white rounded-lg max-h-[150px] overflow-y-auto shadow border border-slate-100 p-1'
                    >
                      {state.availableTokens.map(token => (
                        <span
                          key={token.address}
                          onClick={() => {
                            setState({
                              ...state,
                              selectedToken: token,
                            });
                            setIsTokenDropdownVisible(false);
                          }}
                          className='py-1 px-2 hover:bg-slate-50 transition-all duration-300 cursor-pointer text-sm text-slate-500'
                        >
                          <span className='text-slate-800'>
                            {token.symbol} (balance: {token.amount})
                          </span>{' '}
                          <span className='whitespace-nowrap'>Address: {token.address}</span>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
              {state.selectedToken && (
                <div className='flex flex-col'>
                  <label
                    htmlFor='payment-amount'
                    className='text-gray-500 text-sm font-medium mb-0.5'
                  >
                    Amount (USD):
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
                    <span className='text-xs text-red-500 mt-1 font-medium'>
                      {state.errors.amount}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      {state.stage === 3 &&
        (state.paymentOption === 'fiat' ? (
          <div className='flex flex-col p-5'>
            <h3 className='font-bold text-gray-600'>
              Step 3: Choose the payment method and fill out required fields
            </h3>
            <p className='text-sm text-gray-500 mt-1 mb-3'>
              Fill out the form with payment method details to make a donation
            </p>
            <PaymentForm
              clientSecret={state.clientSecret}
              post={post}
              ref={paymentFormRef}
              onSubmit={handleSubmitFiat}
            />
          </div>
        ) : (
          <></>
        ))}
    </Modal>
  );
};

export default PaymentModal;
