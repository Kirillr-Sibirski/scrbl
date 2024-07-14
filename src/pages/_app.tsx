"use client"
/* ------------------ Imports ----------------- */
// Next.js
import type { AppProps } from "next/app"
import NavBar from "@/components/navbar"
// Web3
import { WagmiProvider } from "wagmi"
import { ConnectKitProvider } from "connectkit"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
// Other
import { config } from "@/lib/config"
import "@/styles/globals.css"

/* ----------------- Component ---------------- */
const queryClient = new QueryClient()

export default function App({ Component, pageProps }: AppProps) {
    return (
        <WagmiProvider config={config}>
            <QueryClientProvider client={queryClient}>
                <ConnectKitProvider>
                    <div className="w-screen h-screen flex flex-col">
                        <NavBar />
                        <Component {...pageProps} />
                    </div>
                </ConnectKitProvider>
            </QueryClientProvider>
        </WagmiProvider>
    )
}
