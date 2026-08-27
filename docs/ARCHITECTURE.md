# Architecture

Rook separates observing a market from authorizing a financial action. The evaluator may propose a move; the vault independently decides whether that move is legal.

~~~mermaid
sequenceDiagram
  participant M as Market / Oracle
  participant E as Evaluator
  participant V as StrategyVault
  participant A as Allowlisted Adapter
  participant U as User
  U->>V: Create and fund bounded strategy
  E->>M: Observe price or schedule
  E->>V: Request execution with observation
  V->>M: Verify fresh onchain price
  V->>V: Check executor, adapter, status, expiry, caps
  V->>A: Transfer exact spend and execute
  A-->>V: Return settlement result
  V-->>U: Emit auditable receipt
~~~

## Chessboard interface

The 8×8 board is a visual model of the authority graph, not decoration.

| Piece | Component | Authority |
| --- | --- | --- |
| King | User wallet | Final approval and revocation |
| Queen | Market | Produces the available position |
| Rook | StrategyVault | Executes constrained straight-line authority |
| Bishop | Permission layer | Validates scope, caps, and expiry |
| Knight | Evaluator | Observes and proposes a move |
| Pawn | Observation/action | The smallest unit in a strategy line |

Selecting a square reveals its role. Changing the asset or action updates the position represented on the board.

## Frontend

The Vinext/Next.js TypeScript client contains Market, Create, My Rooks, and Explore views. The server route **/api/market** proxies documented, read-only Robinhood endpoints and applies short cache windows. Loading, disconnected, empty, and unavailable states are first-class.

## Automation service

The evaluator is intentionally not a custodian. A production service watches Chainlink and RPC data, creates an execution request, and signs it with an allowlisted executor key. That key cannot select arbitrary tokens, exceed a user's caps, use an unapproved adapter, or withdraw funds.

## Onchain boundary

**StrategyVault** stores the auditable permission definition and funded balance. It checks strategy ownership, assets, action, spend limits, expiry, status, executor, adapter, and oracle freshness before external interaction.

## Market data

Current Stock Token metadata and quotes come from **https://api.robinhood.com/rhj/**. Contract addresses are discovered from canonical deployment records. Chainlink feed addresses and heartbeat values must be sourced from current official registries at deployment time.

## Deployment boundaries

* Drafts, presentation copy, discovery metadata, and deterministic simulations stay offchain.
* Strategy permission, funded balance, total spent, status, and expiry belong onchain.
* The current testnet preview persists created strategies in browser storage and does not claim completed execution.
