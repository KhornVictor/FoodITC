const USERS_DATA_URL = "/public/data/users.json";

export const fetchUsers = async () => {
  return fetch(USERS_DATA_URL)
    .then((response) => {
      if (!response.ok) throw new Error(`Failed to load users: ${response.statusText}`);
      return response.json();
    })
    .then((data) => {
      if (!Array.isArray(data)) {
        return [];
      }
      console.log(data);
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
