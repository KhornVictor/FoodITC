import { checkLoginState } from "../../../function/navigations/Navigation.js";
import { authenticateUser } from "../../../services/User.js";

const loginForm = document.getElementById("login-form");
const emailInput = document.getElementById("login-email");
const passwordInput = document.getElementById("login-password");

const getOrCreateMessageBox = () => {
  let messageBox = document.getElementById("login-message");

  if (!messageBox && loginForm) {
    messageBox = document.createElement("p");
    messageBox.id = "login-message";
    messageBox.className = "form-message";
    loginForm.appendChild(messageBox);
  }

  return messageBox;
};

const setMessage = (text, type = "error") => {
  const messageBox = getOrCreateMessageBox();

  if (!messageBox) {
    return;
  }

  messageBox.textContent = text;
  messageBox.className = `form-message ${type}`;
};

const setSubmittingState = (isSubmitting) => {
  const submitButton = loginForm?.querySelector("button[type='submit']");
  if (!submitButton) {
    return;
  }

  submitButton.disabled = isSubmitting;
  submitButton.textContent = isSubmitting ? "Logging in..." : "Log In";
};

const persistLoggedInUser = (user, remember) => {

  const storage = remember ? localStorage : sessionStorage;

  localStorage.removeItem("currentUser");
  sessionStorage.removeItem("currentUser");
  storage.setItem("currentUser", JSON.stringify(user));
};

const redirectAfterLogin = () => {
  window.location.href = "../../../index.html#home";
};

if (loginForm && emailInput && passwordInput) {
  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();
    const remember = Boolean(
      loginForm.querySelector("input[name='remember']")?.checked,
    );

    if (!email || !password) {
      setMessage("Please enter both email and password.", "error");
      return;
    }

    try {
      setSubmittingState(true);
      setMessage("", "");
    
      const result = await authenticateUser(email, password);

      if (!result.success) {
        setMessage(
          result.message || "Login failed. Please try again.",
          "error",
        );
        return;
      }

      persistLoggedInUser(result.user, remember);
      setMessage("Login successful! Redirecting...", "success");
      checkLoginState(true, result.user);
      setTimeout(redirectAfterLogin, 500);
    } catch (error) {
      console.error("Login error:", error);
      setMessage("Unable to login right now. Please try again.", "error");
    } finally {
      setSubmittingState(false);
    }
  });
}
