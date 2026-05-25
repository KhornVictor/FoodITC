import { initSidebarNavigation } from "./SideBar.js";

export const initBottomBarNavigation = (root = document) => {
  const bottomBar = root.querySelector("#bottom-side-bar");
  const bottomItems = root.querySelectorAll(
    "#bottom-side-bar .bottom-item[data-route]",
  );

  if (bottomItems.length === 0) {
    console.warn("No bottom bar items found with data-route attribute");
    return;
  }

  if (!bottomBar) {
    console.warn("No bottom navigation bar found");
    return;
  }

  const setActiveBottomItem = (route) => {
    bottomItems.forEach((button) => {
      button.classList.toggle("active", button.dataset.route === route);
    });
  };

  const syncWithSidebar = (route) => {
    const sidebarItems = root.querySelectorAll(
      ".left-sidebar .menu-item[data-route]",
    );
    sidebarItems.forEach((item) => {
      item.classList.toggle("active", item.dataset.route === route);
    });
  };

  const handleBottomItemClick = (route) => {
    // Update URL
    history.pushState(
      { page: route },
      "",
      "?page=" + encodeURIComponent(route),
    );

    // Update active states
    setActiveBottomItem(route);
    syncWithSidebar(route);

    // Trigger sidebar route rendering
    if (window.renderSidebarRoute) {
      window.renderSidebarRoute(route);
    }
  };

  bottomItems.forEach((button) => {
    if (button.dataset.bound === "true") {
      return;
    }

    button.dataset.bound = "true";

    button.addEventListener("click", () => {
      const route = button.dataset.route;
      if (route) {
        handleBottomItemClick(route);
      }
    });
  });

  // Sync bottom bar active state when sidebar changes
  const originalRenderRoute = window.renderSidebarRoute;
  if (originalRenderRoute) {
    window.renderSidebarRoute = async function (route) {
      setActiveBottomItem(route);
      return originalRenderRoute.call(this, route);
    };
  }

  // Handle back/forward navigation
  if (root.dataset.bottomQueryListenerBound !== "true") {
    root.dataset.bottomQueryListenerBound = "true";

    window.addEventListener("popstate", () => {
      const params = new URLSearchParams(window.location.search);
      const route = params.get("page");
      if (route) {
        setActiveBottomItem(route);
      }
    });
  }

  // Sync initial state with current URL
  const urlParams = new URLSearchParams(window.location.search);
  const currentRoute = urlParams.get("page");
  if (currentRoute) {
    setActiveBottomItem(currentRoute);
  }
};
