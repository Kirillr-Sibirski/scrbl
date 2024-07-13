// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;
pragma abicoder v2;

import {IEscrowWallet} from "./interfaces/IEscrowWallet.sol";
import {IERC20} from "openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "solidity-utils/libraries/SafeERC20.sol";
import {Address} from "openzeppelin-contracts/contracts/utils/Address.sol";

// @notice thrown when someone other than the escrow manager is trying to call this function
error CallerNotEscrowManagerException();

// @notice thrown when caller is not the escrow facade account
error CallerNotFacadeException();

contract EscrowWallet is IEscrowWallet {
    using SafeERC20 for IERC20;
    using Address for address;

    /// @notice facade this account was deployed with
    address public immutable facade;

    /// @notice Credit manager this account is connected to
    address public immutable escrowManagerAddr;

    /// @dev Ensures that function caller is escrow facade
    modifier facadeOnly() {
        if (msg.sender != facade) {
            revert CallerNotFacadeException();
        }
        _;
    }

    modifier managerOnly() {
        if (msg.sender != escrowManagerAddr) {
            revert CallerNotEscrowManagerException();
        }
        _;
    }

    /// @notice Constructor will deployed by escrow wallet factory contract so msg.sender will be factory contract address
    /// @param _escrowManager escrow manager to connect this account to
    constructor(address _escrowManager, address _facadeContract) {
        escrowManagerAddr = _escrowManager;
        facade = _facadeContract; 
    }

    function escrowManager() public view returns(address) {
        return escrowManagerAddr;
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
        facadeOnly
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
        facadeOnly
    {
        target.functionCall(data);
    }
}



