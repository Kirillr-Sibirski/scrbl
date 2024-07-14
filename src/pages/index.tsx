"use client"

import abi from '@/abi/ContractAbi.json'
import { ConnectKitButton } from 'connectkit'
import { IDKitWidget, ISuccessResult, useIDKit } from '@worldcoin/idkit'
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract, type BaseError } from 'wagmi'
import { decodeAbiParameters, parseAbiParameters } from 'viem'
import { useState } from 'react'

export default function Home() {
	const account = useAccount()
	const { setOpen } = useIDKit()
	const [done, setDone] = useState(false)
	const { data: hash, isPending, error, writeContractAsync } = useWriteContract()
	const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash, }) 
	const [loanAmount, setLoanAmount] = useState(0);

	const submitTx = async (proof: ISuccessResult) => {
		try {
			console.log("nullifier_hash", BigInt(proof!.nullifier_hash))
			console.log("proof", decodeAbiParameters(
				parseAbiParameters('uint256[8]'),
				proof!.proof as `0x${string}`
			)[0])
			console.log("merkle_root", BigInt(proof!.merkle_root))

			let a = await writeContractAsync({
				address: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`,
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

	const estimateLoan = () => {
		console.log("Loan amount: ",loanAmount);
		try {
			const output = useReadContract({
				address: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`,
				account: account.address!,
				abi,
				functionName: 'estimateLoan',
				args: [loanAmount],
			});
			console.log("Transaction output: ", {output});
		} catch(err) {
			console.error(err);
		}
	}

	const handleChange = (event: any) => {
		setLoanAmount(event.target.value); // Update state with the current input value
	};

	return (
		<div className="h-screen container pt-6 px-6 flex flex-col gap-8">
			<div className="px-6 py-4 overflow-scroll bg-zinc-800 rounded-lg">
				<ConnectKitButton/>

				{account.isConnected && (<>
					<IDKitWidget
						app_id={process.env.NEXT_PUBLIC_APP_ID as `app_${string}`}
						action={process.env.NEXT_PUBLIC_ACTION as string}
						signal={account.address}
						onSuccess={submitTx}
						autoClose
					/>

					{!done && <button onClick={() => setOpen(true)} className="px-4 py-2 my-3 bg-zinc-900 rounded-md">{!hash && (isPending ? "Pending, please check your wallet..." : "Verify and Execute Transaction")}</button>}

					{hash && <p>Transaction Hash: {hash}</p>}
					{isConfirming && <p>Waiting for confirmation...</p>} 
					{isConfirmed && <p>Wallet verified confirmed.</p>}
					{error && <p>Error: {(error as BaseError).message}</p>}
				</>)}
			</div>
			<div className="px-6 py-4 flex flex-col items-start bg-zinc-800 rounded-lg">
				<input
					id="inputField"
					type="text"
					value={loanAmount}
					onChange={handleChange}
					placeholder="Desired loan amount"
				/>
				<button onClick={estimateLoan}>Estimate Loan</button>
				{/* {estimatedDetails && <p>{estimatedDetails}</p>} */}
			</div>
		</div>
	)
}