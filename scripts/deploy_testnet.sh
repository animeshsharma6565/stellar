#!/usr/bin/env bash
set -e

echo "=== Building SolarYield Soroban Contracts ==="
stellar contract build

echo "=== Deploying Contracts to Stellar Testnet ==="
TOKEN_ID=$(stellar contract deploy --wasm target/wasm32v1-none/release/reward_token.wasm --source admin --network testnet)
YIELD_MANAGER_ID=$(stellar contract deploy --wasm target/wasm32v1-none/release/yield_pool_manager.wasm --source admin --network testnet)
VAULT_ID=$(stellar contract deploy --wasm target/wasm32v1-none/release/liquidity_vault.wasm --source admin --network testnet)

echo "Reward Token ID: $TOKEN_ID"
echo "Yield Pool Manager ID: $YIELD_MANAGER_ID"
echo "Liquidity Vault ID: $VAULT_ID"

echo "=== Initializing Contracts ==="
ADMIN=$(stellar keys address admin)
stellar contract invoke --id "$TOKEN_ID" --source admin --network testnet -- initialize --admin "$ADMIN" --decimals 7 --name "Solar Reward Token" --symbol "syUSD"
stellar contract invoke --id "$YIELD_MANAGER_ID" --source admin --network testnet -- initialize --admin "$ADMIN"
stellar contract invoke --id "$VAULT_ID" --source admin --network testnet -- initialize --admin "$ADMIN" --token_contract "$TOKEN_ID" --yield_manager_contract "$YIELD_MANAGER_ID"
stellar contract invoke --id "$YIELD_MANAGER_ID" --source admin --network testnet -- set_vault --vault "$VAULT_ID"
