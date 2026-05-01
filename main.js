import { rendering } from "./src/function/Rendering.js";
import { initSidebarNavigation } from "./src/function/SideBar.js";
import { checkLoginState } from "./src/function/Navigation.js";

const main = document.getElementById("main");

const initApp = async () => {
  await rendering("./src/app.html", main);
  checkLoginState();
  initSidebarNavigation(main);
};

if (document.readyState === "loading")
  document.addEventListener("DOMContentLoaded", initApp);
else initApp();

console.log("User" + (localStorage.getItem("isLoggedIn") === "true" ? " is logged in." : " is not logged in."));