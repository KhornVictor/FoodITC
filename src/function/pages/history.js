import { fetchOrders, fetchMenuItems } from "../../services/Order.js";
import { fetchOrderItems } from "../../services/OrderItems.js";
import {
  getCurrentUser,
  getCurrentUserId,
  hasValidUserId,
} from "../utils/getme.js";

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

const formatDateTime = (value) => {
  if (!value) return "Unknown date";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
};

const getStatusLabel = (status = "") => {
  const normalizedStatus = String(status).toLowerCase();

  switch (normalizedStatus) {
    case "delivered":
      return { label: "Delivered", className: "is-delivered" };
    case "confirmed":
      return { label: "Confirmed", className: "is-confirmed" };
    case "pending":
      return { label: "Pending", className: "is-pending" };
    case "cancelled":
      return { label: "Cancelled", className: "is-cancelled" };
    default:
      return { label: status || "Unknown", className: "is-unknown" };
  }
};

const groupItemsByOrder = (items = []) => {
  return items.reduce((accumulator, item) => {
    const orderId = Number(item.order_id);
    if (!accumulator.has(orderId)) accumulator.set(orderId, []);
    accumulator.get(orderId).push(item);
    return accumulator;
  }, new Map());
};

const getOrderTotalItems = (items = []) => {
  return items.reduce((total, item) => total + Number(item.quantity || 0), 0);
};

const getOrderItemTotal = (item) => {
  return Number(item.quantity || 0) * Number(item.price || 0);
};

const renderEmptyState = (message, actionLabel = "") => {
  return `
    <div class="history-empty-state">
      <i class="fa-solid fa-receipt" aria-hidden="true"></i>
      <h2>${message}</h2>
      ${actionLabel ? `<p>${actionLabel}</p>` : ""}
    </div>
  `;
};

const renderOrderCard = (order, orderItems = []) => {
  const statusInfo = getStatusLabel(order.status);
  const totalItems = getOrderTotalItems(orderItems);


  return `
    <article class="history-order-card ${statusInfo.className}" data-order-id="${order.order_id}" style="cursor: pointer;">
      <div class="history-order-card__header">
        <div>
          <p class="history-order-card__label">Order #${order.order_id}</p>
          <h2>${currencyFormatter.format(Number(order.total_price || 0))}</h2>
        </div>
        <span class="history-order-card__status">${statusInfo.label}</span>
      </div>

      <div class="history-order-card__meta">
        <p><i class="fa-regular fa-calendar" aria-hidden="true"></i> ${formatDateTime(order.created_at)}</p>
        <p><i class="fa-solid fa-location-dot" aria-hidden="true"></i> ${order.address || "No address provided"}</p>
        <p><i class="fa-solid fa-bag-shopping" aria-hidden="true"></i> ${totalItems} item${totalItems === 1 ? "" : "s"}</p>
      </div>

    </article>
  `;
};

const createOrderDetailCard = async (
  order,
  orderItems = [],
  menuItems = [],
) => {
  const container = document.createElement("section");
  container.className = "history-detail-page";

  const statusInfo = getStatusLabel(order.status);
  const totalItems = getOrderTotalItems(orderItems);

  const itemsWithDetails = orderItems.map((item) => {
    const menuItem =
      menuItems.find((menu) => Number(menu.item_id) === Number(item.item_id)) ||
      {};

    return {
      ...item,
      ...menuItem,
      itemTotal: getOrderItemTotal(item),
    };
  });

  const itemsGridMarkup = itemsWithDetails
    .map((item) => {
      const title = item.name || `Item #${item.item_id}`;
      const image =
        item.image_url || "https://via.placeholder.com/200?text=No+Image";

      return `
        <article class="order-detail-item-card">
          <div class="order-detail-item-image">
            <img src="${image}" alt="${title}" onError="this.src='https://via.placeholder.com/200?text=No+Image'" />
          </div>
          <div class="order-detail-item-body">
            <h3>${title}</h3>
            <p class="order-detail-item-desc">${item.description || ""}</p>
            <div class="order-detail-item-footer">
              <span class="order-detail-item-qty">${item.quantity} x ${currencyFormatter.format(Number(item.price || 0))}</span>
              <strong class="order-detail-item-total">${currencyFormatter.format(item.itemTotal)}</strong>
            </div>
          </div>
        </article>
      `;
    })
    .join("");

  container.innerHTML = `
    <div class="history-detail-header">
      <h1>Order #${order.order_id}</h1>
    </div>

    <div class="history-detail-order-info">
      <div class="detail-info-card">
        <div class="detail-info-row">
          <span class="detail-info-label">Status</span>
          <span class="detail-info-value">
            <span class="history-order-card__status ${statusInfo.className}">${statusInfo.label}</span>
          </span>
        </div>
        <div class="detail-info-row">
          <span class="detail-info-label">Order Date</span>
          <span class="detail-info-value"><i class="fa-regular fa-calendar"></i> ${formatDateTime(order.created_at)}</span>
        </div>
        <div class="detail-info-row">
          <span class="detail-info-label">Delivery Address</span>
          <span class="detail-info-value"><i class="fa-solid fa-location-dot"></i> ${order.address || "Not provided"}</span>
        </div>
        <div class="detail-info-row">
          <span class="detail-info-label">Total Amount</span>
          <span class="detail-info-value detail-info-total">${currencyFormatter.format(Number(order.total_price || 0))}</span>
        </div>
      </div>
    </div>

    <div class="history-detail-items">
      <h2>Order Items (${totalItems})</h2>
      <div class="order-detail-items-grid">
        ${itemsGridMarkup || `<p class="history-empty-state">No item details available.</p>`}
      </div>
    </div>
  `;

  return container;
};

const renderDetailView = async (root, orderId) => {
  const historyDetailRoot = root.querySelector(".history-detail-body");
  if (!historyDetailRoot) return false;

  const currentUser = getCurrentUser();
  if (!currentUser) {
    historyDetailRoot.innerHTML = renderEmptyState(
      "Please log in to view order details",
      "Your order history is saved with your account.",
    );
    return false;
  }

  const [orders, orderItems, menuItems] = await Promise.all([
    fetchOrders(),
    fetchOrderItems(),
    fetchMenuItems(),
  ]);

  const userId = getCurrentUserId();
  const userOrders = orders.filter(
    (order) => Number(order.user_id) === Number(userId),
  );
  const selectedOrder = userOrders.find(
    (order) => Number(order.order_id) === Number(orderId),
  );

  if (!selectedOrder) {
    historyDetailRoot.innerHTML =
      '<p class="component-error">Order not found.</p>';
    return false;
  }

  const itemsByOrder = groupItemsByOrder(orderItems);
  const selectedItems = itemsByOrder.get(Number(orderId)) || [];

  historyDetailRoot.innerHTML = "";

  const backBtn = document.createElement("button");
  backBtn.className = "history-detail-back";
  backBtn.textContent = "← Back to Orders";
  backBtn.addEventListener("click", () => {
    history.pushState({ page: "history" }, "", "?page=history");
    if (typeof window.renderSidebarRoute === "function") {
      void window.renderSidebarRoute("history");
    }
  });

  const detailedCard = await createOrderDetailCard(
    selectedOrder,
    selectedItems,
    menuItems,
  );
  historyDetailRoot.append(backBtn, detailedCard);
  window.scrollTo(0, 0);
  return true;
};

const renderListView = async (root) => {
  const historyContainer = root.querySelector("#history-content") || root;
  if (!historyContainer) return false;

  const currentUser = getCurrentUser();
  if (!currentUser || !hasValidUserId()) {
    historyContainer.innerHTML = `
      <section class="history-page">
        <div class="history-page__header">
          <p class="history-page__kicker">Orders</p>
          <h1>Order History</h1>
          <p class="history-page__subtitle">Please log in to view your order history.</p>
        </div>
      </section>
    `;
    return false;
  }

  historyContainer.innerHTML = `
    <section class="history-page__loading" aria-live="polite">
      Loading order history...
    </section>
  `;

  const [orders, orderItems] = await Promise.all([
    fetchOrders(),
    fetchOrderItems(),
  ]);
  const userId = getCurrentUserId();

  const visibleOrders = orders.filter(
    (order) => Number(order.user_id) === Number(userId),
  );
  const itemsByOrder = groupItemsByOrder(orderItems);

  const totalSpent = visibleOrders.reduce(
    (sum, order) => sum + Number(order.total_price || 0),
    0,
  );
  const deliveredOrders = visibleOrders.filter(
    (order) => String(order.status).toLowerCase() === "delivered",
  ).length;
  const pendingOrders = visibleOrders.filter((order) => {
    const status = String(order.status).toLowerCase();
    return status === "pending" || status === "confirmed";
  }).length;

  const headerNote = `Showing orders for ${currentUser?.name || "your account"}.`;

  if (visibleOrders.length === 0) {
    historyContainer.innerHTML = `
      <section class="history-page">
        <div class="history-page__header">
          <p class="history-page__kicker">Orders</p>
          <h1>Order History</h1>
          <p class="history-page__subtitle">${headerNote}</p>
        </div>
        ${renderEmptyState("No orders found for this account.", "Place an order to see it appear here.")}
      </section>
    `;
    return true;
  }

  historyContainer.innerHTML = `
    <section class="history-page">
      <div class="history-page__header">
        <p class="history-page__kicker">Orders</p>
        <h1>Order History</h1>
        <p class="history-page__subtitle">${headerNote}</p>
      </div>

      <div class="history-stats" aria-label="Order summary">
        <article class="history-stat-card">
          <span class="history-stat-card__value">${visibleOrders.length}</span>
          <span class="history-stat-card__label">Total orders</span>
        </article>
        <article class="history-stat-card">
          <span class="history-stat-card__value">${deliveredOrders}</span>
          <span class="history-stat-card__label">Delivered</span>
        </article>
        <article class="history-stat-card">
          <span class="history-stat-card__value">${pendingOrders}</span>
          <span class="history-stat-card__label">Pending</span>
        </article>
        <article class="history-stat-card history-stat-card--highlight">
          <span class="history-stat-card__value">${currencyFormatter.format(totalSpent)}</span>
          <span class="history-stat-card__label">Total spent</span>
        </article>
      </div>

      <div class="history-orders">
        ${visibleOrders
          .sort(
            (left, right) =>
              new Date(right.created_at).getTime() -
              new Date(left.created_at).getTime(),
          )
          .map((order) =>
            renderOrderCard(
              order,
              itemsByOrder.get(Number(order.order_id)) || [],
            ),
          )
          .join("")}
      </div>
    </section>
  `;

  const orderCards = historyContainer.querySelectorAll(
    ".history-order-card[data-order-id]",
  );
  orderCards.forEach((card) => {
    card.addEventListener("click", () => {
      const orderId = Number(card.dataset.orderId);
      history.pushState(
        { page: "history", orderId },
        "",
        `?page=history&orderId=${orderId}`,
      );
      if (typeof window.renderSidebarRoute === "function") {
        void window.renderSidebarRoute("history");
      }
    });
  });

  return true;
};

export const initOrderHistory = async (root = document) => {
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const orderId = Number(urlParams.get("orderId"));

    if (orderId && root.querySelector(".history-detail-body")) {
      return await renderDetailView(root, orderId);
    }

    return await renderListView(root);
  } catch (error) {
    console.error("Error rendering order history:", error);

    const historyContainer = root.querySelector("#history-content") || root;
    if (historyContainer) {
      historyContainer.innerHTML = `
        <section class="history-page">
          <div class="history-page__header">
            <p class="history-page__kicker">Orders</p>
            <h1>Order History</h1>
          </div>
          ${renderEmptyState("Unable to load order history.", "Please try again later.")}
        </section>
      `;
    }

    return false;
  }
};
