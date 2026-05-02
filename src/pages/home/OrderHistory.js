/**
 * Render order history from localStorage
 */
const getStoredUser = () => {
  const storedUser =
    sessionStorage.getItem("currentUser") ||
    localStorage.getItem("currentUser");

  if (!storedUser) {
    return null;
  }

  try {
    const parsedUser = JSON.parse(storedUser);
    if (parsedUser && Number.isFinite(Number(parsedUser.user_id))) {
      return parsedUser;
    }
  } catch (error) {
    console.warn("Unable to parse stored user", error);
  }

  return null;
};

const fetchJson = async (path) => {
  try {
    const response = await fetch(path);
    if (!response.ok) {
      throw new Error(`Failed to fetch ${path}`);
    }
    return await response.json();
  } catch (error) {
    console.warn(`Fetch error for ${path}:`, error);
    return [];
  }
};

const formatOrderDate = (isoDate) => {
  const date = new Date(isoDate);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getStatusColor = (status) => {
  if (status === "delivered") return "#4CAF50";
  if (status === "confirmed") return "#2196F3";
  if (status === "cancelled") return "#ff6b6b";
  return "#FFA500";
};

const renderOrderDetail = async (root, orderId) => {
  const historyContent = root.querySelector(".history-content");
  if (!historyContent) {
    return;
  }

  const [orders, orderItems, menuItems, categories] = await Promise.all([
    fetchJson("/public/data/orders.json"),
    fetchJson("/public/data/order_items.json"),
    fetchJson("/public/data/menu_items.json"),
    fetchJson("/public/data/catgories.json"),
  ]);

  const order = orders.find((item) => item.order_id === orderId);
  if (!order) {
    historyContent.innerHTML = `
      <div style="padding: 40px; text-align: center; color: #999;">
        <p style="font-size: 16px;">Order not found</p>
      </div>
    `;
    return;
  }

  const itemsForOrder = orderItems.filter(
    (item) => item.order_id === order.order_id,
  );

  const categoryLookup = new Map(
    categories.map((category) => [category.category_id, category.name]),
  );

  const orderItemsHTML = itemsForOrder
    .map((item) => {
      const menuItem = menuItems.find((m) => m.item_id === item.item_id);
      const categoryName = menuItem
        ? categoryLookup.get(menuItem.category_id)
        : null;
      return `
        <div style="display: flex; gap: 12px; align-items: center; padding: 12px 0; border-bottom: 1px solid #eee;">
          <img
            src="${menuItem?.image_url || "https://via.placeholder.com/80"}"
            alt="${menuItem?.name || "Item"}"
            style="width: 70px; height: 70px; border-radius: 10px; object-fit: cover; background: #f5f5f5;"
          />
          <div style="flex: 1;">
            <p style="margin: 0; font-weight: 600;">${menuItem?.name || `Item ${item.item_id}`}</p>
            <p style="margin: 4px 0 0; font-size: 12px; color: #777;">${categoryName || "Uncategorized"}</p>
            <p style="margin: 6px 0 0; font-size: 12px; color: #999;">Qty: ${item.quantity}</p>
          </div>
          <strong style="font-size: 14px;">$${(item.price * item.quantity).toFixed(2)}</strong>
        </div>
      `;
    })
    .join("");

  historyContent.innerHTML = `
    <div style="margin-bottom: 20px; display: flex; align-items: center; gap: 10px;">
      <button type="button" id="order-history-back" style="border: none; background: #fff1e3; color: #8a3f00; padding: 8px 12px; border-radius: 999px; font-weight: 600; cursor: pointer;">← Back</button>
      <div>
        <h1 style="margin: 0;">Order #${order.order_id}</h1>
        <p style="margin: 4px 0 0; color: #666; font-size: 13px;">${formatOrderDate(order.created_at)}</p>
      </div>
      <span style="margin-left: auto; background: ${getStatusColor(order.status)}; color: #fff; padding: 6px 14px; border-radius: 999px; font-size: 12px; font-weight: 600; text-transform: capitalize;">${order.status}</span>
    </div>
    <div style="background: #fff; border: 1px solid #eee; border-radius: 12px; padding: 16px;">
      ${orderItemsHTML || "<p style=\"color:#999;\">No items found for this order.</p>"}
      <div style="display: flex; justify-content: space-between; margin-top: 16px; font-weight: 700;">
        <span>Total</span>
        <span>$${order.total_price.toFixed(2)}</span>
      </div>
    </div>
  `;

  const backButton = historyContent.querySelector("#order-history-back");
  if (backButton) {
    backButton.addEventListener("click", () => {
      void renderOrderHistory(root);
    });
  }
};

export const renderOrderHistory = async (root = document) => {
  const historyContent = root.querySelector(".history-content");

  if (!historyContent) {
    console.warn("History content element not found");
    return;
  }

  try {
    const user = getStoredUser();
    if (!user) {
      historyContent.innerHTML = `
        <div style="margin-bottom: 20px;">
          <h1>Order History</h1>
          <p style="color: #666; margin-bottom: 20px;">View all your orders below</p>
        </div>
        <div style="padding: 40px; text-align: center; color: #999;">
          <p style="font-size: 16px;">Please log in to view your order history</p>
        </div>
      `;
      return;
    }

    const orders = await fetchJson("/public/data/orders.json");

    // Fetch order items
    let orderItems = [];
    const storedOrderItems = localStorage.getItem("order_items");
    if (storedOrderItems) {
      orderItems = JSON.parse(storedOrderItems);
    }

    // Fetch menu items for details
    let menuItems = [];
    try {
      const response = await fetch("/public/data/menu_items.json");
      if (response.ok) {
        menuItems = await response.json();
      }
    } catch (error) {
      console.warn("Could not fetch menu items:", error);
    }

    // Build history content
    let html = `
      <div style="margin-bottom: 20px;">
        <h1>Order History</h1>
        <p style="color: #666; margin-bottom: 20px;">View all your orders below</p>
      </div>
    `;

    const userOrders = orders.filter(
      (order) => Number(order.user_id) === Number(user.user_id),
    );

    if (userOrders.length === 0) {
      html += `
        <div style="padding: 40px; text-align: center; color: #999;">
          <p style="font-size: 16px;">No orders yet</p>
          <p style="font-size: 14px;">Start ordering from the Food menu!</p>
        </div>
      `;
    } else {
      // Sort orders by date (newest first)
      userOrders.sort(
        (a, b) => new Date(b.created_at) - new Date(a.created_at),
      );

      userOrders.forEach((order) => {
        const itemsForOrder = orderItems.filter((item) => item.order_id === order.order_id);
        const orderItemsHTML = itemsForOrder
          .map((item) => {
            const menuItem = menuItems.find((m) => m.item_id === item.item_id);
            const itemName = menuItem ? menuItem.name : `Item ${item.item_id}`;
            return `<span style="display: block; font-size: 12px; color: #666;">• ${itemName} x${item.quantity}</span>`;
          })
          .join("");

        const date = formatOrderDate(order.created_at);
        const statusColor = getStatusColor(order.status);

        html += `
          <div style="
            border: 1px solid #ddd;
            border-radius: 8px;
            padding: 15px;
            margin-bottom: 15px;
            background: #f9f9f9;
          " data-order-id="${order.order_id}">
            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 10px;">
              <div>
                <p style="margin: 0; font-weight: bold; font-size: 14px;">Order #${order.order_id}</p>
                <p style="margin: 5px 0 0 0; font-size: 12px; color: #999;">${date}</p>
              </div>
              <span style="
                background: ${statusColor};
                color: white;
                padding: 4px 12px;
                border-radius: 4px;
                font-size: 12px;
                font-weight: bold;
                text-transform: capitalize;
              ">${order.status}</span>
            </div>
            <div style="margin: 10px 0; font-size: 12px; line-height: 1.6;">
              ${orderItemsHTML}
            </div>
            <div style="
              border-top: 1px solid #ddd;
              padding-top: 10px;
              margin-top: 10px;
              display: flex;
              justify-content: space-between;
              align-items: center;
            ">
              <span style="font-size: 12px; color: #666;">${itemsForOrder.length} item${itemsForOrder.length !== 1 ? "s" : ""}</span>
              <span style="font-weight: bold; font-size: 14px;">$${order.total_price.toFixed(2)}</span>
            </div>
          </div>
        `;
      });
    }

    historyContent.innerHTML = html;

    const orderCards = historyContent.querySelectorAll("[data-order-id]");
    orderCards.forEach((card) => {
      card.addEventListener("click", () => {
        const orderId = Number(card.dataset.orderId);
        if (Number.isFinite(orderId)) {
          void renderOrderDetail(root, orderId);
        }
      });
    });
  } catch (error) {
    console.error("Error rendering order history:", error);
    historyContent.innerHTML = `
      <div style="padding: 40px; text-align: center; color: #ff6b6b;">
        <p style="font-size: 16px;">Error loading order history</p>
        <p style="font-size: 12px; color: #999;">${error.message}</p>
      </div>
    `;
  }
};

/**
 * Initialize order history page
 */
export const initOrderHistory = async (root = document) => {
  console.log("Order history page initialized");
  await renderOrderHistory(root);
};
