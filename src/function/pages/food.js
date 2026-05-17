import { fetchCategories } from "../../services/Category.js";
// Helper to get filter values from the filter menu
function getFilterValues(root = document) {
  const category = root.querySelector("#category")?.value || "all";
  const maxPrice = Number(root.querySelector("#priceRange")?.value || 100);
  const isAvailable = root.querySelector("#isAvailable")?.checked || false;
  const isDiscount = root.querySelector("#isDiscount")?.checked || false;
  const minRating = Number(root.querySelector("#rating")?.value || 0);
  return { category, maxPrice, isAvailable, isDiscount, minRating };
}

// Enhanced filter logic
function filterMenuItem(item, filters) {
  // Category (by id)
  if (filters.category !== "all") {
    if (String(item.category_id) !== filters.category) {
      return false;
    }
  }
  // Price
  if (item.price > filters.maxPrice) return false;
  // Availability
  if (filters.isAvailable && !item.is_available) return false;
  // Discount
  if (filters.isDiscount && !(item.discount && item.discount > 0)) return false;
  // Rating
  if (item.rating < filters.minRating) return false;
  return true;
}
import { addToCart } from "../../services/Cart.js";
import {
  fetchMenuItems,
  countFood,
  averageRating,
  isAvailableCount,
  countDiscounted,
} from "../../services/food.js";
// Reusable function to fetch menu item

export const createFoodCard = (food) => {
  const card = document.createElement("div");
  card.className = "food-card";

  if (!food.is_available) {
    card.classList.add("food-unavailable");
  }

  const image = document.createElement("img");
  image.className = "food-image";
  image.src = food.image_url;
  image.alt = food.name;

  const name = document.createElement("p");
  name.className = "food-name";
  name.textContent = food.name;

  const description = document.createElement("p");
  description.className = "food-description";
  description.textContent = food.description;

  // Discount label
  let discountLabel = null;
  if (food.discount && food.discount > 0) {
    discountLabel = document.createElement("span");
    discountLabel.className = "food-discount";
    discountLabel.textContent = `-${Math.round(food.discount * 100)}% OFF`;
    discountLabel.style.background = "#ff5252";
    discountLabel.style.color = "#fff";
    discountLabel.style.fontWeight = "bold";
    discountLabel.style.fontSize = "0.85em";
    discountLabel.style.padding = "2px 6px";
    discountLabel.style.borderRadius = "6px";
    discountLabel.style.position = "absolute";
    discountLabel.style.top = "10px";
    discountLabel.style.right = "10px";
    discountLabel.style.zIndex = "2";
  }

  const meta = document.createElement("div");
  meta.className = "food-meta";

  let price;
  if (food.discount && food.discount > 0) {
    // Original price with strikethrough
    const originalPrice = document.createElement("span");
    originalPrice.className = "food-original-price";
    originalPrice.textContent = `$${Number(food.price).toFixed(2)}`;
    originalPrice.style.textDecoration = "line-through";
    originalPrice.style.color = "#888";
    originalPrice.style.marginRight = "8px";

    // Discounted price
    const discountedPrice = document.createElement("span");
    discountedPrice.className = "food-discounted-price";
    const newPrice = food.price * (1 - food.discount);
    discountedPrice.textContent = `$${newPrice.toFixed(2)}`;
    discountedPrice.style.color = "#ff5252";
    discountedPrice.style.fontWeight = "bold";

    price = document.createElement("span");
    price.className = "food-price-group";
    price.append(originalPrice, discountedPrice);
  } else {
    price = document.createElement("span");
    price.className = "food-price";
    price.textContent = `$${Number(food.price).toFixed(2)}`;
  }

  const addButton = document.createElement("button");
  addButton.className = "add-btn";
  addButton.type = "button";
  addButton.textContent = "+";
  addButton.disabled = !food.is_available;

  if (!food.is_available) {
    addButton.title = "This item is currently unavailable";
  }

  // Add click handler for add to cart
  addButton.addEventListener("click", async (e) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      await addToCart(food.item_id, 1);

      // Simple feedback - just disable button briefly
      const originalText = addButton.textContent;
      addButton.disabled = true;
      addButton.textContent = "✓";

      setTimeout(() => {
        addButton.textContent = originalText;
        addButton.disabled = false;
      }, 1000);

      console.log(`Added ${food.name} to cart`);

      // Refresh cart display
      const cartRefreshEvent = new CustomEvent("cartUpdated");
      document.dispatchEvent(cartRefreshEvent);
    } catch (error) {
      console.error("Error adding to cart:", error);
    }
  });

  meta.append(price, addButton);

  // Make card position relative for discount label
  card.style.position = "relative";
  if (discountLabel) {
    card.appendChild(discountLabel);
  }

  card.append(image, name, description, meta);

  return card;
};

export const renderCards = async (root = document, filterLabel = "All") => {
  const foodGrid = root.querySelector("#food-grid");
  const countElement = root.querySelector("#food-count");
  if (countElement) {
    try {
      const totalCount = await countFood();
      countElement.textContent = `${totalCount}`;
    } catch (error) {
      countElement.textContent = "(0)";
      console.error("Error fetching food count:", error);
    }
  }

  const ratingElement = root.querySelector("#average-food-rating");
  if (ratingElement) {
    try {
      const averageRatingValue = await countDiscounted();
      ratingElement.textContent = averageRatingValue;
    } catch (error) {
      ratingElement.textContent = "N/A";
      console.error("Error fetching average rating:", error);
    }
  }

  const isAvailableElement = root.querySelector("#available-food-count");
  if (isAvailableElement) {
    try {
      const availableCount = await isAvailableCount();
      isAvailableElement.textContent = `${availableCount}`;
    } catch (error) {
      isAvailableElement.textContent = "N/A";
      console.error("Error fetching available food count:", error);
    }
  }

  if (!foodGrid) {
    return;
  }

  try {
    const items = await fetchMenuItems();
    const fragment = document.createDocumentFragment();

    // Get filter values from filter menu
    const filters = getFilterValues(root);

    items
      .filter((item) => filterMenuItem(item, filters))
      .forEach((item) => {
        fragment.appendChild(createFoodCard(item));
      });

    foodGrid.innerHTML = "";

    if (!fragment.childNodes.length) {
      foodGrid.innerHTML =
        '<p class="component-error">No menu items match this filter.</p>';
      return;
    }

    foodGrid.appendChild(fragment);
  } catch (error) {
    foodGrid.innerHTML =
      '<p class="component-error">Unable to load menu items right now.</p>';
    console.error(error);
  }
};

export const initFoodPage = async (root = document) => {
  // Populate category dropdown dynamically
  const categorySelect = root.querySelector("#category");
  if (categorySelect) {
    // Remove all except 'All'
    categorySelect.innerHTML = '<option value="all">All</option>';
    const categories = await fetchCategories();
    categories.forEach((cat) => {
      const option = document.createElement("option");
      option.value = cat.category_id;
      option.textContent = cat.name;
      categorySelect.appendChild(option);
    });
  }
  // Filter menu toggle
  const filterToggle = root.querySelector(".filter-toggle");
  const filterMenu = root.querySelector(".filter-menu");
  if (filterToggle && filterMenu) {
    filterToggle.addEventListener("click", () => {
      filterMenu.classList.toggle("open");
    });
  }

  // Filter controls
  const filterControls = [
    "#category",
    "#priceRange",
    "#isAvailable",
    "#isDiscount",
    "#rating",
  ];
  filterControls.forEach((selector) => {
    const el = root.querySelector(selector);
    if (el) {
      el.addEventListener("change", () => renderCards(root));
      if (el.type === "range") {
        el.addEventListener("input", () => renderCards(root));
      }
    }
  });
  const statusPills = root.querySelectorAll(".status-list .status-pill");

  await renderCards(root, "All");

  statusPills.forEach((pill) => {
    if (pill.dataset.bound === "true") {
      return;
    }

    pill.dataset.bound = "true";

    pill.addEventListener("click", async () => {
      statusPills.forEach((item) => item.classList.remove("active"));
      pill.classList.add("active");
      await renderCards(root, pill.textContent || "All");
    });
  });
};

export const get10FoodCards = async (root = document, filterLabel = "All") => {
  const foodGrid = root.querySelector("#food-container #food-grid");
  if (!foodGrid) {
    return;
  }

  console.log("in get 10 food cards with filter:", filterLabel);

  const getOrderingCount = (item) => {
    const value = item.ordering_count ?? item.ording_count ?? 0;
    return Number.isFinite(Number(value)) ? Number(value) : 0;
  };

  try {
    const items = await fetchMenuItems();
    const fragment = document.createDocumentFragment();
    let renderItems = items;

    if (filterLabel === "All") {
      renderItems = items.slice(0, 10);
    } else {
      renderItems = items.filter((item) => item.category_id === filterLabel);
    }

    renderItems.forEach((item) => {
      fragment.appendChild(createFoodCard(item));
    });

    foodGrid.innerHTML = "";
    foodGrid.appendChild(fragment);
  } catch (error) {
    foodGrid.innerHTML =
      '<p class="component-error">Unable to load menu items right now.</p>';
    console.error(error);
  }
};
