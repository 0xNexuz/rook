# Demo runbook

## Goal

Show that Rook turns a market rule into a visible, constrained sequence of moves without hiding authority or inventing execution results.

## Walkthrough

1. Open Rook and introduce the chessboard: “Plan the position. Let your Rook move.”
2. Select a few occupied squares and explain the King, market Queen, oracle Pawn, evaluator Knight, permission Bishop, and automation Rook.
3. In the rule card, keep **NVDA / falls / 5% / BUY / $100**. Point out that the board's live position updates with the selected asset and action.
4. Select **Simulate**. Highlight the **DETERMINISTIC SIMULATION** label and evaluation pipeline.
5. Select **Review permissions**. Show what Rook may and cannot do, then adjust the total cap or expiry.
6. Select **Connect & activate**. If no injected wallet exists, demonstrate the honest unsupported state. With a wallet, approve Robinhood Chain Testnet, chain ID **46630**.
7. Open **My Rooks**. The strategy is active with zero executions and no invented receipt. Pause, resume, then revoke it.
8. Open **Market**. Inspect canonical assets if the official API responds; otherwise show the explicit unavailable state.
9. Open **Explore**, fork **Market Dip Buyer**, and verify that only public configuration is copied.

## Narrative

Use the four chess lifecycle labels:

1. **Opening** — define the position.
2. **Analyze** — simulate the line.
3. **Castle** — lock the permission.
4. **Rook** — execute only legal moves.

No narration should be required to understand the primary flow.
