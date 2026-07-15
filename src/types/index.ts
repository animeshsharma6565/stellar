export interface StakingStrategy {
  id: number;
  name: string;
  operator: string;
  apyBps: number; // APY in basis points (e.g. 800)
  lockupSeconds: number;
  description: string;
  features: string[];
}

export interface StakingPositionRecord {
  id: string;
  strategyName: string;
  operator: string;
  principalAmount: number;
  lockupSeconds: number;
  lastCheckpointTimestamp: number;
  status: 'Active' | 'Paused' | 'Terminated';
  initiatedTimestamp: number;
}

export interface LiquidityVaultState {
  vaultAddress: string;
  vaultBalance: number;
  totalYieldAggregated: number;
  activeStakersCount: number;
}
