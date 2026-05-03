const ORDER_ITEMS_DATA_URL = "/public/data/order_items.json";

/**
 * Fetch all order items from localStorage (primary source) or JSON file (fallback)
 * @returns {Promise<Array>} Array of order item objects
 */
export const fetchOrderItems = async () => {
  try {
    // Check localStorage first
    const localData = localStorage.getItem("order_items");
    if (localData) {
      return JSON.parse(localData);
    }

    // Fallback to JSON file
    const response = await fetch(ORDER_ITEMS_DATA_URL);
    if (!response.ok)
      throw new Error(`Failed to load order items: ${response.statusText}`);

    const data = await response.json();
    if (!Array.isArray(data)) return [];

    return data;
  } catch (error) {
    console.error(`Error fetching order items: ${error.message}`);
    return [];
  }
};
