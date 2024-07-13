"use client"

import { Chain, getDefaultConfig, RainbowKitProvider, darkTheme } from "@rainbow-me/rainbowkit"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { WagmiProvider } from "wagmi"

export const chain: Chain = {
    id: 10,
    name: "Optimism Anvil Fork",
    nativeCurrency: {
        decimals: 18,
        name: "Optimism Sepolia Anvil Fork Ether",
        symbol: "SETH",
    },
    rpcUrls: {
        default: { http: ["http://127.0.0.1:8545/"] },
    },
    testnet: false,
}
const config = getDefaultConfig({
    appName: "SCRBL",
    projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_ID!,
    chains: [chain],
    ssr: true,
})
const queryClient = new QueryClient()

export default function Provider({ children }: { children: React.ReactNode }) {
    return (
        <WagmiProvider config={config}>
            <QueryClientProvider client={queryClient}>
                <RainbowKitProvider theme={darkTheme({
                    accentColor: "#eb5e28",
                    accentColorForeground: "#fffcf2",
                    borderRadius: "medium",
                })} modalSize="compact">{children}</RainbowKitProvider>
            </QueryClientProvider>
        </WagmiProvider>
    )
}
