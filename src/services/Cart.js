const CARTS_DATA_URL = "/public/data/carts.json";
const CART_ITEMS_DATA_URL = "/public/data/cart_items.json";
const MENU_ITEMS_DATA_URL = "/public/data/menu_items.json";

const AUTH_STORAGE_KEY = "currentUser";

/**
 * Get the currently logged-in user or create a guest user
 * @returns {Object} User object with user_id
 */
const getCurrentUser = () => {
  // Try to get logged-in user
  const storedUser =
    sessionStorage.getItem(AUTH_STORAGE_KEY) ||
    localStorage.getItem(AUTH_STORAGE_KEY);

  if (storedUser) {
    try {
      return JSON.parse(storedUser);
    } catch (error) {
      console.error("Unable to parse stored user:", error);
    }
  }

  // Create guest user for testing (will be replaced with real user on login)
  const guestUser = {
    user_id: 999,
    name: "Guest",
    email: "guest@nomnom.local",
  };
  
  return guestUser;
};

/**
 * Fetch all carts from data (checks localStorage first, then JSON)
 * @returns {Promise<Array>} Array of cart objects
 */
export const fetchCarts = async () => {
  try {
    // Check localStorage first
    const localData = localStorage.getItem("carts");
    if (localData) {
      return JSON.parse(localData);
    }

    // Fallback to JSON file
    const response = await fetch(CARTS_DATA_URL);
    if (!response.ok) {
      throw new Error(`Failed to load carts: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Error fetching carts: ${error.message}`);
    return [];
  }
};

/**
 * Fetch all cart items from data (checks localStorage first, then JSON)
 * @returns {Promise<Array>} Array of cart item objects
 */
export const fetchCartItems = async () => {
  try {
    // Check localStorage first
    const localData = localStorage.getItem("cart_items");
    if (localData) {
      return JSON.parse(localData);
    }

    // Fallback to JSON file
    const response = await fetch(CART_ITEMS_DATA_URL);
    if (!response.ok) {
      throw new Error(`Failed to load cart items: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Error fetching cart items: ${error.message}`);
    return [];
  }
};

/**
 * Fetch all menu items from data
 * @returns {Promise<Array>} Array of menu item objects
 */
export const fetchMenuItems = async () => {
  try {
    const response = await fetch(MENU_ITEMS_DATA_URL);
    if (!response.ok) {
      throw new Error(`Failed to load menu items: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Error fetching menu items: ${error.message}`);
    return [];
  }
};

/**
 * Get or create an active cart for the current user
 * @returns {Promise<Object>} Cart object with cart_id
 */
export const getOrCreateUserCart = async () => {
  const user = getCurrentUser();

  let carts = await fetchCarts();
  
  // Look for existing cart for this user
  let userCart = carts.find((cart) => cart.user_id === user.user_id);

  if (userCart) {
    return userCart;
  }

  // Create new cart if it doesn't exist
  const newCartId = carts.length > 0 ? Math.max(...carts.map((c) => c.cart_id)) + 1 : 1;
  
  const newCart = {
    cart_id: newCartId,
    user_id: user.user_id,
    created_at: new Date().toISOString(),
  };

  // Store in memory (in a real app, this would save to backend)
  carts.push(newCart);
  
  // Save to localStorage as backup
  localStorage.setItem("carts", JSON.stringify(carts));

  return newCart;
};

/**
 * Get all items in the user's cart with product details
 * @returns {Promise<Array>} Array of cart items with merged product info
 */
export const getUserCartItems = async () => {
  const user = getCurrentUser();
  const userCart = await getOrCreateUserCart();
  let allCartItems = await fetchCartItems();
  const menuItems = await fetchMenuItems();

  // Filter items for this user's cart
  const userCartItems = allCartItems.filter(
    (item) => item.cart_id === userCart.cart_id
  );

  // Merge with menu item details
  return userCartItems.map((cartItem) => {
    const menuItem = menuItems.find((item) => item.item_id === cartItem.item_id);
    return {
      ...cartItem,
      ...menuItem,
    };
  });
};

/**
 * Add an item to the user's cart
 * @param {number} itemId - The menu item ID to add
 * @param {number} quantity - Quantity to add (default: 1)
 * @returns {Promise<Object>} Updated cart item object
 */
export const addToCart = async (itemId, quantity = 1) => {
  const user = getCurrentUser();

  if (!itemId || itemId <= 0) {
    throw new Error("Invalid item ID");
  }

  if (quantity <= 0) {
    throw new Error("Quantity must be greater than 0");
  }

  // Get or create user's cart
  const userCart = await getOrCreateUserCart();
  
  // Fetch current cart items
  let allCartItems = await fetchCartItems();
  
  // Check if item already exists in cart
  const existingItem = allCartItems.find(
    (item) =>
      item.cart_id === userCart.cart_id && item.item_id === itemId
  );

  let updatedCartItem;

  if (existingItem) {
    // Item already in cart - update quantity
    existingItem.quantity += quantity;
    updatedCartItem = existingItem;
    console.log(`Updated item ${itemId} quantity to ${existingItem.quantity}`);
  } else {
    // Add new item to cart
    const newCartItemId =
      allCartItems.length > 0
        ? Math.max(...allCartItems.map((item) => item.cart_item_id)) + 1
        : 1;

    const newCartItem = {
      cart_item_id: newCartItemId,
      cart_id: userCart.cart_id,
      item_id: itemId,
      quantity: quantity,
    };

    allCartItems.push(newCartItem);
    updatedCartItem = newCartItem;
    console.log(`Added new item ${itemId} with quantity ${quantity} to cart`);
  }

  // Save updated cart items to localStorage
  localStorage.setItem("cart_items", JSON.stringify(allCartItems));

  return updatedCartItem;
};

/**
 * Update quantity of an item in cart
 * @param {number} cartItemId - The cart item ID
 * @param {number} newQuantity - New quantity value
 * @returns {Promise<Object>} Updated cart item
 */
export const updateCartItemQuantity = async (cartItemId, newQuantity) => {
  const user = getCurrentUser();

  if (newQuantity <= 0) {
    throw new Error("Quantity must be greater than 0");
  }

  let allCartItems = await fetchCartItems();
  
  const cartItem = allCartItems.find((item) => item.cart_item_id === cartItemId);
  
  if (!cartItem) {
    throw new Error(`Cart item ${cartItemId} not found`);
  }

  cartItem.quantity = newQuantity;
  
  // Save to localStorage
  localStorage.setItem("cart_items", JSON.stringify(allCartItems));
  
  console.log(`Updated cart item ${cartItemId} quantity to ${newQuantity}`);
  return cartItem;
};

/**
 * Remove item from cart
 * @param {number} cartItemId - The cart item ID to remove
 * @returns {Promise<boolean>} True if removed successfully
 */
export const removeFromCart = async (cartItemId) => {
  const user = getCurrentUser();
  let allCartItems = await fetchCartItems();
  
  const initialLength = allCartItems.length;
  allCartItems = allCartItems.filter((item) => item.cart_item_id !== cartItemId);

  if (allCartItems.length === initialLength) {
    throw new Error(`Cart item ${cartItemId} not found`);
  }

  // Save to localStorage
  localStorage.setItem("cart_items", JSON.stringify(allCartItems));
  
  console.log(`Removed cart item ${cartItemId}`);
  return true;
};

/**
 * Validate promo code and return discount percentage
 * @param {string} code - Promo code to validate
 * @returns {Object} { valid: boolean, discount: number (0-1), message: string }
 */
export const validatePromoCode = (code) => {
  const validCodes = {
    "NOMNOM": 0.1, // 10% discount
  };

  if (!code || code.trim() === "") {
    return { valid: false, discount: 0, message: "Please enter a promo code" };
  }

  const upperCode = code.trim().toUpperCase();
  
  if (validCodes[upperCode]) {
    return { 
      valid: true, 
      discount: validCodes[upperCode], 
      message: `Promo code applied! ${validCodes[upperCode] * 100}% discount` 
    };
  }

  return { valid: false, discount: 0, message: "Invalid promo code" };
};

/**
 * Get cart total with calculations and optional promo discount
 * @param {number} promoDiscount - Discount percentage (0-1), optional
 * @returns {Promise<Object>} Object with subtotal, discount, tax, delivery, and total
 */
export const calculateCartTotal = async (promoDiscount = 0) => {
  const cartItems = await getUserCartItems();
  
  let subtotal = 0;
  cartItems.forEach((item) => {
    const itemPrice = item.price * item.quantity;
    const itemDiscount = item.discount || 0;
    const discountedPrice = itemPrice * (1 - itemDiscount);
    subtotal += discountedPrice;
  });

  const discountAmount = subtotal * promoDiscount; // Promo discount on subtotal
  const subtotalAfterPromo = subtotal - discountAmount;
  const tax = subtotalAfterPromo * 0.1; // 10% tax
  const delivery = subtotalAfterPromo > 0 ? 3.0 : 0; // $3 delivery if cart not empty
  const total = subtotalAfterPromo + tax + delivery;

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    discount: Math.round(discountAmount * 100) / 100,
    subtotalAfterDiscount: Math.round(subtotalAfterPromo * 100) / 100,
    tax: Math.round(tax * 100) / 100,
    delivery,
    total: Math.round(total * 100) / 100,
    itemCount: cartItems.length,
  };
};

/**
 * Clear user's cart (remove all items)
 * @returns {Promise<boolean>} True if cleared successfully
 */
export const clearUserCart = async () => {
  const user = getCurrentUser();
  const userCart = await getOrCreateUserCart();
  let allCartItems = await fetchCartItems();

  allCartItems = allCartItems.filter(
    (item) => item.cart_id !== userCart.cart_id
  );

  localStorage.setItem("cart_items", JSON.stringify(allCartItems));
  
  console.log(`Cleared cart for user ${user.user_id}`);
  return true;
};

/**
 * Get cart item count for user
 * @returns {Promise<number>} Total number of items in cart
 */
export const getCartItemCount = async () => {
  try {
    const cartItems = await getUserCartItems();
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  } catch (error) {
    console.error("Error getting cart item count:", error);
    return 0;
  }
};

/**
 * Checkout - create order from current cart
 * @param {number} promoDiscount - Promo discount percentage (0-1)
 * @returns {Promise<Object>} Order object with order_id
 */
export const checkoutCart = async (promoDiscount = 0) => {
  const user = getCurrentUser();
  const userCart = await getOrCreateUserCart();
  const cartItems = await getUserCartItems();
  const totals = await calculateCartTotal(promoDiscount);

  if (cartItems.length === 0) {
    throw new Error("Cannot checkout with empty cart");
  }

  // Fetch existing orders from localStorage (primary source)
  let orders = [];
  const storedOrders = localStorage.getItem("orders");
  if (storedOrders) {
    try {
      orders = JSON.parse(storedOrders);
    } catch (error) {
      console.warn("Could not parse stored orders:", error);
    }
  }

  // Create order
  const newOrderId = orders.length > 0 ? Math.max(...orders.map((o) => o.order_id)) + 1 : 1;
  
  const newOrder = {
    order_id: newOrderId,
    user_id: user.user_id,
    total_price: totals.total,
    status: "pending",
    address: "Delivery Address TBD", // Will be set by user later
    promo_discount: promoDiscount,
    created_at: new Date().toISOString(),
  };

  // Store order in localStorage
  orders.push(newOrder);
  localStorage.setItem("orders", JSON.stringify(orders));

  // Create order items (link cart items to order)
  let orderItems = [];
  const storedOrderItems = localStorage.getItem("order_items");
  if (storedOrderItems) {
    try {
      orderItems = JSON.parse(storedOrderItems);
    } catch (error) {
      console.warn("Could not parse stored order items:", error);
    }
  }

  cartItems.forEach((item) => {
    const newOrderItemId = 
      orderItems.length > 0 
        ? Math.max(...orderItems.map((oi) => oi.order_item_id)) + 1 
        : 1;

    orderItems.push({
      order_item_id: newOrderItemId,
      order_id: newOrderId,
      item_id: item.item_id,
      quantity: item.quantity,
      price: item.price,
    });
  });

  localStorage.setItem("order_items", JSON.stringify(orderItems));

  console.log(`Order ${newOrderId} created with total: $${totals.total}`);
  
  // Clear the cart after checkout
  await clearUserCart();

  return newOrder;
};
