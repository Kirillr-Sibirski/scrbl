# Semi-Collateralized Reputation Based Lending

SCRBL is an undercollateralized lending platform backed by WorldID to secure on-chain credit scores. 
It addresses a key issue in crypto adoption by eliminating the need for overcollateralized positions, mirroring the functionality of traditional lending practices.
The primary use case for this project is margin trading, enabling any type of leverage on any protocol, provided the protocol is whitelisted within the escrow wallet.

This repository is based on the [WorldID Onchain Template](https://github.com/worldcoin/world-id-onchain-template/tree/main).

## Local Development

### Prerequisites

Create a staging on-chain app in the [Worldcoin Developer Portal](https://developer.worldcoin.org).

Ensure you have installed [Foundry](https://book.getfoundry.sh/getting-started/installation), [NodeJS](https://nodejs.org/en/download), and [pnpm](https://pnpm.io/installation).

### Testnet Deployment

In another shell, deploy the contract, replacing `$WORLD_ID_ROUTER` with the [World ID Router address](https://docs.worldcoin.org/reference/address-book) for your selected chain, `$NEXT_PUBLIC_APP_ID` with the app ID as configured in the [Worldcoin Developer Portal](https://developer.worldcoin.org), `$NEXT_PUBLIC_ACTION` with the action ID as configured in the Worldcoin Developer Portal, `$YOUR_API_KEY` with your Alchemy key and `$PYTH_ROUTER` with Pyth oracle address.

```bash
cd contracts
forge create --rpc-url https://base-sepolia.g.alchemy.com/v2/$YOUR_API_KEY --private-key {private key} src/Manager.sol:Manager --constructor-args $WORLD_ID_ROUTER $NEXT_PUBLIC_APP_ID $NEXT_PUBLIC_ACTION $PYTH_ROUTER
```

Note the `Deployed to:` address from the output.

Use the [Worldcoin Simulator](https://simulator.worldcoin.org) in place of World App to scan the IDKit QR codes and generate the zero-knowledge proofs.
