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
  Clock
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { showError, showSuccess } from '../lib/toast';
import orderApi from '../api/order';
import clubApi from '../api/club';
import matchApi from '../api/match';
import establishmentApi from '../api/establishment';
import { useLocation } from 'react-router-dom';
import establishmentProductApi from '../api/establishment_product';

export default function StadiumOrdersPage() {
  const navigate = useNavigate();
  const { clubId, gameId } = useParams();
  const { isAuthenticated, getUserData } = useWalletContext();
  const { state } = useLocation();
  // UI States
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState('establishments'); // 'establishments', 'menu', 'cart', 'confirmation', 'activeOrders'
  const [placingOrder, setPlacingOrder] = useState(false);
  
  // Data States
  const [establishments, setEstablishments] = useState([]);
  const [selectedEstablishment, setSelectedEstablishment] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [cart, setCart] = useState([]);
  const [club, setClub] = useState(state?.club);
  const [order, setOrder] = useState(null);
  const [gameInfo, setGameInfo] = useState(null);
  const [activeOrders, setActiveOrders] = useState([]);
  
  // Check if user is authenticated and load data
  useEffect(() => {
    const checkAuthAndLoadData = async () => {
      try {
        if (!isAuthenticated) {
          console.log('StadiumOrders: User not authenticated, redirecting to /app');
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
      console.log('menu items', data);
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
    console.log('establishment', establishment);
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
      navigate(`/clubs/${clubId}`);
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
        total_fantoken: cart.reduce((total, item) => total + (item.value_tokenfan * item.quantity), 0)
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

  // Get order status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'READY':
        return 'text-green-600 dark:text-green-400';
      case 'PROCESSING':
        return 'text-amber-600 dark:text-amber-400';
      case 'PENDING':
        return 'text-blue-600 dark:text-blue-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className="flex flex-col items-center">
          <Loader2 className="h-12 w-12 animate-spin text-secondary" />
          <p className="mt-4 text-primary/70 dark:text-white/70">Loading...</p>
        </div>
      </div>
    );
  }
  console.log('activeOrders', activeOrders);
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
            <span>Back</span>
          </button>
          
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold">
              {currentView === 'establishments' && 'Stadium Food & Drinks'}
              {currentView === 'menu' && selectedEstablishment?.name}
              {currentView === 'cart' && 'Your Order'}
              {currentView === 'confirmation' && 'Order Confirmed'}
              {currentView === 'activeOrders' && 'My Active Orders'}
            </h1>
            
            {/* Header actions */}
            <div className="flex items-center gap-2">
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
                    <h3 className="font-medium text-primary dark:text-white">You have {activeOrders.length} active order{activeOrders.length > 1 ? 's' : ''}</h3>
                    <p className="text-sm text-primary/70 dark:text-white/70">Tap to track your orders</p>
                  </div>
                </div>
                <ChevronRight size={20} className="text-primary/50 dark:text-white/50" />
              </div>
            )}
            
            {/* Game Information Card */}
            {gameInfo && (
              <div className="bg-white dark:bg-[#150924] rounded-lg p-4 mb-4 shadow-sm">
                <h2 className="text-lg font-bold text-primary dark:text-white">Game Information</h2>
                <div className="flex items-center mt-2">
                  <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse mr-2"></div>
                  <span className="text-sm font-medium text-primary dark:text-white">
                    {gameInfo.home_club_name} vs {gameInfo.away_club_name}
                  </span>
                </div>
                <p className="text-sm text-primary/70 dark:text-white/70 mt-1">
                  Stadium: {gameInfo.stadium_name}
                </p>
                <p className="text-sm text-primary/70 dark:text-white/70 mt-1">
                  Current Score: 0 - 0
                </p>
                <p className="text-xs text-primary/60 dark:text-white/60 mt-1">
                  {gameInfo.is_home_team ? "Your team is playing at home" : "Your team is the away team"}
                </p>
              </div>
            )}
            
            <h2 className="text-lg font-medium text-primary dark:text-white mb-4">
              Select an establishment
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
                          <Store size={24} className="text-secondary" />
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
                <p className="text-primary/70 dark:text-white/70">No establishments available</p>
              </div>
            )}
          </div>
        )}

        {/* Menu Items View */}
        {currentView === 'menu' && (
          <div className="space-y-4">
            <h2 className="text-lg font-medium text-primary dark:text-white mb-4">
              Menu Items
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
                          <p className="text-secondary font-medium mt-2">R$ {item.value_real.toFixed(2)}</p>
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
                          Add
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="bg-white dark:bg-[#150924] rounded-lg p-6 text-center shadow-sm">
                <p className="text-primary/70 dark:text-white/70">No menu items available</p>
              </div>
            )}
          </div>
        )}

        {/* Cart View */}
        {currentView === 'cart' && (
          <div className="space-y-4">
            <h2 className="text-lg font-medium text-primary dark:text-white mb-4">
              Your Order
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
                            <p className="text-sm text-secondary">R$ {item.value_real.toFixed(2)}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center">
                          <span className="font-medium text-primary dark:text-white mr-4">
                            R$ {(item.value_real * item.quantity).toFixed(2)}
                          </span>
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
                    <div className="flex justify-between items-center font-bold">
                      <span className="text-primary dark:text-white">Total</span>
                      <span className="text-primary dark:text-white">R$ {calculateTotal().toFixed(2)}</span>
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
              My Active Orders
            </h2>
            
            {activeOrders.length > 0 ? (
              activeOrders.map((order) => (
                <div 
                  key={order.id}
                  className="bg-white dark:bg-[#150924] rounded-lg p-4 shadow-sm"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-medium text-primary dark:text-white">Order #{order.orderNumber}</h3>
                      <p className="text-sm text-primary/70 dark:text-white/70">{order.establishmentName}</p>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)} bg-opacity-10`}>
                      {order.status}
                    </div>
                  </div>
                  
                  <div className="divide-y divide-gray-100 dark:divide-gray-800">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="py-2 flex justify-between">
                        <span className="text-primary/80 dark:text-white/80">
                          {item.quantity}x {item.name}
                        </span>
                        <span className="text-primary/80 dark:text-white/80">
                          R$ {(item.value_real * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-primary/70 dark:text-white/70 text-sm">Total</p>
                        <p className="font-bold text-primary dark:text-white">R$ {order.totalAmount.toFixed(2)}</p>
                      </div>
                      
                      <div className="text-right">
                        <p className="text-primary/70 dark:text-white/70 text-sm">Pickup Location</p>
                        <p className="font-medium text-primary dark:text-white">{order.pickupLocation || 'Counter #' + order.id}</p>
                      </div>
                    </div>
                    
                    {/* Estimated time or other info */}
                    {order.status === 'PROCESSING' && (
                      <div className="mt-3 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-md text-sm">
                        <p className="text-blue-700 dark:text-blue-300">
                          Estimated ready in {order.estimatedTime || '10-15 minutes'}
                        </p>
                      </div>
                    )}
                    
                    {/* Ready for pickup message */}
                    {order.status === 'READY' && (
                      <div className="mt-3 bg-green-50 dark:bg-green-900/20 p-3 rounded-md text-sm">
                        <p className="text-green-700 dark:text-green-300 font-medium">
                          Your order is ready for pickup!
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-white dark:bg-[#150924] rounded-lg p-6 text-center shadow-sm">
                <p className="text-primary/70 dark:text-white/70">You don't have any active orders</p>
                <Button 
                  variant="secondary" 
                  className="mt-4" 
                  onClick={() => setCurrentView('establishments')}
                >
                  Place an order
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
                Order Confirmed!
              </h2>
              
              <p className="text-primary/70 dark:text-white/70 text-center mb-4">
                Your order #{order.orderNumber} has been placed successfully and will be ready for pickup shortly.
              </p>
              
              <div className="bg-white dark:bg-[#150924] rounded-lg p-4 shadow-sm w-full max-w-md">
                <h3 className="font-medium text-primary dark:text-white mb-3">
                  Order Details
                </h3>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-primary/70 dark:text-white/70">Order Number:</span>
                    <span className="font-medium text-primary dark:text-white">{order.orderNumber}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-primary/70 dark:text-white/70">Establishment:</span>
                    <span className="font-medium text-primary dark:text-white">{selectedEstablishment?.name}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-primary/70 dark:text-white/70">Status:</span>
                    <span className="font-medium text-green-600 dark:text-green-400">Processing</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-primary/70 dark:text-white/70">Total Amount:</span>
                    <span className="font-medium text-primary dark:text-white">R$ {order.totalAmount?.toFixed(2)}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-primary/70 dark:text-white/70">Pickup Location:</span>
                    <span className="font-medium text-primary dark:text-white">{order.pickupLocation || 'Counter #' + order.id}</span>
                  </div>
                </div>
              </div>
              
              <div className="mt-8 flex flex-col sm:flex-row gap-4 w-full max-w-md">
                <Button 
                  className="flex-1"
                  onClick={() => navigate(`/clubs/${clubId}`)}
                >
                  Go to {club.name} Home
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

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
              View Cart ({cart.reduce((total, item) => total + item.quantity, 0)} items) - R$ {calculateTotal().toFixed(2)}
            </Button>
          </div>
        </div>
      )}

      {/* Fixed Active Orders Button (when not in active orders view) */}
      {(activeOrders.length > 0 && currentView !== 'activeOrders' && currentView !== 'menu' && currentView !== 'cart') && (
        <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-[#150924] p-4 shadow-lg border-t border-gray-100 dark:border-gray-800">
          <div className="container mx-auto">
            <Button 
              className="w-full" 
              size="lg"
              variant="secondary"
              onClick={handleViewActiveOrders}
            >
              <Clock size={18} className="mr-2" />
              View My Orders ({activeOrders.length})
            </Button>
          </div>
        </div>
      )}
    </div>
  );
} 