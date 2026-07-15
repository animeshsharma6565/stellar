#![no_std]
use soroban_sdk::{contract, contractclient, contractimpl, contracttype, token, Address, Env, symbol_short};

pub mod yield_pool_manager_interface {
    use super::*;

    #[contractclient(name = "YieldPoolManagerContractClient")]
    pub trait YieldPoolManagerContract {
        fn checkpoint_and_update_rewards(
            e: &Env,
            caller: &Address,
            staker: &Address,
            operator: &Address,
        ) -> (i128, Address);
    }
}

use yield_pool_manager_interface::YieldPoolManagerContractClient;

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Admin,
    TokenContract,
    YieldManagerContract,
    OperatorBalance(Address),
    TotalYieldAggregated(Address),
}

#[contract]
pub struct LiquidityVaultContract;

#[contractimpl]
impl LiquidityVaultContract {
    pub fn initialize(
        e: Env,
        admin: Address,
        token_contract: Address,
        yield_manager_contract: Address,
    ) {
        if e.storage().instance().has(&DataKey::Admin) {
            panic!("already initialized");
        }
        e.storage().instance().set(&DataKey::Admin, &admin);
        e.storage().instance().set(&DataKey::TokenContract, &token_contract);
        e.storage().instance().set(&DataKey::YieldManagerContract, &yield_manager_contract);
    }

    pub fn aggregate_yield_checkpoint(
        e: Env,
        operator: Address,
        staker: Address,
    ) -> i128 {
        operator.require_auth();

        let yield_manager_addr: Address = e
            .storage()
            .instance()
            .get(&DataKey::YieldManagerContract)
            .expect("yield manager not set");
        let token_addr: Address = e
            .storage()
            .instance()
            .get(&DataKey::TokenContract)
            .expect("token not set");

        let yield_client = YieldPoolManagerContractClient::new(&e, &yield_manager_addr);
        let token_client = token::Client::new(&e, &token_addr);

        let vault_address = e.current_contract_address();

        // 1. Verify staking status and checkpoint eligibility via inter-contract call
        let (amount, sub_operator) = yield_client.checkpoint_and_update_rewards(
            &vault_address,
            &staker,
            &operator,
        );

        if sub_operator != operator {
            panic!("operator mismatch");
        }

        // 2. Transfer payment asset from staker to liquidity vault using token allowance
        token_client.transfer_from(&vault_address, &staker, &vault_address, &amount);

        // 3. Update operator vault balances
        let current_bal = Self::get_vault_balance(e.clone(), operator.clone());
        let new_bal = current_bal.checked_add(amount).expect("overflow");
        e.storage().persistent().set(&DataKey::OperatorBalance(operator.clone()), &new_bal);

        let current_total = Self::get_total_yield_aggregated(e.clone(), operator.clone());
        let new_total = current_total.checked_add(amount).expect("overflow");
        e.storage().persistent().set(&DataKey::TotalYieldAggregated(operator.clone()), &new_total);

        e.events().publish(
            (symbol_short!("chkpoint"), operator),
            amount
        );

        amount
    }

    pub fn operator_withdraw(e: Env, operator: Address, amount: i128) {
        operator.require_auth();

        if amount <= 0 {
            panic!("amount must be positive");
        }

        let balance = Self::get_vault_balance(e.clone(), operator.clone());
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
        e.storage().persistent().set(&DataKey::OperatorBalance(operator.clone()), &(balance - amount));

        // Transfer funds from vault to operator
        token_client.transfer(&vault_address, &operator, &amount);

        e.events().publish(
            (symbol_short!("withdraw"), operator),
            amount
        );
    }

    pub fn get_vault_balance(e: Env, operator: Address) -> i128 {
        e.storage()
            .persistent()
            .get(&DataKey::OperatorBalance(operator))
            .unwrap_or(0)
    }

    pub fn get_total_yield_aggregated(e: Env, operator: Address) -> i128 {
        e.storage()
            .persistent()
            .get(&DataKey::TotalYieldAggregated(operator))
            .unwrap_or(0)
    }
}

#[cfg(test)]
mod test;
