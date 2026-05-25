const AUTH_STORAGE_KEY = "currentUser";

export const getCurrentUser = () => {
  const storedUser =
    localStorage.getItem(AUTH_STORAGE_KEY) ||
    sessionStorage.getItem(AUTH_STORAGE_KEY);

  console.log(storedUser);

  if (!storedUser) {
    return null;
  }

  try {
    const parsedUser = JSON.parse(storedUser);

    if (parsedUser && Number.isFinite(Number(parsedUser.user_id))) {
      return parsedUser;
    }

    return null;
  } catch (error) {
    console.warn("Unable to parse stored user:", error);
    return null;
  }
};

export const isLoggedIn = () => {
  return getCurrentUser() !== null;
};

export const getCurrentUserId = () => {
  const user = getCurrentUser();
  return user ? Number(user.user_id) : null;
};

export const hasValidUserId = () => {
  return Number.isFinite(getCurrentUserId());
};
