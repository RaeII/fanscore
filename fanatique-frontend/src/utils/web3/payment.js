import { useContracts } from './contracts';
import { useContext } from 'react';
import { WalletContext } from '../../contexts/WalletContextDef';
import { ethers } from 'ethers';

export function usePayment() {

    const { getSigner, isConnected, provider } = useContext(WalletContext);
    const { getContracts } = useContracts();

    // 1. Usuário solicita pagamento
    async function paymentSignature(orderId, amount, erc20Id) {
        try {   
            console.log('paymentSignature');

            const { fanTokenContract, fanatiqueContractAddress, fanTokenContractAddress } = await getContracts();

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
            
            // Converte amount para BigInt se for string
            const amountBigInt = ethers.parseEther(amount.toString());

            console.log('amountBigInt', amountBigInt.toString());

            // Obter chainId
            const network = await provider.getNetwork();
            const chainId = Number(network.chainId);
            
            // Prazo de 1 hora para a transação
            const deadline = Math.floor(Date.now() / 1000) + 3600;
            
            // Obter nonce atual (necessário para a permissão EIP-2612)
            const nonce = await fanTokenContract.nonces(userAddress);
            
            console.log({
              orderId, 
              userAddress, 
              amountBigInt, 
              fanatiqueContractAddress, 
              chainId,
              erc20Id
            });
            
            // Computa o hash da mensagem para a assinatura da ordem
            // Ajustado para corresponder ao formato usado no contrato
            const messageHash = ethers.solidityPackedKeccak256(
                ['uint256', 'address', 'uint256', 'address', 'uint256'],
                [orderId, userAddress, amountBigInt, fanatiqueContractAddress, chainId]
            );
            
            // Converte o hash para bytes
            const messageBytes = ethers.getBytes(messageHash);
            
            // Assina a mensagem (prefixo EIP-191/Ethereum) para obter a orderSignature
            const orderSignature = await signer.signMessage(messageBytes);
            
            // Dados para assinatura EIP-2612 Permit
            const domain = {
              name: await fanTokenContract.name(),
              version: '1',
              chainId: chainId,
              verifyingContract: fanTokenContractAddress
            };
            
            const types = {
              Permit: [
                { name: "owner", type: "address" },
                { name: "spender", type: "address" },
                { name: "value", type: "uint256" },
                { name: "nonce", type: "uint256" },
                { name: "deadline", type: "uint256" }
              ]
            };
            
            const permitDeadline = Math.floor(Date.now() / 1000) + 3600; // 1 hora
            
            const permitValue = {
              owner: userAddress,
              spender: fanatiqueContractAddress,
              value: amountBigInt,
              nonce: nonce.toString(),
              deadline: permitDeadline
            };
            
            // Assinar usando o formato EIP-2612 Permit
            const permitSignature = await signer.signTypedData(domain, types, permitValue);
            const sig = ethers.Signature.from(permitSignature);
            
            // Retorna os dados necessários alinhados com o backend
            return {
                orderId,
                userAddress: userAddress,
                amount: amount.toString(),
                deadline: deadline,
                signature: orderSignature,
                erc20Id: erc20Id,
                permitV: sig.v,
                permitR: sig.r,
                permitS: sig.s,
                permitDeadline: permitDeadline
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

    return {
        paymentSignature
    };
}

export default usePayment;