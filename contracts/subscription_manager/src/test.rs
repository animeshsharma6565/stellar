#![cfg(test)]

use super::*;
use soroban_sdk::{testutils::Address as _, testutils::Ledger as _, Env, String};

#[test]
fn test_create_plan_and_subscribe() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let merchant = Address::generate(&env);
    let subscriber = Address::generate(&env);

    let manager_id = env.register_contract(None, SubscriptionManagerContract);
    let client = SubscriptionManagerContractClient::new(&env, &manager_id);

    client.initialize(&admin);

    let plan_name = String::from_str(&env, "Basic SaaS Plan");
    let plan_amount = 100_0000000i128;
    let interval = 86400u64; // 1 day

    client.create_plan(&merchant, &1, &plan_name, &plan_amount, &interval);

    let plan = client.get_plan(&merchant, &1).unwrap();
    assert_eq!(plan.amount, plan_amount);
    assert_eq!(plan.interval_seconds, interval);

    client.subscribe(&subscriber, &merchant, &1);

    let sub = client.get_subscription(&subscriber, &merchant).unwrap();
    assert_eq!(sub.amount, plan_amount);
    assert_eq!(sub.status, SubscriptionStatus::Active);
    assert_eq!(sub.last_paid_timestamp, 0);
}

#[test]
fn test_pause_and_resume_subscription() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let merchant = Address::generate(&env);
    let subscriber = Address::generate(&env);

    let manager_id = env.register_contract(None, SubscriptionManagerContract);
    let client = SubscriptionManagerContractClient::new(&env, &manager_id);

    client.initialize(&admin);

    let plan_name = String::from_str(&env, "Pro Tier");
    client.create_plan(&merchant, &1, &plan_name, &500_0000000i128, &300u64);

    client.subscribe(&subscriber, &merchant, &1);

    // Pause subscription
    client.pause_subscription(&subscriber, &merchant);
    let sub = client.get_subscription(&subscriber, &merchant).unwrap();
    assert_eq!(sub.status, SubscriptionStatus::Paused);

    // Resume subscription
    client.resume_subscription(&subscriber, &merchant);
    let sub_resumed = client.get_subscription(&subscriber, &merchant).unwrap();
    assert_eq!(sub_resumed.status, SubscriptionStatus::Active);
}

#[test]
fn test_cancel_subscription() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let merchant = Address::generate(&env);
    let subscriber = Address::generate(&env);

    let manager_id = env.register_contract(None, SubscriptionManagerContract);
    let client = SubscriptionManagerContractClient::new(&env, &manager_id);

    client.initialize(&admin);

    let plan_name = String::from_str(&env, "Enterprise Stream");
    client.create_plan(&merchant, &1, &plan_name, &1000_0000000i128, &86400u64);
    client.subscribe(&subscriber, &merchant, &1);

    client.cancel_subscription(&subscriber, &merchant);
    let sub = client.get_subscription(&subscriber, &merchant).unwrap();
    assert_eq!(sub.status, SubscriptionStatus::Cancelled);
}

#[test]
#[should_panic(expected = "billing cycle not due yet")]
fn test_billing_interval_enforcement_premature() {
    let env = Env::default();
    env.mock_all_auths();
    env.ledger().with_mut(|l| l.timestamp = 1000);

    let admin = Address::generate(&env);
    let merchant = Address::generate(&env);
    let subscriber = Address::generate(&env);

    let manager_id = env.register_contract(None, SubscriptionManagerContract);
    let client = SubscriptionManagerContractClient::new(&env, &manager_id);

    client.initialize(&admin);
    let plan_name = String::from_str(&env, "Monthly Stream");
    client.create_plan(&merchant, &1, &plan_name, &50_0000000i128, &1000u64);
    client.subscribe(&subscriber, &merchant, &1);

    // First billing call works at timestamp 1000
    client.verify_and_update_billing(&merchant, &subscriber, &merchant);

    // Immediate second billing call at timestamp 1000 must fail because 1000s have not elapsed
    client.verify_and_update_billing(&merchant, &subscriber, &merchant);
}

#[test]
#[should_panic(expected = "subscription is not active")]
fn test_billing_on_paused_subscription_fails() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let merchant = Address::generate(&env);
    let subscriber = Address::generate(&env);

    let manager_id = env.register_contract(None, SubscriptionManagerContract);
    let client = SubscriptionManagerContractClient::new(&env, &manager_id);

    client.initialize(&admin);
    let plan_name = String::from_str(&env, "Pausable Plan");
    client.create_plan(&merchant, &1, &plan_name, &100_0000000i128, &60u64);
    client.subscribe(&subscriber, &merchant, &1);

    client.pause_subscription(&subscriber, &merchant);
    client.verify_and_update_billing(&merchant, &subscriber, &merchant);
}

#[test]
#[should_panic(expected = "subscription is not active")]
fn test_billing_on_cancelled_subscription_fails() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let merchant = Address::generate(&env);
    let subscriber = Address::generate(&env);

    let manager_id = env.register_contract(None, SubscriptionManagerContract);
    let client = SubscriptionManagerContractClient::new(&env, &manager_id);

    client.initialize(&admin);
    let plan_name = String::from_str(&env, "Cancellable Plan");
    client.create_plan(&merchant, &1, &plan_name, &100_0000000i128, &60u64);
    client.subscribe(&subscriber, &merchant, &1);

    client.cancel_subscription(&subscriber, &merchant);
    client.verify_and_update_billing(&merchant, &subscriber, &merchant);
}
