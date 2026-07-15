# SolarYield Smart Contract Architecture Specification

## 1. Overview
SolarYield provides a decentralized yield staking and liquidity vault engine on Stellar Soroban Testnet.

## 2. Contracts & Methods

### `reward_token`
- `initialize(admin: Address, decimals: u32, name: String, symbol: String)`
- `mint(to: Address, amount: i128)`
- `balance(id: Address) -> i128`
- `transfer(from: Address, to: Address, amount: i128)`
- `approve(from: Address, spender: Address, amount: i128, expiration_ledger: u32)`
- `allowance(from: Address, spender: Address) -> i128`
- `transfer_from(spender: Address, from: Address, to: Address, amount: i128)`

### `yield_pool_manager`
- `initialize(admin: Address)`
- `set_vault(vault: Address)`
- `register_strategy(operator: Address, strategy_id: u32, name: String, apy_bps: u32, lockup_seconds: u64)`
- `get_strategy(operator: Address, strategy_id: u32) -> Option<YieldStrategy>`
- `initiate_staking(staker: Address, operator: Address, strategy_id: u32, amount: i128)`
- `pause_position(staker: Address, operator: Address)`
- `resume_position(staker: Address, operator: Address)`
- `terminate_position(staker: Address, operator: Address)`
- `checkpoint_and_update_rewards(caller: Address, staker: Address, operator: Address) -> (i128, Address)`
- `get_position(staker: Address, operator: Address) -> Option<StakingPosition>`

### `liquidity_vault`
- `initialize(admin: Address, token_contract: Address, yield_manager_contract: Address)`
- `aggregate_yield_checkpoint(operator: Address, staker: Address) -> i128`
- `operator_withdraw(operator: Address, amount: i128)`
- `get_vault_balance(operator: Address) -> i128`
- `get_total_yield_aggregated(operator: Address) -> i128`
