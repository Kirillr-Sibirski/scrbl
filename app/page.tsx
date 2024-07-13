"use client"

import abi from "@/abi/ContractAbi.json"
import { IDKitWidget, ISuccessResult, useIDKit } from "@worldcoin/idkit"
import { useAccount, useWriteContract, useReadContract, useWaitForTransactionReceipt, type BaseError } from "wagmi"
import { decodeAbiParameters, parseAbiParameters } from "viem"
import { useState, useEffect } from "react"
import { ConnectButton } from "@rainbow-me/rainbowkit"

export default function Home() {
    const account = useAccount()
    const { setOpen } = useIDKit()
    const [done, setDone] = useState(false)
    const { data: hash, isPending, error, writeContractAsync } = useWriteContract()
    const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash })

    const { data, isPending: fetchIsPending } = useReadContract({
        abi,
        address: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`,
        functionName: "getVerifiedWallet",
    });
    // const { isLoading: fetchIsLoading, isSuccess: fetchIsLoaded } = useWaitForTransactionReceipt({ hash: fetchHash })
    
    useEffect(() => {
        console.log("Fetch data:", data)
    })

    const submitTx = async (proof: ISuccessResult) => {
        try {
            await writeContractAsync({
                address: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`,
                account: account.address!,
                abi,
                functionName: "verifyWallet",
                args: [
                    account.address!,
                    BigInt(proof!.merkle_root),
                    BigInt(proof!.nullifier_hash),
                    decodeAbiParameters(parseAbiParameters("uint256[8]"), proof!.proof as `0x${string}`)[0],
                ],
            })
            setDone(true)
        } catch (error) {
            throw new Error((error as BaseError).shortMessage)
        }
    }

    return (
        <div className="container px-32">
            <ConnectButton />
            {account.isConnected && (
                <>
                    <IDKitWidget
                        app_id={process.env.NEXT_PUBLIC_APP_ID as `app_${string}`}
                        action={process.env.NEXT_PUBLIC_ACTION as string}
                        signal={account.address}
                        onSuccess={submitTx}
                        autoClose
                    />

                    {!done && (
                        <button onClick={() => setOpen(true)}>
                            {!hash &&
                                (isPending ? "Pending, please check your wallet..." : "Verify and Execute Transaction")}
                        </button>
                    )}

                    {hash && <p>Transaction Hash: {hash}</p>}
                    {isConfirming && <p>Waiting for confirmation...</p>}
                    {isConfirmed && <p>Transaction confirmed.</p>}
                    {error && <p>Error: {(error as BaseError).message}</p>}
                </>
            )}
        </div>
    )
}
