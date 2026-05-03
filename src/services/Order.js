const ORDERS_DATA_URL = "/public/data/orders.json";
const MENU_ITEMS_DATA_URL = "/public/data/menu_items.json";

/**
 * Fetch all menu items
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
 * Fetch all orders from localStorage (primary source) or JSON file (fallback)
 * @returns {Promise<Array>} Array of order objects
 */
export const fetchOrders = async () => {
  try {
    // Check localStorage first
    const localData = localStorage.getItem("orders");
    if (localData) {
      return JSON.parse(localData);
    }

    // Fallback to JSON file
    const response = await fetch(ORDERS_DATA_URL);
    if (!response.ok)
      throw new Error(`Failed to load orders: ${response.statusText}`);

    const data = await response.json();
    if (!Array.isArray(data)) return [];

    return data;
  } catch (error) {
    console.error(`Error fetching orders: ${error.message}`);
    return [];
  }
};
