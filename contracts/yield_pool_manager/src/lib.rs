#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, Address, Env, String, symbol_short};

#[contracttype]
#[derive(Clone, Debug, PartialEq, Eq)]
pub enum PositionStatus {
    Active,
    Paused,
    Terminated,
}

#[contracttype]
#[derive(Clone, Debug)]
pub struct StakingPosition {
    pub staker: Address,
    pub operator: Address,
    pub principal_amount: i128,
    pub min_duration: u64,
    pub last_checkpoint_timestamp: u64,
    pub status: PositionStatus,
    pub strategy_id: u32,
    pub initiated_at: u64,
}

#[contracttype]
#[derive(Clone, Debug)]
pub struct YieldStrategy {
    pub strategy_id: u32,
    pub operator: Address,
    pub name: String,
    pub apy_bps: u32,
    pub lockup_seconds: u64,
    pub active: bool,
}

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Admin,
    Vault,
    Strategy(Address, u32),     // (operator, strategy_id)
    Position(Address, Address), // (staker, operator)
}

#[contract]
pub struct YieldPoolManagerContract;

#[contractimpl]
impl YieldPoolManagerContract {
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

    pub fn register_strategy(
        e: Env,
        operator: Address,
        strategy_id: u32,
        name: String,
        apy_bps: u32,
        lockup_seconds: u64,
    ) {
        operator.require_auth();

        if apy_bps == 0 {
            panic!("apy_bps must be positive");
        }
        if lockup_seconds == 0 {
            panic!("lockup_seconds must be greater than 0");
        }

        let strategy = YieldStrategy {
            strategy_id,
            operator: operator.clone(),
            name,
            apy_bps,
            lockup_seconds,
            active: true,
        };

        e.storage().persistent().set(&DataKey::Strategy(operator.clone(), strategy_id), &strategy);

        e.events().publish(
            (symbol_short!("strategy"), strategy_id),
            operator
        );
    }

    pub fn get_strategy(e: Env, operator: Address, strategy_id: u32) -> Option<YieldStrategy> {
        e.storage().persistent().get(&DataKey::Strategy(operator, strategy_id))
    }

    pub fn initiate_staking(
        e: Env,
        staker: Address,
        operator: Address,
        strategy_id: u32,
        amount: i128,
    ) {
        staker.require_auth();

        if amount <= 0 {
            panic!("amount must be positive");
        }

        let strategy = Self::get_strategy(e.clone(), operator.clone(), strategy_id)
            .expect("strategy does not exist");
        
        if !strategy.active {
            panic!("strategy is inactive");
        }

        let pos_key = DataKey::Position(staker.clone(), operator.clone());
        let current_time = e.ledger().timestamp();

        let position = StakingPosition {
            staker: staker.clone(),
            operator: operator.clone(),
            principal_amount: amount,
            min_duration: strategy.lockup_seconds,
            last_checkpoint_timestamp: 0,
            status: PositionStatus::Active,
            strategy_id,
            initiated_at: current_time,
        };

        e.storage().persistent().set(&pos_key, &position);

        e.events().publish(
            (symbol_short!("stake"), staker),
            amount
        );
    }

    pub fn pause_position(e: Env, staker: Address, operator: Address) {
        staker.require_auth();

        let pos_key = DataKey::Position(staker.clone(), operator.clone());
        let mut pos: StakingPosition = e
            .storage()
            .persistent()
            .get(&pos_key)
            .expect("staking position not found");

        if pos.status != PositionStatus::Active {
            panic!("position is not active");
        }

        pos.status = PositionStatus::Paused;
        e.storage().persistent().set(&pos_key, &pos);

        e.events().publish(
            (symbol_short!("status"), staker),
            symbol_short!("paused")
        );
    }

    pub fn resume_position(e: Env, staker: Address, operator: Address) {
        staker.require_auth();

        let pos_key = DataKey::Position(staker.clone(), operator.clone());
        let mut pos: StakingPosition = e
            .storage()
            .persistent()
            .get(&pos_key)
            .expect("staking position not found");

        if pos.status != PositionStatus::Paused {
            panic!("position is not paused");
        }

        pos.status = PositionStatus::Active;
        e.storage().persistent().set(&pos_key, &pos);

        e.events().publish(
            (symbol_short!("status"), staker),
            symbol_short!("active")
        );
    }

    pub fn terminate_position(e: Env, staker: Address, operator: Address) {
        staker.require_auth();

        let pos_key = DataKey::Position(staker.clone(), operator.clone());
        let mut pos: StakingPosition = e
            .storage()
            .persistent()
            .get(&pos_key)
            .expect("staking position not found");

        if pos.status == PositionStatus::Terminated {
            panic!("position already terminated");
        }

        pos.status = PositionStatus::Terminated;
        e.storage().persistent().set(&pos_key, &pos);

        e.events().publish(
            (symbol_short!("status"), staker),
            symbol_short!("term")
        );
    }

    pub fn checkpoint_and_update_rewards(
        e: Env,
        caller: Address,
        staker: Address,
        operator: Address,
    ) -> (i128, Address) {
        let vault: Option<Address> = e.storage().instance().get(&DataKey::Vault);
        if let Some(v) = vault {
            if caller != v {
                caller.require_auth();
            }
        } else {
            caller.require_auth();
        }

        let pos_key = DataKey::Position(staker.clone(), operator.clone());
        let mut pos: StakingPosition = e
            .storage()
            .persistent()
            .get(&pos_key)
            .expect("staking position not found");

        if pos.status != PositionStatus::Active {
            panic!("position is not active");
        }

        let current_time = e.ledger().timestamp();
        
        if pos.last_checkpoint_timestamp != 0 {
            let next_checkpoint = pos.last_checkpoint_timestamp + pos.min_duration;
            if current_time < next_checkpoint {
                panic!("lockup period not met yet");
            }
        }

        pos.last_checkpoint_timestamp = current_time;
        e.storage().persistent().set(&pos_key, &pos);

        e.events().publish(
            (symbol_short!("check"), staker),
            pos.principal_amount
        );

        (pos.principal_amount, pos.operator)
    }

    pub fn get_position(
        e: Env,
        staker: Address,
        operator: Address,
    ) -> Option<StakingPosition> {
        e.storage().persistent().get(&DataKey::Position(staker, operator))
    }
}

#[cfg(test)]
mod test;
