/* eslint-disable @typescript-eslint/no-unused-vars */
import { ethers, network,run } from 'hardhat';

export async function deployFanatique(addressFanToken: string,treasury: string) {
  
  const contractFactory = await ethers.getContractFactory('contracts/Fanatique.sol:Fanatique');
  const args = [addressFanToken,treasury] as const;

  const contract = await contractFactory.deploy(...args);
  await contract.waitForDeployment();

  return contract;
  
}

export async function deployFanToken() {
  
  const contractFactory = await ethers.getContractFactory('contracts/FanToken.sol:FanToken');
  //const args = [1000] as const;

  const contract = await contractFactory.deploy();
  await contract.waitForDeployment();

  return contract;
  
}


