/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useWalletContext } from '../hooks/useWalletContext';
import { 
  ArrowLeft, 
  ShoppingBag, 
  Store, 
  ChevronRight, 
  Plus, 
  Minus, 
  ShoppingCart, 
  Loader2, 
  X, 
  Check,
  Clock,
  CreditCard,
  ListTodo,
  AlertCircle,
  Copy,
  ExternalLink,
  Volleyball as Football,
  Receipt
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { showError, showSuccess } from '../lib/toast';
import orderApi from '../api/order';
import clubApi from '../api/club';
import matchApi from '../api/match';
import establishmentApi from '../api/establishment';
import { useLocation } from 'react-router-dom';
import establishmentProductApi from '../api/establishment_product';
import { usePayment } from '../utils/web3/payment';
import { getWalletTokensByClub } from '../api/contract';
import contractApi from '../api/contract';


export default function StadiumOrdersPage() {
  const navigate = useNavigate();
  const { clubId, gameId } = useParams();
  const { isAuthenticated, getUserData, account } = useWalletContext();
  const { state } = useLocation();
  const { paymentSignature } = usePayment();
  // UI States
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState('establishments'); // 'establishments', 'menu', 'cart', 'confirmation', 'activeOrders'
  const [placingOrder, setPlacingOrder] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  
  // Data States
  const [establishments, setEstablishments] = useState([]);
  const [selectedEstablishment, setSelectedEstablishment] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [cart, setCart] = useState([]);
  const [club, setClub] = useState(state?.club);
  const [order, setOrder] = useState(null);
  const [gameInfo, setGameInfo] = useState(null);
  const [activeOrders, setActiveOrders] = useState([]);
  const [orderStatusFilter, setOrderStatusFilter] = useState('all'); // 'all', '1', '2'
  const [userTokens, setUserTokens] = useState(null);
  
  // Nova adição: Modal de compra de tokens
  const [showBuyTokenModal, setShowBuyTokenModal] = useState(false);
  const [tokenQuantity, setTokenQuantity] = useState(1);
  const [showQRCode, setShowQRCode] = useState(false);
  const [processingTokenPayment, setProcessingTokenPayment] = useState(false);
  const [insufficientFunds, setInsufficientFunds] = useState(false);
  const [requiredTokens, setRequiredTokens] = useState(0);
  
  // Modal de confirmação para compra de tokens
  const [showConfirmTokenBuyModal, setShowConfirmTokenBuyModal] = useState(false);

  // Check if user is authenticated and load data
  useEffect(() => {
    const checkAuthAndLoadData = async () => {
      try {
        if (!isAuthenticated) {
          navigate('/app');
          return;
        }

        setLoading(true);
        
        // Get user data - we call this to verify authentication
        await getUserData();
        
        if (clubId && !club) {
          // Load club data
          const clubData = await clubApi.getClubById(clubId);
          if (clubData) {
            setClub(clubData);
          }
        } else if (!clubId && !club) {
          // Redirect to dashboard if no clubId is provided
          navigate('/dashboard');
          return;
        }
        // Load game info
        if (gameId) {
          await verifyHomeGameAndLoadData(clubId, gameId);
          await fetchActiveOrders();
          await fetchUserTokens();
        } else {
          showError('No game specified');
          navigate(`/clubs/${clubId}`);
        }
      } catch (error) {
        console.error('Error loading data:', error);
        showError('Failed to load stadium data');
        navigate('/dashboard');
      } finally {
        setLoading(false);
      }
    };

    checkAuthAndLoadData();
  }, [isAuthenticated, navigate, getUserData, clubId, gameId]);

  // Buscar saldo de tokens do usuário
  const fetchUserTokens = async () => {
    try {
      if (!account || !clubId) return;
      
      const response = await getWalletTokensByClub(account, clubId);
      if (response && response.content) {
        setUserTokens(response.content);
      }
    } catch (error) {
      console.error('Erro ao buscar saldo de tokens:', error);
      // Não mostrar erro para não interromper o fluxo principal
    }
  };

  // Fetch active orders periodically
  useEffect(() => {
    // Only run if authenticated and have game info
    if (!isAuthenticated || !gameId) return;

    const fetchOrders = async () => {
      await fetchActiveOrders();
    };

    // Fetch immediately and then every 30 seconds
    fetchOrders();
    const interval = setInterval(fetchOrders, 30000);

    return () => clearInterval(interval);
  }, [isAuthenticated, gameId]);

  const fetchActiveOrders = async () => {
    try {
      // In a real app, this would fetch the user's active orders for this game
      const activeOrdersData = await orderApi.getActiveOrders(gameId);
      setActiveOrders(activeOrdersData);
    } catch (error) {

      console.error('Error fetching active orders:', error);
      // Don't show error to avoid disrupting the main flow
    }
  };

  const verifyHomeGameAndLoadData = async (clubId, gameId) => {
    try {
      const currentClubName = club.name;
      const game = await matchApi.getMatchById(gameId);

      if (!game) {
        showError('Game not found');
        navigate(`/clubs/${clubId}`);
        return;
      }

      // Check if the current club is playing in this game
      const isParticipating = game.home_club_name === currentClubName || game.away_club_name === currentClubName;
      
      if (!isParticipating) {
        showError('Your club is not participating in this game');
        navigate(`/clubs/${clubId}`);
        return;
      }
      
      // Check if the current club is the home team (for display purposes)
      const isHomeTeam = game.home_club_id === club.id;
      
      setGameInfo({
        ...game,
        is_home_team: isHomeTeam  // Keep track of whether this club is home team (for UI customization)
      });
      
      // Load establishments for any participating team
      const establishments = await establishmentApi.getEstablishmentByStadiumId(game.stadium_id);
      setEstablishments(establishments);
    } catch (error) {
      console.error('Error verifying game participation:', error);
      showError('Failed to verify game data');
      navigate(`/clubs/${clubId}`);
    }
  };

  const fetchMenuItems = async (establishmentId) => {
    try {
      setLoading(true);
      const data = await establishmentProductApi.getProductsByEstablishment(establishmentId);
      setMenuItems(data);
      setCurrentView('menu');
    } catch (error) {
      console.error('Error fetching menu items:', error);
      showError('Failed to load menu');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectEstablishment = (establishment) => {
    setSelectedEstablishment(establishment);
    fetchMenuItems(establishment.establishment_id);
  };

  const handleAddToCart = (item) => {
    const existingItem = cart.find(cartItem => cartItem.id === item.id);
    
    if (existingItem) {
      setCart(cart.map(cartItem => 
        cartItem.id === item.id 
          ? { ...cartItem, quantity: cartItem.quantity + 1 } 
          : cartItem
      ));
    } else {
      setCart([...cart, { ...item, quantity: 1 }]);
    }
    
    // showSuccess(`Added ${item.name} to cart`);
  };

  const handleRemoveFromCart = (item) => {
    const existingItem = cart.find(cartItem => cartItem.id === item.id);
    
    if (existingItem && existingItem.quantity > 1) {
      setCart(cart.map(cartItem => 
        cartItem.id === item.id 
          ? { ...cartItem, quantity: cartItem.quantity - 1 } 
          : cartItem
      ));
    } else {
      setCart(cart.filter(cartItem => cartItem.id !== item.id));
    }
  };

  const handleDeleteFromCart = (itemId) => {
    setCart(cart.filter(item => item.id !== itemId));
  };

  const handleViewCart = () => {
    setCurrentView('cart');
  };

  const handleViewActiveOrders = () => {
    setCurrentView('activeOrders');
  };

  const handleBack = () => {
    if (currentView === 'menu') {
      setCurrentView('establishments');
      setSelectedEstablishment(null);
    } else if (currentView === 'cart') {
      setCurrentView('menu');
    } else if (currentView === 'confirmation') {
      // If from confirmation, go back to establishments to start over
      setCurrentView('establishments');
      setCart([]);
      setOrder(null);
    } else if (currentView === 'activeOrders') {
      setCurrentView('establishments');
    } else {
      navigate(`/game/${clubId}/${gameId}`);
    }
  };

  const handlePlaceOrder = async () => {
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
      
      const orderResult = await orderApi.placeOrder(orderData);
      
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
  };

  const calculateTotal = () => {
    return cart.reduce((total, item) => total + (item.value_real * item.quantity), 0);
  };

  const calculateFanTokenTotal = () => {
    return cart.reduce((total, item) => total + (item.value_tokefan * item.quantity), 0);
  };

  // Get order status color
  const getStatusColor = (status) => {
    switch (status) {
      case 1:
        return 'text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/20';
      case 2:
        return 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/20';
      case 3:
        return 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/20';
      default:
        return 'text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800/40';
    }
  };

  // Obter nome do status traduzido
  const getStatusName = (statusId) => {
    switch (statusId) {
      case 1:
        return 'Aguardando Pagamento';
      case 2:
        return 'Pronto para Retirar';
      case 3:
        return 'Processando';
      default:
        return 'Status Desconhecido';
    }
  };

  // Função para verificar se o usuário tem saldo suficiente para realizar a compra
  const checkUserBalance = (totalTokens) => {
    if (!userTokens) {
      return false;
    }
    
    return parseFloat(userTokens.balance) >= totalTokens;
  };

  // Função para lidar com a compra de tokens
  const handleBuyTokens = async () => {
    if (!account) {
      showError('Conecte sua carteira para continuar com a compra');
      return;
    }
    setShowQRCode(true);
  };

  // Função para fechar o modal de compra de tokens
  const handleCloseTokenModal = () => {
    setShowBuyTokenModal(false);
    setShowQRCode(false);
    setTokenQuantity(1);
    setInsufficientFunds(false);
  };

  // Função para processar a compra de tokens
  const processTokenPurchase = async () => {
    try {
      setProcessingTokenPayment(true);
      
      // Preparar dados para a transferência
      const transferData = {
        club_id: clubId,
        to: account,
        amount: tokenQuantity
      };
      
      // Chamar a API para transferir tokens
      await contractApi.transferTokens(transferData);
      
      // Atualizar tokens da carteira após a compra
      await fetchUserTokens();
      
      // Fechar todos os modais
      setShowQRCode(false);
      setShowBuyTokenModal(false);
      setShowConfirmTokenBuyModal(false);
      setTokenQuantity(1);
      showSuccess(`Compra de ${tokenQuantity} FanTokens realizada com sucesso!`);
      
      // Se a compra foi devido a fundos insuficientes para um pedido, agora tente realizar o pagamento do pedido
      if (insufficientFunds && order) {
        handlePayment(order);
      }
    } catch (error) {
      console.error('Erro ao processar pagamento de tokens:', error);
      showError('Falha ao processar o pagamento de tokens. Tente novamente.');
    } finally {
      setProcessingTokenPayment(false);
      setInsufficientFunds(false);
    }
  };
  
  // Gerar QR Code aleatório
  const getRandomQRCode = () => {
    return `/qr.png`;
  };

  // Atualização da função de pagamento para verificar saldo
  const handlePayment = async (order) => {
    try {
      // Verificar se o usuário tem saldo suficiente
      const hasEnoughBalance = checkUserBalance(order.total_fantoken);
      
      if (!hasEnoughBalance) {
        // Calcular quantos tokens o usuário precisa comprar
        const currentBalance = userTokens ? parseFloat(userTokens.balance) : 0;
        const needed = parseFloat(order.total_fantoken) - currentBalance;
        
        setRequiredTokens(Math.ceil(needed)); // Arredondar para cima
        setTokenQuantity(Math.ceil(needed)); // Definir quantidade inicial para compra
        setInsufficientFunds(true); // Indicar que estamos comprando devido a saldo insuficiente
        setOrder(order); // Salvar o pedido atual
        
        // Mostrar modal de confirmação antes de abrir o modal de compra de tokens
        setShowConfirmTokenBuyModal(true);
        return;
      }
      
      setProcessingPayment(true);
      
      // ERC20 token ID (1 = token padrão, pode variar dependendo da configuração)
      const erc20Id = 1;
      
      // Obter assinatura do usuário usando a função de pagamento atualizada
      const signatureData = await paymentSignature(order.id, order.total_fantoken, erc20Id);
      
      // Adicionar os dados de pagamento à ordem no formato que o backend espera
      const paymentData = {
        orderId: order.id,
        userId: order.user_id,
        userAddress: signatureData.userAddress,
        amount: signatureData.amount,
        deadline: signatureData.deadline,
        signature: signatureData.signature,
        erc20Id: signatureData.erc20Id,
        permitV: signatureData.permitV,
        permitR: signatureData.permitR,
        permitS: signatureData.permitS,
        permitDeadline: signatureData.permitDeadline
      };
      
      console.log('Enviando dados de pagamento:', paymentData);          
      
      // Enviar para o backend processar o pagamento
      const paymentResult = await orderApi.paymentOrder(paymentData);
      
      if (paymentResult) {
        // Após o pagamento bem-sucedido, atualizar os pedidos ativos
        await fetchActiveOrders();
        showSuccess('Pagamento realizado com sucesso!');
        
        // Redirecionar para a tela de pedidos ativos após o pagamento bem-sucedido
        setCurrentView('activeOrders');
      } else {
        showError('Falha ao processar o pagamento');
      }
    } catch (error) {
      console.error('Erro ao processar pagamento:', error);
      if (error.message) {
        showError(error.message);
      } else {
        showError('Erro ao processar o pagamento');
      }
    } finally {
      setProcessingPayment(false);
      await fetchActiveOrders();
    }
  };

  // Função para responder à confirmação de compra de tokens
  const handleTokenBuyConfirmation = (confirmed) => {
    setShowConfirmTokenBuyModal(false);
    
    if (confirmed) {
      // Se confirmou, abre o modal de compra de tokens
      setShowBuyTokenModal(true);
    } else {
      // Se recusou, limpa os estados
      setInsufficientFunds(false);
      setRequiredTokens(0);
      setTokenQuantity(1);
      showError('É necessário ter saldo suficiente para finalizar o pedido');
    }
  };

  // Filtered orders based on status filter
  const filteredActiveOrders = activeOrders.filter(order => {
    if (orderStatusFilter === 'all') return true;
    return order.status_id.toString() === orderStatusFilter;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className="flex flex-col items-center">
          <Loader2 className="h-12 w-12 animate-spin text-secondary" />
          <p className="mt-4 text-primary/70 dark:text-white/70">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#fafafa] dark:bg-[#0d0117]">
      {/* Header */}
      <div className="bg-primary text-white p-4">
        <div className="container mx-auto">
          <button 
            onClick={handleBack}
            className="flex items-center text-white/80 hover:text-white mb-2"
          >
            <ArrowLeft size={18} className="mr-1" />
            <span>Voltar</span>
          </button>
          
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold">
              {currentView === 'establishments' && 'Comidas & Bebidas do Estádio'}
              {currentView === 'menu' && selectedEstablishment?.name}
              {currentView === 'cart' && 'Seu Pedido'}
              {currentView === 'confirmation' && 'Pedido Confirmado'}
              {currentView === 'activeOrders' && 'Meus Pedidos Ativos'}
            </h1>
            
            {/* Header actions */}
            <div className="flex items-center gap-2">
              {/* Token Balance */}
              {userTokens && (
                <div className="flex items-center bg-white/10 rounded-lg px-3 py-1">
                  {userTokens.clubImage ? (
                    <img 
                      src={userTokens.clubImage} 
                      alt={userTokens.tokenSymbol} 
                      className="w-7 h-7 mr-1.5 rounded-full"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="w-4 h-4 mr-1.5 bg-secondary rounded-full flex items-center justify-center text-[8px] text-white font-bold">
                      {userTokens.tokenSymbol?.charAt(0) || 'T'}
                    </div>
                  )}
                  <span className="font-medium text-white">{userTokens.balance} {userTokens.tokenSymbol}</span>
                </div>
              )}
              
              {/* Active orders button */}
              {activeOrders.length > 0 && currentView !== 'activeOrders' && (
                <Button 
                  variant="secondary" 
                  size="sm" 
                  className="flex items-center" 
                  onClick={handleViewActiveOrders}
                >
                  <Clock size={16} className="mr-1" />
                  <span>{activeOrders.length}</span>
                </Button>
              )}
              
              {/* Cart button in header */}
              {(currentView === 'menu' && cart.length > 0) && (
                <Button 
                  variant="secondary" 
                  size="sm" 
                  className="flex items-center" 
                  onClick={handleViewCart}
                >
                  <ShoppingCart size={16} className="mr-1" />
                  <span>{cart.reduce((total, item) => total + item.quantity, 0)}</span>
                </Button>
              )}
            </div>
          </div>
          
          {club && (
            <div className="text-sm text-white/80 mt-1">
              {club.name}
              {gameInfo && (
                <span className="ml-2">| {gameInfo.home_club_name} vs {gameInfo.away_club_name}</span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6 pb-24">
        {/* Establishments View */}
        {currentView === 'establishments' && (
          <div className="space-y-4">
            {/* Active orders compact banner */}
            {activeOrders.length > 0 && (
              <div onClick={handleViewActiveOrders} className="bg-secondary/10 rounded-lg p-4 flex justify-between items-center cursor-pointer mb-6 border border-secondary/20">
                <div className="flex items-center">
                  <Clock size={20} className="text-secondary mr-2" />
                  <div>
                    <h3 className="font-medium text-primary dark:text-white">Você tem {activeOrders.length} pedido{activeOrders.length > 1 ? 's' : ''} ativo{activeOrders.length > 1 ? 's' : ''}</h3>
                    <p className="text-sm text-primary/70 dark:text-white/70">Toque para acompanhar seus pedidos</p>
                  </div>
                </div>
                <ChevronRight size={20} className="text-primary/50 dark:text-white/50" />
              </div>
            )}
            
            {/* Game Information Card */}
            {gameInfo && (
              <div className="bg-white dark:bg-[#150924] rounded-lg p-4 mb-4 shadow-sm">
                <h2 className="text-lg font-bold text-primary dark:text-white">Informações do Jogo</h2>
                <div className="flex items-center mt-2">
                  <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse mr-2"></div>
                  <span className="text-sm font-medium text-primary dark:text-white">
                    {gameInfo.home_club_name} vs {gameInfo.away_club_name}
                  </span>
                </div>
                <p className="text-sm text-primary/70 dark:text-white/70 mt-1">
                  Estádio: {gameInfo.stadium_name}
                </p>
                <p className="text-sm text-primary/70 dark:text-white/70 mt-1">
                  Placar Atual: 0 - 0
                </p>
                <p className="text-xs text-primary/60 dark:text-white/60 mt-1">
                  {gameInfo.is_home_team ? "Seu time está jogando em casa" : "Seu time é o visitante"}
                </p>
              </div>
            )}
            
            <h2 className="text-lg font-medium text-primary dark:text-white mb-4">
              Selecione um estabelecimento
            </h2>
            
            {establishments.length > 0 ? (
              <>
                {/* {gameInfo.is_home_team === false && (
                  <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg mb-4">
                    <p className="text-amber-700 dark:text-amber-300 font-medium">
                      You're placing an order for an away game. Food and drinks will be available at {gameInfo?.stadium}.
                    </p>
                  </div>
                )} */}
                
                {establishments.map((establishment) => (
                  <div 
                    key={establishment.id}
                    className="bg-white dark:bg-[#150924] rounded-lg p-4 shadow-sm cursor-pointer"
                    onClick={() => handleSelectEstablishment(establishment)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-12 h-12 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center mr-4">
                          <img 
                            src={establishment.image} 
                            alt={establishment.establishment_name}
                            className="w-full h-full object-cover rounded-full"
                            onError={(e) => e.target.src = 'https://via.placeholder.com/80?text=No+Image'}
                          />
                        </div>  
                        <div>
                          <h3 className="font-medium text-primary dark:text-white">{establishment.establishment_name}</h3>
                          <p className="text-sm text-primary/70 dark:text-white/70">{establishment.description || ''}</p>
                        </div>
                      </div>
                      <ChevronRight size={20} className="text-primary/50 dark:text-white/50" />
                    </div>
                  </div>
                ))
              }</>
            ) : (
              <div className="bg-white dark:bg-[#150924] rounded-lg p-6 text-center shadow-sm">
                <p className="text-primary/70 dark:text-white/70">Nenhum estabelecimento disponível</p>
              </div>
            )}
          </div>
        )}

        {/* Menu Items View */}
        {currentView === 'menu' && (
          <div className="space-y-4">
            <h2 className="text-lg font-medium text-primary dark:text-white mb-4">
              Menu de Itens
            </h2>
            
            {menuItems.length > 0 ? (
              menuItems.map((item) => {
                const cartItem = cart.find(i => i.id === item.id);
                const quantity = cartItem ? cartItem.quantity : 0;
                
                return (
                  <div 
                    key={item.id}
                    className="bg-white dark:bg-[#150924] rounded-lg p-4 shadow-sm"
                  >
                    <div className="flex justify-between">
                      <div className="flex">
                        {item.image && (
                          <div className="mr-4 w-20 h-20 flex-shrink-0">
                            <img 
                              src={item.image} 
                              alt={item.name}
                              className="w-full h-full object-cover rounded-md"
                              onError={(e) => e.target.src = 'https://via.placeholder.com/80?text=No+Image'}
                            />
                          </div>
                        )}
                        <div>
                          <h3 className="font-medium text-primary dark:text-white">{item.name}</h3>
                          <p className="text-sm text-primary/70 dark:text-white/70 mt-1">{item.description}</p>
                          <div className="mt-2">
                            <p className="font-medium text-primary dark:text-white">{item.value_tokefan.toFixed(2)} {userTokens?.tokenSymbol || club?.symbol || ""}</p>
                            <p className="text-sm text-primary/70 dark:text-white/70">R$ {item.value_real.toFixed(2)}</p>
                          </div>
                        </div>
                      </div>
                      
                      {quantity > 0 ? (
                        <div className="flex items-center">
                          <Button 
                            variant="outline" 
                            size="icon" 
                            className="h-8 w-8"
                            onClick={() => handleRemoveFromCart(item)}
                          >
                            <Minus size={16} />
                          </Button>
                          <span className="mx-3 font-medium text-primary dark:text-white">{quantity}</span>
                          <Button 
                            variant="outline" 
                            size="icon" 
                            className="h-8 w-8"
                            onClick={() => handleAddToCart(item)}
                          >
                            <Plus size={16} />
                          </Button>
                        </div>
                      ) : (
                        <Button 
                          variant="secondary" 
                          size="sm"
                          onClick={() => handleAddToCart(item)}
                        >
                          Adicionar
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="bg-white dark:bg-[#150924] rounded-lg p-6 text-center shadow-sm">
                <p className="text-primary/70 dark:text-white/70">Nenhum item de menu disponível</p>
              </div>
            )}
          </div>
        )}

        {/* Cart View */}
        {currentView === 'cart' && (
          <div className="space-y-4">
            <h2 className="text-lg font-medium text-primary dark:text-white mb-4">
              Seu Pedido
            </h2>
            
            {cart.length > 0 ? (
              <>
                <div className="bg-white dark:bg-[#150924] rounded-lg p-4 shadow-sm">
                  <h3 className="font-medium text-primary dark:text-white mb-3">
                    {selectedEstablishment?.establishment_name}
                  </h3>
                  
                  <div className="divide-y divide-gray-100 dark:divide-gray-800">
                    {cart.map((item) => (
                      <div key={item.id} className="py-3 flex justify-between items-center">
                        <div className="flex items-center">
                          {item.image && (
                            <div className="mr-3 w-12 h-12 flex-shrink-0">
                              <img 
                                src={item.image} 
                                alt={item.name}
                                className="w-full h-full object-cover rounded-md"
                                onError={(e) => e.target.src = 'https://via.placeholder.com/48?text=No+Image'}
                              />
                            </div>
                          )}
                          <div className="mr-3 flex items-center">
                            <span className="font-medium text-primary dark:text-white">
                              {item.quantity}x
                            </span>
                          </div>
                          <div>
                            <h4 className="text-primary dark:text-white">{item.name}</h4>
                            <p className="text-sm text-primary/70 dark:text-white/70">{item.value_tokefan.toFixed(2)} {userTokens?.tokenSymbol || club?.symbol || ""}</p>
                            <p className="text-xs text-primary/50 dark:text-white/50">R$ {item.value_real.toFixed(2)}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center">
                          <div className="text-right mr-4">
                            <p className="font-medium text-primary dark:text-white">
                              {(item.value_tokefan * item.quantity).toFixed(2)} {userTokens?.tokenSymbol || club?.symbol || ""}
                            </p>
                            <p className="text-xs text-primary/50 dark:text-white/50">
                              R$ {(item.value_real * item.quantity).toFixed(2)}
                            </p>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-red-500"
                            onClick={() => handleDeleteFromCart(item.id)}
                          >
                            <X size={16} />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                    <div className="flex justify-between items-center">
                      <span className="text-primary dark:text-white font-bold">Total</span>
                      <div className="text-right">
                        <p className="font-bold text-lg text-primary dark:text-white">
                          {calculateFanTokenTotal().toFixed(2)} {userTokens?.tokenSymbol || club?.symbol || ""}
                        </p>
                        <p className="font-medium text-primary/90 dark:text-white/90 text-sm">
                          R$ {calculateTotal().toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <Button 
                  className="w-full mt-4" 
                  size="lg"
                  onClick={handlePlaceOrder}
                  disabled={placingOrder}
                >
                  {placingOrder ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    'Place Order'
                  )}
                </Button>
              </>
            ) : (
              <div className="bg-white dark:bg-[#150924] rounded-lg p-6 text-center shadow-sm">
                <p className="text-primary/70 dark:text-white/70">Your cart is empty</p>
                <Button 
                  variant="secondary" 
                  className="mt-4" 
                  onClick={() => setCurrentView('menu')}
                >
                  Go back to menu
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Active Orders View */}
        {currentView === 'activeOrders' && (
          <div className="space-y-4">
            <h2 className="text-lg font-medium text-primary dark:text-white mb-4">
              Meus Pedidos Ativos
            </h2>
            
            {/* Filter tabs */}
            <div className="flex flex-wrap gap-2 mb-6">
              <Button 
                variant={orderStatusFilter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setOrderStatusFilter('all')}
                className={`
                  rounded-full font-medium 
                  ${orderStatusFilter === 'all' 
                    ? 'bg-primary text-white shadow-md' 
                    : 'bg-white/10 text-primary dark:text-white border-primary/20 dark:border-white/20 hover:bg-white/20 hover:border-primary/30 dark:hover:border-white/30'}
                `}
              >
                <ListTodo size={16} className="mr-1.5" />
                Todos
              </Button>
              <Button 
                variant={orderStatusFilter === '1' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setOrderStatusFilter('1')}
                className={`
                  rounded-full font-medium
                  ${orderStatusFilter === '1' 
                    ? 'bg-amber-500 text-white shadow-md' 
                    : 'bg-white/10 text-primary dark:text-white border-primary/20 dark:border-white/20 hover:bg-white/20 hover:border-primary/30 dark:hover:border-white/30'}
                `}
              >
                <CreditCard size={16} className="mr-1.5" />
                Aguardando Pagamento
              </Button>
              <Button 
                variant={orderStatusFilter === '2' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setOrderStatusFilter('2')}
                className={`
                  rounded-full font-medium
                  ${orderStatusFilter === '2' 
                    ? 'bg-green-500 text-white shadow-md' 
                    : 'bg-white/10 text-primary dark:text-white border-primary/20 dark:border-white/20 hover:bg-white/20 hover:border-primary/30 dark:hover:border-white/30'}
                `}
              >
                <Check size={16} className="mr-1.5" />
                Pronto para Retirar
              </Button>
            </div>
            
            {activeOrders.length > 0 ? (
              filteredActiveOrders.length > 0 ? (
                filteredActiveOrders.map((order) => (
                  <div 
                    key={order.id}
                    className="bg-white dark:bg-[#150924] rounded-lg p-4 shadow-sm"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-medium text-primary dark:text-white">Pedido #{order.id}</h3>
                        <p className="text-sm text-primary/70 dark:text-white/70">{order?.establishment_name}</p>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status_id)}`}>
                        {getStatusName(order.status_id)}
                      </div>
                    </div>
                    
                    <div className="divide-y divide-gray-100 dark:divide-gray-800">
                      {order.products.map((item, idx) => (
                        <div key={idx} className="py-2 flex justify-between">
                          <span className="text-primary/80 dark:text-white/80">
                            {item.quantity}x {item.product_name}
                          </span>
                          <div className="text-right">
                            <p className="font-medium text-primary dark:text-white">
                              {(item.value_tokefan * item.quantity).toFixed(2)} {userTokens?.tokenSymbol || club?.symbol || ""}
                            </p>
                            <p className="text-sm text-primary/70 dark:text-white/70">
                              R$ {(item.value_real * item.quantity).toFixed(2)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-primary/70 dark:text-white/70 text-sm">Total</p>
                          {/* Valor em Fan Token */}
                          <p className="font-bold text-lg text-primary dark:text-white">
                            {order.total_fantoken.toFixed(2)} {userTokens?.tokenSymbol || club?.symbol || ""}
                          </p>
                          <p className="font-medium text-primary/90 dark:text-white/90 text-sm">R$ {order.total_real.toFixed(2)}</p>
                        </div>
                        
                        <div className="text-right">
                          <p className="text-primary/70 dark:text-white/70 text-sm">Local de Retirada</p>
                          <p className="font-medium text-primary dark:text-white">{order?.establishment_name || 'sem local de retirada'}</p>
                        </div>
                      </div>
                      
                      {/* Botão de pagamento para ordens com status_id igual a 1 */}
                      {order.status_id === 1 && (
                        <Button
                          className="w-full mt-4"
                          onClick={() => handlePayment(order)}
                          disabled={processingPayment}
                        >
                          {processingPayment ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Processando pagamento...
                            </>
                          ) : (
                            <>
                              <CreditCard className="mr-2 h-4 w-4" />
                              Pagar Agora
                            </>
                          )}
                        </Button>
                      )}
                      
                      {/* Exibir hash da transação para pedidos pagos (status 2) */}
                      {order.status_id === 2 && order.transaction_hash && (
                        <div className="mt-4 bg-[#071e36] dark:bg-[#071e36] p-3 rounded-lg">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                    
                                <div className="flex items-center text-xs text-gray-400">
                                  <span className="inline-flex items-center">
                                    <Receipt size={12} className="mr-1" />
                                    {order.transaction_hash.length > 16 
                                      ? `${order.transaction_hash.substring(0, 8)}...${order.transaction_hash.substring(order.transaction_hash.length - 8)}` 
                                      : order.transaction_hash}
                                  </span>
                                  <a 
                                    href={`https://chiliscan.com/tx/${order.transaction_hash}`} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="ml-2 inline-flex items-center text-blue-400 hover:text-blue-300"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <ExternalLink size={17} className="mr-1" />
                                    Explorar
                                  </a>
                                </div>
                            
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-gray-400">
                                {new Date().toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* Estimated time or other info */}
                      {order.status === 'PROCESSING' && (
                        <div className="mt-3 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-md text-sm">
                          <p className="text-blue-700 dark:text-blue-300">
                            Estimativa de preparo: {order?.estimated_time || 'sem tempo estimado'}
                          </p>
                        </div>
                      )}
                      
                      {/* Ready for pickup message */}
                      {order.status === 'READY' && (
                        <div className="mt-3 bg-green-50 dark:bg-green-900/20 p-3 rounded-md text-sm">
                          <p className="text-green-700 dark:text-green-300 font-medium">
                            Seu pedido está pronto para retirada!
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="bg-white dark:bg-[#150924] rounded-lg p-6 text-center shadow-sm">
                  <p className="text-primary/70 dark:text-white/70">Nenhum pedido encontrado com este status</p>
                </div>
              )
            ) : (
              <div className="bg-white dark:bg-[#150924] rounded-lg p-6 text-center shadow-sm">
                <p className="text-primary/70 dark:text-white/70">Você não tem pedidos ativos</p>
                <Button 
                  variant="secondary" 
                  className="mt-4" 
                  onClick={() => setCurrentView('establishments')}
                >
                  Fazer um pedido
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Confirmation View */}
        {currentView === 'confirmation' && order && (
          <div className="space-y-4">
            <div className="flex flex-col items-center justify-center py-8">
              <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center mb-4">
                <Check size={32} className="text-green-600 dark:text-green-400" />
              </div>
              
              <h2 className="text-xl font-bold text-primary dark:text-white mb-2">
                Pedido Confirmado!
              </h2>
              
              <p className="text-primary/70 dark:text-white/70 text-center mb-4">
                Seu pedido #{order.id} foi realizado com sucesso e estará pronto para retirada em breve.
              </p>
              
              <div className="bg-white dark:bg-[#150924] rounded-lg p-4 shadow-sm w-full max-w-md">
                <h3 className="font-medium text-primary dark:text-white mb-3">
                  Detalhes do Pedido
                </h3>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-primary/70 dark:text-white/70">Número do Pedido:</span>
                    <span className="font-medium text-primary dark:text-white">{order.id}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-primary/70 dark:text-white/70">Estabelecimento:</span>
                    <span className="font-medium text-primary dark:text-white">{order.establishment_name}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-primary/70 dark:text-white/70">Status:</span>
                    <span className="font-medium text-green-600 dark:text-green-400">Aguardando pagamento</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-primary/70 dark:text-white/70">Valor FanToken:</span>
                    <span className="font-bold text-lg text-primary dark:text-white">{order.total_fantoken?.toFixed(2)} {userTokens?.tokenSymbol || club?.symbol || ""}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-primary/70 dark:text-white/70">Valor Total:</span>
                    <span className="font-medium text-primary/90 dark:text-white/90 text-sm">R$ {order.total_real?.toFixed(2)}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-primary/70 dark:text-white/70">Local de Retirada:</span>
                    <span className="font-medium text-primary dark:text-white">{order.establishment_name || 'Balcão #' + order.id}</span>
                  </div>
                </div>

                {/* Botão de pagamento */}
                <Button
                  className="w-full mt-6"
                  onClick={() => handlePayment(order)}
                  disabled={processingPayment}
                >
                  {processingPayment ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processando pagamento...
                    </>
                  ) : (
                    <>
                      <CreditCard className="mr-2 h-4 w-4" />
                      Pagar Agora
                    </>
                  )}
                </Button>
              </div>
              
              <div className="mt-8 flex flex-col sm:flex-row gap-4 w-full max-w-md">
                <Button 
                  className="flex-1"
                  variant="outline"
                  onClick={() => navigate(`/clubs/${clubId}`)}
                >
                  <ArrowLeft size={16} className="mr-2" />
                  Voltar o jogo
                </Button>
                
                <Button 
                  className="flex-1"
                  onClick={() => handleViewActiveOrders()}
                >
                  <Clock size={16} className="mr-2" />
                  Ver Meus Pedidos
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal de confirmação para compra de tokens */}
      {showConfirmTokenBuyModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-[#1c0c2e] rounded-lg w-full max-w-md overflow-hidden shadow-xl">
            <div className="p-5">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-primary dark:text-white">
                  Saldo Insuficiente
                </h3>
                <Button variant="ghost" size="icon" onClick={() => handleTokenBuyConfirmation(false)}>
                  <X size={18} />
                </Button>
              </div>
              
              <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg mb-6">
                <div className="flex items-start">
                  <AlertCircle className="text-amber-600 dark:text-amber-400 mt-0.5 mr-2 flex-shrink-0" />
                  <p className="text-amber-700 dark:text-amber-300">
                    Você não tem saldo suficiente para este pedido. Deseja comprar {requiredTokens} tokens adicionais do {club?.name}?
                  </p>
                </div>
              </div>
              
              <div className="flex space-x-3">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => handleTokenBuyConfirmation(false)}
                >
                  Não, cancelar
                </Button>
                <Button 
                  className="flex-1"
                  onClick={() => handleTokenBuyConfirmation(true)}
                >
                  Sim, comprar tokens
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de compra de tokens */}
      {showBuyTokenModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-[#1c0c2e] rounded-lg w-full max-w-md overflow-hidden shadow-xl">
            <div className="p-5">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-primary dark:text-white">
                  {showQRCode ? "Realize o Pagamento" : `${insufficientFunds ? "Saldo Insuficiente" : "Comprar FanTokens"}`}
                </h3>
                <Button variant="ghost" size="icon" onClick={handleCloseTokenModal}>
                  <X size={18} />
                </Button>
              </div>

              {!showQRCode ? (
                <>
                  <div className="flex items-center justify-center mb-6">
                    <div className="w-20 h-20 rounded-full bg-white dark:bg-[#2d1248] overflow-hidden">
                      {club?.image ? (
                        <img 
                          src={club.image} 
                          alt={club.name} 
                          className="w-full h-full object-cover" 
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-primary/5 dark:bg-primary/20 text-primary/50 dark:text-white/50">
                          <Football size={32} />
                        </div>
                      )}
                    </div>
                  </div>

                  {insufficientFunds && (
                    <div className="bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg mb-4">
                      <div className="flex items-start">
                        <AlertCircle size={20} className="text-amber-600 dark:text-amber-400 mt-0.5 mr-2 flex-shrink-0" />
                        <p className="text-amber-700 dark:text-amber-300 text-sm">
                          Você não tem saldo suficiente para este pedido. É necessário comprar pelo menos <strong>{requiredTokens} tokens</strong> adicionais.
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="mb-4 text-center">
                    <p className="text-sm text-primary/70 dark:text-white/70 mb-1">Seu saldo atual</p>
                    <p className="text-xl font-bold text-primary dark:text-white">
                      {userTokens ? userTokens.balance : 0} {userTokens?.tokenSymbol || club?.symbol || "Tokens"}
                    </p>
                  </div>

                  <div className="mb-6">
                    <label className="block text-sm font-medium text-primary/80 dark:text-white/80 mb-2 text-center">
                      Quantidade de FanTokens
                    </label>
                    <div className="flex items-center justify-center">
                      <Button 
                        variant="outline" 
                        onClick={() => tokenQuantity > 1 && setTokenQuantity(tokenQuantity - 1)}
                        className="px-3 mr-2 py-1 hover:bg-secondary hover:text-white transition-colors font-bold"
                        disabled={insufficientFunds && tokenQuantity <= requiredTokens}
                      >
                        -
                      </Button>
                      <input
                        type="number"
                        min={insufficientFunds ? requiredTokens : 1}
                        max="100"
                        value={tokenQuantity}
                        onChange={(e) => {
                          const value = parseInt(e.target.value) || 1;
                          const minValue = insufficientFunds ? requiredTokens : 1;
                          setTokenQuantity(Math.max(minValue, value));
                        }}
                        className="w-16 mx-2 py-2 text-center border border-primary/20 dark:border-white/20 rounded-md bg-white dark:bg-[#150924] text-primary dark:text-white focus:outline-none"
                      />
                      <Button 
                        variant="outline" 
                        onClick={() => setTokenQuantity(tokenQuantity + 1)}
                        className="px-3 py-1 hover:bg-secondary hover:text-white transition-colors ml-2 font-bold"
                      >
                        +
                      </Button>
                    </div>
                  </div>

                  <div className="bg-primary/5 dark:bg-white/5 p-4 rounded-lg mb-6">
                    <div className="flex justify-between mb-2">
                      <span className="text-primary/70 dark:text-white/70">Preço por token:</span>
                      <span className="text-primary dark:text-white font-medium">R$ 1,00</span>
                    </div>
                    <div className="flex justify-between mb-2">
                      <span className="text-primary/70 dark:text-white/70">Quantidade:</span>
                      <span className="text-primary dark:text-white font-medium">{tokenQuantity}</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-primary/10 dark:border-white/10">
                      <span className="text-primary/90 dark:text-white/90 font-medium">Total:</span>
                      <span className="text-primary dark:text-white font-bold">
                        R$ {tokenQuantity.toFixed(2).replace('.', ',')}
                      </span>
                    </div>
                  </div>

                  <Button 
                    className="w-full"
                    onClick={handleBuyTokens}
                  >
                    Comprar FanTokens
                  </Button>
                </>
              ) : (
                <div className="flex flex-col items-center">
                  <p className="text-primary/70 dark:text-white/70 mb-4 text-center">
                    Escaneie o QR Code abaixo para realizar o pagamento via PIX
                  </p>
                  <div className="bg-white p-4 rounded-lg mb-4">
                    <img 
                      src={getRandomQRCode()} 
                      alt="QR Code de pagamento" 
                      className="w-48 h-48 object-contain"
                    />
                  </div>
                  <p className="text-xs text-primary/60 dark:text-white/60 mb-4 text-center">
                    Valor: R$ {tokenQuantity.toFixed(2).replace('.', ',')}
                  </p>
                  <Button 
                    className="w-full"
                    onClick={processTokenPurchase}
                    disabled={processingTokenPayment}
                  >
                    {processingTokenPayment ? (
                      <div className="flex items-center">
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processando...
                      </div>
                    ) : (
                      "Confirmar Pagamento"
                    )}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Fixed Cart Button */}
      {(currentView === 'menu' && cart.length > 0) && (
        <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-[#150924] p-4 shadow-lg border-t border-gray-100 dark:border-gray-800">
          <div className="container mx-auto">
            <Button 
              className="w-full" 
              size="lg"
              onClick={handleViewCart}
            >
              <ShoppingCart size={18} className="mr-2" />
              Ver Carrinho ({cart.reduce((total, item) => total + item.quantity, 0)} itens) - R$ {calculateTotal().toFixed(2)}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
} 