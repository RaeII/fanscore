// Mock data for stadium orders
export const establishments = [
  {
    id: '1',
    name: 'Burger Grill',
    foodType: 'Burgers & Sandwiches',
    image: 'https://placehold.co/400x400/orange/white?text=Burger+Grill',
    description: 'Premium burgers made with high-quality ingredients'
  },
  {
    id: '2',
    name: 'Pizza Corner',
    foodType: 'Pizza & Pasta',
    image: 'https://placehold.co/400x400/red/white?text=Pizza+Corner',
    description: 'Handcrafted pizzas with traditional toppings'
  },
  {
    id: '3',
    name: 'Healthy Bites',
    foodType: 'Salads & Bowls',
    image: 'https://placehold.co/400x400/green/white?text=Healthy+Bites',
    description: 'Fresh salads and healthy options for the health-conscious fan'
  },
  {
    id: '4',
    name: 'Stadium Drinks',
    foodType: 'Beverages & Snacks',
    image: 'https://placehold.co/400x400/blue/white?text=Stadium+Drinks',
    description: 'Refreshing drinks and quick snacks'
  }
];

export const menuItems = {
  '1': [ // Burger Grill
    {
      id: '101',
      name: 'Classic Cheeseburger',
      description: 'Beef patty with melted cheese, lettuce, tomato, and special sauce',
      price: 12.99,
      image: 'https://placehold.co/400x300/orange/white?text=Cheeseburger'
    },
    {
      id: '102',
      name: 'Double Bacon Burger',
      description: 'Two beef patties with crispy bacon, cheddar cheese, and BBQ sauce',
      price: 15.99,
      image: 'https://placehold.co/400x300/orange/white?text=Bacon+Burger'
    },
    {
      id: '103',
      name: 'Chicken Sandwich',
      description: 'Grilled chicken breast with avocado, lettuce, and honey mustard',
      price: 13.99,
      image: 'https://placehold.co/400x300/orange/white?text=Chicken+Sandwich'
    },
    {
      id: '104',
      name: 'French Fries',
      description: 'Crispy golden fries with sea salt',
      price: 5.99,
      image: 'https://placehold.co/400x300/orange/white?text=French+Fries'
    },
    {
      id: '105',
      name: 'Onion Rings',
      description: 'Crispy battered onion rings with dipping sauce',
      price: 6.99,
      image: 'https://placehold.co/400x300/orange/white?text=Onion+Rings'
    }
  ],
  '2': [ // Pizza Corner
    {
      id: '201',
      name: 'Margherita Pizza',
      description: 'Classic pizza with tomato sauce, mozzarella, and fresh basil',
      price: 14.99,
      image: 'https://placehold.co/400x300/red/white?text=Margherita'
    },
    {
      id: '202',
      name: 'Pepperoni Pizza',
      description: 'Pizza with tomato sauce, mozzarella, and pepperoni slices',
      price: 16.99,
      image: 'https://placehold.co/400x300/red/white?text=Pepperoni'
    },
    {
      id: '203',
      name: 'Vegetarian Pizza',
      description: 'Pizza with bell peppers, mushrooms, olives, and onions',
      price: 15.99,
      image: 'https://placehold.co/400x300/red/white?text=Vegetarian'
    },
    {
      id: '204',
      name: 'Garlic Breadsticks',
      description: 'Freshly baked breadsticks with garlic butter and herbs',
      price: 7.99,
      image: 'https://placehold.co/400x300/red/white?text=Breadsticks'
    }
  ],
  '3': [ // Healthy Bites
    {
      id: '301',
      name: 'Caesar Salad',
      description: 'Romaine lettuce with Caesar dressing, croutons, and parmesan',
      price: 11.99,
      image: 'https://placehold.co/400x300/green/white?text=Caesar+Salad'
    },
    {
      id: '302',
      name: 'Greek Salad',
      description: 'Mixed greens with feta cheese, olives, cucumbers, and tomatoes',
      price: 12.99,
      image: 'https://placehold.co/400x300/green/white?text=Greek+Salad'
    },
    {
      id: '303',
      name: 'Protein Bowl',
      description: 'Quinoa, grilled chicken, avocado, and mixed vegetables',
      price: 14.99,
      image: 'https://placehold.co/400x300/green/white?text=Protein+Bowl'
    },
    {
      id: '304',
      name: 'Fruit Cup',
      description: 'Fresh seasonal fruits',
      price: 6.99,
      image: 'https://placehold.co/400x300/green/white?text=Fruit+Cup'
    }
  ],
  '4': [ // Stadium Drinks
    {
      id: '401',
      name: 'Soft Drink',
      description: 'Cola, lemon-lime, or orange soda',
      price: 4.99,
      image: 'https://placehold.co/400x300/blue/white?text=Soft+Drink'
    },
    {
      id: '402',
      name: 'Bottled Water',
      description: 'Still or sparkling water (500ml)',
      price: 3.99,
      image: 'https://placehold.co/400x300/blue/white?text=Water'
    },
    {
      id: '403',
      name: 'Beer',
      description: 'Local draft beer (must be 21+ to purchase)',
      price: 8.99,
      image: 'https://placehold.co/400x300/blue/white?text=Beer'
    },
    {
      id: '404',
      name: 'Popcorn',
      description: 'Freshly popped popcorn with butter and salt',
      price: 5.99,
      image: 'https://placehold.co/400x300/blue/white?text=Popcorn'
    },
    {
      id: '405',
      name: 'Nachos',
      description: 'Tortilla chips with cheese sauce',
      price: 7.99,
      image: 'https://placehold.co/400x300/blue/white?text=Nachos'
    }
  ]
};

// Mock quest data
export const quests = {
  // Quests by club ID
  '1': [ // FC Barcelona
    {
      id: 'q1001',
      name: 'First Time Fan',
      description: 'Check-in at Camp Nou for the first time',
      points: 100,
      type: 'CHECK_IN',
      status: 'AVAILABLE',
      image: 'https://placehold.co/400x300/purple/white?text=Stadium+Check-in',
      requirements: 'Attend a match at Camp Nou',
      reward: {
        type: 'POINTS',
        value: 100,
        description: '100 fan points'
      },
      expiresAt: null
    },
    {
      id: 'q1002',
      name: 'Merchandise Supporter',
      description: 'Purchase official team merchandise at the stadium store',
      points: 150,
      type: 'PURCHASE',
      status: 'AVAILABLE',
      image: 'https://placehold.co/400x300/blue/white?text=Merchandise',
      requirements: 'Make a purchase of €30 or more at the official store',
      reward: {
        type: 'POINTS',
        value: 150,
        description: '150 fan points'
      },
      expiresAt: null
    },
    {
      id: 'q1003',
      name: 'Social Media Ambassador',
      description: 'Share your game day experience on social media with official hashtag',
      points: 75,
      type: 'SOCIAL',
      status: 'AVAILABLE',
      image: 'https://placehold.co/400x300/cyan/white?text=Social+Media',
      requirements: 'Post on social media with #FCBFan hashtag',
      reward: {
        type: 'POINTS',
        value: 75,
        description: '75 fan points'
      },
      expiresAt: null
    },
    {
      id: 'q1004',
      name: 'Refreshment Break',
      description: 'Order food or drinks through the fan app',
      points: 50,
      type: 'ORDER',
      status: 'AVAILABLE',
      image: 'https://placehold.co/400x300/orange/white?text=Food+Order',
      requirements: 'Complete a stadium food order',
      reward: {
        type: 'POINTS',
        value: 50,
        description: '50 fan points'
      },
      expiresAt: null
    },
    {
      id: 'q1005',
      name: 'Attendance Streak',
      description: 'Attend 3 consecutive home matches',
      points: 250,
      type: 'ATTENDANCE',
      status: 'IN_PROGRESS',
      progress: {
        current: 1,
        total: 3
      },
      image: 'https://placehold.co/400x300/gold/white?text=Attendance+Streak',
      requirements: 'Check in at 3 consecutive home matches',
      reward: {
        type: 'POINTS',
        value: 250,
        description: '250 fan points'
      },
      expiresAt: '2023-12-31T23:59:59Z'
    }
  ],
  '2': [ // Real Madrid
    {
      id: 'q2001',
      name: 'Santiago Bernabéu Welcome',
      description: 'Check-in at Santiago Bernabéu for the first time',
      points: 100,
      type: 'CHECK_IN',
      status: 'AVAILABLE',
      image: 'https://placehold.co/400x300/white/black?text=Bernabeu+Check-in',
      requirements: 'Attend a match at Santiago Bernabéu',
      reward: {
        type: 'POINTS',
        value: 100,
        description: '100 fan points'
      },
      expiresAt: null
    },
    {
      id: 'q2002',
      name: 'Halftime Refreshment',
      description: 'Order a drink during halftime',
      points: 75,
      type: 'ORDER',
      status: 'AVAILABLE',
      image: 'https://placehold.co/400x300/blue/white?text=Halftime+Order',
      requirements: 'Place an order during the halftime break',
      reward: {
        type: 'POINTS',
        value: 75,
        description: '75 fan points'
      },
      expiresAt: null
    },
    {
      id: 'q2003',
      name: 'Madridista Loyalty',
      description: 'Attend 5 home matches in a season',
      points: 300,
      type: 'ATTENDANCE',
      status: 'IN_PROGRESS',
      progress: {
        current: 2,
        total: 5
      },
      image: 'https://placehold.co/400x300/gold/white?text=Season+Loyalty',
      requirements: 'Check in at 5 home matches this season',
      reward: {
        type: 'POINTS',
        value: 300,
        description: '300 fan points'
      },
      expiresAt: '2023-05-31T23:59:59Z'
    }
  ],
  '3': [ // Manchester United
    {
      id: 'q3001',
      name: 'Old Trafford Welcome',
      description: 'Check-in at Old Trafford for the first time',
      points: 100,
      type: 'CHECK_IN',
      status: 'COMPLETED',
      completedAt: '2023-09-23T15:30:00Z',
      image: 'https://placehold.co/400x300/red/white?text=OT+Check-in',
      requirements: 'Attend a match at Old Trafford',
      reward: {
        type: 'POINTS',
        value: 100,
        description: '100 fan points'
      },
      expiresAt: null
    },
    {
      id: 'q3002',
      name: 'Red Devils Supporter',
      description: 'Purchase a jersey at the stadium store',
      points: 200,
      type: 'PURCHASE',
      status: 'AVAILABLE',
      image: 'https://placehold.co/400x300/red/white?text=Jersey+Purchase',
      requirements: 'Buy an official team jersey',
      reward: {
        type: 'POINTS',
        value: 200,
        description: '200 fan points'
      },
      expiresAt: null
    },
    {
      id: 'q3003',
      name: 'Matchday Meal Deal',
      description: 'Order a meal combo during a match',
      points: 75,
      type: 'ORDER',
      status: 'AVAILABLE',
      image: 'https://placehold.co/400x300/red/white?text=Meal+Deal',
      requirements: 'Order a meal combo from any stadium vendor',
      reward: {
        type: 'POINTS',
        value: 75,
        description: '75 fan points'
      },
      expiresAt: null
    }
  ],
  '4': [ // Vasco
    {
      id: 'q4001',
      name: 'São Januário Welcome',
      description: 'Check-in at São Januário for the first time',
      points: 100,
      type: 'CHECK_IN',
      status: 'AVAILABLE',
      image: 'https://placehold.co/400x300/red/white?text=Meal+Deal',
      requirements: 'Attend a match at São Januário',
      reward: {
        type: 'POINTS',
        value: 100,
        description: '100 fan points'
      },
      expiresAt: null
    },
    {
      id: 'q4002',
      name: 'Vasco Fan Photos',
      description: 'Upload photos from your matchday experience',
      points: 50,
      type: 'SOCIAL',
      status: 'AVAILABLE',
      image: 'https://placehold.co/400x300/black/white?text=Fan+Photos',
      requirements: 'Upload at least 3 photos from the match',
      reward: {
        type: 'POINTS',
        value: 50,
        description: '50 fan points'
      },
      expiresAt: null
    }
  ]
};

// Helper functions to work with quests
export const getAvailableQuestsForClub = (clubId) => {
  return quests[clubId] || [];
};

export const completeQuest = (clubId, questId) => {
  const clubQuests = quests[clubId];
  if (!clubQuests) return null;
  
  const questIndex = clubQuests.findIndex(q => q.id === questId);
  if (questIndex === -1) return null;
  
  const quest = {...clubQuests[questIndex]};
  
  // Only allow completion of available quests
  if (quest.status !== 'AVAILABLE' && quest.status !== 'IN_PROGRESS') return null;
  
  // For progress-based quests
  if (quest.progress) {
    quest.progress.current += 1;
    
    // If we've reached the goal, mark as completed
    if (quest.progress.current >= quest.progress.total) {
      quest.status = 'COMPLETED';
      quest.completedAt = new Date().toISOString();
    }
  } else {
    // For single-action quests
    quest.status = 'COMPLETED';
    quest.completedAt = new Date().toISOString();
  }
  
  // In a real app, this would call an API to update the database
  return quest;
};

// Mock order data
export const orderHistory = [
  {
    id: '1001',
    orderNumber: '10256',
    establishmentName: 'Burger Grill',
    status: 'COMPLETED',
    createdAt: '2023-09-15T15:30:00Z',
    updatedAt: '2023-09-15T15:45:00Z',
    readyAt: '2023-09-15T15:50:00Z',
    gameId: '123',
    clubId: '1',
    items: [
      {
        id: '101',
        name: 'Classic Cheeseburger',
        quantity: 2,
        price: 12.99
      },
      {
        id: '104',
        name: 'French Fries',
        quantity: 1,
        price: 5.99
      }
    ],
    subtotal: 31.97,
    tax: 2.88,
    totalAmount: 34.85,
    pickupLocation: 'Counter 4'
  },
  {
    id: '1002',
    orderNumber: '10342',
    establishmentName: 'Pizza Corner',
    status: 'COMPLETED',
    createdAt: '2023-10-02T19:15:00Z',
    updatedAt: '2023-10-02T19:30:00Z',
    readyAt: '2023-10-02T19:40:00Z',
    gameId: '124',
    clubId: '3',
    items: [
      {
        id: '201',
        name: 'Margherita Pizza',
        quantity: 1,
        price: 14.99
      },
      {
        id: '204',
        name: 'Garlic Breadsticks',
        quantity: 1,
        price: 7.99
      }
    ],
    subtotal: 22.98,
    tax: 2.07,
    totalAmount: 25.05,
    pickupLocation: 'Counter 2'
  },
  {
    id: '1003',
    orderNumber: '10458',
    establishmentName: 'Stadium Drinks',
    status: 'PROCESSING',
    createdAt: '2023-10-28T14:20:00Z',
    updatedAt: '2023-10-28T14:20:00Z',
    gameId: '125',
    clubId: '2',
    items: [
      {
        id: '401',
        name: 'Soft Drink',
        quantity: 2,
        price: 4.99
      },
      {
        id: '404',
        name: 'Popcorn',
        quantity: 1,
        price: 5.99
      }
    ],
    subtotal: 15.97,
    tax: 1.44,
    totalAmount: 17.41,
    pickupLocation: 'Counter 5'
  }
];

// Generate a random order number
export const generateOrderNumber = () => {
  return Math.floor(10000 + Math.random() * 90000).toString();
};

// Create a new order with all required details
export const createNewOrder = (orderData) => {
  const now = new Date().toISOString();
  const id = `order-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  
  // Calculate tax and subtotal if not provided
  const subtotal = orderData.totalAmount || 
    orderData.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const tax = orderData.tax || (subtotal * 0.09);
  
  // Create the order
  return {
    id,
    orderNumber: orderData.orderNumber || generateOrderNumber(),
    establishmentId: orderData.establishmentId,
    establishmentName: orderData.establishmentName,
    status: orderData.status || 'PROCESSING',
    createdAt: now,
    updatedAt: now,
    gameId: orderData.gameId,
    clubId: orderData.clubId,
    items: orderData.items || [],
    subtotal: parseFloat(subtotal.toFixed(2)),
    tax: parseFloat(tax.toFixed(2)),
    totalAmount: parseFloat((subtotal + tax).toFixed(2)),
    pickupLocation: orderData.pickupLocation || 'Main Counter'
  };
}; 