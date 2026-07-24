import {
  Contract,
  Address,
  TransactionBuilder,
  BASE_FEE,
  nativeToScVal,
  scValToNative,
  rpc,
} from '@stellar/stellar-sdk';
import * as freighter from '@stellar/freighter-api';
import { STELLAR_CONFIG } from '@/config/contracts';

export const getServer = () => new rpc.Server(STELLAR_CONFIG.rpcUrl);

export const toUnits = (amount: string | number): bigint =>
  BigInt(Math.round(parseFloat(String(amount)) * 10 ** STELLAR_CONFIG.tokenDecimals));

export const fromUnits = (raw: bigint | number | string | null | undefined): number =>
  raw === null || raw === undefined ? 0 : Number(BigInt(raw)) / 10 ** STELLAR_CONFIG.tokenDecimals;

export const scAddr = (a: string) => new Address(a).toScVal();
export const scI128 = (n: string | number | bigint) => nativeToScVal(n, { type: 'i128' });
export const scU32 = (n: number) => nativeToScVal(n, { type: 'u32' });
export const scU64 = (n: number | bigint) => nativeToScVal(n, { type: 'u64' });
export const scString = (s: string) => nativeToScVal(s, { type: 'string' });

export class ContractCallError extends Error {
  raw?: string;
  constructor(message: string, raw?: string) {
    super(message);
    this.raw = raw;
  }
}

/** Read-only contract call, resolved via simulation (no signature, no ledger write). */
export async function readContract(contractId: string, method: string, args: any[] = []): Promise<any> {
  const server = getServer();
  const account = await server.getAccount(STELLAR_CONFIG.admin);
  const contract = new Contract(contractId);
  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: STELLAR_CONFIG.networkPassphrase,
  })
    .addOperation(contract.call(method, ...args))
    .setTimeout(30)
    .build();

  const sim = await server.simulateTransaction(tx);
  if (rpc.Api.isSimulationError(sim)) {
    throw new ContractCallError(sim.error, sim.error);
  }
  const retval = (sim as rpc.Api.SimulateTransactionSuccessResponse).result?.retval;
  return retval ? scValToNative(retval) : null;
}

export interface InvokeResult {
  hash: string;
  value: any;
}

/** Builds, simulates, signs (via Freighter) and submits a real write transaction. */
export async function invokeContract(
  contractId: string,
  method: string,
  args: any[],
  signerAddress: string
): Promise<InvokeResult> {
  const server = getServer();
  const account = await server.getAccount(signerAddress);
  const contract = new Contract(contractId);

  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: STELLAR_CONFIG.networkPassphrase,
  })
    .addOperation(contract.call(method, ...args))
    .setTimeout(60)
    .build();

  const sim = await server.simulateTransaction(tx);
  if (rpc.Api.isSimulationError(sim)) {
    throw new ContractCallError(parseContractPanic(sim.error), sim.error);
  }

  const prepared = rpc.assembleTransaction(tx, sim).build();

  let signedXdr: string;
  try {
    signedXdr = await freighter.signTransaction(prepared.toXDR(), {
      networkPassphrase: STELLAR_CONFIG.networkPassphrase,
      accountToSign: signerAddress,
    });
  } catch (err: any) {
    const msg = err?.message || '';
    if (/declin|reject|cancel/i.test(msg)) {
      throw new ContractCallError('SIGNATURE_REJECTED');
    }
    throw err;
  }

  const signedTx = TransactionBuilder.fromXDR(signedXdr, STELLAR_CONFIG.networkPassphrase);
  const sendResult = await server.sendTransaction(signedTx);

  if (sendResult.status === 'ERROR') {
    throw new ContractCallError(
      parseContractPanic(JSON.stringify(sendResult.errorResult)),
      JSON.stringify(sendResult.errorResult)
    );
  }

  const hash = sendResult.hash;
  let getResult = await server.getTransaction(hash);
  let attempts = 0;
  while (getResult.status === rpc.Api.GetTransactionStatus.NOT_FOUND && attempts < 20) {
    await new Promise((r) => setTimeout(r, 1500));
    getResult = await server.getTransaction(hash);
    attempts++;
  }

  if (getResult.status !== rpc.Api.GetTransactionStatus.SUCCESS) {
    const raw = JSON.stringify((getResult as any).resultXdr ?? getResult);
    throw new ContractCallError(parseContractPanic(raw), raw);
  }

  const successResult = getResult as rpc.Api.GetSuccessfulTransactionResponse;
  const value = successResult.returnValue ? scValToNative(successResult.returnValue) : null;

  return { hash, value };
}

/** Soroban panic messages surface as raw simulation/result diagnostics; map the ones this app's contracts raise to something user-facing. */
function parseContractPanic(raw: string): string {
  if (/lockup period not met|not active/i.test(raw)) return 'CYCLE_NOT_DUE';
  if (/insufficient balance|insufficient allowance|insufficient vault balance/i.test(raw)) return 'INSUFFICIENT_FUNDS';
  if (/declin|reject/i.test(raw)) return 'SIGNATURE_REJECTED';
  return raw;
}

// ---- Domain reads ----

export async function fetchTokenBalance(accountAddress: string): Promise<number> {
  try {
    const raw = await readContract(STELLAR_CONFIG.contracts.rewardToken, 'balance', [scAddr(accountAddress)]);
    return fromUnits(raw);
  } catch {
    return 0;
  }
}

export async function fetchVaultBalance(operator: string): Promise<number> {
  const raw = await readContract(STELLAR_CONFIG.contracts.liquidityVault, 'get_vault_balance', [scAddr(operator)]);
  return fromUnits(raw);
}

export async function fetchTotalYieldAggregated(operator: string): Promise<number> {
  const raw = await readContract(STELLAR_CONFIG.contracts.liquidityVault, 'get_total_yield_aggregated', [
    scAddr(operator),
  ]);
  return fromUnits(raw);
}

export interface OnChainPosition {
  staker: string;
  operator: string;
  principal_amount: bigint;
  min_duration: bigint;
  last_checkpoint_timestamp: bigint;
  status: { tag: string };
  strategy_id: number;
  initiated_at: bigint;
}

export async function fetchPosition(staker: string, operator: string): Promise<OnChainPosition | null> {
  try {
    const raw = await readContract(STELLAR_CONFIG.contracts.yieldManager, 'get_position', [
      scAddr(staker),
      scAddr(operator),
    ]);
    return raw ?? null;
  } catch {
    return null;
  }
}

export interface OnChainStrategy {
  strategy_id: number;
  operator: string;
  name: string;
  apy_bps: number;
  lockup_seconds: bigint;
  active: boolean;
}

export async function fetchStrategy(operator: string, strategyId: number): Promise<OnChainStrategy | null> {
  try {
    const raw = await readContract(STELLAR_CONFIG.contracts.yieldManager, 'get_strategy', [
      scAddr(operator),
      scU32(strategyId),
    ]);
    return raw ?? null;
  } catch {
    return null;
  }
}

// ---- Domain writes ----

export async function approveVaultAllowance(staker: string, amount: string | number): Promise<InvokeResult> {
  return invokeContract(
    STELLAR_CONFIG.contracts.rewardToken,
    'approve',
    [scAddr(staker), scAddr(STELLAR_CONFIG.contracts.liquidityVault), scI128(toUnits(amount)), scU32(999999999)],
    staker
  );
}

export async function initiateStaking(
  staker: string,
  operator: string,
  strategyId: number,
  amount: string | number
): Promise<InvokeResult> {
  return invokeContract(
    STELLAR_CONFIG.contracts.yieldManager,
    'initiate_staking',
    [scAddr(staker), scAddr(operator), scU32(strategyId), scI128(toUnits(amount))],
    staker
  );
}

export async function registerStrategy(
  operator: string,
  strategyId: number,
  name: string,
  apyBps: number,
  lockupSeconds: number
): Promise<InvokeResult> {
  return invokeContract(
    STELLAR_CONFIG.contracts.yieldManager,
    'register_strategy',
    [scAddr(operator), scU32(strategyId), scString(name), scU32(apyBps), scU64(lockupSeconds)],
    operator
  );
}

export async function pausePosition(staker: string, operator: string): Promise<InvokeResult> {
  return invokeContract(
    STELLAR_CONFIG.contracts.yieldManager,
    'pause_position',
    [scAddr(staker), scAddr(operator)],
    staker
  );
}

export async function resumePosition(staker: string, operator: string): Promise<InvokeResult> {
  return invokeContract(
    STELLAR_CONFIG.contracts.yieldManager,
    'resume_position',
    [scAddr(staker), scAddr(operator)],
    staker
  );
}

export async function terminatePosition(staker: string, operator: string): Promise<InvokeResult> {
  return invokeContract(
    STELLAR_CONFIG.contracts.yieldManager,
    'terminate_position',
    [scAddr(staker), scAddr(operator)],
    staker
  );
}

export async function runCheckpoint(operator: string, staker: string): Promise<InvokeResult> {
  return invokeContract(
    STELLAR_CONFIG.contracts.liquidityVault,
    'aggregate_yield_checkpoint',
    [scAddr(operator), scAddr(staker)],
    operator
  );
}

export async function operatorWithdraw(operator: string, amount: string | number): Promise<InvokeResult> {
  return invokeContract(
    STELLAR_CONFIG.contracts.liquidityVault,
    'operator_withdraw',
    [scAddr(operator), scI128(toUnits(amount))],
    operator
  );
}

// ---- Real event polling (Soroban RPC getEvents, no full page reload) ----

export interface OnChainEvent {
  id: string;
  ledger: number;
  time: string;
  contract: string;
  topic: string;
  data: string;
}

export const formatContractAddress = (addr: string): string => {
  if (!addr || addr.length < 10) return addr;
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
};

export async function fetchRecentEvents(limit = 12): Promise<OnChainEvent[]> {
  try {
    const server = getServer();
    const latest = await server.getLatestLedger();
    const startLedger = Math.max(1, latest.sequence - 9000);

    const resp = await server.getEvents({
      startLedger,
      filters: [
        {
          type: 'contract',
          contractIds: [
            STELLAR_CONFIG.contracts.yieldManager,
            STELLAR_CONFIG.contracts.liquidityVault,
          ],
        },
      ],
      limit: 100,
    });

    const events = resp.events
      .map((e) => {
        let topic = 'event';
        try {
          topic = e.topic.map((t) => scValToNative(t)).join(':');
        } catch {
          /* leave default */
        }
        let data = '';
        try {
          data = JSON.stringify(scValToNative(e.value));
        } catch {
          data = '(unparsed)';
        }
        return {
          id: e.id,
          ledger: e.ledger,
          time: e.ledgerClosedAt ? new Date(e.ledgerClosedAt).toLocaleTimeString() : '',
          contract: formatContractAddress(e.contractId?.toString() ?? ''),
          topic,
          data,
        };
      })
      .sort((a, b) => b.ledger - a.ledger)
      .slice(0, limit);

    return events;
  } catch {
    return [];
  }
}

export async function getStrategies(): Promise<OnChainStrategy[]> {
  const operator = STELLAR_CONFIG.demoAccounts.operator;
  const strategies: OnChainStrategy[] = [];
  for (const id of [1, 2]) {
    const s = await fetchStrategy(operator, id);
    if (s) {
      strategies.push(s);
    }
  }
  return strategies;
}

export async function getVaultBalance(): Promise<number> {
  return fetchVaultBalance(STELLAR_CONFIG.demoAccounts.operator);
}

export async function getTotalYieldAggregated(): Promise<number> {
  return fetchTotalYieldAggregated(STELLAR_CONFIG.demoAccounts.operator);
}

export async function getPosition(staker: string, operator: string): Promise<OnChainPosition | null> {
  return fetchPosition(staker, operator);
}

