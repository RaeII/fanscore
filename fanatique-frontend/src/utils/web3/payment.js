import { useContracts } from './contracts';
import { useContext } from 'react';
import { WalletContext } from '../../contexts/WalletContextDef';
import { ethers } from 'ethers';

export function usePayment() {

    const { getSigner, isConnected, provider } = useContext(WalletContext);
    const { getContracts } = useContracts();

    // 1. Usuário solicita pagamento
    async function paymentSignature(orderId, clubId, amount) {

        try {   

            console.log('paymentSignature');

            const { fanTokenContract, fanatiqueContract, fanatiqueContractAddress, fanTokenContractAddress } = await getContracts();

            console.log({fanTokenContractAddress});
            // Verificar se a carteira está conectada

            console.log({isConnected});

            if (!isConnected) {
                throw new Error("conecte sua carteira.");
            }

            // Obter o signer usando getSigner
            const signer = await getSigner();

            // Verificar se o signer está disponível
            if (!signer) {
                throw new Error("Carteira bloqueada ou não disponível");
            }

            let userAddress;
            try {
                userAddress = await signer.getAddress();
            } catch {
                throw new Error("Por favor, desbloqueie sua carteira.");
            }

            console.log('amount',amount.toString());
            
            // Converte amount para BigInt se for string
            const amountBigInt = ethers.parseEther(amount.toString());

            console.log('amountBigInt',amountBigInt.toString());

            // Obter chainId
            const network = await provider.getNetwork();
            const chainId = Number(network.chainId);
            
            // Prazo de 1 hora para a transação
            const deadline = Math.floor(Date.now() / 1000) + 3600;

            console.log({fanTokenContractAddress});
            
            // Obter nonce atual (necessário para a meta-transação)
            const nonce = await fanTokenContract.getNonce(userAddress);

            console.log({
              orderId, 
              userAddress, 
              clubId, 
              amountBigInt, 
              fanatiqueContractAddress, 
              chainId
            });
            
            // Computa o hash da mensagem igual ao usado no contrato Solidity
            // Incluindo chainId como no backend
            const messageHash = ethers.solidityPackedKeccak256(
                ['uint256', 'address', 'uint256', 'uint256', 'address', 'uint256'],
                [orderId, userAddress, clubId, amountBigInt, fanatiqueContractAddress, chainId]
            );
            
            // Converte o hash para arrayify (equivalente a getBytes na v6)
            const messageBytes = ethers.getBytes(messageHash);
            
            // Assina a mensagem (prefixo EIP-191/Ethereum) para obter a orderSignature
            const orderSignature = await signer.signMessage(messageBytes);
            
            // Agora vamos preparar a meta-transação (transferência sem gas)
            // Obtemos o endereço da treasury
            const treasury = await fanatiqueContract.treasury();
            
            // Dados para assinatura EIP-712 no padrão MetaTransfer
            const domain = {
              name: "Fanatique Token",
              version: "1",
              chainId: chainId,
              verifyingContract: fanTokenContractAddress
            };
            
            const types = {
              Transfer: [
                { name: "clubId", type: "uint256" },
                { name: "from", type: "address" },
                { name: "to", type: "address" },
                { name: "amount", type: "uint256" },
                { name: "nonce", type: "uint256" },
                { name: "deadline", type: "uint256" }
              ]
            };
            
            const value = {
              clubId: clubId,
              from: userAddress,
              to: treasury,
              amount: amountBigInt,
              nonce: nonce.toString(),
              deadline: deadline
            };
            
            // Assinar usando MetaMask para metaTransfer
            const metaSignature = await signer.signTypedData(domain, types, value);
            const sig = ethers.Signature.from(metaSignature);
            
            // Retorna os dados necessários alinhados com o backend
            return {
                orderId,
                userAddress: userAddress,  // Renomeado para userId conforme esperado pelo backend
                clubId,
                amount: amountBigInt.toString(),
                deadline: deadline,
                signature: orderSignature,  // Signature da ordem
                v: sig.v,               // Componente v da assinatura EIP-712
                r: sig.r,               // Componente r da assinatura EIP-712
                s: sig.s                // Componente s da assinatura EIP-712
            };
        } catch (err) {
            console.error('Erro ao assinar pagamento:', err);
            if (err.message) {
                throw new Error(`Erro ao assinar pagamento:\n${err.message}`);
            } else {
                throw new Error('Erro ao assinar pagamento');
            }
        }
    }

    // Método alternativo para pagamento usando EIP-712 (TypedData)
/*     async function paymentSignatureTyped(orderId, clubId, amount) {
        try {
            // Verificar se a carteira está conectada
            if (!isConnected) {
                throw new Error("Carteira não está conectada. Por favor, conecte sua carteira.");
            }

            // Verificar se o signer está disponível
            if (!signer) {
                throw new Error("Carteira bloqueada ou não disponível. Por favor, desbloqueie sua carteira.");
            }

            let userAddress;
            try {
                userAddress = await signer.getAddress();
            } catch {
                throw new Error("Não foi possível obter o endereço da carteira. Por favor, desbloqueie sua carteira.");
            }
            
            // Obter nonce atual
            const nonce = await fanTokenContract.getNonce(userAddress);
            
            // Prazo de 1 hora
            const deadline = Math.floor(Date.now() / 1000) + 3600;
            
            // Dados para assinatura EIP-712
            const domain = {
              name: "Fanatique Token",
              version: "1",
              chainId: await signer.getChainId(),
              verifyingContract: fanTokenContract.address
            };
            
            const types = {
              Transfer: [
                { name: "clubId", type: "uint256" },
                { name: "from", type: "address" },
                { name: "to", type: "address" },
                { name: "amount", type: "uint256" },
                { name: "nonce", type: "uint256" },
                { name: "deadline", type: "uint256" }
              ]
            };
            
            const treasury = await fanatiqueContract.treasury();
            
            const value = {
              orderId: orderId,
              clubId: clubId,
              from: userAddress,
              to: treasury,
              amount: amount,
              nonce: nonce.toString(),
              deadline: deadline
            };
            
            // Assinar usando MetaMask
            const signature = await signer._signTypedData(domain, types, value);
            const sig = ethers.splitSignature(signature);
            
            return {
                orderId,
                clubId,
                amount,
                buyer: userAddress,
                deadline,
                v: sig.v,
                r: sig.r,
                s: sig.s
            }
        } catch (err) {
            console.error('Erro ao assinar pagamento:', err);
            throw new Error(`Erro ao assinar pagamento: ${err.message}`);
        }
    } */

    return {
        paymentSignature
    };
}

export default usePayment;