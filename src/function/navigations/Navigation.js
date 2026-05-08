const AUTH_STORAGE_KEY = "currentUser";

const getStoredUser = () => {
  const storedUser =
    sessionStorage.getItem(AUTH_STORAGE_KEY) ||
    localStorage.getItem(AUTH_STORAGE_KEY);

  if (!storedUser) {
    return null;
  }

  try {
    return JSON.parse(storedUser);
  } catch (error) {
    console.warn("Unable to parse stored user", error);
    return null;
  }
};

const getAvatarUrl = (user = null) => {
  return user?.avatar || "https://static.vecteezy.com/system/resources/previews/013/360/247/non_2x/default-avatar-photo-icon-social-media-profile-sign-symbol-vector.jpg";
};

const renderLoggedOutState = (container) => {
  container.innerHTML = `
    <button
      onclick="window.location.href = 'src/pages/auth/login.html'"
      class="login-btn"
      type="button"
    >
      Login
    </button>
    <button
      onclick="window.location.href = 'src/pages/auth/register.html'"
      class="register-btn"
      type="button"
    >
      Register
    </button>
  `;
};

const renderLoggedInState = (container, user) => {
  console.log("Rendering logged-in state for user:", user);
  container.innerHTML = `
    <div class="notification-bell" title="Notifications">
      <i class="fas fa-bell"></i>
    </div>
    <div class="auth-profile" title="${user?.name || "User"}">
      <img src="${getAvatarUrl(user)}" alt="profile" />
    </div>
  `;

  const authProfile = container.querySelector(".auth-profile");
  if (authProfile) {
    authProfile.addEventListener("click", () => {
      history.pushState({ page: "settings" }, "", "?page=settings");
      if (typeof window.renderSidebarRoute === "function") {
        void window.renderSidebarRoute("settings");
        return;
      }

      if (typeof topBarLabel === "function") {
        topBarLabel("Settings");
      }

      window.location.href = "index.html?page=settings";
    });
  }

  const logoutBtn = container.querySelector("#logout-btn");
  if (!logoutBtn) {
    return;
  }

  logoutBtn.addEventListener("click", () => {
    sessionStorage.removeItem(AUTH_STORAGE_KEY);
    localStorage.removeItem(AUTH_STORAGE_KEY);
    renderLoggedOutState(container);
  });
};

export const checkLoginState = (isLoggedin, user) => {
  const loginRegister = document.getElementById("login-register");

  if (!loginRegister) {
    console.warn("Login/Register container not found");
    return;
  }

  const resolvedUser = user || getStoredUser();
  const resolvedIsLoggedIn =
    typeof isLoggedin === "boolean" ? isLoggedin : Boolean(resolvedUser);

  if (resolvedIsLoggedIn && resolvedUser) {
    renderLoggedInState(loginRegister, resolvedUser);
    return;
  }

  renderLoggedOutState(loginRegister);
};

export const topBarLabel = (label) => {
  const labelElement = document.getElementById("top-bar-label");
  if (!labelElement) {
    console.warn("Top bar label element not found");
    return;
  }
  labelElement.textContent = label;
};

export const initTopBarScrollBehavior = () => {
  const topBar = document.querySelector(".top-bar");
  const contentArea = document.querySelector(".content-area");

  if (!topBar || !contentArea) {
    console.warn("Top bar or content area not found");
    return;
  }

  let lastScrollTop = contentArea.scrollTop;
  let ticking = false;

  const updateTopBar = () => {
    const currentScrollTop = contentArea.scrollTop;
    const scrollDown = currentScrollTop > lastScrollTop;
    const isNearTop = currentScrollTop <= 8;

    if (scrollDown && !isNearTop) {
      topBar.classList.add("top-bar--hidden");
    } else {
      topBar.classList.remove("top-bar--hidden");
    }

    lastScrollTop = Math.max(0, currentScrollTop);
    ticking = false;
  };

  contentArea.addEventListener(
    "scroll",
    () => {
      if (!ticking) {
        window.requestAnimationFrame(updateTopBar);
        ticking = true;
      }
    },
    { passive: true }
  );
};
