// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import { ByteHasher } from './helpers/ByteHasher.sol';
import { IWorldID } from './interfaces/IWorldID.sol';

contract Manager {
	using ByteHasher for bytes;

	///////////////////////////////////////////////////////////////////////////////
	///                                  ERRORS                                ///
	//////////////////////////////////////////////////////////////////////////////

	/// @notice Thrown when attempting to reuse a nullifier
	error DuplicateNullifier(uint256 nullifierHash);

	/// @dev The World ID instance that will be used for verifying proofs
	IWorldID internal immutable worldId;

	/// @dev The contract's external nullifier hash
	uint256 internal immutable externalNullifier;

	/// @dev The World ID group ID (always 1)
	uint256 internal immutable groupId = 1;

	/// @dev Normal wallet to WorldID (here are the wallets that have been verified with the World ID)
	mapping(address => uint256) internal verifiedWallet;

	/// @param nullifierHash The nullifier hash for the verified proof
	/// @dev A placeholder event that is emitted when a user successfully verifies with World ID
	event Verified(uint256 nullifierHash);

	/// @param nullifierHash The nullifier hash for the verified proof
	/// @param old_address The old address that the user wants to change
	/// @param new_address The new address that the user wants to change to
	event UpdateVerified(uint256 nullifierHash, address old_address, address new_address);

	/// @param _worldId The WorldID router that will verify the proofs
	/// @param _appId The World ID app ID
	/// @param _actionId The World ID action ID
	constructor(IWorldID _worldId, string memory _appId, string memory _actionId) {
		worldId = _worldId;
		externalNullifier = abi.encodePacked(abi.encodePacked(_appId).hashToField(), _actionId).hashToField();
	}

	/// @param signal An arbitrary input from the user, usually the user's wallet address (check README for further details)
	/// @param root The root of the Merkle tree (returned by the JS widget).
	/// @param nullifierHash The nullifier hash for this proof, preventing double signaling (returned by the JS widget).
	/// @param proof The zero-knowledge proof that demonstrates the claimer is registered with World ID (returned by the JS widget).
	/// @dev Here we verify that the ETH wallet they have connected corresponds to a real person using WorldID.
	function verifyWallet(address signal, uint256 root, uint256 nullifierHash, uint256[8] calldata proof) public {
		if(verifiedWallet[msg.sender] != 0) revert("Wallet address already verified with WorldID");
		// We now verify the provided proof is valid and the user is verified by World ID
		worldId.verifyProof(
			root,
			groupId,
			abi.encodePacked(signal).hashToField(),
			nullifierHash,
			externalNullifier,
			proof
		);

		verifiedWallet[msg.sender] = nullifierHash;

		emit Verified(nullifierHash);
	}


	/// @param signal Old address of the wallet that user wants to change.
	function changeVerifiedWallet(address signal, uint256 root, uint256 nullifierHash, uint256[8] calldata proof) public {
		if(verifiedWallet[signal] == 0) revert("Wallet address doesn't exist.");
		// We now verify the provided proof is valid and the user is verified by World ID
		worldId.verifyProof(
			root,
			groupId,
			abi.encodePacked(signal).hashToField(),
			nullifierHash,
			externalNullifier,
			proof
		);

		if(verifiedWallet[signal] != nullifierHash) revert("WorldID is different.");
		verifiedWallet[msg.sender] = nullifierHash; //Updating
		verifiedWallet[signal] = 0;

		emit UpdateVerified(nullifierHash, signal, msg.sender);
	}
}
