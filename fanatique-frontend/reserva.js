/* const handlePlaceOrder = async () => {
    try {
      setPlacingOrder(true);
      const orderData = {
        match_id: gameId,
        establishment_id: selectedEstablishment.establishment_id,
        products: cart.map(item => ({
          product_id: item.id,
          quantity: item.quantity
        })),
        total_real: cart.reduce((total, item) => total + (item.value_real * item.quantity), 0),
        total_fantoken: cart.reduce((total, item) => total + (item.value_tokefan * item.quantity), 0)
      };

      // Solicita a assinatura para pagamento sem gas
      const totalFantoken = cart.reduce((total, item) => total + (item.value_tokefan * item.quantity), 0);
      const paymentSignature = await solicitarPagamentoSemGas(
        `order-${Date.now()}`, // ID temporário para o pedido
        club.id,
        totalFantoken
      );
      
      // Adiciona os dados de pagamento à ordem
      const orderWithPayment = {
        ...orderData,
        payment_signature: paymentSignature
      };
      
      console.log('orderData', orderWithPayment);
      
      const orderResult = await orderApi.placeOrder(orderWithPayment);
      
      if (orderResult) {
        setOrder(orderResult);
        await fetchActiveOrders(); // Refresh active orders
        setCurrentView('confirmation');
        showSuccess('Order placed successfully!');
        setCart([]); // Clear cart after successful order
      } else {
        showError('Failed to place order');
      }
    } catch (error) {
      console.error('Error placing order:', error);
      showError('Failed to place order');
    } finally {
      setPlacingOrder(false);
    }
  }; */