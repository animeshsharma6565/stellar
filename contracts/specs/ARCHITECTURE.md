# SubScript Architecture & State Machine

## Subscription State Machine
- **Active**: Normal state where periodic automated billing collection is permitted when `current_time >= last_paid_timestamp + billing_interval`.
- **Paused**: Temporarily freezes billing countdown. Calls to `verify_and_update_billing()` trap with `subscription is not active`.
- **Cancelled**: Permanently stops subscription stream. Cannot be reactivated.

## Security & Allowance Management
- Subscriber delegates allowance via `token.approve(merchant_vault, amount)`.
- Merchant triggers `merchant_vault.collect_subscription()`.
- Vault invokes `subscription_manager.verify_and_update_billing()`.
- If valid, `merchant_vault` pulls funds via `token.transfer_from()`.
