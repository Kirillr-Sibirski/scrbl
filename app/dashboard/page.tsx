"use client"

import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi"
import { ConnectButton } from "@rainbow-me/rainbowkit"
import { IDKitWidget, ISuccessResult, useIDKit, VerificationLevel } from "@worldcoin/idkit"
import React, { useState } from "react"
import abi from "@/abi/ContractAbi.json";
import { decodeAbiParameters, parseAbiParameters } from "viem"

export default function Dashboard() {
    const account = useAccount()
    const [accountDataFetched, setAccountDataFetched] = useState(false)

    const { setOpen } = useIDKit()
    const { data: hash, isPending, writeContract } = useWriteContract();
    const { isLoading, isSuccess } = useWaitForTransactionReceipt({ hash })

    async function verifyWallet(proof: ISuccessResult) {
        try {
            writeContract({
                address: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`,
                account: account.address!,
                abi,
                functionName: "verifyWallet",
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
        } catch (error) {
            console.error(error)
        }
    }

    return (<>
        {!accountDataFetched && (<>
            <div className="min-w-[100vw] h-screen top-0 absolute z-10 backdrop-blur-md flex flex-col justify-center items-center">
                <div className="w-72 h-96 relative px-6 py-5 flex flex-col gap-1 bg-d-200 border-2 border-d-100/80 rounded-lg">
                    <h1 className="font-bold text-2xl">Log In</h1>
                
                    <div className="w-[85%] h-[1px] bg-l-100/[0.2] my-2 self-center" />
                    
                    {account.isDisconnected && (<>
                        <h2 className="font-semibold text-lg">Wallet Disconnected</h2>
                        <p className="text-l-100 text-md mb-3">Connect wallet to continue.</p>
                    </>)}
                    {account.isConnecting && <h2 className="font-semibold text-lg">Wallet Connecting...</h2>}
                    {account.isConnected && (<>
                        <h2 className="font-semibold text-lg">Verify Identity</h2>
                        <p className="text-l-100 text-md mb-3">
                            Sign-in with an orb-verified WorldID passport to continue.
                        </p>
                        
                        {isLoading && <p>Transaction in progress...</p>}
                        {isSuccess && <p>Transaction successful.</p>}
                        {hash && <p>Transaction Hash: {hash}</p>}

                        {/* {error &&  <p className="text-red-500">Error: {(error as BaseError).shortMessage || error.message}</p>} */}
                    </>)}
                    
                    <div className="h-full flex flex-col justify-center items-center">
                        {(account.isDisconnected || account.isConnecting) && (<div className="my-auto scale-125"><ConnectButton /></div>)}
                        {account.isConnected && (<>
                            <IDKitWidget
                                app_id={process.env.NEXT_PUBLIC_APP_ID! as `app_${string}`}
                                action={process.env.NEXT_PUBLIC_ACTION!}
                                signal={account.address}
                                onSuccess={verifyWallet}
                                verification_level={VerificationLevel.Orb}
                                autoClose
                            />

                            <button onClick={() => setOpen(true)} disabled={isPending} className="px-4 py-2 text-center font-semibold rounded-lg border-[1px] hover:brightness-125 active:scale-95 transition duration-200 bg-ac/30 border-ac text-l-100 hover:text-l-200">
                                {isPending ? "Confirming..." : "Verify Wallet"}
                            </button>
                        </>)}
                    </div>
                </div>
            </div>
        </>)}

        <div className="container px-32 grid grid-cols-8 gap-4">
            <div className="grid-cols-subgrid col-span-full flex flex-row items-center gap-2">
                <div className="flex flex-col gap-1">
                    <h1 className="ml-2 font-semibold text-lg">User Analytics</h1>
                    <div className="flex flex-row items-center gap-4">
                        <div className="flex flex-col gap-2 px-6 py-4 bg-d-100/70 border-2 border-d-100 rounded-lg">
                            <h2 className="font-bold text-2xl text-l-200">50</h2>
                            <h3 className="text-sm text-l-200/90">Credit Score</h3>
                        </div>
                    </div>
                </div>

                <div className="w-[1px] h-[80%] bg-l-100/[0.2] mx-6"></div>

                <div className="flex flex-col gap-1">
                    <h1 className="ml-2 font-semibold text-lg">Loan Analytics</h1>
                    <div className="flex flex-row items-center gap-4">
                        <div className="flex flex-col gap-2 px-6 py-4 bg-d-100/70 border-2 border-d-100 rounded-lg">
                            <h2 className="font-bold text-2xl text-l-200">80%</h2>
                            <h3 className="text-sm text-l-200/90">Health</h3>
                        </div>
                        <div className="flex flex-col gap-2 px-6 py-4 bg-d-100/70 border-2 border-d-100 rounded-lg">
                            <h2 className="font-bold text-2xl text-l-200">0.015%</h2>
                            <h3 className="text-sm text-l-200/90">Daily Interest Rate</h3>
                        </div>
                    </div>
                </div>
            </div>
            <div className="grid-cols-subgrid col-span-3 flex flex-col gap-1">
                <h1 className="ml-4 font-semibold text-lg">Loan Operations</h1>
                <div className="h-full px-6 py-4 flex flex-col rounded-lg bg-d-100/70 border-2 border-d-100"></div>
            </div>
            <div className="grid-cols-subgrid col-span-5 flex flex-col gap-1">
                <h1 className="ml-4 font-semibold text-lg">Escrow Wallet Operations</h1>
                <div className="h-full px-6 py-4 flex flex-col rounded-lg bg-d-100/70 border-2 border-d-100"></div>
            </div>
        </div>
    </>)
}
