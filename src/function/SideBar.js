import { rendering } from "./Rendering.js";
import { initFoodPage, get10FoodCards } from "./foodCard.js";
import { initResturantBox } from "./resturantBox.js";
import { initCategoryCards } from "./categoryCard.js";
import { topBarLabel } from "./Navigation.js";

/**
 * Initialize sidebar navigation with click handlers.
 * Manages active states and hash-based routing.
 * @param {HTMLElement} root - Root element to search for sidebar (defaults to document)
 */
export const initSidebarNavigation = (root = document) => {
  const menuItems = root.querySelectorAll(
    ".left-sidebar .menu-item[data-route]",
  );
  const contentArea = root.querySelector("#content-area");
  const routeMap = {
    home: "./src/pages/home/home.html",
    food: "./src/pages/home/food.html",
    history: "./src/pages/home/history.html",
    restaurant: "./src/pages/home/restaurant.html",
    settings: "./src/pages/home/setting.html",
  };

  if (menuItems.length === 0) {
    console.warn("No sidebar menu items found with data-route attribute");
    return;
  }

  if (!contentArea) {
    console.warn("No #content-area found for sidebar route rendering");
    return;
  }

  const setActiveByRoute = (route) => {
    menuItems.forEach((button) => {
      button.classList.toggle("active", button.dataset.route === route);
    });
  };

  const getLabelByRoute = (route) => {
    const matchedItem = Array.from(menuItems).find(
      (button) => button.dataset.route === route,
    );

    if (!matchedItem) {
      return "Dashboard";
    }

    return matchedItem.querySelector("p")?.textContent?.trim() || "Dashboard";
  };

  const renderRoute = async (route) => {
    topBarLabel(getLabelByRoute(route));

    const pagePath = routeMap[route];

    if (!pagePath) {
      contentArea.innerHTML =
        '<p class="component-error">This page is not available yet.</p>';
      setActiveByRoute(route);
      return;
    }

    await rendering(pagePath, contentArea);

    if (route === "home") {
      await initResturantBox(contentArea);
      await initCategoryCards(contentArea);
      await get10FoodCards(contentArea);
    }

    if (route === "food") {
      await initFoodPage(contentArea);
    }

    if (route === "restaurant") {
      await initResturantBox(contentArea);
    }

    setActiveByRoute(route);
  };

  

  menuItems.forEach((item) => {
    if (item.dataset.bound === "true") {
      return;
    }

    item.dataset.bound = "true";

    item.addEventListener("click", () => {
      const route = item.dataset.route;

      if (route) {
        void renderRoute(route);
        window.location.hash = route;
      }
    });
  });

  if (root.dataset.hashListenerBound !== "true") {
    root.dataset.hashListenerBound = "true";

    window.addEventListener("hashchange", () => {
      const route = window.location.hash.replace(/^#/, "");
      if (route) {
        void renderRoute(route);
      }
    });
  }

  const initialRoute =
    window.location.hash.replace(/^#/, "") ||
    root.querySelector(".left-sidebar .menu-item.active")?.dataset.route ||
    "home";

  void renderRoute(initialRoute);
};

export const siderSelection = (path) => {
  const menuItems = document.querySelectorAll(
    ".left-sidebar .menu-item[data-route]",
  );
  menuItems.forEach((button) => {
    button.classList.toggle("active", button.dataset.route === path);
  });
};
