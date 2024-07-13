// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;
pragma abicoder v1;

import { ISwapRouter } from "v3-periphery/contracts/interfaces/ISwapRouter.sol";
import {IERC20} from "openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "solidity-utils/libraries/SafeERC20.sol";
import {Address} from "openzeppelin-contracts/contracts/utils/Address.sol";
import "./Manager";
import "./EscrowWallet";

contract EscrowFacade {
    using SafeERC20 for IERC20;
    using Address for address;

    Manager public immutable escrowManager;
    ISwapRouter public immutable swapRouter;

    address public constant WETH = 0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14;
    address public constant USDC = 0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238;

    //hard code 0.1% fee since these are a stable/popular pair
     uint24 public constant poolFee = 1000;

    struct Loan {
		uint256 debtAmount; // In USDC, will be increasing with interested rate
		uint256 collateralAmount; // Stays unchanged, will be used for liquidation
		address escrowWallet;
		int16 interestRate;
	}

    constructor(address _escrowManager, address _swapRouter) {
        escrowManager = Manager(_escrowManagerAddr);
        swapRouter = ISwapRouter(_swapRouter);
    }

    function SwapOnUniswap(address tokenIn, address tokenOut, uint64 amountIn) external {
        Loan loan = escrowManager.s_loans[msg.sender];
        if(loan.escrowWallet != address(0)) revert("This caller does not have any loans initiated from this address");
        
        IERC20 token0 = IERC20(tokenIn);
        if (token0.balanceOf(loan.escrowWallet) < amountIn) revert("escrow wallet does not have enough of token0 to perfrom swap");
        if (tokenOut != WETH && tokenOut != USDC) revert("caller is attempting to swap to a not whitelisted token");

        token0.approve(address(swapRouter), amountIn);

        // get price from oracle here

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

        EscrowWallet escrow = EscrowWallet(loan.escrowWallet);
        escrow.execute(address(swapRouter), abi.encode(params));

        bool liquidate = escrowManager.checkLiquidate(loan.escrowWallet);
        if (!liquidate) revert("this swap puts this loan udnerwater");
    }

    
}

