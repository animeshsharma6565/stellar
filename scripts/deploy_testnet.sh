#!/usr/bin/env bash
set -e

echo "=== Building SubScript Soroban Contracts ==="
stellar contract build

echo "=== Deploying Contracts to Stellar Testnet ==="
TOKEN_ID=$(stellar contract deploy --wasm target/wasm32v1-none/release/token.wasm --source admin --network testnet)
SUB_MANAGER_ID=$(stellar contract deploy --wasm target/wasm32v1-none/release/subscription_manager.wasm --source admin --network testnet)
VAULT_ID=$(stellar contract deploy --wasm target/wasm32v1-none/release/merchant_vault.wasm --source admin --network testnet)

echo "Token ID: $TOKEN_ID"
echo "SubManager ID: $SUB_MANAGER_ID"
echo "Vault ID: $VAULT_ID"
