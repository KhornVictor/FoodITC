import {
  getSettings,
  saveSettings,
  setLanguage,
  setNotifications,
  getNotifications,
} from "../../services/Setting.js";
import { getCurrentUser } from "../utils/getme.js";

export const initSettingsPage = async () => {
  const languageSelect = document.getElementById("language-select");
  const notificationButton = document.getElementById("notification-button");
  const saveButton = document.getElementById("save-changes");
  const profileAvatar = document.getElementById("profile-avatar");
  const profileSummary = document.getElementById("profile-summary");

  const currentUser = getCurrentUser();
  if (profileSummary) {
    profileSummary.textContent = currentUser
      ? `Signed in as ${currentUser.name}`
      : "Not signed in. Your preferences will be stored locally.";
  }

  if (profileAvatar) {
    profileAvatar.src =
      currentUser?.avatar ||
      "https://img.freepik.com/free-icon/user_318-159711.jpg?w=740";
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