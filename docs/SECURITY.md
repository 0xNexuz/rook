# Security model

## User guarantees

* Authority is scoped to named assets, one action, a per-execution cap, total allocation, and expiry.
* Users can pause or revoke.
* Revocation returns the unused funded balance.
* Executors and venue adapters are independent allowlists.
* The contract checks state before external interaction and uses a reentrancy guard.
* Oracle answers must be positive, exact, and fresh.

## Legal-move checks

An execution request is rejected when any of these are false:

1. the strategy exists and is active;
2. the caller is an allowlisted executor;
3. the venue adapter is allowlisted;
4. the strategy has not expired;
5. the amount fits the per-execution limit;
6. total spend remains below the allocation;
7. the oracle value is valid and fresh;
8. the vault has sufficient funded balance.

## Production requirements

1. Audit StrategyVault and every adapter.
2. Move administration to a multisig with a timelock.
3. Add the Robinhood Chain L2 sequencer uptime feed and a recovery grace period.
4. Configure each Chainlink proxy, decimals, heartbeat, and corporate-action pause behavior from current official registries.
5. Implement percentage conditions with authenticated checkpoint prices.
6. Validate slippage and deadlines inside venue-specific adapters.
7. Measure received tokens by balance delta.
8. Add invariant, fuzz, fork, and static-analysis coverage.
9. Isolate and rotate executor keys, rate-limit requests, monitor events, and maintain an emergency pause.

## Threat boundaries

### Compromised executor

The executor may request execution but cannot change assets, spend beyond limits, bypass expiry, select an arbitrary adapter, or withdraw unused funds.

### Malicious adapter

An allowlisted adapter is high trust. Each adapter must be minimal, venue-specific, audited, monitored, and removable by delayed governance.

### Stale or manipulated price

Reject non-positive, stale, incomplete, or mismatched oracle observations. Production must enforce the L2 sequencer check before accepting a price.

### Frontend compromise

Users should verify wallet prompts and onchain permission parameters. The frontend must never request a private key or place secrets in public environment variables.

## Explicitly out of scope

The preview does not claim a live deployed strategy contract, completed swap, historical performance, APY, TVL, user count, or partnership.

## Reporting

Do not send private keys or exploit details through public issues. Establish a private security contact and coordinated disclosure policy before production.
