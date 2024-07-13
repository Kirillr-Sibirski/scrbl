// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@pythnetwork/pyth-sdk-solidity/IPyth.sol";
import "@pythnetwork/pyth-sdk-solidity/PythStructs.sol";
import { ByteHasher } from './helpers/ByteHasher.sol';
import { IWorldID } from './interfaces/IWorldID.sol';

contract Manager {
	using ByteHasher for bytes;
	IPyth pyth;

	int16 private constant DEFAULT_CREDIT_SCORE = 50;
	uint256 private constant INTEREST_INTERVAL = 86400; //seconds (1 day)
	int16 private constant SCORE_STEP = 10;

	struct Loan {
		uint256 debtAmount; // In USDC, will be increasing with interested rate
		uint256 collateralAmount; // Stays unchanged, will be used for liquidation
		address escrowWallet;
		int16 interestRate;
		int16 initialCollateralPercentage;
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
	mapping(address => int16) internal s_creditScore;

	/// @dev List of current loans
	mapping(address => Loan) internal s_loans;
	mapping(address => uint256) internal s_loanIndexes;
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
	/// @param _pythContract Pyth contract oracle contract
	constructor(IWorldID _worldId, string memory _appId, string memory _actionId, address _pythContract) {
		worldId = _worldId;
		externalNullifier = abi.encodePacked(abi.encodePacked(_appId).hashToField(), _actionId).hashToField();
		pyth = IPyth(_pythContract);
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
	function estimateLoan(uint256 loanAmount) public view returns(uint256 collateralAmount, int16 interestRate, int16 creditScore, int16 initialCollateralPercentage) {
		if(s_verifiedWallet[msg.sender] == 0) revert("Wallet not verified with WorldID.");
		creditScore = s_creditScore[msg.sender];

		if(creditScore >= 90) { // The best terms for a loan
			collateralAmount = 0.02 ether; /// Get price of ETH to USDC, get 10% of the @param loanAmount 
			initialCollateralPercentage = 10;
			interestRate = 274; // % per day (10% per year)
		} else if(creditScore < 90 && creditScore >= 60) {
			collateralAmount = 0.03 ether; /// Get price of ETH to USDC, get 30% of the @param loanAmount 
			initialCollateralPercentage = 30;
			interestRate = 548; // % per day (20% per year)
		} else if(creditScore < 60 && creditScore >= 30) {
			collateralAmount = 0.04 ether; /// Get price of ETH to USDC, get 60% of the @param loanAmount 
			initialCollateralPercentage = 60;
			interestRate = 822; // % per day (30% per year)
		} else { // The worst terms for a loan
			collateralAmount = 0.05 ether; /// Get price of ETH to USDC, get 80% of the @param loanAmount 
			initialCollateralPercentage = 80;
			interestRate = 1370; // % per day (50% per year)
		}
	}

	/// @dev Estimate the loan before taking it
	/// @param loanAmount How much loan the user wants to take out (in USDC)
	function depositCollateralAndCreateEscrow(uint256 loanAmount) external payable {
		if(s_verifiedWallet[msg.sender] == 0) revert("Wallet not verified with WorldID.");
		(uint256 collateralAmount, int16 interestRate, int16 creditScore, int16 initialCollateralPercentage) = estimateLoan(loanAmount);
		if(msg.value != collateralAmount) revert("Wrong collateral amount."); // Check that the right amount of ETH is provided
		// Deploy new wallet and fund with loanAmount in USDC
		address escrowWallet = address(0); // Actual address here
		Loan memory newLoan = Loan({
            debtAmount: loanAmount,
            collateralAmount: collateralAmount,
            escrowWallet: escrowWallet,
            interestRate: interestRate,
			initialCollateralPercentage: initialCollateralPercentage
        });
		s_loans[msg.sender] = newLoan;
		s_loanAddresses.push(msg.sender);
		s_loanIndexes[msg.sender] = s_loanAddresses.length - 1;
	}

	/// @dev This function is used to improve the health ratio of user's loan
	function repayWithoutCollateralWithdrawal(uint256 repayAmount) external {
		if(repayAmount == 0) revert("Amount must be greater than zero");
        // Transfer USDC from the user to the contract
        bool success = usdcToken.transferFrom(msg.sender, address(this), repayAmount);
		if(!success) revert("USDC transfer failed");
        s_loans[msg.sender].debtAmount -= repayAmount; // Decrease the owed amount to the protocol

        emit RepayLoan(msg.sender, repayAmount);
	}

	/// @dev This function is used to fully repay and terminate the loan
	function repayFull() external {
		if(s_loans[msg.sender].debtAmount == 0) revert("This loan doesn't exist.");
		if(s_verifiedWallet[msg.sender] == 0) revert("Wallet not verified with WorldID.");
		bool success = usdcToken.transferFrom(msg.sender, address(this), s_loans[msg.sender].debtAmount);
		if(!success) revert("USDC transfer failed");
		// Delete the escrow wallet +allow withdrawal
		int16 creditScore = s_creditScore[msg.sender];
		s_creditScore[msg.sender] = creditScore+SCORE_STEP; // Increase credit score
		deleteLoan(msg.sender);
	}

	function checkLiquidate(address debtor) public returns(bool liquidate) { // For chainlink automation
		if(getHealthRatio(debtor) >= uint(int(s_loans[debtor].initialCollateralPercentage-10))) { // they have 10 percent margin of safety
			liquidate = false;
		} else {
			liquidate = true;
		}
	}

	function liquidateLoan(address debtor) external {
		if(!checkLiquidate(debtor)) revert("The loan can't be liquidated.");
		// 1Inch liquidation event here
		int16 creditScore = s_creditScore[debtor];
		s_creditScore[debtor] = creditScore-SCORE_STEP; // Decrease credit score
		// Delete the escrow wallet +withdraw all the capital back here
		emit Liquidation(debtor);
	}

	function topUpInterestRate() external {
		if(block.timestamp < (lastInterestTopUp+INTEREST_INTERVAL)) revert("Not enough time has passed"); // Do a check that enough time has passed
        for (uint256 i = 0; i < s_loanAddresses.length; i++) { // Loop through each loan and increase debtAmount by whatever their interest rate is.
			uint256 currentDebt = s_loans[s_loanAddresses[i]].debtAmount;
            int16 interestRate = s_loans[s_loanAddresses[i]].interestRate;

            // Ensure the interest rate is safely converted and applied
            if(interestRate <= 0) revert("Negative interest rate not allowed");
            uint256 interestRateUint = uint256(int256(interestRate));

            uint256 newDebtAmount = currentDebt + (currentDebt * (interestRateUint / 10) / 100);
            s_loans[s_loanAddresses[i]].debtAmount = newDebtAmount;
		}
	}

	// SOME HELPER STUFF
	function deleteLoan(address debtor) private {
        delete s_loans[msg.sender];
        uint256 index = s_loanIndexes[msg.sender];
        
        for (uint256 i = index; i < s_loanAddresses.length - 1; i++) {
            s_loanAddresses[i] = s_loanAddresses[i + 1];
            s_loanIndexes[s_loanAddresses[i]] = i;
        }
        s_loanAddresses.pop();
        
        delete s_loanIndexes[msg.sender];
	}

	function getETHtoUSCDPrice() public payable returns(uint64) {
		bytes32 priceFeedId = 0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace; // ETH/USD
		PythStructs.Price memory price = pyth.getPrice(priceFeedId);
		return uint64(price.price);
	}

	function getHealthRatio(address debtor) public returns(uint256 health){
		if(s_loans[debtor].debtAmount == 0) revert("This loan doesn't exist.");
		health = ((s_loans[debtor].collateralAmount*getETHtoUSCDPrice()) / s_loans[debtor].debtAmount)*100;
	}
}
