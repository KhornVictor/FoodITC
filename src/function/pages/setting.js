import { getSettings, saveSettings, setLanguage, getLanguage, setNotifications, getNotifications } from "../../services/Setting.js";

export const initSettingsPage = () => {
  const languageSelect = document.getElementById("language-select");
  const notificationButton = document.getElementById("notification-button");
  const saveButton = document.getElementById("save-changes");

  // Load current settings
  const settings = getSettings();
  languageSelect.value = settings.language;
  notificationButton.textContent = settings.notifications ? "Disable Notifications" : "Enable Notifications";

  // Handle language change
  languageSelect.addEventListener("change", (e) => {
    setLanguage(e.target.value);
    // Optionally, you can add logic to change the UI language here
    alert(`Language changed to ${e.target.value}`);
  });

  // Handle notification button
  notificationButton.addEventListener("click", () => {
    const current = getNotifications();
    setNotifications(!current);
    notificationButton.textContent = !current ? "Disable Notifications" : "Enable Notifications";
    if (!current) {
      // Show a test notification
      if (Notification.permission === "granted") {
        new Notification("Notifications Enabled", {
          body: "You will now receive notifications.",
          icon: "/public/images/notification-icon.png" // Assuming an icon exists
        });
      } else if (Notification.permission !== "denied") {
        Notification.requestPermission().then(permission => {
          if (permission === "granted") {
            new Notification("Notifications Enabled", {
              body: "You will now receive notifications."
            });
          }
        });
      }
    } else {
      alert("Notifications disabled.");
    }
  });

  // Handle save changes (though changes are saved immediately)
  saveButton.addEventListener("click", () => {
    alert("Settings saved!");
  });
};