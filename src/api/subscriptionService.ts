import apiRequest from './apiClient';
import { Subscription } from '../types/models';

export const getActiveSubscription = async (): Promise<{
  active: boolean;
  subscription: Subscription | null;
  message?: string;
}> => {
  return await apiRequest<{
    active: boolean;
    subscription: Subscription | null;
    message?: string;
  }>('/subscriptions/active');
};

export const getSubscriptionHistory = async (): Promise<Subscription[]> => {
  return await apiRequest<Subscription[]>('/subscriptions/history');
};

export interface CreateSubscriptionInput {
  subscriptionType: string;
  startDate: string;
  endDate: string;
  paymentReference?: string;
  amount?: number;
}

export const createSubscription = async (
  data: CreateSubscriptionInput,
): Promise<{
  message: string;
  subscription: Subscription;
}> => {
  return await apiRequest('/subscriptions', 'POST', data);
};

export const cancelSubscription = async (
  subscriptionId: number,
): Promise<{
  message: string;
  subscription: Subscription;
}> => {
  return await apiRequest(`/subscriptions/${subscriptionId}/cancel`, 'POST');
};
