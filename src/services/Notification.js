export async function fetchNotifications() {
  const response = await fetch("/data/notification.json");

  if (!response.ok) {
    throw new Error("Failed to fetch notifications");
  }

  return response.json();
}
