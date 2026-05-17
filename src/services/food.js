export const fetchMenuItems = async () => {
  const response = await fetch("./public/data/menu_items.json");
  if (!response.ok) {
    throw new Error(`Failed to load menu items: ${response.statusText}`);
  }
  return await response.json();
};