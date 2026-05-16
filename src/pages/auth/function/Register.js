import { checkLoginState } from "../../../function/navigations/Navigation.js";
import { createUser } from "../../../services/User.js";

const registerForm = document.getElementById("register-form");
const firstNameInput = document.getElementById("first-name");
const lastNameInput = document.getElementById("last-name");
const emailInput = document.getElementById("register-email");
const phoneInput = document.getElementById("register-phone");
const passwordInput = document.getElementById("register-password");
const confirmPasswordInput = document.getElementById("confirm-password");

const getOrCreateMessageBox = () => {
  let messageBox = document.getElementById("register-message");

  if (!messageBox && registerForm) {
    messageBox = document.createElement("p");
    messageBox.id = "register-message";
    messageBox.className = "form-message";
    registerForm.appendChild(messageBox);
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
  const submitButton = registerForm?.querySelector("button[type='submit']");
  if (!submitButton) {
    return;
  }

  submitButton.disabled = isSubmitting;
  submitButton.textContent = isSubmitting ? "Creating account..." : "Create Account";
};

const persistLoggedInUser = (user) => {
  localStorage.removeItem("currentUser");
  sessionStorage.removeItem("currentUser");
  localStorage.setItem("currentUser", JSON.stringify(user));
};

const redirectAfterRegister = () => {
  window.location.href = "../../../index.html#home";
};

const isValidEmail = (value) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
};

const isValidPhone = (value) => {
  return /^[0-9+()\s-]{8,}$/.test(value);
};

const validateForm = () => {
  const firstName = firstNameInput?.value.trim() || "";
  const lastName = lastNameInput?.value.trim() || "";
  const email = emailInput?.value.trim() || "";
  const phone = phoneInput?.value.trim() || "";
  const password = passwordInput?.value || "";
  const confirmPassword = confirmPasswordInput?.value || "";
  const termsChecked = Boolean(
    registerForm?.querySelector("input[name='terms']")?.checked,
  );

  if (!firstName || !lastName) {
    return "Please enter your first and last name.";
  }

  if (!email || !isValidEmail(email)) {
    return "Please enter a valid email address.";
  }

  if (!phone || !isValidPhone(phone)) {
    return "Please enter a valid phone number.";
  }

  if (!password || password.length < 6) {
    return "Password must be at least 6 characters.";
  }

  if (password !== confirmPassword) {
    return "Passwords do not match.";
  }

  if (!termsChecked) {
    return "Please accept the terms and privacy policy.";
  }

  return "";
};

if (
  registerForm &&
  firstNameInput &&
  lastNameInput &&
  emailInput &&
  phoneInput &&
  passwordInput &&
  confirmPasswordInput
) {
  registerForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const errorMessage = validateForm();
    if (errorMessage) {
      setMessage(errorMessage, "error");
      return;
    }

    const payload = {
      firstName: firstNameInput.value.trim(),
      lastName: lastNameInput.value.trim(),
      email: emailInput.value.trim(),
      phone: phoneInput.value.trim(),
      password: passwordInput.value,
    };

    try {
      setSubmittingState(true);
      setMessage("", "");

      const result = await createUser(payload);
      if (!result.success) {
        setMessage(result.message || "Registration failed.", "error");
        return;
      }

      persistLoggedInUser(result.user);
      setMessage("Account created! Redirecting...", "success");
      checkLoginState(true, result.user);
      setTimeout(redirectAfterRegister, 500);
    } catch (error) {
      console.error("Register error:", error);
      setMessage("Unable to register right now. Please try again.", "error");
    } finally {
      setSubmittingState(false);
    }
  });
}
