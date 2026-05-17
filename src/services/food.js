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

export const averageRating = async () => {
    try {
        const items = await fetchMenuItems();
        const itemRatings = items.filter(item => item.rating !== undefined).map(item => item.rating);
        if (itemRatings.length === 0) return "No ratings";
        const average = itemRatings.reduce((sum, rating) => sum + rating, 0) / itemRatings.length;
        return average.toFixed(1);
    } catch (error) {        
        console.error("Error calculating average rating:", error);
        return "N/A";
    }
}

export const isAvailableCount = () => {
    const items = fetchMenuItems();
    return items.filter(item => item.is_available).length;
}