"use client"

import { WagmiProvider, createConfig, http } from "wagmi"
import { type Chain } from "viem"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ConnectKitProvider, getDefaultConfig } from "connectkit"
import { fallback, injected, unstable_connector } from "@wagmi/core"

export const chain: Chain = {
    id: 11155420,
    name: "Optimism Sepolia Anvil Fork",
    nativeCurrency: {
        decimals: 18,
        name: "Optimism Sepolia Anvil Fork Ether",
        symbol: "SETH",
    },
    rpcUrls: {
        default: { http: ["http://127.0.0.1:8545/"] },
    },
    testnet: true,
}

const config = createConfig(
    getDefaultConfig({
        // Your dApps chains
        chains: [chain],
        transports: {
            // RPC URL for each chain
            //   [chain.id]: http(
            //     `https://eth-mainnet.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_ID}`,
            //   ),
            [chain.id]: fallback([unstable_connector(injected), http(chain.rpcUrls.default.http[0])]),
        },

        // Required API Keys
        walletConnectProjectId: process.env.NEXT_PUBLIC_WALLETCONNECT_ID!,

        // Required App Info
        appName: "SCRBL",
        // Optional App Info
        // appDescription: "Your App Description",
        // appUrl: "https://family.co", // your app's url
        // appIcon: "https://family.co/logo.png", // your app's icon, no bigger than 1024x1024px (max. 1MB)
    })
)

const queryClient = new QueryClient()

export default function Web3Provider({ children }: { children: React.ReactNode }) {
    return (
        <WagmiProvider config={config}>
            <QueryClientProvider client={queryClient}>
                <ConnectKitProvider>{children}</ConnectKitProvider>
            </QueryClientProvider>
        </WagmiProvider>
    )
}
