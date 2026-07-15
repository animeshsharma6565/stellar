# SolarYield Architecture & State Machine

## Staking Position State Machine
- **Active**: Normal state where a checkpoint (`checkpoint_and_update_rewards`) is permitted when `current_time >= last_checkpoint_timestamp + min_duration` (or immediately, if never checkpointed).
- **Paused**: Temporarily freezes checkpoint eligibility. Calls to `checkpoint_and_update_rewards()` trap with `position is not active`.
- **Terminated**: Permanently stops the position. Cannot be reactivated.

## Security & Allowance Management
- Staker delegates allowance via `reward_token.approve(liquidity_vault, amount)`.
- Operator triggers `liquidity_vault.aggregate_yield_checkpoint(operator, staker)`.
- Vault invokes `yield_pool_manager.checkpoint_and_update_rewards()` (inter-contract call).
- If valid, `liquidity_vault` pulls funds via `reward_token.transfer_from()`.
