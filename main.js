import { rendering } from "./src/function/core/Rendering.js";
import { initSidebarNavigation } from "./src/function/navigations/SideBar.js";
import { checkLoginState } from "./src/function/navigations/Navigation.js";
import { initCartPage } from "./src/pages/order/CartPage.js";

const main = document.getElementById("main");

const initApp = async () => {
  try {
    await rendering("./src/app.html", main);
    checkLoginState();
    initSidebarNavigation(main);

    // Initialize cart page when DOM is ready
    Promise.resolve().then(() => {
      try {
        initCartPage(main);
      } catch (error) {
        console.error("Cart page init error:", error);
      }
    });

    console.log("App initialized successfully");
  } catch (error) {
    console.error("App initialization error:", error);
    if (main) {
      main.innerHTML = `<div style="padding: 20px; color: red;"><strong>Error loading app:</strong> ${error.message}</div>`;
    }
  }
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initApp);
} else {
  initApp();
}

console.log(
  "User" +
    (localStorage.getItem("isLoggedIn") === "true"
      ? " is logged in."
      : " is not logged in."),
);
