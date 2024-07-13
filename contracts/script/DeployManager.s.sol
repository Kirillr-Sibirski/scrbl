// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import { Script, console } from "forge-std/Script.sol";
import { Manager } from "../Manager.sol";
import { IWorldID } from "../interfaces/IWorldID.sol";
import { IPyth } from "pyth-sdk-solidity/IPyth.sol";

contract DeployManager is Script {
    function run() external {
        // Start broadcasting transactions
        vm.startBroadcast(0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80);

        // Deploy the Manager contract
        Manager manager = new Manager(
            IWorldID(0x11cA3127182f7583EfC416a8771BD4d11Fae4334),
            'app_staging_462987db1a03edf27aed2f71941b16a8',
            'lending',
            address(0x0708325268dF9F66270F1401206434524814508b)
        );

        console.log("Oracle:", uint(int(manager.getETHtoUSCDPrice().price)));
        // manager.verifyWallet();

        (uint256 collateralAmount, int16 interestRate, int16 creditScore, uint256 initialCollateralPercentage) = manager.estimateLoan(100);

        console.log("Collateral:", collateralAmount / (10**16));
        console.log("interestRate:", uint(int(interestRate)));
        console.log("creditScore:", uint(int(creditScore)));
        console.log("initialCollateralPercentage:", initialCollateralPercentage);
        vm.stopBroadcast();
    }
}
