import { establishments, menuItems, orderHistory, createNewOrder } from '../data/mock-data';

// Local mock data storage (will be reset on page refresh)
let localOrderHistory = [...orderHistory];

// Get all establishments for a stadium
const getEstablishments = async (clubId, gameId) => {
  // In a real app, this would be:
  // const response = await api.get(`/club/${clubId}/game/${gameId}/establishments`);
  // return response.data?.content || [];
  
  // For now, use mock data, but log the parameters so they're used
  console.log(`Fetching establishments for club ${clubId} and game ${gameId}`);
  
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(establishments);
    }, 500);
  });
};

// Get menu items for an establishment
const getMenuItems = async (establishmentId) => {
  // In a real app, this would be:
  // const response = await api.get(`/establishment/${establishmentId}/menu`);
  // return response.data?.content || [];
  
  // For now, use mock data
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(menuItems[establishmentId] || []);
    }, 500);
  });
};

// Place an order
const placeOrder = async (orderData) => {
  // In a real app, this would be:
  // const response = await api.post(`/orders`, orderData);
  // return response.data?.content || null;
  
  console.log('Placing order with data:', orderData);
  
  // For now, create a mock order and add it to local history
  return new Promise((resolve) => {
    setTimeout(() => {
      // Find establishment name for the order
      const establishment = establishments.find(e => e.id === orderData.establishmentId);
      
      // Create new order with establishment name
      const newOrderData = {
        ...orderData,
        establishmentName: establishment ? establishment.name : 'Stadium Vendor',
        status: 'PROCESSING', // Initial status
        orderNumber: `ORD-${Math.floor(Math.random() * 10000)}`,
        pickupLocation: establishment ? `${establishment.name} Counter` : 'Main Counter',
        estimatedTime: '10-15 minutes',
        orderDate: new Date().toISOString(),
        items: orderData.items.map(item => {
          // Find the item details from our menu items
          const establishmentMenu = menuItems[orderData.establishmentId] || [];
          const menuItem = establishmentMenu.find(mi => mi.id === item.itemId);
          
          return {
            itemId: item.itemId,
            name: menuItem ? menuItem.name : `Item ${item.itemId}`,
            quantity: item.quantity,
            price: item.price
          };
        })
      };
      
      const newOrder = createNewOrder(newOrderData);
      console.log('Created new order:', newOrder);
      
      // Add to beginning of array
      localOrderHistory.unshift(newOrder);
      console.log('Updated order history:', localOrderHistory);
      
      resolve(newOrder);
    }, 1000);
  });
};

// Get active orders for a game
const getActiveOrders = async (gameId) => {
  // In a real app, this would be:
  // const response = await api.get(`/games/${gameId}/orders/active`);
  // return response.data?.content || [];
  
  console.log(`Fetching active orders for game ${gameId}`);
  
  return new Promise((resolve) => {
    setTimeout(() => {
      // Filter orders by gameId and active status (anything not COMPLETED or CANCELLED)
      const activeOrders = localOrderHistory.filter(order => 
        order.gameId === gameId && 
        !['COMPLETED', 'CANCELLED'].includes(order.status)
      );
      
      console.log('Active orders found:', activeOrders);
      resolve(activeOrders);
    }, 500);
  });
};

// Get user orders history
const getUserOrders = async () => {
  // In a real app, this would be:
  // const response = await api.get(`/orders/history`);
  // return response.data?.content || [];
  
  // For now, use local mock data
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(localOrderHistory);
    }, 500);
  });
};

// Get order details
const getOrderDetails = async (orderId) => {
  // In a real app, this would be:
  // const response = await api.get(`/orders/${orderId}`);
  // return response.data?.content || null;
  
  // For now, find the order in our mock data
  return new Promise((resolve) => {
    setTimeout(() => {
      const order = localOrderHistory.find(o => o.id === orderId);
      resolve(order || null);
    }, 500);
  });
};

export default {
  getEstablishments,
  getMenuItems,
  placeOrder,
  getUserOrders,
  getOrderDetails,
  getActiveOrders
}; 