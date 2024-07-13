// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

interface IEscrowWallet {
    function escrowManager() external view returns (address);

    function safeTransfer(address token, address to, uint256 amount) external;

    function execute(address target, bytes calldata data) external returns (bytes memory result);

    function rescue(address target, bytes calldata data) external;
}

