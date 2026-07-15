#![cfg(test)]

use super::*;
use ::reward_token::{SolarRewardToken, SolarRewardTokenClient};
use soroban_sdk::{testutils::Address as _, testutils::Ledger as _, Env, String};
use yield_pool_manager::{YieldPoolManagerContract, YieldPoolManagerContractClient};

#[test]
fn test_liquidity_vault_checkpoint_and_withdraw_flow() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let operator = Address::generate(&env);
    let staker = Address::generate(&env);

    // Register 3 contracts
    let token_id = env.register_contract(None, SolarRewardToken);
    let token_client = SolarRewardTokenClient::new(&env, &token_id);
    token_client.initialize(
        &admin,
        &7u32,
        &String::from_str(&env, "Solar Yield USD"),
        &String::from_str(&env, "syUSD"),
    );

    let yield_manager_id = env.register_contract(None, YieldPoolManagerContract);
    let yield_manager_client = YieldPoolManagerContractClient::new(&env, &yield_manager_id);
    yield_manager_client.initialize(&admin);

    let vault_id = env.register_contract(None, LiquidityVaultContract);
    let vault_client = LiquidityVaultContractClient::new(&env, &vault_id);
    vault_client.initialize(&admin, &token_id, &yield_manager_id);

    // Configure vault authorization in yield_manager
    yield_manager_client.set_vault(&vault_id);

    // Mint tokens to staker
    let initial_balance = 1_000_0000000i128;
    token_client.mint(&staker, &initial_balance);
    assert_eq!(token_client.balance(&staker), initial_balance);

    // Staker approves vault to pull funds
    let sub_amount = 100_0000000i128; // 100 syUSD is the standard principal
    token_client.approve(&staker, &vault_id, &1_000_0000000i128, &100000u32);

    // Operator registers yield strategy (interval = 3600 seconds)
    let lockup = 3600u64;
    yield_manager_client.register_strategy(
        &operator,
        &1u32,
        &String::from_str(&env, "DeFi Yield Core"),
        &800u32, // 8.00% APY
        &lockup,
    );

    // Staker initiates staking on strategy 1
    yield_manager_client.initiate_staking(&staker, &operator, &1u32, &sub_amount);

    // 1st Collection: Operator checkpoints yield via liquidity_vault
    let collected = vault_client.aggregate_yield_checkpoint(&operator, &staker);
    assert_eq!(collected, sub_amount);

    // Check balances
    assert_eq!(token_client.balance(&staker), initial_balance - sub_amount);
    assert_eq!(token_client.balance(&vault_id), sub_amount);
    assert_eq!(vault_client.get_vault_balance(&operator), sub_amount);
    assert_eq!(vault_client.get_total_yield_aggregated(&operator), sub_amount);

    // Advance ledger timestamp by interval (3601 seconds)
    env.ledger().with_mut(|l| l.timestamp += 3601);

    // 2nd Collection: Operator checkpoints yield again
    let collected_2 = vault_client.aggregate_yield_checkpoint(&operator, &staker);
    assert_eq!(collected_2, sub_amount);

    assert_eq!(token_client.balance(&staker), initial_balance - (sub_amount * 2));
    assert_eq!(vault_client.get_vault_balance(&operator), sub_amount * 2);

    // Operator withdraws half of vault funds
    let withdraw_amount = 50_0000000i128;
    vault_client.operator_withdraw(&operator, &withdraw_amount);

    assert_eq!(vault_client.get_vault_balance(&operator), (sub_amount * 2) - withdraw_amount);
    assert_eq!(token_client.balance(&operator), withdraw_amount);
}

#[test]
#[should_panic(expected = "insufficient vault balance")]
fn test_operator_withdraw_exceeds_balance() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let operator = Address::generate(&env);

    let token_id = env.register_contract(None, SolarRewardToken);
    let yield_manager_id = env.register_contract(None, YieldPoolManagerContract);
    let vault_id = env.register_contract(None, LiquidityVaultContract);
    let vault_client = LiquidityVaultContractClient::new(&env, &vault_id);

    vault_client.initialize(&admin, &token_id, &yield_manager_id);

    // Attempt withdrawal with 0 balance
    vault_client.operator_withdraw(&operator, &100_0000000i128);
}
