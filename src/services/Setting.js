const SETTINGS_STORAGE_KEY = "userSettings";

/**
 * Get user settings from localStorage
 * @returns {Object} Settings object with language and notification preferences
 */
export const getSettings = () => {
  const stored = localStorage.getItem(SETTINGS_STORAGE_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (error) {
      console.error("Unable to parse stored settings:", error);
    }
  }
  // Default settings
  return {
    language: "English",
    notifications: false
  };
};

/**
 * Save user settings to localStorage
 * @param {Object} settings - Settings object
 */
export const saveSettings = (settings) => {
  localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
};

/**
 * Set the language preference
 * @param {string} language - The selected language
 */
export const setLanguage = (language) => {
  const settings = getSettings();
  settings.language = language;
  saveSettings(settings);
};

/**
 * Get the current language
 * @returns {string} Current language
 */
export const getLanguage = () => {
  return getSettings().language;
};

/**
 * Set notification preference
 * @param {boolean} enabled - Whether notifications are enabled
 */
export const setNotifications = (enabled) => {
  const settings = getSettings();
  settings.notifications = enabled;
  saveSettings(settings);
};

/**
 * Get notification preference
 * @returns {boolean} Whether notifications are enabled
 */
export const getNotifications = () => {
  return getSettings().notifications;
};