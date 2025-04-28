/* eslint-disable @typescript-eslint/no-unused-vars */
import { ethers} from 'hardhat';
import env from '../../src/config/index';
export async function deployFanatique(addressFanToken: string = "", treasury: string = "") {
  console.log(`Deploying Fanatique with params: fanToken=${addressFanToken}, treasury=${treasury}`);

  if(!addressFanToken && !treasury){
    addressFanToken = env.FANTOKEN_CONTRACT_ADDRESS;
    treasury = env.TREASURY_ADDRESS;
  }

  console.log(`addressFanToken: ${addressFanToken}`);
  console.log(`treasury: ${treasury}`);
  
  const contractFactory = await ethers.getContractFactory('contracts/Fanatique.sol:Fanatique');
  
  // Se os parâmetros não forem fornecidos, obtenha o endereço do FanToken primeiro
  let finalAddressFanToken = addressFanToken;
  if (!finalAddressFanToken) {
    const fanToken = await deployFanToken();
    finalAddressFanToken = await fanToken.getAddress();
    console.log(`Using newly deployed FanToken at: ${finalAddressFanToken}`);
  }
  
  // Se o treasury não for fornecido, use o endereço do deployer
  let finalTreasury = treasury;
  if (!finalTreasury) {
    const [deployer] = await ethers.getSigners();
    finalTreasury = await deployer.getAddress();
    console.log(`Using deployer as treasury: ${finalTreasury}`);
  }
  
  const args = [finalAddressFanToken, finalTreasury] as const;
  
  console.log(`Deploying Fanatique...`);
  const contract = await contractFactory.deploy(...args);
  await contract.waitForDeployment();
  
  const address = await contract.getAddress();
  console.log(`Fanatique deployed to: ${address}`);

  return contract;
}

export async function deployFanToken() {

  console.log(`Deploying FanToken...`);
  
  const contractFactory = await ethers.getContractFactory('contracts/FanToken.sol:FanToken');
  //const args = [1000] as const;

  const contract = await contractFactory.deploy();
  await contract.waitForDeployment();
  
  const address = await contract.getAddress();
  console.log(`FanToken deployed to: ${address}`);

  return contract;
}


