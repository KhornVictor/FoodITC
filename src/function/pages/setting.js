import {
  getSettings,
  saveSettings,
  setLanguage,
  setNotifications,
  getNotifications,
} from "../../services/Setting.js";
import { getCurrentUser } from "../utils/getme.js";
import { updateUser } from "../../services/User.js";

const getAvatarUrl = (user = null) => {
  const defaultAvatar =
    "https://static.vecteezy.com/system/resources/previews/013/360/247/non_2x/default-avatar-photo-icon-social-media-profile-sign-symbol-vector.jpg";
  const imageUrl = user?.profile_picture || user?.avatar;
  if (imageUrl) {
    const validExtensions = [".png", ".jpg", ".jpeg", ".gif", ".webp"];

    const isValidImage = validExtensions.some((ext) =>
      imageUrl.toLowerCase().endsWith(ext)
    );

    if (isValidImage) {
      return imageUrl;
    }
  }

  return defaultAvatar;
};

export const saveProfile = async () => {
  const profileNameInput = document.getElementById("profile-name-input");
  const profileEmailInput = document.getElementById("profile-email-input");
  const profilePhoneInput = document.getElementById("profile-phone-input");
  const profileAddressInput = document.getElementById("profile-address-input");
  const profileName = document.getElementById("profile-name");
  const profileAvatar = document.getElementById("profile-avatar");
  const profileSummary = document.getElementById("profile-summary");

  const currentUser = getCurrentUser();
  if (!currentUser) {
    alert("Please sign in to update your profile.");
    return;
  }

  const updatedUser = {
    ...currentUser,
    name: profileNameInput?.value?.trim() || currentUser.name,
    email: profileEmailInput?.value?.trim() || currentUser.email,
    phone: profilePhoneInput?.value?.trim() || currentUser.phone,
    address: profileAddressInput?.value?.trim() || currentUser.address,
  };

  const storage = localStorage;
  storage.setItem("currentUser", JSON.stringify(updatedUser));

  if (profileName) profileName.textContent = updatedUser.name || "Guest";
  if (profileSummary) {
    profileSummary.textContent = "Manage your profile info, language, and notifications.";
  }
  if (profileAvatar) profileAvatar.src = getAvatarUrl(updatedUser);

  alert("Profile updated successfully.");
};

export const initSettingsPage = async () => {
  window.saveProfile = saveProfile;
  const languageSelect = document.getElementById("language-select");
  const notificationButton = document.getElementById("notification-button");
  const saveButton = document.getElementById("save-changes");
  const profileAvatar = document.getElementById("profile-avatar");
  const profileSummary = document.getElementById("profile-summary");
  const profileName = document.getElementById("profile-name");
  const profileEmail = document.getElementById("profile-email");
  const profilePhone = document.getElementById("profile-phone");
  const profileAddress = document.getElementById("profile-address");
  const profileRole = document.getElementById("profile-role");
  const profileCreated = document.getElementById("profile-created");
  const signOutButton = document.getElementById("setting-signout");
  const passwordForm = document.getElementById("password-form");
  const currentPasswordInput = document.getElementById("current-password");
  const newPasswordInput = document.getElementById("new-password");
  const confirmPasswordInput = document.getElementById("confirm-password");
  const profileForm = document.getElementById("profile-form");
  const profileNameInput = document.getElementById("profile-name-input");
  const profileEmailInput = document.getElementById("profile-email-input");
  const profilePhoneInput = document.getElementById("profile-phone-input");
  const profileAddressInput = document.getElementById("profile-address-input");
  const profileAvatarInput = document.getElementById("profile-avatar-input");

  const currentUser = getCurrentUser();
  if (profileSummary) {
    profileSummary.textContent = currentUser
      ? "Manage your profile info, language, and notifications."
      : "Not signed in. Your preferences will be stored locally.";
  }

  if (profileAvatar) {
    profileAvatar.src = getAvatarUrl(currentUser);
  }

  if (profileName) {
    profileName.textContent = currentUser?.name || "Guest";
  }

  if (profileEmail) {
    profileEmail.textContent = currentUser?.email || "-";
  }

  if (profilePhone) {
    profilePhone.textContent = currentUser?.phone || "-";
  }

  if (profileAddress) {
    profileAddress.textContent = currentUser?.address || "-";
  }

  if (profileRole) {
    profileRole.textContent = currentUser?.role || "-";
  }

  if (profileCreated) {
    profileCreated.textContent = currentUser?.created_at
      ? new Date(currentUser.created_at).toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        })
      : "-";
  }

  if (profileNameInput) {
    profileNameInput.value = currentUser?.name || "";
  }

  if (profileEmailInput) {
    profileEmailInput.value = currentUser?.email || "";
  }

  if (profilePhoneInput) {
    profilePhoneInput.value = currentUser?.phone || "";
  }

  if (profileAddressInput) {
    profileAddressInput.value = currentUser?.address || "";
  }

  if (profileAvatarInput) {
    profileAvatarInput.value = currentUser?.avatar || "";
  }

  if (signOutButton && signOutButton.dataset.bound !== "true") {
    signOutButton.dataset.bound = "true";
    signOutButton.addEventListener("click", () => {
      sessionStorage.removeItem("currentUser");
      localStorage.removeItem("currentUser");
      window.location.href = "src/pages/auth/login.html";
    });
  }

  if (profileForm && profileForm.dataset.bound !== "true") {
    profileForm.dataset.bound = "true";
    profileForm.addEventListener("submit", async (event) => {
      event.preventDefault();

      if (!currentUser) {
        alert("Please sign in to update your profile.");
        return;
      }

      const updatedUser = {
        ...currentUser,
        name: profileNameInput?.value?.trim() || currentUser.name,
        email: profileEmailInput?.value?.trim() || currentUser.email,
        phone: profilePhoneInput?.value?.trim() || currentUser.phone,
        address: profileAddressInput?.value?.trim() || currentUser.address,
        avatar: profileAvatarInput?.value?.trim() || currentUser.avatar,
      };

      const result = await updateUser(updatedUser);
      if (!result.success) {
        alert(result.message || "Unable to update profile.");
        return;
      }

      const storage = localStorage.getItem("currentUser")
        ? localStorage
        : sessionStorage;
      storage.setItem("currentUser", JSON.stringify(updatedUser));

      if (profileName) profileName.textContent = updatedUser.name || "Guest";
      if (profileEmail) profileEmail.textContent = updatedUser.email || "-";
      if (profilePhone) profilePhone.textContent = updatedUser.phone || "-";
      if (profileAddress) profileAddress.textContent = updatedUser.address || "-";
      if (profileAvatar) profileAvatar.src = getAvatarUrl(updatedUser);

      alert("Profile updated successfully.");
    });
  }

  if (passwordForm && passwordForm.dataset.bound !== "true") {
    passwordForm.dataset.bound = "true";
    passwordForm.addEventListener("submit", async (event) => {
      event.preventDefault();

      if (!currentUser) {
        alert("Please sign in to change your password.");
        return;
      }

      const currentValue = currentPasswordInput?.value || "";
      const newValue = newPasswordInput?.value || "";
      const confirmValue = confirmPasswordInput?.value || "";

      if (!currentValue || !newValue || !confirmValue) {
        alert("Please fill in all password fields.");
        return;
      }

      if (currentValue !== currentUser.password) {
        alert("Current password is incorrect.");
        return;
      }

      if (newValue.length < 6) {
        alert("New password must be at least 6 characters.");
        return;
      }

      if (newValue !== confirmValue) {
        alert("New passwords do not match.");
        return;
      }

      const updatedUser = { ...currentUser, password: newValue };
      const result = await updateUser(updatedUser);
      if (!result.success) {
        alert(result.message || "Unable to update password.");
        return;
      }

      const storage = localStorage.getItem("currentUser")
        ? localStorage
        : sessionStorage;
      storage.setItem("currentUser", JSON.stringify(updatedUser));

      if (currentPasswordInput) currentPasswordInput.value = "";
      if (newPasswordInput) newPasswordInput.value = "";
      if (confirmPasswordInput) confirmPasswordInput.value = "";

      alert("Password updated successfully.");
    });
  }

  const settings = await getSettings();
  languageSelect.value = settings.language;
  notificationButton.textContent = settings.notifications
    ? "Disable Notifications"
    : "Enable Notifications";

  languageSelect.addEventListener("change", async (e) => {
    const value = e.target.value;
    await setLanguage(value);
    alert(`Language changed to ${value}`);
  });

  notificationButton.addEventListener("click", async () => {
    const current = await getNotifications();
    const enabled = !current;
    const updated = await setNotifications(enabled);
    notificationButton.textContent = updated
      ? "Disable Notifications"
      : "Enable Notifications";

    if (updated) {
      if (Notification.permission === "granted") {
        new Notification("Notifications Enabled", {
          body: "You will now receive notifications.",
          icon: "/public/images/notification-icon.png",
        });
      } else if (Notification.permission !== "denied") {
        Notification.requestPermission().then((permission) => {
          if (permission === "granted") {
            new Notification("Notifications Enabled", {
              body: "You will now receive notifications.",
            });
          }
        });
      }
    } else {
      alert("Notifications disabled.");
    }
  });

  saveButton.addEventListener("click", async () => {
    const updatedSettings = {
      language: languageSelect.value,
      notifications: await getNotifications(),
    };
    await saveSettings(updatedSettings);
    alert("Settings saved!");
  });
};
