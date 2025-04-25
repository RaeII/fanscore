  /* it("Deve criar um token de fã e permitir pagamento", async function () {
    // 1. Criar token para um clube
    console.log("Criando token para o clube:", clubeId);
    await contractFanToken.createToken(clubeId, tokenName, tokenSymbol, initialSupply);
    
    // Verificar se o token foi criado corretamente
    const [name, symbol, totalSupply] = await contractFanToken.getTokenDetails(clubeId);
    expect(name).to.equal(tokenName);
    expect(symbol).to.equal(tokenSymbol);
    expect(totalSupply).to.equal(initialSupply);
    console.log(`Token criado: ${name} (${symbol}), Supply: ${ethers.formatEther(totalSupply)} tokens`);
    
    console.log('\n\n')

    // 2. Transferir alguns tokens para o usuário israel (simulando compra ou recompensa)
    console.log(`Transferindo ${ethers.formatEther(orderAmount)} tokens para ${await israel.getAddress()}`);
    await contractFanToken.transferFromByOwner(clubeId, await israel.getAddress(), orderAmount);
    
    // Verificar o saldo do usuário
    const israelBalance = await contractFanToken.balanceOf(clubeId, await israel.getAddress());
    expect(israelBalance).to.equal(orderAmount);
    console.log(`Saldo de ${await israel.getAddress()}: ${ethers.formatEther(israelBalance)} ${symbol}`);
    console.log({israelBalance})
    console.log('\n\n')


    // 3. Configurar o contrato Payment (Fanatique)
    console.log("Configurando contrato Fanatique para aceitar pagamentos");
    
    // Configurar o token como método de pagamento aceito
    await contractFanatique.setTokenAcceptance(clubeId, true);
    
    // 4. Gerar assinatura para pagamento (simulando backend)
    console.log("Gerando assinatura para pagamento");
   
    const buyerAddress = await israel.getAddress();

    const paymentData = await PaymentService.signPayment(orderId, buyerAddress, clubeId, orderAmountInt,addressFanatique);
    
    const tx = await israelSigner.orderPayment(
      orderId, 
      clubeId, 
      orderAmount, 
      paymentData.signature
    );
    await tx.wait();
    
    // 7. Verificar saldos após o pagamento
    const israelBalanceAfter = await contractFanToken.balanceOf(clubeId, await israel.getAddress());
    const treasuryBalance = await contractFanToken.balanceOf(clubeId, await ownerSigner.getAddress());
    
    expect(israelBalanceAfter).to.equal(0); // Israel gastou todos os seus tokens
    expect(treasuryBalance).to.equal(orderAmount); // Treasury recebeu os tokens
    
    console.log(`Novo saldo de ${await israel.getAddress()}: ${ethers.formatEther(israelBalanceAfter)} ${symbol}`);
    console.log(`Saldo da treasury ${await ownerSigner.getAddress()}: ${ethers.formatEther(treasuryBalance)} ${symbol}`);
  }); */