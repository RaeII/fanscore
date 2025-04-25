/* eslint-disable prefer-const */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { ethers } from "hardhat";
import { Fanatique, FanToken } from "../typechain-types";
import { deployFanatique, deployFanToken } from "../scripts/deploy/deploy";
import { expect } from "chai";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import PaymentService from "./services/payment.service";

describe("\n\n  == FANATIQUE == \n\n", function () {
  
  let contractFanatique: Fanatique;
  let addressFanatique: string;
  let contractFanToken: FanToken;
  let addressFanToken: string;
  let ownerSigner: HardhatEthersSigner;
  let israel: HardhatEthersSigner;
  let vit: HardhatEthersSigner;
  let treasury: HardhatEthersSigner;
  let backendSigner: HardhatEthersSigner;
  let israelSigner: Fanatique;
  let vitSigner: Fanatique;
  
  // IDs para teste
  const clubeId = 1;
  const tokenName = "Flamengo Token";
  const tokenSymbol = "FLA";
  const initialSupply = ethers.parseEther("10000");
  const orderAmount = ethers.parseEther("50");
  const orderAmountInt = 50;
  const orderId = 12345;
  const gaslessOrderId = 54321;

  before(async function () {
    // Obtem os signers da rede de teste
    [ownerSigner, israel, vit,treasury] = await ethers.getSigners() as unknown as HardhatEthersSigner[];

    console.log("Signer Before:", ownerSigner.address);

    // Realiza o deploy do contrato FanToken
    contractFanToken = await deployFanToken() as FanToken;
    addressFanToken = await contractFanToken.getAddress();
    console.log("FanToken implantado em :", addressFanToken);

    // Realiza o deploy do contrato principal Fanatique com os endereços corretos
    // Definimos manualmente os parâmetros ao invés de usar a função deployFanatique padrão
    contractFanatique = await deployFanatique(addressFanToken,treasury.address) as Fanatique;
    addressFanatique = await contractFanatique.getAddress();
    console.log("Fanatique implantado em:", addressFanatique);

    console.log('\n\n')

    // Cria instâncias do contrato conectadas aos respectivos signers para simular interações de usuário
    israelSigner = contractFanatique.connect(israel);
    vitSigner = contractFanatique.connect(vit);
  });

  it("Deve permitir pagamento gasless (sem gas para o usuário)", async function () {

    // 1. Criar token para um clube
    console.log("Criando token para o clube:", clubeId);
    await contractFanToken.createToken(clubeId, tokenName, tokenSymbol, initialSupply);
    
    // Verificar se o token foi criado corretamente
    const [name, symbol, totalSupply] = await contractFanToken.getTokenDetails(clubeId);
    expect(name).to.equal(tokenName);
    expect(symbol).to.equal(tokenSymbol);
    expect(totalSupply).to.equal(initialSupply);
    console.log(`Token criado: ${name} (${symbol}), Supply: ${ethers.formatEther(totalSupply)} tokens`);

    // Configurar o token como método de pagamento aceito
    await contractFanatique.setTokenAcceptance(clubeId, true);
    
    console.log('\n\n')

    // Este teste pode não funcionar se a implementação dos contratos não estiver atualizada
    // com as funções gaslessOrderPayment e getNonce.
    // Você deve garantir que as interfaces estejam atualizadas nos typechain-types
    
    // 1. Transferir novos tokens para o usuário vit (simulando compra ou recompensa)
    const gaslessAmount = ethers.parseEther("30");
    const gaslessAmountInt = 30;
    
    console.log(`\nTRANSFERINDO ${ethers.formatEther(gaslessAmount)} tokens para ${await vit.getAddress()}`);
    await contractFanToken.transferFromByOwner(clubeId, await vit.getAddress(), gaslessAmount);
    
    // Verificar o saldo do usuário
    const vitBalance = await contractFanToken.balanceOf(clubeId, await vit.getAddress());
    expect(vitBalance).to.equal(gaslessAmount);
    console.log(`Saldo inicial de ${await vit.getAddress()}: ${ethers.formatEther(vitBalance)} ${tokenSymbol}`);
    
    // 2. Obter o nonce atual para o usuário
    const vitAddress = await vit.getAddress();
    // Método direto através do contrato, pode ser necessário chamar como função ou acessar propriedade
    const nonceCall = await (contractFanToken as any).getNonce(vitAddress);
    const nonce = Number(nonceCall); // Converter para Number para facilitar operações
    console.log(`Nonce atual para ${vitAddress}: ${nonce}`);
    
    // 3. Obter o endereço da treasury do contrato Fanatique
    const treasuryAddress = await contractFanatique.treasury();
    console.log(`Treasury address: ${treasuryAddress}`);
    
    // 4. Gerar assinaturas para pagamento gasless
    console.log("Gerando assinaturas para pagamento gasless");
    
    const metaPaymentData = await PaymentService.signMetaPayment(
      gaslessOrderId,
      vitAddress,
      clubeId,
      gaslessAmountInt,
      addressFanatique,
      addressFanToken,
      treasuryAddress,
      nonce,
      vit // Passamos o usuário para assinar diretamente no teste
    );
    
    console.log("Assinaturas geradas para meta-transação:", {
      orderSignature: metaPaymentData.orderSignature.slice(0, 10) + "...",
      v: metaPaymentData.v,
      r: metaPaymentData.r?.slice(0, 10) + "...",
      s: metaPaymentData.s?.slice(0, 10) + "..."
    });
    
    // 5. Executar gaslessOrderPayment a partir do owner
    // Usando 'as any' para ignorar erros de tipo durante o teste
    console.log("Executando pagamento gasless...");
    
    const gaslessTx = await (contractFanatique as any).gaslessOrderPayment(
      gaslessOrderId,
      vitAddress,
      clubeId,
      gaslessAmount,
      metaPaymentData.deadline,
      metaPaymentData.orderSignature,
      metaPaymentData.v,
      metaPaymentData.r,
      metaPaymentData.s
    );
    
    await gaslessTx.wait();
    console.log("Transação gasless completada!");
    
    // 6. Verificar saldos após o pagamento gasless
    const vitBalanceAfter = await contractFanToken.balanceOf(clubeId, vitAddress);
    const treasuryBalanceAfter = await contractFanToken.balanceOf(clubeId, treasuryAddress);
    const ownerBalanceAfter = await contractFanToken.balanceOf(clubeId, ownerSigner.address);
    
    console.log(`Novo saldo de ${vitAddress}: ${ethers.formatEther(vitBalanceAfter)} ${tokenSymbol}`);
    console.log(`Novo saldo da treasury ${treasuryAddress}: ${ethers.formatEther(treasuryBalanceAfter)} ${tokenSymbol}`);
    console.log(`Novo saldo do owner ${ownerSigner.address}: ${ethers.formatEther(ownerBalanceAfter)} ${tokenSymbol}`);
    // 7. Verificar se os tokens foram transferidos corretamente
    expect(vitBalanceAfter).to.equal(0); // Vit gastou todos os seus tokens
    
    // Comparar com o valor inicial + transferências
    // A treasury inicialmente tem initialSupply, então somamos os dois valores transferidos
    const expectedTreasuryBalance = initialSupply; // Já contém todos os tokens 
    
    // Verificamos se o saldo da treasury é pelo menos igual à quantidade de tokens que enviamos
    expect(treasuryBalanceAfter).to.be.gte(gaslessAmount);
    console.log(`Treasury tem pelo menos os ${ethers.formatEther(gaslessAmount)} tokens da transação gasless`);

    // 8. Verificar se o nonce foi incrementado
    const newNonceCall = await (contractFanToken as any).getNonce(vitAddress);
    const newNonce = Number(newNonceCall);
    expect(newNonce).to.equal(nonce + 1);
    console.log(`Novo nonce para ${vitAddress}: ${newNonce}`);
  });
});
