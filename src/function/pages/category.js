import { fetchCategories } from "../../services/Category.js";

const FALLBACK_IMAGE =
  "https://1000logos.net/wp-content/uploads/2017/03/McDonalds-logo.png";

const createCategoryCard = (category) => {
  const item = document.createElement("div");
  item.className = "category-item";

  const image = document.createElement("img");
  image.src = category.image_url || FALLBACK_IMAGE;
  image.alt = category.name || "Category";
  image.loading = "lazy";
  image.addEventListener("error", () => {
    image.src = FALLBACK_IMAGE;
  });

  const name = document.createElement("p");
  name.textContent = category.name || "Unknown";

  item.append(image, name);
  return item;
};

export const renderCategoryCards = async (root = document) => {
  const categoryItems =
    root.querySelector("#category-items") ||
    root.querySelector(".category-items");

  if (!categoryItems) {
    return;
  }

  const categories = await fetchCategories();
  categoryItems.innerHTML = "";

  if (!categories.length) {
    categoryItems.innerHTML =
      '<p class="component-error">No categories available right now.</p>';
    return;
  }

  const fragment = document.createDocumentFragment();
  categories.forEach((category) => {
    fragment.appendChild(createCategoryCard(category));
  });

  categoryItems.appendChild(fragment);
};

export const initCategoryCards = async (root = document) => {
  await renderCategoryCards(root);
};
