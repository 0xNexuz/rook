# Rook

## Programmable markets, played like chess

Rook turns a market rule into a constrained onchain move. You choose the position, simulate the line, define exactly what the automation may do, and retain the power to pause or revoke it.

> **Status:** Rook is an experimental Robinhood Chain testnet preview. Strategy records are stored locally in the browser and activation does not move funds until an audited vault and venue adapter are configured.

## Documentation

| Guide | What it covers |
| --- | --- |
| [Getting started](#getting-started) | Create, simulate, and activate a first strategy |
| [Strategy model](#strategy-model) | Conditions, actions, limits, and chess notation |
| [Architecture](docs/ARCHITECTURE.md) | Frontend, evaluator, vault, adapter, and data boundaries |
| [Security](docs/SECURITY.md) | User guarantees and production requirements |
| [Demo runbook](docs/DEMO.md) | A complete product walkthrough |
| [Contract](contracts/src/StrategyVault.sol) | The onchain permission boundary |

## The board

| Piece | Product role |
| --- | --- |
| ♔ King | Your wallet and final authority |
| ♛ Queen | The market and available liquidity |
| ♜ Rook | The constrained automation vault |
| ♝ Bishop | Permission validation |
| ♞ Knight | The condition evaluator |
| ♟ Pawn | A market observation or execution action |

## Getting started

### 1. Create an opening

Open **Create** and define one clear rule:

> When **condition** is true for **asset**, perform **action** within **limits**.

Choose a supported asset, a trigger, **BUY**, **SELL**, or **NOTIFY**, and the maximum amount for one execution.

### 2. Analyze the line

Select **Simulate**. The deterministic preview shows the condition check, market check, rule match, permission check, and requested result. It does not claim historical performance without a verified historical dataset.

### 3. Castle the permission

Set a maximum total allocation and an expiry. The Rook may use only the named asset, action, and limits. It never receives unrestricted wallet authority.

### 4. Activate and observe

Connect an injected EVM wallet and approve Robinhood Chain Testnet, chain ID **46630**. Open **My Rooks** to pause, resume, or revoke the device-local preview.

## Strategy model

### Conditions

| Condition | Meaning | Production requirement |
| --- | --- | --- |
| Falls below | Price is below an absolute threshold | Fresh onchain oracle |
| Rises above | Price is above an absolute threshold | Fresh onchain oracle |
| Falls by % | Price declined from a reference observation | Authenticated checkpoint |
| Rises by % | Price increased from a reference observation | Authenticated checkpoint |
| Every Monday | Recurring schedule | Trusted scheduler plus market checks |

### Actions

* **BUY** — spend no more than the execution and total caps to acquire the selected asset.
* **SELL** — sell only the selected asset and never more than the configured cap.
* **NOTIFY** — observe the condition without moving funds.

### Chess notation

* A **position** is the complete strategy configuration.
* A **move** is one evaluated execution request.
* A **legal move** passes oracle, condition, expiry, adapter, and spend checks.
* **Check** is a risk condition requiring attention.
* To **resign** is to revoke the strategy and recover its unused vault balance.

## API reference

### GET /api/market

Returns supported Robinhood assets enriched with current quotes. The proxy uses documented, read-only Robinhood endpoints and never synthesizes missing prices or addresses.

### GET /api/market?symbol=NVDA

Returns the upstream price payload for one uppercased symbol.

Successful responses use a short public cache window. Upstream failures return an explicit 502 or 503 response.

## Contract workflow

~~~bash
forge build
forge test
~~~

Deploy only after configuring a reviewed administrator, oracle feeds, heartbeats, sequencer checks, and audited venue adapters.

~~~bash
forge create contracts/src/StrategyVault.sol:StrategyVault \
  --rpc-url "$ROBINHOOD_RPC_URL" \
  --private-key "$DEPLOYER_PRIVATE_KEY" \
  --constructor-args <ADMIN_ADDRESS>
~~~

Never commit private keys. Rook is not investment advice and does not bypass issuer or venue eligibility controls.
