# SolarYield — Soroban Yield Staking & Liquidity Vaults

[![CI Pipeline](https://github.com/animeshsharma6565/stellar/actions/workflows/ci.yml/badge.svg)](https://github.com/animeshsharma6565/stellar/actions/workflows/ci.yml)
![Stellar Testnet](https://img.shields.io/badge/Stellar-Testnet-blue?logo=stellar)
![Cloudflare Connected](https://img.shields.io/badge/Cloudflare%20Pages-Connected-orange?logo=cloudflare)

*   **Live Demo**: `PENDING — Cloudflare domain assignment awaiting DNS propagation`
*   **Demo Video (1–2 min)**: `PENDING — Walkthrough recording session scheduled`

---

## Project Description

**SolarYield** is a premium, non-custodial decentralized yield staking and liquidity vault management application built on the **Stellar Testnet** using **Soroban smart contracts**. SolarYield allows users to allocate assets into locked yield strategies, accruing returns calculated live down to the microsecond, while vault operators manage strategies and trigger checkpoint distributions via time-locked on-chain triggers.

---

## Architecture

SolarYield operates on a 3-contract Cargo workspace where yield accounting, reward distributions, and capital lockups are processed modularly:

```
project1/
├── Cargo.toml                          # Cargo workspace configuration
├── contracts/
│   ├── reward_token/                   # Payment Asset & Reward Distribution (syUSD)
│   ├── yield_pool_manager/             # Staking strategy details, lockups, and events
│   └── liquidity_vault/                # Vault operator balances & inter-contract checkpoints
├── src/                                # Next.js 14 App Router Frontend
│   ├── core/                           # Connectors, global error components, & modals
│   ├── modules/                        # Staking dashboards, explorers, & operator metrics
│   └── types/                          # TypeScript definitions
├── scripts/                            # Math unit tests and deploy scripts
└── README.md
```

### Inter-Contract Call Flow
```mermaid
sequenceDiagram
    participant Operator
    participant LiquidityVault as liquidity_vault
    participant YieldManager as yield_pool_manager
    participant Token as reward_token
    participant Staker

    Staker->>YieldManager: initiate_staking(strategy_id, amount)
    Staker->>Token: approve(liquidity_vault, amount)
    Operator->>LiquidityVault: aggregate_yield_checkpoint(staker_address)
    LiquidityVault->>YieldManager: checkpoint_and_update_rewards(staker_address)
    YieldManager-->>LiquidityVault: Returns principal amount & operators details (verified)
    LiquidityVault->>Token: transfer_from(staker, liquidity_vault, amount)
    LiquidityVault-->>Operator: Yield aggregates successfully inside vault
    Operator->>LiquidityVault: operator_withdraw(amount)
    LiquidityVault->>Token: transfer(liquidity_vault, operator, amount)
```

---

## Tech Stack

*   **Smart Contracts**: Rust, Soroban SDK (v21.4.0)
*   **Frontend Core**: Next.js 14 (App Router, React 18, TypeScript)
*   **Styling System**: Tailwind CSS (Fintech Minimalist Light Theme)
*   **Wallet Integration**: `@stellar/freighter-api` & `@creit.tech/stellar-wallets-kit`
*   **CI/CD Pipeline**: GitHub Actions (Ubuntu workflows compiling WASM and static Next builds)
*   **Hosting**: Cloudflare Pages / Workers static assets

---

## Smart Contracts (Testnet)

| Contract | Address | Stellar Expert Link |
| :--- | :--- | :--- |
| **`reward_token`** | `CASTQ7SBTRUEIMF5ZE2QDUUUCZ34B73GQCD5CTA432B4EL6K5WB2UJX6` | [Stellar Expert Explorer](https://stellar.expert/explorer/testnet/contract/CASTQ7SBTRUEIMF5ZE2QDUUUCZ34B73GQCD5CTA432B4EL6K5WB2UJX6) |
| **`yield_pool_manager`** | `CBADCP2XSXPAPGPSQP26DJMQACZGTTE2SNI7SAJTGGL6SDPTSNCZJNEJ` | [Stellar Expert Explorer](https://stellar.expert/explorer/testnet/contract/CBADCP2XSXPAPGPSQP26DJMQACZGTTE2SNI7SAJTGGL6SDPTSNCZJNEJ) |
| **`liquidity_vault`** | `CDJVALNLLGNQIW6GQYKMDSJ2S5MHA2EBL5QLE3UMN3MN7TVVXHHL7ZC5` | [Stellar Expert Explorer](https://stellar.expert/explorer/testnet/contract/CDJVALNLLGNQIW6GQYKMDSJ2S5MHA2EBL5QLE3UMN3MN7TVVXHHL7ZC5) |

All three contracts above were compiled from the current `contracts/*/src/lib.rs` sources and deployed fresh to Stellar Testnet on 2026-07-22 by this audit (previous evidence in this repo's history referenced a stale, cosmetically-renamed deployment and has been replaced end-to-end).

---

## Inter-Contract Calls

SolarYield features verified on-chain inter-contract calls. During a checkpoint distribution event, the `LiquidityVaultContract` invokes the `YieldPoolManagerContract` using the following signatures:

*   **Caller Module**: `LiquidityVaultContract` (source file: [lib.rs](contracts/liquidity_vault/src/lib.rs))
*   **Target Module**: `YieldPoolManagerContract` (source file: [lib.rs](contracts/yield_pool_manager/src/lib.rs))
*   **Target Signature**: `checkpoint_and_update_rewards(e: Env, caller: Address, staker: Address, operator: Address) -> (i128, Address)`
*   **Technical Mechanism**: `YieldPoolManagerContractClient::new(&e, &yield_manager_addr).checkpoint_and_update_rewards(&vault_address, &staker, &operator)`
*   **Verified Checkpoint Tx Hash**: `0e230f78c96c70877a15ccedd622920b1691a9530dcf1cc86a9a3af3bbab3db9` [Stellar Expert Verification Link](https://stellar.expert/explorer/testnet/tx/0e230f78c96c70877a15ccedd622920b1691a9530dcf1cc86a9a3af3bbab3db9)

---

## Verified On-Chain Transactions

Full, reproducible testnet evidence trail (deploy → init → wire → register → stake → checkpoint → withdraw), each independently verifiable on Stellar Expert:

| Step | Transaction Hash | Explorer Link |
| :--- | :--- | :--- |
| `reward_token` deploy | `e95a3351180be43ed37b96f919fa35ed9ee0e6a7e4ef1ff5ca0e605d60a64b03` | [View](https://stellar.expert/explorer/testnet/tx/e95a3351180be43ed37b96f919fa35ed9ee0e6a7e4ef1ff5ca0e605d60a64b03) |
| `yield_pool_manager` deploy | `4580d4bfebf6c7efd40221f9653ca03aafba7f7ffecc8d696591b58ec54eeb2a` | [View](https://stellar.expert/explorer/testnet/tx/4580d4bfebf6c7efd40221f9653ca03aafba7f7ffecc8d696591b58ec54eeb2a) |
| `liquidity_vault` deploy | `15fd0d8f3ce92f95ebc2feb4318087b00f4fa8dade48ec31c27a92e8eae45c5c` | [View](https://stellar.expert/explorer/testnet/tx/15fd0d8f3ce92f95ebc2feb4318087b00f4fa8dade48ec31c27a92e8eae45c5c) |
| `initiate_staking` (stake event) | `9fffce6d3f04bff1dae32965d44c39057729a7ab617cb728bb12072fbdb8a777` | [View](https://stellar.expert/explorer/testnet/tx/9fffce6d3f04bff1dae32965d44c39057729a7ab617cb728bb12072fbdb8a777) |
| `aggregate_yield_checkpoint` (inter-contract call + event) | `0e230f78c96c70877a15ccedd622920b1691a9530dcf1cc86a9a3af3bbab3db9` | [View](https://stellar.expert/explorer/testnet/tx/0e230f78c96c70877a15ccedd622920b1691a9530dcf1cc86a9a3af3bbab3db9) |
| `operator_withdraw` | `da21be35fff4d7cb2b2ea802d0864454b150a8d10c439b2cb8efb9048d49f373` | [View](https://stellar.expert/explorer/testnet/tx/da21be35fff4d7cb2b2ea802d0864454b150a8d10c439b2cb8efb9048d49f373) |

---

## Wallet Connection

SolarYield utilizes Freighter Wallet API wrappers to handle secure key authentication:
*   Queries connection state and prompts access requests during session initializations.
*   Presents clean `Connect Wallet` and `Disconnect` hooks in the navigation bar.
*   Enforces Freighter context validations before executing any contract transactions.

---

## Core Mechanics

Vesting yield accumulation models a compound linear checkpoints algorithm based on APY basis points:

$$\text{accrued\_rewards} = \text{unclaimed\_balance} + \frac{\text{principal} \times \text{apy\_bps} \times \text{elapsed\_seconds}}{10000 \times \text{SECONDS\_PER\_YEAR}}$$

*   Every deposit or withdrawal updates user checkpoints to lock accumulated rewards.
*   A client-side clock animation updates the visual ticker down to microsecond increments.

---

## Events & Real-Time Updates

Both `yield_pool_manager` and `liquidity_vault` emit Soroban contract events (`env.events().publish`) for every state-changing action: `strategy`, `stake`, `status` (pause/resume/terminate), `check`, `chkpoint`, and `withdraw`. The frontend's **On-Chain Event Ledger** (Staking Portal) polls these events directly from Soroban RPC (`server.getEvents`) every 15 seconds and re-renders without a full page reload — it is not a hardcoded log. Real emitted events from this audit's test run are independently queryable at the tx hashes listed above.

---

## Error Handling

SolarYield handles three distinct user-facing fallback exceptions with custom messaging and visual boundaries:
1.   **Freighter Wallet Not Found**: Shows when extension hooks are absent with install guides.
2.   **Signature Rejected**: Alert displayed when keysigner operations are declined.
3.   **Maturity Lock / Insufficient Funds**: Dispatched when time-locked constraints remain active on-chain.

---

## Screenshots

### Wallet Connected & Core flow
![Desktop Staking Overview](src/media/staking_portal_desktop.png)

### Success State & Strategy Explorer
![Desktop Strategy Explorer](src/media/strategy_explorer_desktop.png)

### Operator Dashboard Metrics
![Operator Vault Metrics](src/media/operator_vault_desktop.png)

### Mobile UI
![SolarYield Mobile Dashboard](src/media/staking_portal_mobile.png)

### CI/CD run
`PENDING — this audit's contract/frontend changes are not yet committed or pushed. A real passing-run screenshot for github.com/animeshsharma6565/stellar was visually verified during this audit (run #23 on commit 363aa3f, "Success", 54s) but reflects the pre-audit code; capture a fresh screenshot after pushing so it matches what's actually in this repo.`

### Error State (Missing Wallet)
![Error Modal Missing Wallet](src/media/error_modal_missing_wallet.png)

Verbose test output (contract + frontend) is linked as text in the [Testing](#testing) section below rather than duplicated as a screenshot.

---

## Setup Instructions

### Pre-requisites
*   Node.js (v20+)
*   Rust + Cargo
*   Stellar CLI

### Quick Start
1.  **Clone workspace dependencies**:
    ```bash
    npm install
    ```
2.  **Build smart contracts**:
    ```bash
    stellar contract build
    ```
3.  **Run next.js dev server**:
    ```bash
    npm run dev
    ```

---

## Testing

### Run Smart Contract Cargo Unit Tests
```bash
cargo test --all
```
[Verbose Contract Test Outputs](src/media/cargo_test_output.txt)

### Run Frontend Mathematics Unit Tests
```bash
npm run test
```
[Verbose Frontend Test Outputs](src/media/frontend_test_output.txt)

---

## License

This project is licensed under the MIT License.
