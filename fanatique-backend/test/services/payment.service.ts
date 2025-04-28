import { ethers } from "hardhat";
import * as dotenv from 'dotenv';
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

dotenv.config();

/**
 * Serviço para gerenciar assinatura de pagamentos para o contrato Fanatique
 * 
 * INTEGRAÇÃO COM FRONTEND:
 * 
 * 1. O frontend deve chamar a API do backend para solicitar uma assinatura para pagamento
 *    POST /api/payment/signature
 *    Body: { OrderId: number, buyer: string (endereço), clubId: number, amount: string }
 * 
 * 2. O backend (este serviço) gera a assinatura e retorna todos os dados necessários
 *    Resposta: { OrderId, buyer, clubId, amount, contractAddress, chainId, signature }
 * 
 * 3. O frontend usa esses dados para chamar o método purchase() do contrato Fanatique:
 *    const contract = new ethers.Contract(contractAddress, ABI_FANATIQUE, signer);
 *    await contract.purchase(OrderId, clubId, amount, signature);
 * 
 * 4. O contrato Fanatique verifica a assinatura e processa o pagamento
 */
class PaymentService {

  /**
   * Gera uma assinatura para uma transação de pagamento
   * Esta assinatura deve ser enviada ao contrato para validar a transação
   * 
   * @param orderId ID único da compra
   * @param buyer Endereço da carteira do comprador
   * @param clubId ID do clube cujo token será usado no pagamento
   * @param amount Valor em tokens a ser pago
   * @returns Objeto contendo os dados da transação e a assinatura
   */
  async signPayment(orderId: number, buyer: string, clubId: number, amount: number, contractAddress: string) {
    try {
      if (!orderId || !amount || !buyer || !clubId) {
        throw new Error('orderId, clubId, amount e buyer são obrigatórios');
      }

      const [wallet] = await ethers.getSigners() as unknown as HardhatEthersSigner[];
      const chainId = (await ethers.provider.getNetwork()).chainId;

      // Converter amount para BigInt se for string
      const amountBigInt = ethers.parseEther(amount.toString());

      console.log("\nSERVICE PAYMENT\n");
      console.log("OrderId:", orderId);
      console.log("Buyer:", buyer);
      console.log("ClubId:", clubId);
      console.log("Amount:", amountBigInt);
      console.log("Contract Address:", contractAddress);
      console.log("ChainId:", chainId);
      console.log("Signer Address:", wallet.address);
      console.log("\n========================================\n");

      // Computa o hash da mensagem igual ao usado no contrato Solidity
      // Corresponde ao formato no contrato Payment.sol:
      // keccak256(abi.encodePacked(OrderId, msg.sender, clubId, amount, address(this), block.chainid))
      const messageHash = ethers.solidityPackedKeccak256(
        ['uint256', 'address', 'uint256', 'uint256', 'address', 'uint256'],
        [orderId, buyer, clubId, amountBigInt, contractAddress,chainId]
      );

      // Converte o hash para bytes
      const messageBytes = ethers.getBytes(messageHash);
      
      // Assina a mensagem (prefixo EIP-191/Ethereum)
      const signature = await wallet.signMessage(messageBytes);

      // Retorna os dados necessários para o frontend fazer a transação
      return {
        orderId,
        buyer,
        clubId,
        amount: amountBigInt.toString(),
        contractAddress: contractAddress,
        chainId: chainId,
        signature
      };
    } catch (err: any) {
      console.error('Erro ao assinar pagamento:', err);
      throw new Error(`Erro ao assinar pagamento: ${err.message}`);
    }
  }

  /**
   * Gera assinaturas para uma transação gasless (meta-transação)
   * Cria tanto a assinatura da ordem (pelo backend) quanto prepara dados para assinatura do usuário
   * 
   * @param orderId ID único da compra
   * @param buyer Endereço da carteira do comprador
   * @param clubId ID do clube cujo token será usado
   * @param amount Valor em tokens a ser pago
   * @param contractAddress Endereço do contrato Payment
   * @param tokenAddress Endereço do contrato FanToken
   * @param treasuryAddress Endereço da treasury
   * @param nonce Número único para evitar duplicações
   * @param userSigner Signer do usuário para teste (ou null em produção)
   * @returns Objeto com as assinaturas e dados necessários para a meta-transação
   */
  async signMetaPayment(
    orderId: number, 
    buyer: string, 
    clubId: number, 
    amount: number,
    contractAddress: string,
    tokenAddress: string,
    treasuryAddress: string,
    nonce: number,
    userSigner?: HardhatEthersSigner
  ) {
    try {
      if (!orderId || !amount || !buyer || !clubId) {
        throw new Error('orderId, clubId, amount e buyer são obrigatórios');
      }

      const [backendWallet] = await ethers.getSigners() as unknown as HardhatEthersSigner[];
      const chainId = (await ethers.provider.getNetwork()).chainId;

      // Converter amount para BigInt
      const amountBigInt = ethers.parseEther(amount.toString());

      console.log("\nSERVICE META-PAYMENT\n");
      console.log("OrderId:", orderId);
      console.log("Buyer:", buyer);
      console.log("ClubId:", clubId);
      console.log("Amount:", amountBigInt);
      console.log("Contract Address:", contractAddress);
      console.log("Token Address:", tokenAddress);
      console.log("Treasury Address:", treasuryAddress);
      console.log("Nonce:", nonce);
      console.log("ChainId:", chainId);
      console.log("Backend Signer:", backendWallet.address);
      console.log("\n========================================\n");

      // 1. Assinatura da ordem pelo backend (mesma lógica do signPayment)
      const orderMessageHash = ethers.solidityPackedKeccak256(
        ['uint256', 'address', 'uint256', 'uint256', 'address', 'uint256'],
        [orderId, buyer, clubId, amountBigInt, contractAddress, chainId]
      );
      const orderMessageBytes = ethers.getBytes(orderMessageHash);
      const orderSignature = await backendWallet.signMessage(orderMessageBytes);

      // 2. Preparar dados para a assinatura de meta-transação do usuário
      // Prazo de 1 hora a partir de agora (em segundos)
      const deadline = Math.floor(Date.now() / 1000) + 3600;

      // Preparar dados para assinatura tipada EIP-712
      const domain = {
        name: "Fanatique Token",
        version: "1",
        chainId,
        verifyingContract: tokenAddress
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
        clubId,
        from: buyer,
        to: treasuryAddress,
        amount: amountBigInt.toString(),
        nonce,
        deadline
      };

      let userSignature;
      let v, r, s;

      // Se for teste, o usuário assina diretamente, caso contrário, retornamos apenas os dados
      if (userSigner) {
        console.log("Assinando com usuário de teste:", await userSigner.getAddress());
        
        // Criar objeto de assinatura para o usuário
        const userSignatureObject = await userSigner.signTypedData(
          domain, 
          types, 
          value
        );
        
        // Extrair componentes v, r, s da assinatura
        const sig = ethers.Signature.from(userSignatureObject);
        v = sig.v;
        r = sig.r;
        s = sig.s;
      }

      // Retornar dados completos para a transação gasless
      return {
        orderId,
        buyer,
        clubId,
        amount: amountBigInt.toString(),
        deadline,
        nonce,
        contractAddress,
        tokenAddress,
        treasuryAddress,
        chainId,
        orderSignature,
        v,
        r,
        s,
        domain,
        types,
        value
      };
    } catch (err: any) {
      console.error('Erro ao assinar meta-transação:', err);
      throw new Error(`Erro ao assinar meta-transação: ${err.message}`);
    }
  }
}

export default new PaymentService(); 