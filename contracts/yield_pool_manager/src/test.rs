#![cfg(test)]

use super::*;
use soroban_sdk::{testutils::Address as _, testutils::Ledger as _, Env, String};

#[test]
fn test_register_strategy_and_stake() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let operator = Address::generate(&env);
    let staker = Address::generate(&env);

    let manager_id = env.register_contract(None, YieldPoolManagerContract);
    let client = YieldPoolManagerContractClient::new(&env, &manager_id);

    client.initialize(&admin);

    let strategy_name = String::from_str(&env, "High Yield Strategy");
    let apy_bps = 800u32; // 8.00%
    let lockup = 86400u64; // 1 day

    client.register_strategy(&operator, &1, &strategy_name, &apy_bps, &lockup);

    let strategy = client.get_strategy(&operator, &1).unwrap();
    assert_eq!(strategy.apy_bps, apy_bps);
    assert_eq!(strategy.lockup_seconds, lockup);

    client.initiate_staking(&staker, &operator, &1, &100i128);

    let pos = client.get_position(&staker, &operator).unwrap();
    assert_eq!(pos.principal_amount, 100);
    assert_eq!(pos.status, PositionStatus::Active);
    assert_eq!(pos.last_checkpoint_timestamp, 0);
}

#[test]
fn test_pause_and_resume_position() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let operator = Address::generate(&env);
    let staker = Address::generate(&env);

    let manager_id = env.register_contract(None, YieldPoolManagerContract);
    let client = YieldPoolManagerContractClient::new(&env, &manager_id);

    client.initialize(&admin);

    let strategy_name = String::from_str(&env, "Safe Pool Strategy");
    client.register_strategy(&operator, &1, &strategy_name, &450u32, &300u64);

    client.initiate_staking(&staker, &operator, &1, &100i128);

    // Pause position
    client.pause_position(&staker, &operator);
    let pos = client.get_position(&staker, &operator).unwrap();
    assert_eq!(pos.status, PositionStatus::Paused);

    // Resume position
    client.resume_position(&staker, &operator);
    let pos_resumed = client.get_position(&staker, &operator).unwrap();
    assert_eq!(pos_resumed.status, PositionStatus::Active);
}

#[test]
fn test_terminate_position() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let operator = Address::generate(&env);
    let staker = Address::generate(&env);

    let manager_id = env.register_contract(None, YieldPoolManagerContract);
    let client = YieldPoolManagerContractClient::new(&env, &manager_id);

    client.initialize(&admin);

    let strategy_name = String::from_str(&env, "Liquid Pool Strategy");
    client.register_strategy(&operator, &1, &strategy_name, &500u32, &86400u64);
    client.initiate_staking(&staker, &operator, &1, &100i128);

    client.terminate_position(&staker, &operator);
    let pos = client.get_position(&staker, &operator).unwrap();
    assert_eq!(pos.status, PositionStatus::Terminated);
}

#[test]
#[should_panic(expected = "lockup period not met yet")]
fn test_checkpoint_interval_enforcement_premature() {
    let env = Env::default();
    env.mock_all_auths();
    env.ledger().with_mut(|l| l.timestamp = 1000);

    let admin = Address::generate(&env);
    let operator = Address::generate(&env);
    let staker = Address::generate(&env);

    let manager_id = env.register_contract(None, YieldPoolManagerContract);
    let client = YieldPoolManagerContractClient::new(&env, &manager_id);

    client.initialize(&admin);
    let strategy_name = String::from_str(&env, "Locked Strategy");
    client.register_strategy(&operator, &1, &strategy_name, &600u32, &1000u64);
    client.initiate_staking(&staker, &operator, &1, &100i128);

    // First checkpoint works at timestamp 1000
    client.checkpoint_and_update_rewards(&operator, &staker, &operator);

    // Immediate second checkpoint call at timestamp 1000 must fail because lockup duration has not passed
    client.checkpoint_and_update_rewards(&operator, &staker, &operator);
}

#[test]
#[should_panic(expected = "position is not active")]
fn test_checkpoint_on_paused_position_fails() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let operator = Address::generate(&env);
    let staker = Address::generate(&env);

    let manager_id = env.register_contract(None, YieldPoolManagerContract);
    let client = YieldPoolManagerContractClient::new(&env, &manager_id);

    client.initialize(&admin);
    let strategy_name = String::from_str(&env, "Flexible Strategy");
    client.register_strategy(&operator, &1, &strategy_name, &800u32, &60u64);
    client.initiate_staking(&staker, &operator, &1, &100i128);

    client.pause_position(&staker, &operator);
    client.checkpoint_and_update_rewards(&operator, &staker, &operator);
}

#[test]
#[should_panic(expected = "position is not active")]
fn test_checkpoint_on_terminated_position_fails() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let operator = Address::generate(&env);
    let staker = Address::generate(&env);

    let manager_id = env.register_contract(None, YieldPoolManagerContract);
    let client = YieldPoolManagerContractClient::new(&env, &manager_id);

    client.initialize(&admin);
    let strategy_name = String::from_str(&env, "Terminatable Strategy");
    client.register_strategy(&operator, &1, &strategy_name, &800u32, &60u64);
    client.initiate_staking(&staker, &operator, &1, &100i128);

    client.terminate_position(&staker, &operator);
    client.checkpoint_and_update_rewards(&operator, &staker, &operator);
}
