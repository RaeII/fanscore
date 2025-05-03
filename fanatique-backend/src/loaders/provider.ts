import { ethers } from "ethers";
import env from "../config";

const providerURL =  env.URL_RPC_NETWORK;
console.log({providerURL})
const provider = new ethers.JsonRpcProvider(providerURL)

const privateKey = env.PRIVATE_KEY ?? ''
console.log({privateKey})
const wallet = new ethers.Wallet(privateKey, provider);

export {
    provider,
    wallet
} 

