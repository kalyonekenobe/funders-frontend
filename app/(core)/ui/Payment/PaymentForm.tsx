'use client';

import { Elements, useElements, useStripe } from '@stripe/react-stripe-js';
import { FormHTMLAttributes, ForwardedRef, forwardRef } from 'react';
import { PaymentIntentResult, loadStripe } from '@stripe/stripe-js';
import { Post } from '@/app/(core)/store/types/post.types';

export interface PaymentFormProps extends Omit<FormHTMLAttributes<HTMLFormElement>, 'onSubmit'> {
  clientSecret: string;
  post: Post;
  onSubmit: (result: PaymentIntentResult) => void;
}

const PaymentForm = forwardRef<HTMLFormElement, PaymentFormProps>(
  ({ post, clientSecret, ...props }, ref) => {
    return (
      <Elements
        stripe={loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY || '')}
        options={{ clientSecret }}
      >
        <PaymentFormContent post={post} {...props} ref={ref} clientSecret={clientSecret} />
      </Elements>
    );
  },
);

const PaymentFormContent = forwardRef<HTMLFormElement, PaymentFormProps>(
  ({ post, children, clientSecret, onSubmit, ...props }, ref: ForwardedRef<HTMLFormElement>) => {
    const stripe = useStripe();
    const elements = useElements();

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      try {
        if (!stripe || !elements) return;
        const response = await stripe?.confirmPayment({ elements, redirect: 'if_required' });
        onSubmit(response);
      } catch (error) {
        console.log(error);
      }
    };

    return (
      <form onSubmit={handleSubmit} {...props} ref={ref}>
        {/* <PaymentElement /> */}
      </form>
    );
  },
);

export default PaymentForm;
