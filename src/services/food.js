export const fetchMenuItems = async () => {
  const response = await fetch("./public/data/menu_items.json");
  if (!response.ok) {
    throw new Error(`Failed to load menu items: ${response.statusText}`);
  }
  return await response.json();
};


export const countFood = async () => {
  try {
    const items = await fetchMenuItems();
    return items.length;
  } catch (error) {
    console.error("Error counting food items:", error);
    return 0;
  }
}