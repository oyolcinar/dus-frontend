// src/api/subscriptionService.ts
import apiRequest from './apiClient';
import { Subscription } from '../types/models';
import { ApiResponse } from '../types/api';

// Response interfaces for subscription endpoints
interface ActiveSubscriptionResponse
  extends ApiResponse<{
    active: boolean;
    subscription: Subscription | null;
    message?: string;
  }> {}

interface SubscriptionHistoryResponse extends ApiResponse<Subscription[]> {}

interface CreateSubscriptionResponse
  extends ApiResponse<{
    message: string;
    subscription: Subscription;
  }> {}

interface CancelSubscriptionResponse
  extends ApiResponse<{
    message: string;
    subscription: Subscription;
  }> {}

interface SubscriptionPlansResponse
  extends ApiResponse<
    Array<{
      id: number;
      name: string;
      description: string;
      price: number;
      durationDays: number;
      features: string[];
      isPopular: boolean;
    }>
  > {}

interface InitiatePaymentResponse
  extends ApiResponse<{
    paymentUrl: string;
    paymentId: string;
    expiresAt: string;
  }> {}

interface VerifyPaymentResponse
  extends ApiResponse<{
    success: boolean;
    message: string;
    subscription?: Subscription;
  }> {}

export interface CreateSubscriptionInput {
  subscriptionType: string;
  startDate: string;
  endDate: string;
  paymentReference?: string;
  amount?: number;
}

/**
 * Get the currently active subscription for the user
 * @returns Object with active status and subscription details
 */
export const getActiveSubscription = async (): Promise<{
  active: boolean;
  subscription: Subscription | null;
  message?: string;
}> => {
  const response = await apiRequest<ActiveSubscriptionResponse>(
    '/subscriptions/active',
  );

  if (!response.data) {
    return {
      active: false,
      subscription: null,
      message: 'No active subscription found',
    };
  }

  return response.data;
};

/**
 * Get the subscription history for the current user
 * @returns Array of past and current subscriptions
 */
export const getSubscriptionHistory = async (): Promise<Subscription[]> => {
  const response = await apiRequest<SubscriptionHistoryResponse>(
    '/subscriptions/history',
  );
  return response.data || [];
};

/**
 * Create a new subscription
 * @param data Subscription details including type, dates and payment info
 * @returns Created subscription with success message
 */
export const createSubscription = async (
  data: CreateSubscriptionInput,
): Promise<{
  message: string;
  subscription: Subscription;
}> => {
  const response = await apiRequest<CreateSubscriptionResponse>(
    '/subscriptions',
    'POST',
    data,
  );

  if (!response.data) {
    throw new Error('Failed to create subscription');
  }

  return response.data;
};

/**
 * Cancel an existing subscription
 * @param subscriptionId ID of the subscription to cancel
 * @returns Canceled subscription with success message
 */
export const cancelSubscription = async (
  subscriptionId: number,
): Promise<{
  message: string;
  subscription: Subscription;
}> => {
  const response = await apiRequest<CancelSubscriptionResponse>(
    `/subscriptions/${subscriptionId}/cancel`,
    'POST',
  );

  if (!response.data) {
    throw new Error(`Failed to cancel subscription with ID ${subscriptionId}`);
  }

  return response.data;
};

/**
 * Get available subscription plans
 * @returns Array of subscription plans with details
 */
export const getSubscriptionPlans = async (): Promise<
  Array<{
    id: number;
    name: string;
    description: string;
    price: number;
    durationDays: number;
    features: string[];
    isPopular: boolean;
  }>
> => {
  const response = await apiRequest<SubscriptionPlansResponse>(
    '/subscriptions/plans',
  );
  return response.data || [];
};

/**
 * Initiate a payment for a subscription plan
 * @param planId ID of the subscription plan
 * @param paymentMethod Payment method to use
 * @returns Payment details including URL and expiration
 */
export const initiatePayment = async (
  planId: number,
  paymentMethod: string,
): Promise<{
  paymentUrl: string;
  paymentId: string;
  expiresAt: string;
}> => {
  const response = await apiRequest<InitiatePaymentResponse>(
    '/subscriptions/initiate-payment',
    'POST',
    {
      planId,
      paymentMethod,
    },
  );

  if (!response.data) {
    throw new Error(`Failed to initiate payment for plan with ID ${planId}`);
  }

  return response.data;
};

/**
 * Verify a payment after completion
 * @param paymentId ID of the payment to verify
 * @returns Verification result with optional subscription details
 */
export const verifyPayment = async (
  paymentId: string,
): Promise<{
  success: boolean;
  message: string;
  subscription?: Subscription;
}> => {
  const response = await apiRequest<VerifyPaymentResponse>(
    '/subscriptions/verify-payment',
    'POST',
    {
      paymentId,
    },
  );

  if (!response.data) {
    return {
      success: false,
      message: 'Payment verification failed',
    };
  }

  return response.data;
};

/**
 * Get subscription usage metrics
 * @returns Subscription usage details
 */
export const getSubscriptionUsage = async (): Promise<{
  daysRemaining: number;
  percentUsed: number;
  expiresAt: string;
  features: {
    [key: string]: {
      limit: number;
      used: number;
      remaining: number;
      percentUsed: number;
    };
  };
}> => {
  const response = await apiRequest<
    ApiResponse<{
      daysRemaining: number;
      percentUsed: number;
      expiresAt: string;
      features: {
        [key: string]: {
          limit: number;
          used: number;
          remaining: number;
          percentUsed: number;
        };
      };
    }>
  >('/subscriptions/usage');

  if (!response.data) {
    // Return default usage object
    return {
      daysRemaining: 0,
      percentUsed: 0,
      expiresAt: new Date().toISOString(),
      features: {},
    };
  }

  return response.data;
};

/**
 * Apply a promotional code to get a discount
 * @param promoCode Promotional code to apply
 * @returns Discount information if valid
 */
export const applyPromoCode = async (
  promoCode: string,
): Promise<{
  valid: boolean;
  message: string;
  discountPercent?: number;
  discountAmount?: number;
  expiresAt?: string;
}> => {
  const response = await apiRequest<
    ApiResponse<{
      valid: boolean;
      message: string;
      discountPercent?: number;
      discountAmount?: number;
      expiresAt?: string;
    }>
  >('/subscriptions/promo-code', 'POST', { promoCode });

  if (!response.data) {
    return {
      valid: false,
      message: 'Invalid promotional code',
    };
  }

  return response.data;
};
