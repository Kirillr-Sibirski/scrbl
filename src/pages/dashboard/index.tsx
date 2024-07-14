"use client"
/* ------------------ Imports ----------------- */
// Web3
import { useAccount, useWriteContract, useWaitForTransactionReceipt, type BaseError } from "wagmi"
import { IDKitWidget, ISuccessResult, useIDKit } from "@worldcoin/idkit"
import { decodeAbiParameters, parseAbiParameters } from "viem"
// Next.js
import { useState } from "react"
// Other
import { publicClient } from "@/lib/client"
import abi from "@/abi/ContractAbi.json"
import { ConnectKitButton } from "connectkit"

/* ----------------- Component ---------------- */
export default function Dashboard() {
    const address = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`
    const account = useAccount()

    const [hasLoan, setHasLoan] = useState(false)
    const [creditScore, setCreditScore] = useState(0)
    const [debt, setDebt] = useState(BigInt(0))
    const [collateral, setCollateral] = useState(BigInt(0))
    const [interest, setInterest] = useState(0)
    const [health, setHealth] = useState(BigInt(0))

    function replacer(value: any): string {
        return JSON.stringify({ value }, (k, v) => typeof v === 'bigint' ? v.toString() : v)
    }

    /* --------------- Verification --------------- */
    const { setOpen } = useIDKit()
    const [verified, setVerified] = useState(false)
    const {
        data: verifyHash,
        isPending: verifyIsPending,
        error: verifyError,
        writeContractAsync: verifyWriteContractAsync,
    } = useWriteContract()
    const { isLoading: verifyIsConfirming, isSuccess: verifyIsConfirmed } = useWaitForTransactionReceipt({
        hash: verifyHash,
    })

    const verifyWallet = async (proof: ISuccessResult) => {
        try {
            console.log("merkle_root", BigInt(proof!.merkle_root))
            console.log("nullifier_hash", BigInt(proof!.nullifier_hash))
            console.log(
                "proof",
                decodeAbiParameters(parseAbiParameters("uint256[8]"), proof!.proof as `0x${string}`)[0]
            )   

            let tx = await verifyWriteContractAsync({
                address, abi,
                account: account.address!,
                functionName: "verifyWallet",
                args: [
                    account.address!,
                    BigInt(proof!.merkle_root),
                    BigInt(proof!.nullifier_hash),
                    decodeAbiParameters(parseAbiParameters("uint256[8]"), proof!.proof as `0x${string}`)[0],
                ],
            })

            console.log("tx# verifyWallet()", tx)
            setVerified(true)

            let data: any = await publicClient.readContract({
                address, abi,
                functionName: "getVerifiedWallet",
                args: [account.address!],
            })

            let _health: any = await publicClient.readContract({
                address, abi,
                functionName: "getHealthRatio",
                args: [account.address!],
            })

            console.log(data)
            if (data && data[1] == true) {
                setCreditScore(data[0])
                setDebt(data[2])
                setCollateral(data[3])
                setInterest(data[4])
                setHealth(_health)
            }

        } catch (verifyError) {
            console.log((verifyError as BaseError).shortMessage)
        }
    }

    /* --------------- Estimate Loan -------------- */
    const [estimateAmount, setEstimateAmount] = useState(0)
    const handleEstimateChange = (event: any) => {
        setEstimateAmount(event.target.value) // Update state with the current input value
    }

    const estimateLoan = async (e: any) => {
        e.preventDefault()
        if (hasLoan) {
            return
        }

        try {
            const data = await publicClient.readContract({
                address, abi,
                functionName: "estimateLoan",
                args: [account.address!, estimateAmount],
            })

            console.log("Estimate Loan:", data)
        } catch (error) {
            console.log((error as BaseError).shortMessage)
        }
    }

    /* ----------------- Get Loan ----------------- */
    const {
        data: loanHash,
        isPending: loanIsPending,
        error: loanError,
        writeContractAsync: loanWriteContractAsync,
    } = useWriteContract()
    const { isLoading: loanIsConfirming, isSuccess: loanIsConfirmed } = useWaitForTransactionReceipt({ hash: loanHash })

    const [desiredLoanAmount, setDesiredLoanAmount] = useState(0)
    const handleDesiredLoanChange = (event: any) => {
        setDesiredLoanAmount(event.target.value)
    }

    const getLoan = async (e: any) => {
        e.preventDefault()
        if (hasLoan) {
            return
        }

        try {
            const data: any = await publicClient.readContract({
                address, abi,
                functionName: "estimateLoan",
                args: [account.address!, desiredLoanAmount],
            })

            let tx = await loanWriteContractAsync({
                address, abi,
                value: data[0],
                account: account.address!,
                functionName: "depositCollateralAndCreateEscrow",
                args: [desiredLoanAmount],
            })

            console.log("tx# depositCollateralAndCreateEscrow():", tx)

            setHasLoan(true)
        } catch (loanError) {
            console.log((loanError as BaseError).shortMessage)
        }
    }

    /* ----------------- Repay Loan ----------------- */
    const {
        data: partialRepayHash,
        isPending: partialRepayIsPending,
        error: partialRepayError,
        writeContractAsync: partialRepayWriteContractAsync,
    } = useWriteContract()
    const { isLoading: partialRepayIsConfirming, isSuccess: partialRepayIsConfirmed } = useWaitForTransactionReceipt({
        hash: partialRepayHash,
    })

    const [partialRepayAmount, setFullRepayAmount] = useState(0)
    const handlePartialRepayChange = (event: any) => {
        setFullRepayAmount(event.target.value)
    }

    const partialRepay = async (e: any) => {
        e.preventDefault()
        // if (!hasLoan) { return }

        try {
            let tx = await partialRepayWriteContractAsync({
                address, abi,
                account: account.address!,
                functionName: "repayWithoutCollateralWithdrawal",
                args: [partialRepayAmount],
            })

            console.log("tx# repayWithoutCollateralWithdrawal():", tx)
        } catch (partialRepayError) {
            console.log((partialRepayError as BaseError).shortMessage)
        }
    }

    /* ----------------- Full Loan Repay ----------------- */
    const {
        data: fullRepayHash,
        isPending: fullRepayIsPending,
        error: fullRepayError,
        writeContractAsync: fullRepayWriteContractAsync,
    } = useWriteContract()
    const { isLoading: fullRepayIsConfirming, isSuccess: fullRepayIsConfirmed } = useWaitForTransactionReceipt({
        hash: fullRepayHash,
    })

    const fullRepay = async (e: any) => {
        e.preventDefault()
        // if (!hasLoan) { return }

        try {
            let tx = await fullRepayWriteContractAsync({
                address, abi,
                account: account.address!,
                functionName: "repayFull",
            })
            console.log("tx# repayFull()", tx)

            setHasLoan(false)
        } catch (fullRepayError) {
            console.log((fullRepayError as BaseError).shortMessage)
        }
    }

    /* ---------------- Components ---------------- */
    return (
        <div className="w-screen h-full container px-16">
            {/* Connection Overlay */}
            {!verified && (<div className="w-screen h-screen absolute top-0 left-0 z-10 flex flex-col justify-center items-center backdrop-blur-lg transition duration-300">
                <div className="w-[24rem] h-[30rem] relative px-6 py-5 flex flex-col gap-1 bg-d-200 border-2 border-d-100/80 rounded-lg">
                    <h1 className="font-bold text-2xl">Log In</h1>
                    <div className="w-[90%] h-[1px] bg-l-100/[0.2] my-3 self-center" />

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

                        {verifyIsConfirming && <p>Transaction in progress...</p>}
                        {verifyIsConfirmed && <p>Transaction successful.</p>}
                        {verifyHash && <p className="font-light text-l-100">Transaction Hash: {verifyHash}</p>}

                        {verifyError && (
                            <p className="pt-4">
                                Error:{" "}
                                <span className="text-[#eb2e28]">
                                    {(verifyError as BaseError).shortMessage || verifyError.message}
                                </span>
                            </p>
                        )}
                    </>)}

                    <div className="h-full flex flex-col justify-center items-center">
                        {(account.isDisconnected || account.isConnecting) && (
                            <div className="my-auto scale-125 text-center">
                                <ConnectKitButton />
                            </div>
                        )}
                        {account.isConnected && (<>
                            <IDKitWidget
                                app_id={process.env.NEXT_PUBLIC_APP_ID as `app_${string}`}
                                action={process.env.NEXT_PUBLIC_ACTION as string}
                                signal={account.address}
                                onSuccess={verifyWallet}
                                autoClose
                            />

                            {!verified && (
                                <button
                                    onClick={() => setOpen(true)}
                                    disabled={verifyIsPending}
                                    className="px-4 py-2 text-center font-semibold rounded-lg border-[1px] hover:brightness-125 active:scale-95 transition duration-200 bg-ac/30 border-ac text-l-100 hover:text-l-200"
                                >
                                    {verifyIsPending
                                        ? "Pending, please check your wallet..."
                                        : "Verify with WorldID"}
                                </button>
                            )}
                        </>)}
                    </div>
                </div>
            </div>)}
            
            <div className="grid grid-cols-8 gap-4">
                <div className="grid-cols-subgrid col-span-full flex flex-row items-center gap-2">
                    <div className="flex flex-col gap-1">
                        <h1 className="ml-2 mb-1 font-semibold text-lg">User Analytics</h1>
                        <div className="flex flex-row items-center gap-4">
                            <div className="flex flex-col gap-2 px-6 py-4 bg-d-100/70 border-2 border-d-100 rounded-lg">
                                <h2 className="font-bold text-2xl text-l-200">{creditScore}</h2>
                                <h3 className="text-sm text-l-200/90">Credit Score</h3>
                            </div>
                        </div>
                    </div>

                    <div className="w-[1px] h-[80%] bg-l-100/[0.2] mx-6"></div>

                    <div className="flex flex-col gap-1">
                        <h1 className="ml-2 mb-1 font-semibold text-lg">Loan Analytics</h1>
                        <div className="flex flex-row items-center gap-4">
                            <div className="flex flex-col gap-2 px-6 py-4 bg-d-100/70 border-2 border-d-100 rounded-lg">
                                <h2 className="font-bold text-2xl text-l-200">{replacer(health)}%</h2>
                                <h3 className="text-sm text-l-200/90">Health</h3>
                            </div>
                            <div className="flex flex-col gap-2 px-6 py-4 bg-d-100/70 border-2 border-d-100 rounded-lg">
                                <h2 className="font-bold text-2xl text-l-200">{interest}</h2>
                                <h3 className="text-sm text-l-200/90">Daily Interest Rate</h3>
                            </div>
                        </div>
                    </div>
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
                    <button
                        onClick={getLoan}
                        disabled={loanIsPending || loanIsConfirming || loanIsConfirmed || hasLoan}
                        className="disabled:text-red-950"
                    >
                        Get Loan
                    </button>
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
                    <button onClick={partialRepay} disabled={partialRepayIsPending || partialRepayIsConfirmed}>
                        Repay Loan
                    </button>
                </div>

                {/* repayFull */}
                <div className="px-6 py-4 flex flex-col items-start gap-2 bg-zinc-800 rounded-lg">
                    <button
                        onClick={fullRepay}
                        disabled={fullRepayIsPending || fullRepayIsConfirming || fullRepayIsConfirmed}
                    >
                        Fully Repay the Debts
                    </button>
                </div>
            </div>
        </div>
    )
}
