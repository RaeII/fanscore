import { ethers } from 'ethers';
import * as dotenv from 'dotenv';

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
  private readonly privateKey: string;
  private readonly contractAddress: string;
  private readonly chainId: number;
  private readonly wallet: ethers.Wallet;

  constructor() {
    // Chave privada do backend (signer)
    this.privateKey = process.env.SIGNER_PRIVATE_KEY || '';
    if (!this.privateKey) throw new Error("Missing SIGNER_PRIVATE_KEY in .env");
    
    // Endereço do contrato Fanatique
    this.contractAddress = process.env.CONTRACT_ADDRESS || '';
    if (!this.contractAddress) throw new Error("Missing CONTRACT_ADDRESS in .env");
    
    // ID da chain onde o contrato está implantado (Chiliz, por exemplo)
    this.chainId = parseInt(process.env.CHAIN_ID || '0', 10);
    if (!this.chainId) throw new Error("Missing CHAIN_ID in .env");
    
    // Inicializa a carteira com a chave privada
    this.wallet = new ethers.Wallet(this.privateKey);
    
    console.log(`PaymentService inicializado com contrato ${this.contractAddress} na chain ${this.chainId}`);
    console.log(`Endereço do signer: ${this.wallet.address}`);
  }

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
  async signPayment(orderId: number, buyer: string, clubId: number, amount: string) {
    try {
      if (!orderId || !amount || !buyer || !clubId) {
        throw new Error('orderId, clubId, amount e buyer são obrigatórios');
      }

      // Converter amount para BigInt se for string
      const amountBigInt = ethers.parseEther(amount);

      // Computa o hash da mensagem igual ao usado no contrato Solidity
      // Corresponde ao formato no contrato Payment.sol:
      // keccak256(abi.encodePacked(OrderId, msg.sender, clubId, amount, address(this), block.chainid))
      const messageHash = ethers.solidityPackedKeccak256(
        ['uint256', 'address', 'uint256', 'uint256', 'address'],
        [orderId, buyer, clubId, amountBigInt, this.contractAddress]
      );

      // Converte o hash para bytes
      const messageBytes = ethers.getBytes(messageHash);
      
      // Assina a mensagem (prefixo EIP-191/Ethereum)
      const signature = await this.wallet.signMessage(messageBytes);

      // Retorna os dados necessários para o frontend fazer a transação
      return {
        orderId,
        buyer,
        clubId,
        amount: amountBigInt.toString(),
        contractAddress: this.contractAddress,
        chainId: this.chainId,
        signature
      };
    } catch (err: any) {
      console.error('Erro ao assinar pagamento:', err);
      throw new Error(`Erro ao assinar pagamento: ${err.message}`);
    }
  }

  /**
   * Verifica se uma assinatura é válida para os dados fornecidos
   * Útil para debugging e testes
   * 
   * @param orderId ID único da compra
   * @param buyer Endereço da carteira do comprador
   * @param clubId ID do clube cujo token será usado
   * @param amount Valor em tokens a ser pago
   * @param signature Assinatura a ser verificada
   * @returns true se a assinatura for válida
   */
  async verifySignature(orderId: number, buyer: string, clubId: number, amount: string, signature: string): Promise<boolean> {
    try {
      const amountBigInt = ethers.parseEther(amount);
      
      // Recria o hash da mensagem
      const messageHash = ethers.solidityPackedKeccak256(
        ['uint256', 'address', 'uint256', 'uint256', 'address', 'uint256'],
        [orderId, buyer, clubId, amountBigInt, this.contractAddress, this.chainId]
      );
      
      // Converte o hash para bytes
      const messageBytes = ethers.getBytes(messageHash);
      
      // Recupera o endereço que assinou a mensagem
      const signerAddress = ethers.verifyMessage(messageBytes, signature);
      
      // Verifica se o endereço recuperado é o mesmo do wallet configurado
      return signerAddress === this.wallet.address;
    } catch (err) {
      console.error('Erro ao verificar assinatura:', err);
      return false;
    }
  }
}

export default new PaymentService(); 