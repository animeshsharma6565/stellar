export interface Plan {
  id: number;
  name: string;
  merchant: string;
  amount: number;
  intervalSeconds: number;
  description: string;
  features: string[];
}

export interface SubscriptionRecord {
  id: string;
  planName: string;
  merchant: string;
  amount: number;
  intervalSeconds: number;
  lastPaidTimestamp: number;
  status: 'Active' | 'Paused' | 'Cancelled';
  createdTimestamp: number;
}

export interface MerchantVaultState {
  vaultAddress: string;
  vaultBalance: number;
  totalCollected: number;
  activeSubscribersCount: number;
}
