/* eslint-disable @typescript-eslint/no-explicit-any */
import dotenv from "dotenv";

const getEnvs = () => {
  
  let envPath = ''
  if(process.env.NODE_ENV === 'production'){

    console.log('\n\n-- MAINNET --\n\n')

    envPath = '.prod'
  }else if(process.env.NODE_ENV === 'test'){
    envPath = '.test'
  }else{
    envPath = '.dev'
  }
  const dotenvResult = dotenv.config({path: `.env${envPath}`});
  // const dotenvResult = dotenv.config({ path: `.env` });

  if(dotenvResult.error) {
    const processEnv = process.env;

    if(processEnv && !processEnv.error) return processEnv;
  }

  return dotenvResult;
}
// const envFound = dotenv.config({ path: `.env` });
const envFound:any = getEnvs();

if (envFound.error) {
  // This error should crash whole process

  throw new Error(`Couldn't find .env file. ${envFound.error}`);
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
  PORT: Number(process.env.PORT),
  PRIVATE_KEY:process.env.PRIVATE_KEY || '',
  URL_RPC_NETWORK:process.env.URL_RPC_NETWORK || '',
  PASSPORT_CONTRACT_ADDRESS:process.env.PASSPORT_CONTRACT_ADDRESS || '',
  ALIEN_CONTRACT_ADDRESS:process.env.ALIEN_CONTRACT_ADDRESS || '',
  MINTALIEN_CONTRACT_ADDRESS:process.env.MINTALIEN_CONTRACT_ADDRESS || '',
  CATALOG_CONTRACT_ADDRESS:process.env.CATALOG_CONTRACT_ADDRESS || '',
  USDC_CONTRACT_ADDRESS:process.env.USDC_CONTRACT_ADDRESS || '',
  DEVELOPMENT:process.env.NODE_ENV === 'development',
  JWT_SECRET:process.env.JWT_SECRET || '',
  JWT_EXPIRATION:process.env.JWT_EXPIRATION || '',
  FANTOKEN_CONTRACT_ADDRESS:process.env.FANTOKEN_CONTRACT_ADDRESS || '',
  FANATIQUE_CONTRACT_ADDRESS:process.env.FANATIQUE_CONTRACT_ADDRESS || '',
  TREASURY_ADDRESS:process.env.TREASURY_ADDRESS || '',
  DB_HOSTNAME:process.env.DB_HOSTNAME || '',
  DB_PORT:Number(process.env.DB_PORT),
  DB_USERNAME:process.env.DB_USERNAME || '',
  DB_PASSWORD:process.env.DB_PASSWORD || '',
  DB_NAME:process.env.DB_NAME || ''
};

export default env;
