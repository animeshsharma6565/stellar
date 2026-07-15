#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, Address, Env, String};

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Admin,
    Name,
    Symbol,
    Decimals,
    Balance(Address),
    Allowance(AllowanceKey),
}

#[contracttype]
#[derive(Clone)]
pub struct AllowanceKey {
    pub from: Address,
    pub spender: Address,
}

#[contracttype]
#[derive(Clone)]
pub struct AllowanceValue {
    pub amount: i128,
    pub expiration_ledger: u32,
}

#[contract]
pub struct SolarRewardToken;

#[contractimpl]
impl SolarRewardToken {
    pub fn initialize(
        e: Env,
        admin: Address,
        decimals: u32,
        name: String,
        symbol: String,
    ) {
        if e.storage().instance().has(&DataKey::Admin) {
            panic!("already initialized");
        }
        e.storage().instance().set(&DataKey::Admin, &admin);
        e.storage().instance().set(&DataKey::Decimals, &decimals);
        e.storage().instance().set(&DataKey::Name, &name);
        e.storage().instance().set(&DataKey::Symbol, &symbol);
    }

    pub fn mint(e: Env, to: Address, amount: i128) {
        let admin: Address = e.storage().instance().get(&DataKey::Admin).expect("not initialized");
        admin.require_auth();

        if amount < 0 {
            panic!("amount must be non-negative");
        }

        let balance = Self::balance(e.clone(), to.clone());
        let new_balance = balance.checked_add(amount).expect("overflow");
        e.storage().persistent().set(&DataKey::Balance(to.clone()), &new_balance);
    }

    pub fn balance(e: Env, id: Address) -> i128 {
        e.storage()
            .persistent()
            .get(&DataKey::Balance(id))
            .unwrap_or(0)
    }

    pub fn allowance(e: Env, from: Address, spender: Address) -> i128 {
        let key = DataKey::Allowance(AllowanceKey { from, spender });
        if let Some(val) = e.storage().persistent().get::<DataKey, AllowanceValue>(&key) {
            if val.expiration_ledger < e.ledger().sequence() {
                0
            } else {
                val.amount
            }
        } else {
            0
        }
    }

    pub fn approve(
        e: Env,
        from: Address,
        spender: Address,
        amount: i128,
        expiration_ledger: u32,
    ) {
        from.require_auth();

        if amount < 0 {
            panic!("amount must be non-negative");
        }

        let key = DataKey::Allowance(AllowanceKey {
            from: from.clone(),
            spender: spender.clone(),
        });
        let val = AllowanceValue {
            amount,
            expiration_ledger,
        };
        e.storage().persistent().set(&key, &val);
    }

    pub fn transfer(e: Env, from: Address, to: Address, amount: i128) {
        from.require_auth();

        if amount < 0 {
            panic!("amount must be non-negative");
        }

        let from_balance = Self::balance(e.clone(), from.clone());
        if from_balance < amount {
            panic!("insufficient balance");
        }

        let to_balance = Self::balance(e.clone(), to.clone());

        e.storage()
            .persistent()
            .set(&DataKey::Balance(from.clone()), &(from_balance - amount));
        e.storage()
            .persistent()
            .set(&DataKey::Balance(to.clone()), &(to_balance + amount));
    }

    pub fn transfer_from(e: Env, spender: Address, from: Address, to: Address, amount: i128) {
        spender.require_auth();

        if amount < 0 {
            panic!("amount must be non-negative");
        }

        let allowed = Self::allowance(e.clone(), from.clone(), spender.clone());
        if allowed < amount {
            panic!("insufficient allowance");
        }

        let from_balance = Self::balance(e.clone(), from.clone());
        if from_balance < amount {
            panic!("insufficient balance");
        }

        let to_balance = Self::balance(e.clone(), to.clone());

        e.storage()
            .persistent()
            .set(&DataKey::Balance(from.clone()), &(from_balance - amount));
        e.storage()
            .persistent()
            .set(&DataKey::Balance(to.clone()), &(to_balance + amount));

        if allowed != i128::MAX {
            let key = DataKey::Allowance(AllowanceKey {
                from: from.clone(),
                spender: spender.clone(),
            });
            let mut val: AllowanceValue = e.storage().persistent().get(&key).unwrap();
            val.amount -= amount;
            e.storage().persistent().set(&key, &val);
        }
    }
}
