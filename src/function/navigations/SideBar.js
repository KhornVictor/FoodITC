import { rendering } from "../core/Rendering.js";
import { initFoodPage, get10FoodCards } from "../pages/food.js";
import { initResturantBox } from "../pages/resturant.js";
import { initCategoryCards } from "../pages/category.js";
import { topBarLabel } from "./Navigation.js";
import { initOrderHistory } from "../pages/history.js";
import { initCartPage } from "../../pages/order/CartPage.js";
import { initConfirmPage } from "../../pages/order/ConfirmPage.js";
import { initSettingsPage } from "../pages/setting.js";

export const initSidebarNavigation = (root = document) => {
  const logoutBtn = root.querySelector("#logout-btn");
  const logoutIconBtn = root.querySelector(".sidebar-logout-icon");
  const sidebar = root.querySelector(".left-sidebar");
  const sidebarToggle = root.querySelector(".sidebar-toggle");
  const menuItems = root.querySelectorAll(
    ".left-sidebar .menu-item[data-route]",
  );
  const contentArea = root.querySelector("#content-area");
  const routeMap = {
    home: "./src/pages/home/home.html",
    food: "./src/pages/home/food.html",
    history: "./src/pages/home/history.html",
    restaurant: "./src/pages/home/restaurant.html",
    restaurant_detail: "./src/pages/home/resturant.detail.html",
    settings: "./src/pages/home/setting.html",
    order: "./src/pages/order/cart.html",
    confirm: "./src/pages/order/confirm.html",
  };

  if (menuItems.length === 0) {
    console.warn("No sidebar menu items found with data-route attribute");
    return;
  }

  if (sidebarToggle && sidebar && sidebarToggle.dataset.bound !== "true") {
    sidebarToggle.dataset.bound = "true";

    const collapsedState = localStorage.getItem("sidebarCollapsed") === "true";
    if (collapsedState) {
      sidebar.classList.add("is-collapsed");
    }

    sidebarToggle.addEventListener("click", () => {
      const isCollapsed = sidebar.classList.toggle("is-collapsed");
      localStorage.setItem("sidebarCollapsed", String(isCollapsed));
    });
  }

  if (logoutBtn && logoutBtn.dataset.bound !== "true") {
    logoutBtn.dataset.bound = "true";
    logoutBtn.addEventListener("click", () => {
      sessionStorage.removeItem("currentUser");
      localStorage.removeItem("currentUser");
      window.location.href = "src/pages/auth/login.html";
    });
  }

  if (logoutIconBtn && logoutIconBtn.dataset.bound !== "true") {
    logoutIconBtn.dataset.bound = "true";
    logoutIconBtn.addEventListener("click", () => {
      sessionStorage.removeItem("currentUser");
      localStorage.removeItem("currentUser");
      window.location.href = "src/pages/auth/login.html";
    });
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

    if (route === "history") {
      await initOrderHistory(contentArea);
      const urlParams = new URLSearchParams(window.location.search);
      const orderId = urlParams.get("orderId");

      if (orderId) {
        await rendering("./src/pages/home/history.detail.html", contentArea);
        await initOrderHistory(contentArea);
        setActiveByRoute(route);
        return;
      }
    }

    if (route === "restaurant") {
      await initResturantBox(contentArea);
    }

    if (route === "order") {
      await initCartPage(contentArea);
    }

    if (route === "confirm") {
      await initConfirmPage(contentArea);
    }

    if (route === "settings") {
      setActiveByRoute(route);
      await initSettingsPage(contentArea);
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
