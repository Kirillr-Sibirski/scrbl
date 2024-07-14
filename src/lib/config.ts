import { createConfig, http } from 'wagmi'
import { baseSepolia } from "wagmi/chains"
import { getDefaultConfig } from 'connectkit';

// export const chain: Chain = {
// 	id: 11155111,
// 	name: "Ethereum Sepolia Anvil Fork",
// 	nativeCurrency: {
//         decimals: 18,
//         name: "Ethereum Sepolia Anvil Fork Ether",
//         symbol: "SepoliaETH",
// 	},
// 	rpcUrls: {
// 	    default: { http: ["http://127.0.0.1:8545/"] },
// 	},
// 	testnet: true,
// };

// console.log(process.env.NEXT_PUBLIC_ALCHEMY_API_KEY)

export const config = createConfig(
    getDefaultConfig({
        chains: [baseSepolia],
        transports: {
            [baseSepolia.id]: http(`https://base-sepolia.g.alchemy.com/v2/qfoWyEGVHDqbb7QWmgJjUnyUpBeFDFIh`)
        },
        walletConnectProjectId: process.env.NEXT_PUBLIC_WALLETCONNECT_ID!,
        appName: "SCRBL",
    }),
)