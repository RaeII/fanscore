/* eslint-disable @typescript-eslint/no-explicit-any */
import dotenv from "dotenv";

const getEnvs = () => {
  
  let envPath = ''
  if(process.env.NODE_ENV === 'production'){

    console.log('\n\n-- MAINNET --\n\n')

    envPath = '.prod'
  }else if(process.env.NODE_ENV === 'test'){
    envPath = '.test'
    console.log(`.env${envPath}`)
  }else{
    envPath = '.dev'
  }
  const dotenvResult = dotenv.config({path: `.env${envPath}`});
  
  if(dotenvResult.error) {
    const processEnv = process.env;

    if(processEnv && !processEnv.error) return processEnv;
  }

  return dotenvResult.parsed || process.env;
}

const envFound = getEnvs();

if (!envFound) {
  // This error should crash whole process
  throw new Error(`Couldn't find .env file or parse environment variables.`);
}

interface ENV {
  PORT: number,
  PRIVATE_KEY:string,
  URL_RPC_NETWORK:string,
  PASSPORT_CONTRACT_ADDRESS:string,
  ALIEN_CONTRACT_ADDRESS:string,
  MINTALIEN_CONTRACT_ADDRESS:string,
  CATALOG_CONTRACT_ADDRESS:string,
  DEVELOPMENT:boolean,
  USDC_CONTRACT_ADDRESS:string,
  JWT_SECRET:string,
  JWT_EXPIRATION:string,
  FANTOKEN_CONTRACT_ADDRESS:string,
  FANATIQUE_CONTRACT_ADDRESS:string,
  TREASURY_ADDRESS:string,
  DB_HOSTNAME:string,
  DB_PORT:number,
  DB_USERNAME:string,
  DB_PASSWORD:string,
  DB_NAME:string
}
const env: ENV = {
  // Application
  PORT: Number(envFound.PORT || process.env.PORT),
  PRIVATE_KEY: envFound.PRIVATE_KEY || '',
  URL_RPC_NETWORK: envFound.URL_RPC_NETWORK || '',
  PASSPORT_CONTRACT_ADDRESS: envFound.PASSPORT_CONTRACT_ADDRESS || '',
  ALIEN_CONTRACT_ADDRESS: envFound.ALIEN_CONTRACT_ADDRESS || '',
  MINTALIEN_CONTRACT_ADDRESS: envFound.MINTALIEN_CONTRACT_ADDRESS || '',
  CATALOG_CONTRACT_ADDRESS: envFound.CATALOG_CONTRACT_ADDRESS || '',
  USDC_CONTRACT_ADDRESS: envFound.USDC_CONTRACT_ADDRESS || '',
  DEVELOPMENT: process.env.NODE_ENV === 'development',
  JWT_SECRET: envFound.JWT_SECRET || '',
  JWT_EXPIRATION: envFound.JWT_EXPIRATION || '',
  FANTOKEN_CONTRACT_ADDRESS: envFound.FANTOKEN_CONTRACT_ADDRESS || '',
  FANATIQUE_CONTRACT_ADDRESS: envFound.FANATIQUE_CONTRACT_ADDRESS || '',
  TREASURY_ADDRESS: envFound.TREASURY_ADDRESS || '',
  DB_HOSTNAME: envFound.DB_HOSTNAME || '',
  DB_PORT: Number(envFound.DB_PORT),
  DB_USERNAME: envFound.DB_USERNAME || '',
  DB_PASSWORD: envFound.DB_PASSWORD || '',
  DB_NAME: envFound.DB_NAME || ''
};

export default env;
