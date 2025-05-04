/* eslint-disable @typescript-eslint/no-unused-vars */
import { ethers, run} from 'hardhat';
import env from '../../src/config/index';
import { isHardhatNetwork,delay } from '../utils';

export async function deployFanatique(addressFanToken: string = "", treasury: string = "") {
  console.log(`Deploying Fanatique with params: fanToken=${addressFanToken}, treasury=${treasury}`);

  if(!addressFanToken && !treasury){
    treasury = env.TREASURY_ADDRESS;
  }
  
  const contractFactory = await ethers.getContractFactory('contracts/Fanatique.sol:Fanatique');

  
  // Se o treasury não for fornecido, use o endereço do deployer
  let finalTreasury = treasury;
/*   
  const args = ["0x70CB76f1aa8cB85F95536d448973Ba89231D5F0a"] as const;
  
  console.log(`Deploying Fanatique...`);
  const contract = await contractFactory.deploy(...args);
  await contract.waitForDeployment();
  
  const address = await contract.getAddress();
  console.log(`Fanatique deployed to: ${address}`); */

  if(!isHardhatNetwork()) {

/*     console.log('Waiting 2 minutes before verifying contract...');
    await delay( 120000 ); */

    await run('verify:verify', {
      address: "0x5E93BF80818648Cd649D93B11a25C34FF90B21a4",
      constructorArguments: ["0x70CB76f1aa8cB85F95536d448973Ba89231D5F0a"],
      contract: `contracts/Fanatique.sol:Fanatique`,
    });
  }
}

export async function deployFanToken() {

  console.log(`Deploying FanToken...`);
  
  const contractFactory = await ethers.getContractFactory('contracts/FanToken.sol:FanToken');
  //const args = [1000] as const;

  const contract = await contractFactory.deploy();
  await contract.waitForDeployment();
  
  const address = await contract.getAddress();
  console.log(`FanToken deployed to: ${address}`);

  if(!isHardhatNetwork()) {

    console.log('Waiting 2 minutes before verifying contract...');
    await delay( 120000 );

    await run('verify:verify', {
      address: address,
      constructorArguments: [],
      contract: `contracts/FanToken.sol:FanToken`,
    });
  }
}

export async function deployERC20() {

  console.log(`Deploying ERC20...`);

  const contracts = ["BRL.sol:BRL","EURC.sol:EURC","USDC.sol:USDC"]
  const args = [1000000000000000] as const;

  for (const contract of contracts) { 

    const contractFactory = await ethers.getContractFactory(`contracts/ERC20/${contract}`);
      
    const deploy = await contractFactory.deploy(...args);
    await deploy.waitForDeployment();

    const contractAddress = await deploy.getAddress();
    console.log(`\n${contract} deployed to -> ${contractAddress}`)

    if(!isHardhatNetwork()) {

      console.log('Waiting 2 minutes before verifying contract...');
      await delay( 120000 );

      await run('verify:verify', {
        address: contractAddress,
        constructorArguments: args,
        contract: `contracts/ERC20/${contract}`,
      });
    }

  }
}


