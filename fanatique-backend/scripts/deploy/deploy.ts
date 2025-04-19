/* eslint-disable @typescript-eslint/no-unused-vars */
import { ethers, network,run } from 'hardhat';

export async function deployFanScore() {
  
  const contractFactory = await ethers.getContractFactory('contracts/FanScore.sol:FanScore');
  //const args = [1000] as const;

  const contract = await contractFactory.deploy();
  await contract.waitForDeployment();

  return contract;
  
}


