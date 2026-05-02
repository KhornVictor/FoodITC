/**
 * Render order history from localStorage
 */
export const renderOrderHistory = async (root = document) => {
  const historyContent = root.querySelector(".history-content");

  if (!historyContent) {
    console.warn("History content element not found");
    return;
  }

  try {
    // Fetch orders from localStorage
    let orders = [];
    const storedOrders = localStorage.getItem("orders");
    if (storedOrders) {
      orders = JSON.parse(storedOrders);
    }

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

    if (orders.length === 0) {
      html += `
        <div style="padding: 40px; text-align: center; color: #999;">
          <p style="font-size: 16px;">No orders yet</p>
          <p style="font-size: 14px;">Start ordering from the Food menu!</p>
        </div>
      `;
    } else {
      // Sort orders by date (newest first)
      orders.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      orders.forEach((order) => {
        const itemsForOrder = orderItems.filter((item) => item.order_id === order.order_id);
        const orderItemsHTML = itemsForOrder
          .map((item) => {
            const menuItem = menuItems.find((m) => m.item_id === item.item_id);
            const itemName = menuItem ? menuItem.name : `Item ${item.item_id}`;
            return `<span style="display: block; font-size: 12px; color: #666;">• ${itemName} x${item.quantity}</span>`;
          })
          .join("");

        const date = new Date(order.created_at).toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });

        const statusColor =
          order.status === "delivered"
            ? "#4CAF50"
            : order.status === "confirmed"
              ? "#2196F3"
              : order.status === "cancelled"
                ? "#ff6b6b"
                : "#FFA500"; // pending

        html += `
          <div style="
            border: 1px solid #ddd;
            border-radius: 8px;
            padding: 15px;
            margin-bottom: 15px;
            background: #f9f9f9;
          ">
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
