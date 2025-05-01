import { HardhatUserConfig } from 'hardhat/config';
import "tsconfig-paths/register";
import '@nomicfoundation/hardhat-ethers';
import '@nomicfoundation/hardhat-toolbox';
import 'hardhat-contract-sizer';
import "./scripts/run-deploy.ts"
import "scripts/estimate-gas-deploy.ts"
import "scripts/verify-contract.ts"

import env from './src/config/index.ts'

const accounts = env.PRIVATE_KEY !== undefined ? [ env.PRIVATE_KEY] : [];

const config: HardhatUserConfig = {
  solidity: {
    version: '0.8.24',
    
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      viaIR: true,
      //evmVersion: "london",
    },
  },
  mocha: {
    require: [
      "ts-node/register",
      "tsconfig-paths/register" // 👈 Adicione esta linha
    ],
    timeout: 40000
  },
  networks: {
    hardhat: {
      allowUnlimitedContractSize: true,
      // mining: {
      //   auto: false,
      //   interval: 5000
      // }
    },
    mainnet: {
      url: 'https://rpc.ankr.com/chiliz',
      chainId: 88888,
      accounts: accounts,
      gasPrice: 1100000000, 
      allowUnlimitedContractSize: true,
      timeout:60000
    },
    testnet: {
      url: 'https://spicy-rpc.chiliz.com/ ',
      chainId: 88882,
      accounts: accounts,
    },
  },
  etherscan: {
    apiKey: {
    },
    customChains: [
      
    ],
  },
};

export default config;
