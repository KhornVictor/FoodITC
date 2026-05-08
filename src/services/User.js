const USERS_DATA_URL = "/public/data/users.json";
const USERS_STORAGE_KEY = "usersData";

const readStoredUsers = () => {
  const stored = localStorage.getItem(USERS_STORAGE_KEY);
  if (!stored) {
    return null;
  }

  try {
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : null;
  } catch (error) {
    console.warn("Unable to parse stored users:", error);
    return null;
  }
};

const persistUsers = (users) => {
  if (!Array.isArray(users)) {
    return;
  }
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
};

export const fetchUsers = async () => {
  const storedUsers = readStoredUsers();
  if (storedUsers) {
    return storedUsers;
  }

  return fetch(USERS_DATA_URL)
    .then((response) => {
      if (!response.ok) throw new Error(`Failed to load users: ${response.statusText}`);
      return response.json();
    })
    .then((data) => {
      if (!Array.isArray(data)) {
        return [];
      }
      persistUsers(data);
      return data;
    })
    .catch((error) => {
      console.error(`Error fetching users: ${error.message}`);
      return [];
    });
};

export const authenticateUser = async (email, password) => {
  const emailValue = String(email || "").trim();
  const passwordValue = String(password || "").trim();

  const users = await fetchUsers();
  for (const user of users) {
    if (user.email.toLowerCase() === emailValue.toLowerCase()) {
      if (String(user.password) === passwordValue) {
        console.log(`User ${user.email} authenticated successfully`);
        return { success: true, user, message: "Authentication successful" };
      }
      return { success: false, user: null, message: "Incorrect password" };
    }
  }
  return { success: false, user: null, message: "User not found" };
};

export const updateUser = async (updatedUser) => {
  if (!updatedUser || !Number.isFinite(Number(updatedUser.user_id))) {
    return { success: false, user: null, message: "Invalid user" };
  }

  const users = await fetchUsers();
  const nextUsers = users.map((user) =>
    Number(user.user_id) === Number(updatedUser.user_id) ? { ...user, ...updatedUser } : user,
  );

  persistUsers(nextUsers);
  const savedUser = nextUsers.find(
    (user) => Number(user.user_id) === Number(updatedUser.user_id),
  );

  return {
    success: Boolean(savedUser),
    user: savedUser || null,
    message: savedUser ? "User updated" : "User not found",
  };
};
