// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;
pragma abicoder v1;

import {IEscrowWallet} from "./interfaces/IEscrowWallet.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "solidity-utils/contracts/libraries/SafeERC20.sol";
import {Address} from "@openzeppelin/contracts/utils/Address.sol";

// @notice thrown when someone other than the escrow manager is trying to call this function
error CallerNotEscrowManagerException();

// @notice thrown when caller is not the escrow facade account
error CallerNotFactoryException();

contract EscrowWallet is IEscrowWallet {
    using SafeERC20 for IERC20;
    using Address for address;

    /// @notice Account factory this account was deployed with
    address public immutable override factory;

    /// @notice Credit manager this account is connected to
    address public immutable override escrowManager;

    /// @dev Ensures that function caller is account factory
    modifier factoryOnly() {
        if (msg.sender != factory) {
            revert CallerNotFactoryException();
        }
        _;
    }

    modifier managerOnly() {
        if (msg.sender != escrowManager) {
            revert CallerNotEscrowManagerException();
        }
        _;
    }

    /// @notice Constructor will deployed by escrow wallet factory contract so msg.sender will be factory contract address
    /// @param _escrowManager escrow manager to connect this account to
    constructor(address _escrowManager) {
        creditManager = _escrowManager;
        factory = msg.sender; 
    }

    /// @notice Transfers tokens from the escrow wallet, can only be called by the manager
    /// @param token Token to transfer
    /// @param to Transfer recipient
    /// @param amount Amount to transfer
    function safeTransfer(address token, address to, uint256 amount)
        external
        override
        managerOnly
    {
        IERC20(token).safeTransfer(to, amount);
    }

    /// @notice Executes function call from the account to the target contract with provided data,
    ///         can only be called by the manger contract
    /// @param target Contract to call
    /// @param data Data to call the target contract with
    /// @return result Call result
    function execute(address target, bytes calldata data)
        external
        override
        managerOnly
        returns (bytes memory result)
    {
        result = target.functionCall(data);
    }

    /// @notice Executes function call from the account to the target contract with provided data,
    ///         can only be called by the factory.
    ///         Allows to rescue funds that were accidentally left on the account upon closure.
    /// @param target Contract to call
    /// @param data Data to call the target contract with
    function rescue(address target, bytes calldata data)
        external
        override
        factoryOnly
    {
        target.functionCall(data);
    }
}



