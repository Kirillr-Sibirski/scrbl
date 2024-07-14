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
	const address = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`
	const account = useAccount()
	
	/* --------------- Verification --------------- */
	const { setOpen } = useIDKit()
	const [done, setDone] = useState(false)
	const { data: hash, isPending, error, writeContractAsync } = useWriteContract()
	const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash, }) 
	
	const txVerifyWallet = async (proof: ISuccessResult) => {
		try {
			console.log("nullifier_hash", BigInt(proof!.nullifier_hash))
			console.log("proof", decodeAbiParameters(
				parseAbiParameters('uint256[8]'),
				proof!.proof as `0x${string}`
			)[0])
			console.log("merkle_root", BigInt(proof!.merkle_root))

			let a = await writeContractAsync({
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

			console.log("tx completed", a)
			// setDone(true)
		} catch (error) {console.log((error as BaseError).shortMessage)}
	}

	/* --------------- Estimate Loan -------------- */
	const [estimateAmount, setEstimateAmount] = useState(0)
	const handleEstimateChange = (event: any) => {
		setEstimateAmount(event.target.value) // Update state with the current input value
	};
	
	const estimateLoan = async (e: any) => {
		e.preventDefault()
		try {
			const data = await publicClient.readContract({
				address, abi,
				functionName: 'estimateLoan',
				args: [account.address!, estimateAmount],
			})

			console.log("Estimate Loan:", data)
		} catch (error) {console.log((error as BaseError).shortMessage)}
	}
	
	// const estimateLoan = () => {
	// 	console.log("Loan amount: ",estimateAmount);
	// 	try {
	// 		const output = useReadContract({
	// 			address: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`,
	// 			account: account.address!,
	// 			abi,
	// 			functionName: 'estimateLoan',
	// 			args: [estimateAmount],
	// 		});
	// 		console.log("Transaction output: ", {output});
	// 	} catch(err) {
	// 		console.error(err);
	// 	}
	// }

	/* ----------------- Get Loan ----------------- */
	const [loanAmount, setLoanAmount] = useState(0)
	const handleLoanChange = (event: any) => {
		setLoanAmount(event.target.value)
	};

	const getLoan = async (e: any) => {
		e.preventDefault()
		try {
			const data = await publicClient.readContract({
				address, abi,
				functionName: 'depositCollateralAndCreateEscrow',
				args: [loanAmount],
			})

			console.log("Get Loan:", data)
		} catch (error) {console.log((error as BaseError).shortMessage)}
	}

	/* ----------------- Repay Loan ----------------- */
	const [repayAmount, setRepayAmount] = useState(0)
	const handleRepayChange = (event: any) => {
		setRepayAmount(event.target.value)
	};

	const repayLoan = async (e: any) => {
		e.preventDefault()
		try {
			let a = await writeContractAsync({
				address,
				account: account.address!,
				abi,
				functionName: 'repayWithoutCollateralWithdrawal',
				args: [
					repayAmount
				],
			})

			console.log("Repay Loan:", a)
		} catch (error) {console.log((error as BaseError).shortMessage)}
	}

	/* ---------------- Components ---------------- */
	return (
		<div className="h-screen container pt-6 px-6 flex flex-col gap-8">
			<div className="px-6 py-4 overflow-scroll bg-zinc-800 rounded-lg">
				<ConnectKitButton/>

				{account.isConnected && (<>
					<IDKitWidget
						app_id={process.env.NEXT_PUBLIC_APP_ID as `app_${string}`}
						action={process.env.NEXT_PUBLIC_ACTION as string}
						signal={account.address}
						onSuccess={txVerifyWallet}
						autoClose
					/>

					{!done && <button onClick={() => setOpen(true)} className="px-4 py-2 my-3 bg-zinc-900 rounded-md">{!hash && (isPending ? "Pending, please check your wallet..." : "Verify and Execute Transaction")}</button>}

					{hash && <p>Transaction Hash: {hash}</p>}
					{isConfirming && <p>Waiting for confirmation...</p>} 
					{isConfirmed && <p>Wallet verified confirmed.</p>}
					{error && <p>Error: {(error as BaseError).message}</p>}
				</>)}
			</div>
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
			<div className="px-6 py-4 flex flex-col items-start gap-2 bg-zinc-800 rounded-lg">
				<input
					id="inputField"
					type="text"
					value={loanAmount}
					onChange={handleLoanChange}
					placeholder="Desired loan amount"
				/>
				<button onClick={getLoan}>Get Loan</button>
			</div>

			{/* repayWithoutCollateralWithdrawal */}
			<div className="px-6 py-4 flex flex-col items-start gap-2 bg-zinc-800 rounded-lg">
				<input
					id="inputField"
					type="text"
					value={repayAmount}
					onChange={handleRepayChange}
					placeholder="Improve the health ratio"
				/>
				<button onClick={repayLoan}>Repay Loan</button>
			</div>
		</div>
	)
}