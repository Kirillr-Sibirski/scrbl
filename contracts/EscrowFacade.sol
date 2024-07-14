// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;
pragma abicoder v2;

import { ISwapRouter } from "v3-periphery/interfaces/ISwapRouter.sol";
import {IERC20} from "openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "solidity-utils/libraries/SafeERC20.sol";
import {Address} from "openzeppelin-contracts/contracts/utils/Address.sol";
import { Manager } from "./Manager.sol";
import { EscrowWallet } from "./EscrowWallet.sol";

interface CErc20 {
    function mint(uint256) external returns (uint256);

    function exchangeRateCurrent() external returns (uint256);

    function supplyRatePerBlock() external returns (uint256);

    function redeem(uint) external returns (uint);

    function redeemUnderlying(uint) external returns (uint);
}

contract EscrowFacade {
    using SafeERC20 for IERC20;
    using Address for address;

    Manager public immutable escrowManager;
    address public immutable swapRouterAddr = 0xE592427A0AEce92De3Edee1F18E0157C05861564; //optimism mainnet and eth sepolia address 
    ISwapRouter public immutable swapRouter = ISwapRouter(swapRouterAddr);

    address public constant WETH = 0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14; //eth sepolia address
    address public constant USDC = 0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238; //eth sepolia address
    address public constant cUSDCv3 = 0xAec1F48e02Cfb822Be958B68C7957156EB3F0b6e; //eth sepolia address for compound usdc pool
    address public constant cWETHv3 = 0x2943ac1216979aD8dB76D9147F64E61adc126e96; // eth sepolia address

    //hard code 0.1% fee since these are a stable/popular pair
    uint24 public constant poolFee = 1000;

    constructor(address _escrowManager) {
        escrowManager = Manager(_escrowManager);
    }

    function SwapOnUniswap(address tokenIn, address tokenOut, uint64 amountIn) external {
        Manager.Loan memory loan = escrowManager.GetLoanDetailsByAddress(msg.sender);
        if(loan.escrowWallet != address(0)) revert("This caller does not have any loans initiated from this address");
        
        IERC20 token0 = IERC20(tokenIn);
        if (token0.balanceOf(loan.escrowWallet) < amountIn) revert("escrow wallet does not have enough of token0 to perfrom swap");
        if (tokenOut != WETH && tokenOut != USDC) revert("caller is attempting to swap to a not whitelisted token");

        bytes memory approveCallData = abi.encodeWithSelector(token0.approve.selector, address(swapRouter), amountIn);
        EscrowWallet escrow = EscrowWallet(loan.escrowWallet);
        bytes memory result = escrow.execute(address(token0), approveCallData);
        bool approved = abi.decode(result, (bool));
        if (approved == false) revert("unable to approve transfer for token0 in escrow wallet");

        ISwapRouter.ExactInputSingleParams memory params = ISwapRouter
            .ExactInputSingleParams({
                tokenIn: tokenIn,
                tokenOut: tokenOut,
                fee: poolFee,
                recipient: address(loan.escrowWallet),
                deadline: block.timestamp,
                amountIn: amountIn,
                amountOutMinimum: 0,
                sqrtPriceLimitX96: 0
            });

        
        escrow.execute(address(swapRouter), abi.encodeWithSelector(swapRouter.exactInputSingle.selector, params));

        uint256 healthRatio = escrowManager.getHealthRatio(loan.escrowWallet);
        if (healthRatio < uint(int(loan.initialCollateralPercentage-10))) revert("this swap puts this loan udnerwater");
    }

    function DepositInCompound(address tokenIn, uint64 amountToDeposit) external returns (uint) {
        Manager.Loan memory loan = escrowManager.GetLoanDetailsByAddress(msg.sender);
        IERC20 underlying = IERC20(tokenIn);
        if(loan.escrowWallet != address(0)) revert("This caller does not have any loans initiated from this address");

        if (address(underlying) != USDC && address(underlying) != WETH) revert("can only deposit USDC or ETH");
        if (underlying.balanceOf(address(loan.escrowWallet)) < amountToDeposit) revert("account does not have enough of token to deposit this amount");
        CErc20 compoundPool;
        if (address(underlying) == USDC) {
            compoundPool = CErc20(cUSDCv3);
        } else {
            compoundPool = CErc20(cWETHv3);
        }

        
        underlying.approve(address(compoundPool), amountToDeposit);

        uint mintResult = compoundPool.mint(amountToDeposit);
        return mintResult;
    }

    function RedeemCtokensFromPool(address _cToken, uint256 _amountToRedeem, bool _redeemType) external returns(bool) {
        //Manager.Loan memory loan = escrowManager.GetLoanDetailsByAddress(msg.sender);
        IERC20 underlying;
        CErc20 cToken = CErc20(_cToken);
        if (_cToken == address(0xAec1F48e02Cfb822Be958B68C7957156EB3F0b6e)) {
            underlying = IERC20(USDC);
        } else if(_cToken == address(0x2943ac1216979aD8dB76D9147F64E61adc126e96)) {
            underlying = IERC20(WETH);
        }

        uint256 redeemResult;

        if (_redeemType == true) {
            redeemResult = cToken.redeem(_amountToRedeem);
        } else {
            // Retrieve your asset based on an amount of the asset
            redeemResult = cToken.redeemUnderlying(_amountToRedeem);
        }

        if (redeemResult == 0) {
            return true;
        } else {
            return false;
        }
    }
}



