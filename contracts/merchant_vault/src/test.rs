#![cfg(test)]

use super::*;
use ::token::{TokenContract, TokenContractClient};
use soroban_sdk::{testutils::Address as _, testutils::Ledger as _, Env, String};
use subscription_manager::{SubscriptionManagerContract, SubscriptionManagerContractClient};

#[test]
fn test_merchant_vault_collect_and_withdraw_flow() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let merchant = Address::generate(&env);
    let subscriber = Address::generate(&env);

    // Register 3 contracts
    let token_id = env.register_contract(None, TokenContract);
    let token_client = TokenContractClient::new(&env, &token_id);
    token_client.initialize(
        &admin,
        &7u32,
        &String::from_str(&env, "SubScript USD"),
        &String::from_str(&env, "sUSD"),
    );

    let sub_manager_id = env.register_contract(None, SubscriptionManagerContract);
    let sub_manager_client = SubscriptionManagerContractClient::new(&env, &sub_manager_id);
    sub_manager_client.initialize(&admin);

    let vault_id = env.register_contract(None, MerchantVaultContract);
    let vault_client = MerchantVaultContractClient::new(&env, &vault_id);
    vault_client.initialize(&admin, &token_id, &sub_manager_id);

    // Configure vault authorization in sub_manager
    sub_manager_client.set_vault(&vault_id);

    // Mint tokens to subscriber
    let initial_balance = 1_000_0000000i128;
    token_client.mint(&subscriber, &initial_balance);
    assert_eq!(token_client.balance(&subscriber), initial_balance);

    // Subscriber approves vault to pull funds
    let sub_amount = 50_0000000i128;
    token_client.approve(&subscriber, &vault_id, &1_000_0000000i128, &100000u32);

    // Merchant creates subscription plan (interval = 3600 seconds)
    let interval = 3600u64;
    sub_manager_client.create_plan(
        &merchant,
        &1u32,
        &String::from_str(&env, "Creator Monthly Pass"),
        &sub_amount,
        &interval,
    );

    // Subscriber subscribes to plan 1
    sub_manager_client.subscribe(&subscriber, &merchant, &1u32);

    // 1st Collection: Merchant collects payment via merchant_vault
    let collected = vault_client.collect_subscription(&merchant, &subscriber);
    assert_eq!(collected, sub_amount);

    // Check balances
    assert_eq!(token_client.balance(&subscriber), initial_balance - sub_amount);
    assert_eq!(token_client.balance(&vault_id), sub_amount);
    assert_eq!(vault_client.get_vault_balance(&merchant), sub_amount);
    assert_eq!(vault_client.get_total_collected(&merchant), sub_amount);

    // Advance ledger timestamp by interval (3601 seconds)
    env.ledger().with_mut(|l| l.timestamp += 3601);

    // 2nd Collection: Merchant collects payment again
    let collected_2 = vault_client.collect_subscription(&merchant, &subscriber);
    assert_eq!(collected_2, sub_amount);

    assert_eq!(token_client.balance(&subscriber), initial_balance - (sub_amount * 2));
    assert_eq!(vault_client.get_vault_balance(&merchant), sub_amount * 2);

    // Merchant withdraws half of vault funds
    let withdraw_amount = 50_0000000i128;
    vault_client.withdraw(&merchant, &withdraw_amount);

    assert_eq!(vault_client.get_vault_balance(&merchant), (sub_amount * 2) - withdraw_amount);
    assert_eq!(token_client.balance(&merchant), withdraw_amount);
}

#[test]
#[should_panic(expected = "insufficient vault balance")]
fn test_merchant_withdraw_exceeds_balance() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let merchant = Address::generate(&env);

    let token_id = env.register_contract(None, TokenContract);
    let sub_manager_id = env.register_contract(None, SubscriptionManagerContract);
    let vault_id = env.register_contract(None, MerchantVaultContract);
    let vault_client = MerchantVaultContractClient::new(&env, &vault_id);

    vault_client.initialize(&admin, &token_id, &sub_manager_id);

    // Attempt withdrawal with 0 balance
    vault_client.withdraw(&merchant, &100_0000000i128);
}
