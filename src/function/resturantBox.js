import { fetchResturants } from "../services/Resturant.js";

const FALLBACK_IMAGE =
  "https://img.freepik.com/free-photo/close-up-delicious-pizza-with-tomatoes-cheese_23-2148888637.jpg?semt=ais_hybrid&w=740&q=80";

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
      resturant.description ||
      "Fresh ingredients, quick service, and crowd-favorite dishes.";

    const meta = document.createElement("div");
    meta.className = "restaurant-meta";

    const address = document.createElement("p");
    address.innerHTML = `<i class="fa-solid fa-location-dot" aria-hidden="true"></i>${resturant.address || "Address not available"}`;

    const phone = document.createElement("p");
    phone.innerHTML = `<i class="fa-solid fa-phone" aria-hidden="true"></i>${resturant.phone || "Phone not available"}`;

    meta.append(address, phone);
    item.append(description, meta);

    const content=document.getElementById("content-area");

    //ceatedestail
  const createDetailedCard = (resturant) => {
  const container = document.createElement("div");
  container.className = "detail-view";

  // 1. Large Hero Image on Top
  const heroImage = document.createElement("img");
  heroImage.className = "detail-hero-img";
  heroImage.src = resturant.image_url || FALLBACK_IMAGE;
  
  // 2. Header Text
  const title = document.createElement("h1");
  title.className = "detail-title";
  title.textContent = resturant.name || "Restaurant Name";

  // 3. Container for the Side-by-Side Menu Items
  const itemsContainer = document.createElement("div");
  itemsContainer.className = "blank-items-list";

  // Create 4 items with side-by-side layout
  for (let i = 0; i < 4; i++) {
    const itemRow = document.createElement("div");
    itemRow.className = "menu-item-row"; // Side-by-side container

    // Left Side: Image
    const imgDiv = document.createElement("div");
    imgDiv.className = "menu-item-img-box";
    const hImage = document.createElement("img");
    hImage.src = FALLBACK_IMAGE; // Placeholder or menu_item.image_url
    imgDiv.append(hImage);

    // Right Side: Details Placeholder
    const infoDiv = document.createElement("div");
    infoDiv.className = "menu-item-info-box";
    infoDiv.innerHTML = `
      <div class="skeleton-line"></div>
      <div class="skeleton-line short"></div>
    `;

    itemRow.append(imgDiv, infoDiv);
    itemsContainer.appendChild(itemRow);
  }

  container.append(heroImage, title, itemsContainer);
  return container;
};

    //Click
    item.addEventListener("click", () => {
    // 1. Find the main content area where you want to show the detail
    const contentArea = document.getElementById("content-area");
    if (!contentArea) return;

    // 2. Clear current view (e.g., the home page grid)
    contentArea.innerHTML = "";

    // 3. Create a container for the single detailed restaurant
    const detailPage = document.createElement("div");
    detailPage.id = "restaurant-page";
    detailPage.className = "restaurant-page"; // This class ensures the next render knows it's detailed

    // 4. Create a "Back" button for UX
    const backBtn = document.createElement("button");
    backBtn.textContent = "← Back to List";
    backBtn.onclick = () => location.reload(); // Simple way to reset, or call renderResturantBox again
    
    // 5. Generate the detailed card
    contentArea.append(createDetailedCard(resturant))

    // Optional: Scroll to top
    window.scrollTo(0, 0);
});
  }

  return item;
};

export const renderResturantBox = async (root = document) => {
  const shopItems = root.querySelector(".shop-items");

  if (!shopItems) {
    return;
  }

  const resturants = await fetchResturants();
  shopItems.innerHTML = "";

  if (!resturants.length) {
    shopItems.innerHTML =
      '<p class="restaurant-empty-state">No restaurants available right now.</p>';
    return;
  }

  const isDetailedView = Boolean(shopItems.closest(".restaurant-page"));
  const itemsToRender = isDetailedView ? resturants : resturants.slice(0, 10);

  const fragment = document.createDocumentFragment();

  itemsToRender.forEach((resturant) => {
    fragment.appendChild(
      createResturantCard(resturant, isDetailedView ? "detailed" : "compact"),
    );
  });

  shopItems.appendChild(fragment);
};

export const initResturantBox = async (root = document) => {
  await renderResturantBox(root);
};
