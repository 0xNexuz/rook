# Security model

## User guarantees

- Authority is scoped to named assets, action, per-execution cap, total allocation, and expiry.
- Users can pause or revoke. Revocation returns the unused funded balance.
- Executors and execution adapters are separate allowlists.
- The contract applies checks before external interaction and uses a reentrancy guard.
- Oracle answers must be positive, exact, and fresh.

## Production requirements

1. Audit `StrategyVault` and every adapter. An allowlisted adapter is a high-trust component.
2. Move admin authority to a multisig with a timelock and monitored adapter changes.
3. Add the Robinhood Chain L2 sequencer uptime feed and grace period before accepting prices.
4. Configure each Chainlink proxy, decimals, heartbeat, and corporate-action pause behavior from the current official registries.
5. Implement percentage conditions with an authenticated checkpoint/reference price, not executor-supplied history.
6. Apply slippage/deadline validation inside venue-specific adapters and measure received tokens by balance delta.
7. Add invariant, fuzz, fork, static-analysis, and independent-review coverage.
8. Use isolated, rotated executor keys; rate limits; alerting; and an emergency pause.

## Explicitly out of scope

The UI does not claim a live deployed contract, completed swap, historical performance, APY, TVL, users, or partnership. The preview's activation record is device-local and labeled as moving no funds.

## Reporting

Do not send private keys or exploit details through public issues. Establish a private security contact and disclosure policy before deployment.
