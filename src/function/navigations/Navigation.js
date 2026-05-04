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
  if (user?.avatar) {
    return user.avatar;
  }
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
