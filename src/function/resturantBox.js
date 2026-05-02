import { fetchResturants } from "../services/Resturant.js";

const FALLBACK_IMAGE =
  "https://img.freepik.com/free-photo/close-up-delicious-pizza-with-tomatoes-cheese_23-2148888637.jpg?semt=ais_hybrid&w=740&q=80";

// --- FIX 1: ASYNC FETCH AND FILTER LOGIC ---
export const createDetailedCard = async (resturant) => {
  const container = document.createElement("div");
  container.className = "detail-view";

  const hero = document.createElement("div");
  hero.className = "detail-hero";

  const heroImage = document.createElement("img");
  heroImage.className = "detail-hero-img";
  heroImage.src = resturant.image_url || FALLBACK_IMAGE;
  heroImage.alt = resturant.name || "Restaurant";

  const heroOverlay = document.createElement("div");
  heroOverlay.className = "detail-hero-overlay";

  const heroContent = document.createElement("div");
  heroContent.className = "detail-hero-content";

  const title = document.createElement("h1");
  title.className = "detail-title";
  title.textContent = resturant.name || "Restaurant Name";

  const summary = document.createElement("p");
  summary.className = "detail-summary";
  summary.textContent =
    resturant.description ||
    "A curated menu of favorites, prepared fresh and delivered fast.";

  const meta = document.createElement("div");
  meta.className = "detail-meta";
  meta.innerHTML = `
    <span><i class="fa-solid fa-location-dot"></i>${
      resturant.address || "No address"
    }</span>
    <span><i class="fa-solid fa-phone"></i>${
      resturant.phone || "No phone"
    }</span>
  `;

  heroContent.append(title, summary, meta);
  hero.append(heroImage, heroOverlay, heroContent);

  const itemsContainer = document.createElement("div");
  itemsContainer.className = "food-grid detail-food-grid";

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
        const card = document.createElement("div");
        card.className = "food-card";

        const image = document.createElement("img");
        image.className = "food-image";
        image.src = menuItem.image_url || FALLBACK_IMAGE;
        image.alt = menuItem.name || "Menu item";

        const name = document.createElement("p");
        name.className = "food-name";
        name.textContent = menuItem.name || "Menu item";

        const description = document.createElement("p");
        description.className = "food-description";
        description.textContent =
          menuItem.description || "Freshly prepared with quality ingredients.";

        const meta = document.createElement("div");
        meta.className = "food-meta";

        // Price left, add button right
        const price = document.createElement("span");
        price.className = "food-price";
        price.textContent = `$${Number(menuItem.price || 0).toFixed(2)}`;

        const addButton = document.createElement("button");
        addButton.className = "add-btn";
        addButton.type = "button";
        addButton.textContent = "+";
        addButton.disabled = menuItem.is_available === false;
        if (addButton.disabled) {
          addButton.title = "This item is currently unavailable";
        }
        addButton.addEventListener("click", async (e) => {
          e.preventDefault();
          e.stopPropagation();
          try {
            const cartModule = await import("../services/Cart.js");
            await cartModule.addToCart(menuItem.item_id, 1);
            const originalText = addButton.textContent;
            addButton.disabled = true;
            addButton.textContent = "✓";
            setTimeout(() => {
              addButton.textContent = originalText;
              addButton.disabled = false;
            }, 1000);
            const cartRefreshEvent = new CustomEvent("cartUpdated");
            document.dispatchEvent(cartRefreshEvent);
          } catch (error) {
            console.error("Error adding to cart:", error);
          }
        });

        meta.style.display = "flex";
        meta.style.justifyContent = "space-between";
        meta.style.alignItems = "center";
        meta.append(price, addButton);
        card.append(image, name, description, meta);
        itemsContainer.appendChild(card);
      });
    }
  } catch (error) {
    console.error("Menu fetch error:", error);
    itemsContainer.innerHTML = `<p>Error loading menu: ${error.message}. Check file path.</p>`;
  }

  const menuTitle = document.createElement("h2");
  menuTitle.className = "detail-menu-title";
  menuTitle.textContent = "Menu highlights";

  container.append(hero, menuTitle, itemsContainer);
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

    item.addEventListener("click", () => {
      const route = "restaurant";
      const resturantId = resturant.restaurant_id;

      history.pushState(
        { page: route, resturantId },
        "",
        `?page=${encodeURIComponent(route)}&resturantId=${encodeURIComponent(
          resturantId,
        )}`,
      );

      if (typeof window.renderSidebarRoute === "function") {
        void window.renderSidebarRoute(route);
      }
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
  const resturantDetailRoot = root.querySelector(".restaurant-detail-body");
  if (resturantDetailRoot) {
    const urlParams = new URLSearchParams(window.location.search);
    const resturantId = Number(urlParams.get("resturantId"));

    if (!resturantId) {
      resturantDetailRoot.innerHTML =
        '<p class="component-error">Restaurant not found.</p>';
      return;
    }

    const resturants = await fetchResturants();
    const resturant = resturants.find(
      (item) => Number(item.restaurant_id) === resturantId,
    );

    if (!resturant) {
      resturantDetailRoot.innerHTML =
        '<p class="component-error">Restaurant not found.</p>';
      return;
    }

    resturantDetailRoot.innerHTML = "";

    const backBtn = document.createElement("button");
    backBtn.className = "restaurant-detail-back";
    backBtn.textContent = "← Back to List";
    backBtn.addEventListener("click", () => {
      const route = "restaurant";
      history.pushState(
        { page: route },
        "",
        `?page=${encodeURIComponent(route)}`,
      );
      if (typeof window.renderSidebarRoute === "function") {
        void window.renderSidebarRoute(route);
      }
    });

    const detailedCard = await createDetailedCard(resturant);
    resturantDetailRoot.append(backBtn, detailedCard);
    window.scrollTo(0, 0);
    return;
  }

  await renderResturantBox(root);
};
