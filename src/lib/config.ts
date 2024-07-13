import { createConfig, http } from 'wagmi'
import { sepolia } from "wagmi/chains"
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

console.log(process.env.ALCHEMY_API_KEY)

export const config = createConfig(
    getDefaultConfig({
        chains: [sepolia],
        transports: {
            [sepolia.id]: http(`https://eth-sepolia.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY!}`)
        },
        walletConnectProjectId: process.env.NEXT_PUBLIC_WALLETCONNECT_ID!,
        appName: "SCRBL",
    }),
)