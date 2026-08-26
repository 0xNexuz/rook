// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
}

interface IPriceFeed {
    function latestRoundData() external view returns (uint80, int256, uint256, uint256, uint80);
}

interface IExecutionAdapter {
    function execute(address spendAsset, address actionAsset, uint256 spendAmount, uint256 minReceive, bytes calldata data) external returns (uint256 received);
}

/// @notice Permission-constrained vault for Rook strategies. Condition evaluation stays offchain;
///         authorization, price freshness, spend limits and adapter selection are enforced here.
contract StrategyVault {
    enum Condition { PriceAbove, PriceBelow, PercentageRise, PercentageFall, Recurring }
    enum Action { Buy, Sell, Notify }
    enum Status { Active, Paused, Revoked, Completed }

    struct Strategy {
        address owner;
        address conditionAsset;
        address actionAsset;
        address spendAsset;
        address priceFeed;
        uint128 threshold;
        uint128 maxExecutionAmount;
        uint128 maxTotalAllocation;
        uint128 totalSpent;
        uint64 expiry;
        uint32 maxOracleAge;
        Condition condition;
        Action action;
        Status status;
    }

    error Unauthorized(); error InvalidConfiguration(); error InvalidStatus(); error Expired();
    error LimitExceeded(); error StaleOracle(); error InvalidPrice(); error UnsupportedAdapter();
    error TransferFailed(); error ReentrantCall(); error ConditionNotMet();

    event StrategyCreated(uint256 indexed id, address indexed owner);
    event StrategyStatusChanged(uint256 indexed id, Status status);
    event StrategyFunded(uint256 indexed id, address indexed asset, uint256 amount);
    event StrategyExecuted(uint256 indexed id, address indexed executor, uint256 spent, uint256 received);
    event ExecutorUpdated(address indexed executor, bool allowed);
    event AdapterUpdated(address indexed adapter, bool allowed);

    address public immutable admin;
    uint256 public nextStrategyId = 1;
    uint256 private locked = 1;
    mapping(uint256 => Strategy) public strategies;
    mapping(uint256 => uint256) public balances;
    mapping(address => bool) public executors;
    mapping(address => bool) public adapters;

    modifier onlyAdmin() { if (msg.sender != admin) revert Unauthorized(); _; }
    modifier nonReentrant() { if (locked != 1) revert ReentrantCall(); locked = 2; _; locked = 1; }

    constructor(address initialAdmin) {
        if (initialAdmin == address(0)) revert InvalidConfiguration();
        admin = initialAdmin;
    }

    function setExecutor(address executor, bool allowed) external onlyAdmin { executors[executor] = allowed; emit ExecutorUpdated(executor, allowed); }
    function setAdapter(address adapter, bool allowed) external onlyAdmin { adapters[adapter] = allowed; emit AdapterUpdated(adapter, allowed); }

    function createStrategy(Strategy calldata input) external returns (uint256 id) {
        if (input.owner != msg.sender || input.owner == address(0) || input.expiry <= block.timestamp) revert InvalidConfiguration();
        if (input.action != Action.Notify && (input.spendAsset == address(0) || input.actionAsset == address(0) || input.maxExecutionAmount == 0 || input.maxTotalAllocation < input.maxExecutionAmount)) revert InvalidConfiguration();
        if (input.condition != Condition.Recurring && (input.priceFeed == address(0) || input.maxOracleAge == 0 || input.threshold == 0)) revert InvalidConfiguration();
        id = nextStrategyId++;
        strategies[id] = input;
        emit StrategyCreated(id, msg.sender);
    }

    function fund(uint256 id, uint256 amount) external nonReentrant {
        Strategy storage s = strategies[id];
        if (msg.sender != s.owner) revert Unauthorized();
        if (s.status != Status.Active || amount == 0) revert InvalidStatus();
        if (!IERC20(s.spendAsset).transferFrom(msg.sender, address(this), amount)) revert TransferFailed();
        balances[id] += amount;
        emit StrategyFunded(id, s.spendAsset, amount);
    }

    function setStatus(uint256 id, Status status) external {
        Strategy storage s = strategies[id];
        if (msg.sender != s.owner) revert Unauthorized();
        if (s.status == Status.Revoked || status == Status.Active && block.timestamp >= s.expiry) revert InvalidStatus();
        s.status = status;
        emit StrategyStatusChanged(id, status);
    }

    function revokeAndWithdraw(uint256 id) external nonReentrant {
        Strategy storage s = strategies[id];
        if (msg.sender != s.owner) revert Unauthorized();
        s.status = Status.Revoked;
        uint256 amount = balances[id]; balances[id] = 0;
        if (amount != 0 && !IERC20(s.spendAsset).transfer(s.owner, amount)) revert TransferFailed();
        emit StrategyStatusChanged(id, Status.Revoked);
    }

    function execute(uint256 id, address adapter, uint256 amount, uint256 observedPrice, uint256 minReceive, bytes calldata data) external nonReentrant returns (uint256 received) {
        Strategy storage s = strategies[id];
        if (!executors[msg.sender]) revert Unauthorized();
        if (!adapters[adapter]) revert UnsupportedAdapter();
        if (s.status != Status.Active) revert InvalidStatus();
        if (block.timestamp >= s.expiry) revert Expired();
        if (amount > s.maxExecutionAmount || s.totalSpent + amount > s.maxTotalAllocation || amount > balances[id]) revert LimitExceeded();
        if (s.condition != Condition.Recurring) _validatePrice(s, observedPrice);
        s.totalSpent += uint128(amount); balances[id] -= amount;
        if (!IERC20(s.spendAsset).transfer(adapter, amount)) revert TransferFailed();
        received = IExecutionAdapter(adapter).execute(s.spendAsset, s.actionAsset, amount, minReceive, data);
        if (received < minReceive) revert LimitExceeded();
        emit StrategyExecuted(id, msg.sender, amount, received);
    }

    function _validatePrice(Strategy storage s, uint256 observedPrice) internal view {
        (, int256 answer,, uint256 updatedAt,) = IPriceFeed(s.priceFeed).latestRoundData();
        if (answer <= 0) revert InvalidPrice();
        if (updatedAt == 0 || block.timestamp - updatedAt > s.maxOracleAge) revert StaleOracle();
        if (uint256(answer) != observedPrice) revert InvalidPrice();
        if ((s.condition == Condition.PriceAbove && observedPrice <= s.threshold) || (s.condition == Condition.PriceBelow && observedPrice >= s.threshold)) revert ConditionNotMet();
    }
}
