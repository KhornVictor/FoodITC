import { fetchResturants, countResturants, AverageRating, timeEstimate } from "../../services/Resturant.js";
import { createFoodCard } from "./food.js";

const FALLBACK_IMAGE = "https://img.freepik.com/free-photo/close-up-delicious-pizza-with-tomatoes-cheese_23-2148888637.jpg?semt=ais_hybrid&w=740&q=80";

export const createDetailedCard = async (resturant) => {
    // Prepare rating and time estimate (use provided or fallback)
    const rating = typeof resturant.rating !== "undefined" ? resturant.rating : "N/A";
    const timeEstimate = typeof resturant.timeEstimate !== "undefined" ? resturant.timeEstimate : "N/A";
  const container = document.createElement("div");
  container.className = "detail-view";

  const hero = document.createElement("div");
  hero.className = "detail-hero";
  hero.style.backgroundImage = `url('${resturant.background_url || FALLBACK_IMAGE}')`;
  hero.style.backgroundSize = "cover";
  hero.style.backgroundPosition = "center";
  hero.style.position = "relative";

  // Add a dark overlay
  const darkOverlay = document.createElement("div");
  darkOverlay.style.position = "absolute";
  darkOverlay.style.top = 0;
  darkOverlay.style.left = 0;
  darkOverlay.style.width = "100%";
  darkOverlay.style.height = "100%";
  darkOverlay.style.background = "rgba(0,0,0,0.45)";
  darkOverlay.style.zIndex = 1;
  darkOverlay.style.pointerEvents = "none";

  const heroCopy = document.createElement("div");
  heroCopy.className = "detail-hero-copy";
  heroCopy.style.position = "relative";
  heroCopy.style.zIndex = 2;

  const heroImage = document.createElement("img");
  heroImage.className = "detail-hero-img";
  heroImage.src = resturant.image_url || FALLBACK_IMAGE;
  heroImage.alt = resturant.name || "Restaurant";
  // Make the image float on top of the hero section
  heroImage.style.position = "absolute";
  heroImage.style.top = "50%";
  heroImage.style.left = "50%";
  heroImage.style.transform = "translate(-50%, -50%)";
  heroImage.style.zIndex = 3;
  heroImage.style.width = "160px";
  heroImage.style.height = "160px";
  heroImage.style.objectFit = "cover";
  heroImage.style.borderRadius = "50%";
  heroImage.style.boxShadow = "0 4px 24px rgba(0,0,0,0.25)";

  const heroMedia = document.createElement("div");
  heroMedia.className = "detail-hero-media";

  const heroOverlay = document.createElement("div");
  heroOverlay.className = "detail-hero-overlay";

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
    <span><i class="fa-solid fa-location-dot"></i> ${resturant.address || "No address"}</span>
    <span><i class="fa-solid fa-phone"></i> ${resturant.phone || "No phone"}</span>
    <span><i class="fa-solid fa-star"></i> Rating: ${rating}</span>
    <span><i class="fa-solid fa-clock"></i> Delivery: ${timeEstimate} mins</span>
  `;

  heroCopy.append(title, summary, meta);
  heroMedia.append(heroOverlay, heroImage);
  hero.append(darkOverlay, heroCopy, heroMedia);

  const itemsContainer = document.createElement("div");
  itemsContainer.className = "food-grid detail-food-grid";

  try {
    const response = await fetch("./public/data/menu_items.json");

    if (!response.ok) throw new Error("File not found");
    const menuData = await response.json();

    const restaurantMenu = menuData.filter(
      (item) => item.restaurant_id === resturant.restaurant_id,
    );

    if (restaurantMenu.length === 0) {
      itemsContainer.innerHTML = "<p>No menu items available for this restaurant.</p>";
    } else {
      restaurantMenu.forEach((menuItem) => {
        itemsContainer.appendChild(createFoodCard(menuItem));
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
    description.textContent =
      resturant.description || "Fresh ingredients and crowd-favorite dishes.";

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

  const resturantCountEl = document.getElementById("restaurant-count");
  if (resturantCountEl) {
    const updateCount = async () => {
      const count = await countResturants();
      resturantCountEl.textContent = `${count}`;
    };
    updateCount();
  }

  const averageRatingEl = document.getElementById("average-rating");
  if (averageRatingEl) {
    const updateRating = async () => {
      const resturants = await fetchResturants();
      if (resturants.length === 0) {
        averageRatingEl.textContent = "N/A";
        return;
      }
      const totalRating = await AverageRating();
      averageRatingEl.textContent = totalRating;
    };
    updateRating();
  }

  const timeEstimateEl = document.getElementById("typical-delivery");
  if (timeEstimateEl) {
    const updateTimeEstimate = async () => {
      const resturants = await fetchResturants();
      if (resturants.length === 0) {
        timeEstimateEl.textContent = "N/A";
        return;
      }
      const totalTime = await timeEstimate();
      timeEstimateEl.textContent = `${totalTime} mins`;
    };
    updateTimeEstimate();
  }

  return item;
};

export const renderResturantBox = async (root = document) => {
  const shopItems = root.querySelector(".shop-items");
  if (!shopItems) return;

  const resturants = await fetchResturants();
  shopItems.innerHTML = "";

  if (!resturants.length) {
    shopItems.innerHTML =
      '<p class="restaurant-empty-state">No restaurants available.</p>';
    return;
  }

  const isDetailedView = Boolean(shopItems.closest(".restaurant-page"));
  const itemsToRender = isDetailedView ? resturants : resturants.slice(0, 10);

  itemsToRender.forEach((resturant) => {
    shopItems.appendChild(
      createResturantCard(resturant, isDetailedView ? "detailed" : "compact"),
    );
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
