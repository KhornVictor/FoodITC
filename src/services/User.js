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

const getNextUserId = (users) => {
  if (!Array.isArray(users) || users.length === 0) {
    return 1;
  }

  const maxId = users.reduce((max, user) => {
    const value = Number(user?.user_id);
    if (Number.isFinite(value)) {
      return Math.max(max, value);
    }
    return max;
  }, 0);

  return maxId + 1;
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

export const createUser = async (payload) => {
  const firstName = String(payload?.firstName || "").trim();
  const lastName = String(payload?.lastName || "").trim();
  const email = String(payload?.email || "").trim();
  const password = String(payload?.password || "").trim();
  const phone = String(payload?.phone || "").trim();

  if (!firstName || !lastName || !email || !password || !phone) {
    return { success: false, user: null, message: "Missing required fields" };
  }

  const users = await fetchUsers();
  const emailExists = users.some(
    (user) => String(user?.email || "").toLowerCase() === email.toLowerCase(),
  );

  if (emailExists) {
    return { success: false, user: null, message: "Email already registered" };
  }

  const newUser = {
    user_id: getNextUserId(users),
    name: `${firstName} ${lastName}`.trim(),
    email,
    password,
    phone,
    address: "",
    avatar:
      "https://static.vecteezy.com/system/resources/previews/013/360/247/non_2x/default-avatar-photo-icon-social-media-profile-sign-symbol-vector.jpg",
    role: "customer",
    created_at: new Date().toISOString(),
  };

  const nextUsers = [...users, newUser];
  persistUsers(nextUsers);

  return { success: true, user: newUser, message: "User created" };
};
