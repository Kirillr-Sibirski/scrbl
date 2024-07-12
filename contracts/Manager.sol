// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { ByteHasher } from './helpers/ByteHasher.sol';
import { IWorldID } from './interfaces/IWorldID.sol';

contract Manager {
	using ByteHasher for bytes;

	int8 private constant DEFAULT_CREDIT_SCORE = 50;
	uint256 private constant INTEREST_INTERVAL = 86400; //seconds (1 day)

	struct Loan {
		uint256 debtAmount; // In USDC, will be increasing with interested rate
		uint256 collateralAmount; // Stays unchanged, will be used for liquidation
		address escrowWallet;
		int8 interestRate;
	}

	address public usdcTokenAddress = 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48; // Mainnet USDC address
    IERC20 usdcToken = IERC20(usdcTokenAddress);

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

	uint256 private lastInterestTopUp = block.timestamp;

	/// @dev Normal wallet to WorldID (here are the wallets that have been verified with the World ID)
	mapping(address => uint256) internal s_verifiedWallet;

	/// @dev Credit scores are stored here /100
	mapping(address => int8) internal s_creditScore;

	/// @dev List of current loans
	mapping(address => Loan) internal s_loans;
	address[] internal s_loanAddresses;

	/// @param nullifierHash The nullifier hash for the verified proof
	/// @dev A placeholder event that is emitted when a user successfully verifies with World ID
	event Verified(uint256 nullifierHash);

	/// @param nullifierHash The nullifier hash for the verified proof
	/// @param old_address The old address that the user wants to change
	/// @param new_address The new address that the user wants to change to
	event UpdateVerified(uint256 nullifierHash, address old_address, address new_address);

	event RepayLoan(address, uint256);

	event Liquidation(address);

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
		if(s_verifiedWallet[msg.sender] != 0) revert("Wallet address already verified with WorldID");
		// We now verify the provided proof is valid and the user is verified by World ID
		worldId.verifyProof(
			root,
			groupId,
			abi.encodePacked(signal).hashToField(),
			nullifierHash,
			externalNullifier,
			proof
		);

		s_verifiedWallet[msg.sender] = nullifierHash;
		s_creditScore[msg.sender] = DEFAULT_CREDIT_SCORE;

		emit Verified(nullifierHash);
	}


	/// @param signal Old address of the wallet that user wants to change.
	function changeVerifiedWallet(address signal, uint256 root, uint256 nullifierHash, uint256[8] calldata proof) public {
		if(s_verifiedWallet[signal] == 0) revert("Wallet address doesn't exist.");
		// We now verify the provided proof is valid and the user is verified by World ID
		worldId.verifyProof(
			root,
			groupId,
			abi.encodePacked(signal).hashToField(),
			nullifierHash,
			externalNullifier,
			proof
		);

		if(s_verifiedWallet[signal] != nullifierHash) revert("WorldID is different.");
		s_verifiedWallet[msg.sender] = nullifierHash; //Updating
		s_verifiedWallet[signal] = 0;

		emit UpdateVerified(nullifierHash, signal, msg.sender);
	}

	/// @dev Estimate the loan before taking it
	/// @param loanAmount How much loan the user wants to take out (in USDC)
	function estimateLoan(uint256 loanAmount) public view returns(uint256 collateralAmount, uint256 interestRate, int8 creditScore) {
		if(s_verifiedWallet[msg.sender] == 0) revert("Wallet not verified with WorldID.");
		creditScore = s_creditScore[msg.sender];

		if(creditScore >= 90) { // The best terms for a loan
			collateralAmount = 0.02 ether; /// Get price of ETH to USDC, get 10% of the @param loanAmount 
			interestRate = 0.0274; // % per day (10% per year)
		} else if(creditScore < 90 && creditScore >= 60) {
			collateralAmount = 0.03 ether; /// Get price of ETH to USDC, get 30% of the @param loanAmount 
			interestRate = 0.0548; // % per day (20% per year)
		} else if(creditScore < 60 && creditScore >= 30) {
			collateralAmount = 0.04 ether; /// Get price of ETH to USDC, get 60% of the @param loanAmount 
			interestRate = 0.0822; // % per day (30% per year)
		} else { // The worst terms for a loan
			collateralAmount = 0.05 ether; /// Get price of ETH to USDC, get 80% of the @param loanAmount 
			interestRate = 0.137; // % per day (50% per year)
		}
	}

	/// @dev Estimate the loan before taking it
	/// @param loanAmount How much loan the user wants to take out (in USDC)
	function depositCollateralAndCreateEscrow(uint256 loanAmount) external payable {
		if(s_verifiedWallet[msg.sender] == 0) revert("Wallet not verified with WorldID.");
		(uint256 collateralAmount, uint256 interestRate, int8 creditScore) = estimateLoan(loanAmount);
		if(msg.value != collateralAmount) revert("Wrong collateral amount."); // Check that the right amount of ETH is provided
		// Deploy new wallet and fund with loanAmount in USDC
		address escrowWallet = address(0); // Actual address here
		s_loans[msg.sender] = (loanAmount, collateralAmount, escrowWallet, interestRate);
		s_loanAddresses.push(msg.sender);
	}

	/// @dev This function is used to improve the health ratio of user's loan
	function repayWithoutCollateralWithdrawal(uint256 repayAmount) external {
		if(repayAmount = 0) revert ("Amount must be greater than zero");
        // Transfer USDC from the user to the contract
        bool success = usdcToken.transferFrom(msg.sender, address(this), repayAmount);
        require(success, "USDC transfer failed");

        // Decrease the owed amount to the protocol
        s_loans[msg.sender].debtAmount -= repayAmount;

        emit RepayLoan(msg.sender, repayAmount);
	}

	/// @dev This function is used to fully repay and terminate the loan
	function repayFull() external {
		// Delete s_loans shit
	}

	function checkLiquidate(address debtor) external returns(bool liquidate) {
		if(s_loans[msg.sender].debtAmount == 0) revert("This loan doesn't exist.");
		if(true /* health ratio is bad */) {
			liquidate = false;
		} else {
			liquidate = true;
		}
	}

	function liquidateLoan(address debtor) external {
		// 1Inch liquidation event here
		// Decrease credit score
		emit Liquidation(debtor);
	}

	function topUpInterestRate() external {
		// Do a check that enough time has passed
		if(block.timestamp < (lastInterestTopUp+INTEREST_INTERVAL)) revert("Not enough time has passed");
        for (uint256 i = 0; i < s_loanAddresses.length; i++) {
			// Loop through each loan and increase debtAmount by whatever their interest rate is.
        }
	}
}
