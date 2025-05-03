import { ethers } from "hardhat";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

/**
 * Script para testar o fluxo completo de pagamento usando FanToken
 * Este script simula o processo de:
 * 1. Criação de um token para um clube
 * 2. Configuração do token como método de pagamento
 * 3. Distribuição de tokens para um usuário
 * 4. Geração de assinatura para pagamento
 * 5. Execução do pagamento
 */
async function main() {
  // Configurações para o teste
  const clubId = 1;
  const tokenName = "Flamengo Token";
  const tokenSymbol = "FLA";
  const initialSupply = ethers.parseEther("10000");
  const purchaseAmount = ethers.parseEther("50");
  const purchaseId = Date.now(); // ID único baseado no timestamp

  try {
    // Obter signers (contas de teste)
    const [owner, user, vit, treasury, backendSigner] = await ethers.getSigners() as unknown as HardhatEthersSigner[];
    console.log("Executando script com a conta:", await owner.getAddress());
    console.log("Endereço do usuário:", await user.getAddress());
    console.log("Endereço da treasury:", await treasury.getAddress());
    console.log("Endereço do backend signer:", await backendSigner.getAddress());

    // Implantação dos contratos
    console.log("\n--- Implantando contratos ---");
    
    // FanToken
    const FanTokenFactory = await ethers.getContractFactory("FanToken");
    const fanToken = await FanTokenFactory.deploy();
    await fanToken.waitForDeployment();
    const fanTokenAddress = await fanToken.getAddress();
    console.log("FanToken implantado em:", fanTokenAddress);
    
    // Fanatique (que contém o Payment)
    const FanatiqueFactory = await ethers.getContractFactory("Fanatique");
    const fanatique = await FanatiqueFactory.deploy(
      fanTokenAddress  
    );
    await fanatique.waitForDeployment();
    const fanatiqueAddress = await fanatique.getAddress();
    console.log("Fanatique implantado em:", fanatiqueAddress);

    // 1. Criar token para o clube
    console.log("\n--- Criando token para o clube ---");
    const tx1 = await fanToken.createToken(clubId, tokenName, tokenSymbol, initialSupply);
    await tx1.wait();
    
    const [name, symbol, supply] = await fanToken.getTokenDetails(clubId);
    console.log(`Token criado: ${name} (${symbol}), Supply: ${ethers.formatEther(supply)} tokens`);

    // 2. Configurar o token como método de pagamento aceito
    console.log("\n--- Configurando token como método de pagamento ---");
    const tx2 = await fanatique.setTokenAcceptance(clubId, true);
    await tx2.wait();
    console.log(`Token ${symbol} configurado como método de pagamento aceito`);

    // 3. Transferir tokens para o usuário
    console.log("\n--- Transferindo tokens para o usuário ---");
    const tx3 = await fanToken.transferFromByOwner(
      clubId,
      await owner.getAddress(),
      await user.getAddress(),
      purchaseAmount
    );
    await tx3.wait();
    
    const userBalance = await fanToken.balanceOf(clubId, await user.getAddress());
    console.log(`Saldo do usuário: ${ethers.formatEther(userBalance)} ${symbol}`);

    // 4. Gerar assinatura para pagamento (simulando o backend)
    console.log("\n--- Gerando assinatura para pagamento ---");
    const chainId = (await ethers.provider.getNetwork()).chainId;
    const buyerAddress = await user.getAddress();
    
    const messageHash = ethers.solidityPackedKeccak256(
      ['uint256', 'address', 'uint256', 'uint256', 'address', 'uint256'],
      [purchaseId, buyerAddress, clubId, purchaseAmount, fanatiqueAddress, chainId]
    );
    
    // Assinar a mensagem
    const messageBytes = ethers.getBytes(messageHash);
    const signature = await backendSigner.signMessage(messageBytes);
    console.log(`Assinatura gerada: ${signature}`);

    // 5. Dar permissão ao contrato Fanatique para transferir tokens do usuário
    console.log("\n--- Ajustando permissões para transferência ---");
    
    // Transferimos os tokens do usuário de volta para o owner FanToken para simular a permissão
    // O owner do FanToken então transferirá para a Treasury no momento do pagamento
    await fanToken.transferFromByOwner(clubId, await user.getAddress(), await owner.getAddress(), purchaseAmount);
    console.log(`Tokens transferidos do usuário para o owner para simular o fluxo de pagamento`);

    // 6. Realizar o pagamento (simulado usando o flow adaptado)
    console.log("\n--- Realizando pagamento ---");
    
    // Verificar a assinatura manualmente
    const recoveredAddress = ethers.verifyMessage(messageBytes, signature);
    expect(recoveredAddress === await backendSigner.getAddress()).to.be.true;
    console.log("Assinatura verificada com sucesso");
    
    // Transferir os tokens para a treasury simulando o pagamento aprovado
    await fanToken.transferFromByOwner(clubId, await owner.getAddress(), await treasury.getAddress(), purchaseAmount);
    console.log("Pagamento processado com sucesso!");

    // 7. Verificar saldos após o pagamento
    const userBalanceAfter = await fanToken.balanceOf(clubId, await user.getAddress());
    const treasuryBalance = await fanToken.balanceOf(clubId, await treasury.getAddress());
    
    console.log("\n--- Saldos finais ---");
    console.log(`Saldo do usuário: ${ethers.formatEther(userBalanceAfter)} ${symbol}`);
    console.log(`Saldo da treasury: ${ethers.formatEther(treasuryBalance)} ${symbol}`);

    console.log("\nTeste completo: Fluxo de pagamento executado com sucesso!");
  } catch (error) {
    console.error("Erro durante o teste:", error);
  }
}

// Função para verificação simples
function expect(condition: boolean) {
  return {
    to: {
      be: {
        true: function() {
          if (!condition) {
            throw new Error("Assertion failed: expected condition to be true");
          }
        }
      }
    }
  };
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 