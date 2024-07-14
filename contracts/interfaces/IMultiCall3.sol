// SPDX-License-Identifier: MIT
pragma solidity >=0.8.12;

struct Call3 {
    // Target contract to call.
    address target;
    // If false, the entire call will revert if the call fails.
    bool allowFailure;
    // Data to call on the target contract.
    bytes callData;
}

struct Result {
    // True if the call succeeded, false otherwise.
    bool success;
    // Return data if the call succeeded, or revert data if the call reverted.
    bytes returnData;
}

interface IMulticall3 {
	function aggregate3(Call3[] calldata calls) external payable returns (Result[] memory returnData);
}