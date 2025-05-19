import apiRequest from './apiClient';
import { Subscription } from '../types/models'; // Ensure Subscription model is well-defined
// ApiResponse is implicitly handled by apiRequest

// --- Define interfaces for the *actual data payloads* your backend sends ---
// --- These will be the TData in apiRequest<TData> ---

// For GET /subscriptions/active
export interface ActiveSubscriptionPayload {
  // Exporting if used elsewhere
  active: boolean;
  subscription: Subscription | null; // Subscription can be null if not active
  message?: string;
}

// For GET /subscriptions/history
type SubscriptionHistoryPayload = Subscription[]; // Array of Subscription objects

// For POST /subscriptions
interface CreateSubscriptionPayload {
  message: string;
  subscription: Subscription; // The created Subscription object
}

// For POST /subscriptions/:subscriptionId/cancel
interface CancelSubscriptionPayload {
  message: string;
  subscription: Subscription; // The (now likely inactive) Subscription object
}

// For GET /subscriptions/plans
export interface SubscriptionPlanPayload {
  // Exporting as it's a complex type used in return
  id: number; // Plan ID
  name: string;
  description: string;
  price: number; // Assuming in a standard currency unit
  durationDays: number;
  features: string[]; // Array of feature descriptions
  isPopular?: boolean; // Optional flag
}
type SubscriptionPlansListPayload = SubscriptionPlanPayload[];

// For POST /subscriptions/initiate-payment
interface InitiatePaymentPayload {
  paymentUrl: string; // URL to redirect user for payment
  paymentId: string; // Payment provider's transaction ID
  expiresAt?: string; // ISO date string for when the payment link/session expires
}

// For POST /subscriptions/verify-payment
interface VerifyPaymentPayload {
  success: boolean;
  message: string;
  subscription?: Subscription; // The newly activated subscription, if payment was successful
}

// For GET /subscriptions/usage
export interface SubscriptionUsagePayload {
  // Exporting for potential use elsewhere
  daysRemaining: number;
  percentUsed: number; // Percentage of duration used
  expiresAt: string; // ISO date string
  features: {
    [key: string]: {
      // Dynamic keys for different features
      limit: number | string; // Limit could be numeric or 'unlimited'
      used: number;
      remaining: number | string; // Could be numeric or 'unlimited'
      percentUsed?: number; // Optional
    };
  };
}

// For POST /subscriptions/promo-code
interface ApplyPromoCodePayload {
  valid: boolean;
  message: string;
  discountPercent?: number;
  discountAmount?: number; // Fixed amount discount
  expiresAt?: string; // Expiry of the promo code itself
  // Potentially other fields like 'newPrice', 'applicablePlanIds'
}

// --- Service Input DTOs ---
export interface CreateSubscriptionInput {
  // This is fine
  subscriptionType: string; // e.g., 'monthly_premium', 'annual_basic'
  startDate?: string; // ISO String, backend might default to now if not provided
  endDate?: string; // ISO String, backend might calculate based on type/duration if not provided
  paymentReference?: string;
  amount?: number; // Amount paid
}

// --- Service Functions ---

export const getActiveSubscription =
  async (): Promise<ActiveSubscriptionPayload> => {
    try {
      const response = await apiRequest<ActiveSubscriptionPayload>(
        '/subscriptions/active',
      );
      if (!response.data || typeof response.data !== 'object') {
        console.warn(
          'No active subscription data received, returning defaults.',
        );
        return {
          active: false,
          subscription: null,
          message: 'No active subscription information available.',
        };
      }
      // Ensure boolean and nullability are correct
      return {
        active: !!response.data.active,
        subscription: response.data.subscription || null, // Ensure subscription is null if not present
        message: response.data.message,
      };
    } catch (error: any) {
      // If 404 or other error means no active subscription, return default
      console.error('Error fetching active subscription:', error);
      return {
        active: false,
        subscription: null,
        message: 'Could not retrieve subscription status.',
      };
    }
  };

export const getSubscriptionHistory =
  async (): Promise<SubscriptionHistoryPayload> => {
    const response = await apiRequest<SubscriptionHistoryPayload>(
      '/subscriptions/history',
    );
    return response.data || [];
  };

export const createSubscription = async (
  data: CreateSubscriptionInput,
): Promise<CreateSubscriptionPayload> => {
  const response = await apiRequest<CreateSubscriptionPayload>(
    '/subscriptions',
    'POST',
    data,
  );
  if (!response.data)
    throw new Error(
      'Failed to create subscription: No data returned from server.',
    );
  return response.data;
};

export const cancelSubscription = async (
  subscriptionId: number,
): Promise<CancelSubscriptionPayload> => {
  const response = await apiRequest<CancelSubscriptionPayload>(
    `/subscriptions/${subscriptionId}/cancel`,
    'POST',
  );
  if (!response.data)
    throw new Error(
      `Failed to cancel subscription ${subscriptionId}: No data returned.`,
    );
  return response.data;
};

export const getSubscriptionPlans =
  async (): Promise<SubscriptionPlansListPayload> => {
    const response = await apiRequest<SubscriptionPlansListPayload>(
      '/subscriptions/plans',
    );
    return response.data || [];
  };

export const initiatePayment = async (
  planId: number,
  paymentMethod: string,
): Promise<InitiatePaymentPayload> => {
  const response = await apiRequest<InitiatePaymentPayload>(
    '/subscriptions/initiate-payment',
    'POST',
    { planId, paymentMethod },
  );
  if (!response.data)
    throw new Error(
      `Failed to initiate payment for plan ${planId}: No data returned.`,
    );
  return response.data;
};

export const verifyPayment = async (
  paymentId: string,
): Promise<VerifyPaymentPayload> => {
  const response = await apiRequest<VerifyPaymentPayload>(
    '/subscriptions/verify-payment',
    'POST',
    { paymentId },
  );
  if (!response.data || typeof response.data !== 'object') {
    console.warn('Payment verification response malformed, returning failure.');
    return {
      success: false,
      message: 'Payment verification failed: Invalid response from server.',
    };
  }
  return response.data;
};

export const getSubscriptionUsage =
  async (): Promise<SubscriptionUsagePayload> => {
    const defaultUsage: SubscriptionUsagePayload = {
      // For DRY
      daysRemaining: 0,
      percentUsed: 0,
      expiresAt: new Date(0).toISOString(),
      features: {},
    };
    try {
      const response = await apiRequest<SubscriptionUsagePayload>(
        '/subscriptions/usage',
      );
      if (!response.data || typeof response.data !== 'object') {
        console.warn('No subscription usage data, returning defaults.');
        return defaultUsage;
      }
      return {
        // Ensure features is an object
        ...defaultUsage, // Provide base structure
        ...response.data,
        features: response.data.features || {},
      };
    } catch (error: any) {
      console.error('Error fetching subscription usage:', error);
      return defaultUsage;
    }
  };

export const applyPromoCode = async (
  promoCode: string,
): Promise<ApplyPromoCodePayload> => {
  try {
    const response = await apiRequest<ApplyPromoCodePayload>(
      '/subscriptions/promo-code',
      'POST',
      { promoCode },
    );
    if (!response.data || typeof response.data !== 'object') {
      console.warn('Promo code response malformed, returning invalid.');
      return {
        valid: false,
        message: 'Invalid promotional code: Server error.',
      };
    }
    return response.data;
  } catch (error: any) {
    // Often, a 400 or 404 from backend means "invalid promo code"
    if (error.status === 400 || error.status === 404) {
      console.info(`Promo code "${promoCode}" is invalid or not found.`);
      return {
        valid: false,
        message: error.message || 'Invalid or expired promotional code.',
      };
    }
    console.error(`Error applying promo code "${promoCode}":`, error);
    return {
      valid: false,
      message: 'Could not apply promotional code at this time.',
    };
  }
};
