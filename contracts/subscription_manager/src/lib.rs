#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, Address, Env, String};

#[contracttype]
#[derive(Clone, Debug, PartialEq, Eq)]
pub enum SubscriptionStatus {
    Active,
    Paused,
    Cancelled,
}

#[contracttype]
#[derive(Clone, Debug)]
pub struct Subscription {
    pub subscriber: Address,
    pub merchant: Address,
    pub amount: i128,
    pub billing_interval: u64,
    pub last_paid_timestamp: u64,
    pub status: SubscriptionStatus,
    pub plan_id: u32,
    pub created_at: u64,
}

#[contracttype]
#[derive(Clone, Debug)]
pub struct Plan {
    pub plan_id: u32,
    pub merchant: Address,
    pub name: String,
    pub amount: i128,
    pub interval_seconds: u64,
    pub active: bool,
}

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Admin,
    Vault,
    Plan(Address, u32), // (merchant, plan_id)
    Sub(Address, Address), // (subscriber, merchant)
}

#[contract]
pub struct SubscriptionManagerContract;

#[contractimpl]
impl SubscriptionManagerContract {
    pub fn initialize(e: Env, admin: Address) {
        if e.storage().instance().has(&DataKey::Admin) {
            panic!("already initialized");
        }
        e.storage().instance().set(&DataKey::Admin, &admin);
    }

    pub fn set_vault(e: Env, vault: Address) {
        let admin: Address = e.storage().instance().get(&DataKey::Admin).expect("not initialized");
        admin.require_auth();
        e.storage().instance().set(&DataKey::Vault, &vault);
    }

    pub fn get_vault(e: Env) -> Option<Address> {
        e.storage().instance().get(&DataKey::Vault)
    }

    pub fn create_plan(
        e: Env,
        merchant: Address,
        plan_id: u32,
        name: String,
        amount: i128,
        interval_seconds: u64,
    ) {
        merchant.require_auth();

        if amount <= 0 {
            panic!("amount must be positive");
        }
        if interval_seconds == 0 {
            panic!("interval must be greater than 0");
        }

        let plan = Plan {
            plan_id,
            merchant: merchant.clone(),
            name,
            amount,
            interval_seconds,
            active: true,
        };

        e.storage().persistent().set(&DataKey::Plan(merchant, plan_id), &plan);
    }

    pub fn get_plan(e: Env, merchant: Address, plan_id: u32) -> Option<Plan> {
        e.storage().persistent().get(&DataKey::Plan(merchant, plan_id))
    }

    pub fn subscribe(
        e: Env,
        subscriber: Address,
        merchant: Address,
        plan_id: u32,
    ) {
        subscriber.require_auth();

        let plan = Self::get_plan(e.clone(), merchant.clone(), plan_id)
            .expect("plan does not exist");
        
        if !plan.active {
            panic!("plan is inactive");
        }

        let sub_key = DataKey::Sub(subscriber.clone(), merchant.clone());
        let current_time = e.ledger().timestamp();

        let sub = Subscription {
            subscriber: subscriber.clone(),
            merchant: merchant.clone(),
            amount: plan.amount,
            billing_interval: plan.interval_seconds,
            last_paid_timestamp: 0, // 0 indicates never billed yet
            status: SubscriptionStatus::Active,
            plan_id,
            created_at: current_time,
        };

        e.storage().persistent().set(&sub_key, &sub);
    }

    pub fn pause_subscription(e: Env, subscriber: Address, merchant: Address) {
        subscriber.require_auth();

        let sub_key = DataKey::Sub(subscriber.clone(), merchant.clone());
        let mut sub: Subscription = e
            .storage()
            .persistent()
            .get(&sub_key)
            .expect("subscription not found");

        if sub.status != SubscriptionStatus::Active {
            panic!("subscription is not active");
        }

        sub.status = SubscriptionStatus::Paused;
        e.storage().persistent().set(&sub_key, &sub);
    }

    pub fn resume_subscription(e: Env, subscriber: Address, merchant: Address) {
        subscriber.require_auth();

        let sub_key = DataKey::Sub(subscriber.clone(), merchant.clone());
        let mut sub: Subscription = e
            .storage()
            .persistent()
            .get(&sub_key)
            .expect("subscription not found");

        if sub.status != SubscriptionStatus::Paused {
            panic!("subscription is not paused");
        }

        sub.status = SubscriptionStatus::Active;
        e.storage().persistent().set(&sub_key, &sub);
    }

    pub fn cancel_subscription(e: Env, subscriber: Address, merchant: Address) {
        subscriber.require_auth();

        let sub_key = DataKey::Sub(subscriber.clone(), merchant.clone());
        let mut sub: Subscription = e
            .storage()
            .persistent()
            .get(&sub_key)
            .expect("subscription not found");

        if sub.status == SubscriptionStatus::Cancelled {
            panic!("subscription already cancelled");
        }

        sub.status = SubscriptionStatus::Cancelled;
        e.storage().persistent().set(&sub_key, &sub);
    }

    pub fn verify_and_update_billing(
        e: Env,
        caller: Address,
        subscriber: Address,
        merchant: Address,
    ) -> (i128, Address) {
        // Must be authorized by vault or merchant
        let vault: Option<Address> = e.storage().instance().get(&DataKey::Vault);
        if let Some(v) = vault {
            if caller != v {
                caller.require_auth();
            }
        } else {
            caller.require_auth();
        }

        let sub_key = DataKey::Sub(subscriber.clone(), merchant.clone());
        let mut sub: Subscription = e
            .storage()
            .persistent()
            .get(&sub_key)
            .expect("subscription not found");

        if sub.status != SubscriptionStatus::Active {
            panic!("subscription is not active");
        }

        let current_time = e.ledger().timestamp();
        
        // Ensure billing interval has passed
        if sub.last_paid_timestamp != 0 {
            let next_due = sub.last_paid_timestamp + sub.billing_interval;
            if current_time < next_due {
                panic!("billing cycle not due yet");
            }
        }

        sub.last_paid_timestamp = current_time;
        e.storage().persistent().set(&sub_key, &sub);

        (sub.amount, sub.merchant)
    }

    pub fn get_subscription(
        e: Env,
        subscriber: Address,
        merchant: Address,
    ) -> Option<Subscription> {
        e.storage().persistent().get(&DataKey::Sub(subscriber, merchant))
    }
}

mod test;
