import { getCurrentUserId } from "../function/utils/getme.js";

const SETTINGS_FILE_URL = "/public/data/setting.json";
const SETTINGS_STORAGE_PREFIX = "userSettings:";
const DEFAULT_SETTINGS = {
  language: "English",
  notifications: false,
};
let cachedDefaultSettings = null;

const getSettingsStorageKey = (userId) => {
  if (Number.isFinite(Number(userId))) {
    return `${SETTINGS_STORAGE_PREFIX}${userId}`;
  }
  return `${SETTINGS_STORAGE_PREFIX}guest`;
};

const getStoredSettings = (userId) => {
  const key = getSettingsStorageKey(userId);
  const stored = localStorage.getItem(key);
  if (!stored) {
    return null;
  }

  try {
    return JSON.parse(stored);
  } catch (error) {
    console.error("Unable to parse stored settings:", error);
    return null;
  }
};

const loadDefaultSettings = async () => {
  if (cachedDefaultSettings) {
    return cachedDefaultSettings;
  }

  try {
    const response = await fetch(SETTINGS_FILE_URL);
    if (!response.ok) {
      throw new Error(`Failed to load default settings: ${response.statusText}`);
    }

    const data = await response.json();
    const defaults = data?.defaultSettings ?? DEFAULT_SETTINGS;
    cachedDefaultSettings = {
      language: defaults.language || DEFAULT_SETTINGS.language,
      notifications: Boolean(defaults.notifications),
    };
    return cachedDefaultSettings;
  } catch (error) {
    console.warn("Unable to load setting defaults from file, using fallback:", error);
    cachedDefaultSettings = DEFAULT_SETTINGS;
    return DEFAULT_SETTINGS;
  }
};

export const getSettings = async () => {
  const userId = getCurrentUserId();
  const storedSettings = getStoredSettings(userId);
  if (storedSettings) {
    return storedSettings;
  }

  return await loadDefaultSettings();
};

export const saveSettings = async (settings) => {
  const userId = getCurrentUserId();
  const key = getSettingsStorageKey(userId);
  localStorage.setItem(key, JSON.stringify(settings));
  return settings;
};

export const setLanguage = async (language) => {
  const settings = await getSettings();
  const next = { ...settings, language };
  await saveSettings(next);
  return next;
};

export const getLanguage = async () => {
  const settings = await getSettings();
  return settings.language;
};

export const setNotifications = async (enabled) => {
  const settings = await getSettings();
  const next = { ...settings, notifications: Boolean(enabled) };
  await saveSettings(next);
  return next.notifications;
};

export const getNotifications = async () => {
  const settings = await getSettings();
  return Boolean(settings.notifications);
};