#![no_std]
use soroban_sdk::{contract, contractclient, contractimpl, contracttype, token, Address, Env};

pub mod sub_manager_interface {
    use super::*;

    #[contractclient(name = "SubscriptionManagerContractClient")]
    pub trait SubscriptionManagerContract {
        fn verify_and_update_billing(
            e: &Env,
            caller: &Address,
            subscriber: &Address,
            merchant: &Address,
        ) -> (i128, Address);
    }
}

use sub_manager_interface::SubscriptionManagerContractClient;

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Admin,
    TokenContract,
    SubManagerContract,
    MerchantBalance(Address),
    TotalCollected(Address),
}

#[contract]
pub struct MerchantVaultContract;

#[contractimpl]
impl MerchantVaultContract {
    pub fn initialize(
        e: Env,
        admin: Address,
        token_contract: Address,
        sub_manager_contract: Address,
    ) {
        if e.storage().instance().has(&DataKey::Admin) {
            panic!("already initialized");
        }
        e.storage().instance().set(&DataKey::Admin, &admin);
        e.storage().instance().set(&DataKey::TokenContract, &token_contract);
        e.storage().instance().set(&DataKey::SubManagerContract, &sub_manager_contract);
    }

    pub fn collect_subscription(
        e: Env,
        merchant: Address,
        subscriber: Address,
    ) -> i128 {
        merchant.require_auth();

        let sub_manager_addr: Address = e
            .storage()
            .instance()
            .get(&DataKey::SubManagerContract)
            .expect("sub manager not set");
        let token_addr: Address = e
            .storage()
            .instance()
            .get(&DataKey::TokenContract)
            .expect("token not set");

        let sub_client = SubscriptionManagerContractClient::new(&e, &sub_manager_addr);
        let token_client = token::Client::new(&e, &token_addr);

        let vault_address = e.current_contract_address();

        // 1. Verify subscription and billing eligibility via inter-contract call
        let (amount, sub_merchant) = sub_client.verify_and_update_billing(
            &vault_address,
            &subscriber,
            &merchant,
        );

        if sub_merchant != merchant {
            panic!("merchant mismatch");
        }

        // 2. Transfer payment asset from subscriber to merchant vault using token allowance
        token_client.transfer_from(&vault_address, &subscriber, &vault_address, &amount);

        // 3. Update merchant vault balances
        let current_bal = Self::get_vault_balance(e.clone(), merchant.clone());
        let new_bal = current_bal.checked_add(amount).expect("overflow");
        e.storage().persistent().set(&DataKey::MerchantBalance(merchant.clone()), &new_bal);

        let current_total = Self::get_total_collected(e.clone(), merchant.clone());
        let new_total = current_total.checked_add(amount).expect("overflow");
        e.storage().persistent().set(&DataKey::TotalCollected(merchant), &new_total);

        amount
    }

    pub fn withdraw(e: Env, merchant: Address, amount: i128) {
        merchant.require_auth();

        if amount <= 0 {
            panic!("amount must be positive");
        }

        let balance = Self::get_vault_balance(e.clone(), merchant.clone());
        if balance < amount {
            panic!("insufficient vault balance");
        }

        let token_addr: Address = e
            .storage()
            .instance()
            .get(&DataKey::TokenContract)
            .expect("token not set");
        let token_client = token::Client::new(&e, &token_addr);

        let vault_address = e.current_contract_address();

        // Deduct balance first
        e.storage().persistent().set(&DataKey::MerchantBalance(merchant.clone()), &(balance - amount));

        // Transfer funds from vault to merchant
        token_client.transfer(&vault_address, &merchant, &amount);
    }

    pub fn get_vault_balance(e: Env, merchant: Address) -> i128 {
        e.storage()
            .persistent()
            .get(&DataKey::MerchantBalance(merchant))
            .unwrap_or(0)
    }

    pub fn get_total_collected(e: Env, merchant: Address) -> i128 {
        e.storage()
            .persistent()
            .get(&DataKey::TotalCollected(merchant))
            .unwrap_or(0)
    }
}

mod test;
