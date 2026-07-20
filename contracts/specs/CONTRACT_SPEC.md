# SubScript Smart Contract Architecture Specification

## 1. Overview
SubScript provides a decentralized automated recurring billing engine on Stellar Soroban Testnet.

## 2. Contracts & Methods

### `token`
- `initialize(admin: Address, decimals: u32, name: String, symbol: String)`
- `mint(to: Address, amount: i128)`
- `balance(id: Address) -> i128`
- `transfer(from: Address, to: Address, amount: i128)`
- `approve(from: Address, spender: Address, amount: i128, expiration_ledger: u32)`
- `allowance(from: Address, spender: Address) -> i128`
- `transfer_from(spender: Address, from: Address, to: Address, amount: i128)`

### `subscription_manager`
- `initialize(admin: Address)`
- `set_vault(vault: Address)`
- `create_plan(merchant: Address, plan_id: u32, name: String, amount: i128, interval_seconds: u64)`
- `subscribe(subscriber: Address, merchant: Address, plan_id: u32)`
- `pause_subscription(subscriber: Address, merchant: Address)`
- `resume_subscription(subscriber: Address, merchant: Address)`
- `cancel_subscription(subscriber: Address, merchant: Address)`
- `verify_and_update_billing(caller: Address, subscriber: Address, merchant: Address) -> (i128, Address)`

### `merchant_vault`
- `initialize(admin: Address, token_contract: Address, sub_manager_contract: Address)`
- `collect_subscription(merchant: Address, subscriber: Address) -> i128`
- `withdraw(merchant: Address, amount: i128)`
- `get_vault_balance(merchant: Address) -> i128`
- `get_total_collected(merchant: Address) -> i128`
