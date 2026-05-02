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

    if (route === "restaurant") {
      const urlParams = new URLSearchParams(window.location.search);
      const resturantId = urlParams.get("resturantId");

      if (resturantId) {
        await rendering("./src/pages/home/resturant.detail.html", contentArea);
        await initResturantBox(contentArea);
        setActiveByRoute(route);
        return;
      }
    }

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

  window.renderSidebarRoute = renderRoute;

  menuItems.forEach((item) => {
    if (item.dataset.bound === "true") {
      return;
    }

    item.dataset.bound = "true";

    item.addEventListener("click", () => {
      const route = item.dataset.route;

      if (route) {
        history.pushState(
          { page: route },
          "",
          "?page=" + encodeURIComponent(route),
        );
        void renderRoute(route);
      }
    });
  });

  if (root.dataset.queryListenerBound !== "true") {
    root.dataset.queryListenerBound = "true";

    window.addEventListener("popstate", () => {
      const params = new URLSearchParams(window.location.search);
      const route = params.get("page") || "";
      if (route) {
        void renderRoute(route);
      } else {
        const fallback =
          root.querySelector(".left-sidebar .menu-item.active")?.dataset
            .route || "home";
        void renderRoute(fallback);
      }
    });
  }

  const urlParams = new URLSearchParams(window.location.search);
  const initialRoute =
    urlParams.get("page") ||
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
