"use client"
/* ------------------ Imports ----------------- */
// Web3
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract, type BaseError } from 'wagmi'
import { IDKitWidget, ISuccessResult, useIDKit } from '@worldcoin/idkit'
import { decodeAbiParameters, parseAbiParameters } from 'viem'
import { ConnectKitButton } from 'connectkit'
// Next.js
import { useState } from 'react'
// Other
import { publicClient } from '@/lib/client'
import abi from '@/abi/ContractAbi.json'


/* ----------------- Component ---------------- */
export default function Home() {
	// TODO: Move states up here
	const address = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`
	const account = useAccount()

	/* --------------- Verification --------------- */
	const { setOpen } = useIDKit()
	const [verified, setVerified] = useState(false)
	const { data: verifyHash, isPending: verifyIsPending, error: verifyError, writeContractAsync: verifyWriteContractAsync } = useWriteContract()
	const { isLoading: verifyIsConfirming, isSuccess: verifyIsConfirmed } = useWaitForTransactionReceipt({ hash: verifyHash, }) 
	
	const verifyWallet = async (proof: ISuccessResult) => {
		try {
			console.log("merkle_root", BigInt(proof!.merkle_root))
			console.log("nullifier_hash", BigInt(proof!.nullifier_hash))
			console.log("proof", decodeAbiParameters(
				parseAbiParameters('uint256[8]'),
				proof!.proof as `0x${string}`
			)[0])

			let tx = await verifyWriteContractAsync({
				address,
				account: account.address!,
				abi,
				functionName: 'verifyWallet',
				args: [
					account.address!,
					BigInt(proof!.merkle_root),
					BigInt(proof!.nullifier_hash),
					decodeAbiParameters(
						parseAbiParameters('uint256[8]'),
						proof!.proof as `0x${string}`
					)[0],
				],
			})

			console.log("tx# verifyWallet()", tx)

			setVerified(true)
		} catch (verifyError) { console.log((verifyError as BaseError).shortMessage) }
	}

	/* --------------- Estimate Loan -------------- */
	const [estimateAmount, setEstimateAmount] = useState(0)
	const handleEstimateChange = (event: any) => {
		setEstimateAmount(event.target.value) // Update state with the current input value
	};

	const estimateLoan = async (e: any) => {
		e.preventDefault()
		if (hasLoan) { return }

		try {
			const data = await publicClient.readContract({
				address, abi,
				functionName: 'estimateLoan',
				args: [account.address!, estimateAmount],
			})

			console.log("Estimate Loan:", data)
		} catch (error) { console.log((error as BaseError).shortMessage) }
	}

	/* ----------------- Get Loan ----------------- */
	const [hasLoan, setHasLoan] = useState(false)
	const { data: loanHash, isPending: loanIsPending, error: loanError, writeContractAsync: loanWriteContractAsync } = useWriteContract()
	const { isLoading: loanIsConfirming, isSuccess: loanIsConfirmed } = useWaitForTransactionReceipt({ hash: loanHash, }) 
	
	const [desiredLoanAmount, setDesiredLoanAmount] = useState(0)
	const handleDesiredLoanChange = (event: any) => {
		setDesiredLoanAmount(event.target.value)
	}

	const getLoan = async (e: any) => {
		e.preventDefault()
		if (hasLoan) { return }

		try {
			let tx = await loanWriteContractAsync({
				address, abi,
				account: account.address!,
				functionName: "depositCollateralAndCreateEscrow",
				args: [desiredLoanAmount]
			})
			console.log("tx# depositCollateralAndCreateEscrow():", tx)
		} catch (loanError) { console.log((loanError as BaseError).shortMessage) }
	}

	/* ----------------- Repay Loan ----------------- */
	const { data: partialRepayHash, isPending: partialRepayIsPending, error: partialRepayError, writeContractAsync: partialRepayWriteContractAsync } = useWriteContract()
	const { isLoading: partialRepayIsConfirming, isSuccess: partialRepayIsConfirmed } = useWaitForTransactionReceipt({ hash: partialRepayHash, }) 

	const [partialRepayAmount, setFullRepayAmount] = useState(0)
	const handlePartialRepayChange = (event: any) => {
		setFullRepayAmount(event.target.value)
	};

	const partialRepay = async (e: any) => {
		e.preventDefault()
		if (!hasLoan) { return }

		try {
			let tx = await partialRepayWriteContractAsync({
				address,
				account: account.address!,
				abi,
				functionName: 'repayWithoutCollateralWithdrawal',
				args: [
					partialRepayAmount
				],
			})

			console.log("tx# repayWithoutCollateralWithdrawal():", tx)
		} catch (partialRepayError) { console.log((partialRepayError as BaseError).shortMessage) }
	}

	/* ----------------- Full Loan Repay ----------------- */
	const { data: fullRepayHash, isPending: fullRepayIsPending, error: fullRepayError, writeContractAsync: fullRepayWriteContractAsync } = useWriteContract()
	const { isLoading: fullRepayIsConfirming, isSuccess: fullRepayIsConfirmed } = useWaitForTransactionReceipt({ hash: fullRepayHash, }) 

	const fullRepay = async (e: any) => {
		e.preventDefault()
		if (!hasLoan) { return }
		
		try {
			let tx = await fullRepayWriteContractAsync({
				address,
				account: account.address!,
				abi,
				functionName: 'repayFull',
			})
			console.log("tx# repayFull()", tx)
			
			setHasLoan(false)
		} catch (fullRepayError) { console.log((fullRepayError as BaseError).shortMessage) }
	}

	/* ---------------- Components ---------------- */
	return (
		<div className="h-screen container pt-6 px-6 flex flex-col gap-8">
			{/* Wallet & WorldID Integration */}
			<div className="px-6 py-4 overflow-scroll bg-zinc-800 rounded-lg">
				<ConnectKitButton />

				{account.isConnected && (<>
					<IDKitWidget
						app_id={process.env.NEXT_PUBLIC_APP_ID as `app_${string}`}
						action={process.env.NEXT_PUBLIC_ACTION as string}
						signal={account.address}
						onSuccess={verifyWallet}
						autoClose
					/>

					{!verified && <button onClick={() => setOpen(true)} className="px-4 py-2 my-3 bg-zinc-900 rounded-md">{!verifyHash && (verifyIsPending ? "Pending, please check your wallet..." : "Verify and Execute Transaction")}</button>}

					{verifyHash && <p>Transaction Hash: {verifyHash}</p>}
					{verifyIsConfirming && <p>Waiting for confirmation...</p>} 
					{verifyIsConfirmed && <p>Wallet verified confirmed.</p>}
					{verifyError && <p>Error: {(verifyError as BaseError).message}</p>}
				</>)}
			</div>

			{/* Estimate Loan */}
			<div className="px-6 py-4 flex flex-col items-start gap-2 bg-zinc-800 rounded-lg">
				<input
					id="inputField"
					type="text"
					value={estimateAmount}
					onChange={handleEstimateChange}
					placeholder="Desired loan amount"
				/>
				<button onClick={estimateLoan}>Estimate Loan</button>
				{/* {estimatedDetails && <p>{estimatedDetails}</p>} */}
			</div>

			{/* Get Loan */}
			<div className="px-6 py-4 flex flex-col items-start gap-2 bg-zinc-800 rounded-lg">
				<input
					id="inputField"
					type="text"
					value={desiredLoanAmount}
					onChange={handleDesiredLoanChange}
					placeholder="Desired loan amount"
				/>
				<button onClick={getLoan} disabled={loanIsPending || loanIsConfirming || loanIsConfirmed || hasLoan} className="disabled:text-red-950">Get Loan</button>
			</div>

			{/* repayWithoutCollateralWithdrawal */}
			<div className="px-6 py-4 flex flex-col items-start gap-2 bg-zinc-800 rounded-lg">
				<input
					id="inputField"
					type="text"
					value={partialRepayAmount}
					onChange={handlePartialRepayChange}
					placeholder="Improve the health ratio"
				/>
				<button onClick={partialRepay} disabled={partialRepayIsPending || partialRepayIsConfirmed || !hasLoan}>Repay Loan</button>
			</div>

			{/* repayFull */}
			<div className="px-6 py-4 flex flex-col items-start gap-2 bg-zinc-800 rounded-lg">
				<button onClick={fullRepay} disabled={fullRepayIsPending || fullRepayIsConfirming || fullRepayIsConfirmed || !hasLoan}>Fully Repay the Debts</button>
			</div>
		</div>
	)
}