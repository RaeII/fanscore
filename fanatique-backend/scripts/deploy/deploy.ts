/* eslint-disable @typescript-eslint/no-unused-vars */
import { ethers} from 'hardhat';
import env from '../../src/config/index';
export async function deployFanatique(addressFanToken: string = "", treasury: string = "") {
  console.log(`Deploying Fanatique with params: fanToken=${addressFanToken}, treasury=${treasury}`);

  if(!addressFanToken && !treasury){
    treasury = env.TREASURY_ADDRESS;
  }
  
  const contractFactory = await ethers.getContractFactory('contracts/Fanatique.sol:Fanatique');

  
  // Se o treasury não for fornecido, use o endereço do deployer
  let finalTreasury = treasury;
  
  const args = [finalTreasury] as const;
  
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

export async function deployERC20() {

  console.log(`Deploying ERC20...`);

  const contracts = ["BRL.sol:BRL","EURC.sol:EURC","USDC.sol:USDC"]
  const args = [1000000000000000] as const;

  for (const contract of contracts) { 

    const contractFactory = await ethers.getContractFactory(`contracts/ERC20/${contract}`);
      
    const deploy = await contractFactory.deploy(...args);
    await deploy.waitForDeployment();
    
    const address = await deploy.getAddress();
    console.log(`${contract} deployed to: ${address}`);

  }
}


