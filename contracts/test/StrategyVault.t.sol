// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "../src/StrategyVault.sol";

interface Vm { function prank(address) external; function expectRevert(bytes4) external; function warp(uint256) external; }

contract MockERC20 is IERC20 {
    mapping(address=>uint256) public balanceOf; mapping(address=>mapping(address=>uint256)) public allowance;
    function mint(address to,uint256 amount) external { balanceOf[to]+=amount; }
    function approve(address s,uint256 a) external returns(bool){allowance[msg.sender][s]=a;return true;}
    function transfer(address to,uint256 a) external returns(bool){balanceOf[msg.sender]-=a;balanceOf[to]+=a;return true;}
    function transferFrom(address f,address t,uint256 a) external returns(bool){allowance[f][msg.sender]-=a;balanceOf[f]-=a;balanceOf[t]+=a;return true;}
}
contract MockFeed is IPriceFeed { int256 public price=100e8; uint256 public updatedAt=block.timestamp; function set(int256 p,uint256 t) external {price=p;updatedAt=t;} function latestRoundData() external view returns(uint80,int256,uint256,uint256,uint80){return(1,price,updatedAt,updatedAt,1);} }
contract MockAdapter is IExecutionAdapter { function execute(address,address,uint256 a,uint256,bytes calldata) external pure returns(uint256){return a;} }

contract StrategyVaultTest {
    Vm constant vm=Vm(address(uint160(uint256(keccak256("hevm cheat code")))));
    StrategyVault vault; MockERC20 token; MockFeed feed; MockAdapter adapter; address owner=address(0xBEEF); address executor=address(0xCAFE);
    function setUp() public { vault=new StrategyVault(address(this));token=new MockERC20();feed=new MockFeed();adapter=new MockAdapter();vault.setExecutor(executor,true);vault.setAdapter(address(adapter),true);token.mint(owner,1000e18); }
    function strategy() internal view returns(StrategyVault.Strategy memory s){s=StrategyVault.Strategy(owner,address(token),address(token),address(token),address(feed),uint128(99e8),uint128(50e18),uint128(100e18),0,uint64(block.timestamp+30 days),3600,StrategyVault.Condition.PriceAbove,StrategyVault.Action.Buy,StrategyVault.Status.Active);}
    function createAndFund() internal returns(uint256 id){vm.prank(owner);id=vault.createStrategy(strategy());vm.prank(owner);token.approve(address(vault),100e18);vm.prank(owner);vault.fund(id,100e18);}
    function testOwnerCanCreateFundAndRevoke() public {uint256 id=createAndFund();vm.prank(owner);vault.revokeAndWithdraw(id);require(token.balanceOf(owner)==1000e18,"refund");}
    function testExecutorRespectsPerExecutionCap() public {uint256 id=createAndFund();vm.prank(executor);vm.expectRevert(StrategyVault.LimitExceeded.selector);vault.execute(id,address(adapter),51e18,100e8,0,"");}
    function testRejectsStaleOracle() public {uint256 id=createAndFund();vm.warp(block.timestamp+2 hours);vm.prank(executor);vm.expectRevert(StrategyVault.StaleOracle.selector);vault.execute(id,address(adapter),10e18,100e8,0,"");}
    function testUnauthorizedExecutorRejected() public {uint256 id=createAndFund();vm.expectRevert(StrategyVault.Unauthorized.selector);vault.execute(id,address(adapter),10e18,100e8,0,"");}
}
