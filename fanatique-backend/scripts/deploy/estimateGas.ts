/* eslint-disable @typescript-eslint/no-unused-vars */
import { ethers,network,run } from "hardhat";
import { delay, isHardhatNetwork } from '../utils';
import env from '../../src/config';


async function estimateDeployCost(contractPath: string,contractNane:string, args: any) {
    console.log(`\n -- ${contractNane} --\n`);

  // Criar a fábrica do contrato
  const contractFactory = await ethers.getContractFactory(contractPath);

  // Estimar o gas necessário para deploy
  const gasEstimate = await ethers.provider.estimateGas(await contractFactory.getDeployTransaction(...args));

  // Obter preço do gas atual
  const feeData = await ethers.provider.getFeeData();
  const gasPrice = feeData.gasPrice;

  if (!gasPrice) throw new Error("Não foi possível obter o preço do gás.");

  // Calcular custo total (gasEstimate * gasPrice)
  const estimatedCost = gasEstimate * gasPrice;
  const estimatedCostInETH = ethers.formatEther(estimatedCost.toString());

  console.log(`\nCusto estimado de deploy: ${estimatedCostInETH} ETH`);
  console.log(`Gas estimado: ${gasEstimate.toString()}`);
  console.log(`Preço do gás: ${ethers.formatUnits(gasPrice, "gwei")} Gwei\n`);

  return {
    estimatedGas: gasEstimate,
    estimatedCost: estimatedCostInETH,
  };
}


export async function deployUsdt(){
  const args = [1000000] as const;
  await estimateDeployCost("contracts/USD.sol:USD","USDT",args)
}

export async function deploy(){
 
  const argsLp = [(2n ** 200n),env.PRIVATE_KEY] as const;
  await estimateDeployCost("contracts/Lp.sol:Lp","LP",argsLp)

  const args = [
    "ipfs://QmTL2h88FxDcURt5S7AF1B4rV1SRA7PHH5HZqbxvSHGYW5",
    ethers.ZeroAddress,
    env.USDC_CONTRACT_ADDRESS,
    ethers.MaxUint256
  ] as const;

  await estimateDeployCost("contracts.sol:","",args)
}


