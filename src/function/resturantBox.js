import { fetchResturants } from "../services/Resturant.js";

const FALLBACK_IMAGE =
  "https://img.freepik.com/free-photo/close-up-delicious-pizza-with-tomatoes-cheese_23-2148888637.jpg?semt=ais_hybrid&w=740&q=80";

// --- FIX 1: ASYNC FETCH AND FILTER LOGIC ---
const createDetailedCard = async (resturant) => {
  const container = document.createElement("div");
  container.className = "detail-view";

  const heroImage = document.createElement("img");
  heroImage.className = "detail-hero-img";
  heroImage.src = resturant.image_url || FALLBACK_IMAGE;
  
  const title = document.createElement("h1");
  title.className = "detail-title";
  title.textContent = resturant.name || "Restaurant Name";

  const itemsContainer = document.createElement("div");
  itemsContainer.className = "blank-items-list";

  try {
    /* FIX: Adjusted path. If your file structure is:
      /src/js/resturantBox.js
      /src/data/menu_items.json
      The path should be '../data/menu_items.json'
    */
    const response = await fetch("../../public/data/menu_items.json"); 
    
    if (!response.ok) throw new Error("File not found");
    const menuData = await response.json();

    // COMPARE: Only show items for this restaurant ID
    const restaurantMenu = menuData.filter(
      (item) => item.restaurant_id === resturant.restaurant_id
    );

    if (restaurantMenu.length === 0) {
      itemsContainer.innerHTML = "<p>No menu items available for this restaurant.</p>";
    } else {
      restaurantMenu.forEach((menuItem) => {
        const itemRow = document.createElement("div");
        itemRow.className = "menu-item-row";
        itemRow.innerHTML = `
          <div class="menu-item-img-box">
            <img src="${menuItem.image_url || FALLBACK_IMAGE}" alt="${menuItem.name}">
          </div>
          <div class="menu-item-info-box">
            <div class="menu-item-name"><strong>${menuItem.name}</strong></div>
            <div class="menu-item-description">${menuItem.description}</div>
            <div class="menu-item-price">$${menuItem.price.toFixed(2)}</div>
          </div>
        `;
        itemsContainer.appendChild(itemRow);
      });
    }
  } catch (error) {
    console.error("Menu fetch error:", error);
    itemsContainer.innerHTML = `<p>Error loading menu: ${error.message}. Check file path.</p>`;
  }

  container.append(heroImage, title, itemsContainer);
  return container;
};

const createResturantCard = (resturant, variant = "compact") => {
  const item = document.createElement("div");
  item.className = "shop-item";

  const image = document.createElement("img");
  image.src = resturant.image_url || FALLBACK_IMAGE;
  image.alt = resturant.name || "Restaurant";
  image.loading = "lazy";

  image.addEventListener("error", () => {
    image.src = FALLBACK_IMAGE;
  });

  const title = document.createElement("h2");
  title.textContent = resturant.name || "Unknown Restaurant";
  item.append(image, title);

  if (variant === "detailed") {
    const description = document.createElement("p");
    description.className = "restaurant-description";
    description.textContent = resturant.description || "Fresh ingredients and crowd-favorite dishes.";

    const meta = document.createElement("div");
    meta.className = "restaurant-meta";
    meta.innerHTML = `
      <p><i class="fa-solid fa-location-dot"></i> ${resturant.address || "No address"}</p>
      <p><i class="fa-solid fa-phone"></i> ${resturant.phone || "No phone"}</p>
    `;

    item.append(description, meta);

    // --- FIX 2: ASYNC CLICK HANDLER ---
    item.addEventListener("click", async () => {
      const contentArea = document.getElementById("content-area");
      if (!contentArea) return;

      contentArea.innerHTML = "<p>Loading detailed menu...</p>";

      const backBtn = document.createElement("button");
      backBtn.textContent = "← Back to List";
      backBtn.onclick = () => location.reload();
      
      // We must AWAIT the async function result
      const detailedCard = await createDetailedCard(resturant);
      
      contentArea.innerHTML = ""; 
      contentArea.append(backBtn, detailedCard);
      window.scrollTo(0, 0);
    });
  }

  return item;
};

export const renderResturantBox = async (root = document) => {
  const shopItems = root.querySelector(".shop-items");
  if (!shopItems) return;

  const resturants = await fetchResturants();
  shopItems.innerHTML = "";

  if (!resturants.length) {
    shopItems.innerHTML = '<p class="restaurant-empty-state">No restaurants available.</p>';
    return;
  }

  const isDetailedView = Boolean(shopItems.closest(".restaurant-page"));
  const itemsToRender = isDetailedView ? resturants : resturants.slice(0, 10);

  itemsToRender.forEach((resturant) => {
    shopItems.appendChild(createResturantCard(resturant, isDetailedView ? "detailed" : "compact"));
  });
};

export const initResturantBox = async (root = document) => {
  await renderResturantBox(root);
};