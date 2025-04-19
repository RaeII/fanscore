import { createConfig, http } from 'wagmi';
import { metaMask } from 'wagmi/connectors';

// Definindo a rede de teste Chiliz (Spicy)
const chilizTestnet = {
  id: 88882,
  name: 'Chiliz Spicy Testnet',
  network: 'chiliz-testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'CHZ',
    symbol: 'CHZ',
  },
  rpcUrls: {
    public: { http: ['https://spicy-rpc.chiliz.com/'] },
    default: { http: ['https://spicy-rpc.chiliz.com/'] },
  },
  blockExplorers: {
    default: { name: 'Spicy Block Explorer', url: 'https://testnet.chiliscan.com/' },
  },
};

export const wagmiConfig = createConfig({
  autoConnect: true, // tenta reconectar silenciosamente
  chains: [chilizTestnet],
  connectors: [
    metaMask()
  ],
  transports: {
    [chilizTestnet.id]: http()
  }
}); 