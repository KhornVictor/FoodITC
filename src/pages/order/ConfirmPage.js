import {
  getUserCartItems,
  calculateCartTotal,
  checkoutCart,
} from "../../services/Cart.js";
import * as CartPageModule from "./CartPage.js";

const AUTH_STORAGE_KEY = "currentUser";
const DEFAULT_MAP_COORDS = "11.5738261,104.8988252";
const DEFAULT_MAP_IFRAME_URL =
  "https://www.google.com/maps/@11.5738261,104.8988252,7249m/data=!3m1!1e3?entry=ttu&g_ep=EgoyMDI2MDUwMi4wIKXMDSoASAFQAw%3D%3D&output=embed";
const RESPONSIVE_BREAKPOINT = 1024;

const toggleFullscreenMode = (enabled) => {
  const contentArea = document.querySelector("#content-area");
  const topBar = document.querySelector(".top-bar");

  if (contentArea) {
    contentArea.classList.toggle("is-fullscreen", enabled);
  }

  if (topBar) {
    topBar.classList.toggle("top-bar--hidden", enabled);
  }
};

const getConfirmMount = (root = document) => {
  const isResponsive = window.matchMedia(
    `(max-width: ${RESPONSIVE_BREAKPOINT}px)`,
  ).matches;

  if (isResponsive) {
    const contentArea =
      document.querySelector("#content-area") ||
      root.querySelector?.("#content-area") ||
      root;
    return { mount: contentArea, isResponsive };
  }

  const rightSidebar = document.querySelector("#right-side-bar");
  return { mount: rightSidebar, isResponsive };
};

/**
 * Get current promo discount from CartPage
 */
const getPromoDiscount = () => {
  return CartPageModule.currentPromoDiscount;
};

/**
 * Get the currently logged-in user
 */
const getStoredUser = () => {
  const storedUser =
    sessionStorage.getItem(AUTH_STORAGE_KEY) ||
    localStorage.getItem(AUTH_STORAGE_KEY);

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

/**
 * Render the order summary
 */
const renderOrderSummary = async (root = document) => {
  const summaryList = root.querySelector(".order-summary-list");
  if (!summaryList) return;

  try {
    const cartItems = await getUserCartItems();

    if (cartItems.length === 0) {
      summaryList.innerHTML = '<p style="color: #999; font-size: 11px; margin: 0;">No items in your order.</p>';
      return;
    }

    let html = "";
    cartItems.forEach((item) => {
      const itemTotal = (item.price * item.quantity).toFixed(2);
      html += `
        <div style="display: flex; justify-content: space-between; align-items: flex-start; padding: 6px 0; border-bottom: 1px solid #e0e0e0; font-size: 11px;">
          <div style="flex: 1;">
            <p style="margin: 0; font-weight: 500; color: #222;">${item.name}</p>
            <p style="margin: 2px 0 0 0; color: #999;">Qty: ${item.quantity}</p>
          </div>
          <div style="font-weight: 600; color: #222; text-align: right;">$${itemTotal}</div>
        </div>
      `;
    });

    summaryList.innerHTML = html;
  } catch (error) {
    console.error("Error rendering order summary:", error);
    summaryList.innerHTML = '<p style="color: #d32f2f; font-size: 11px; margin: 0;">Error loading order.</p>';
  }
};

/**
 * Render the price breakdown
 */
const renderPriceBreakdown = async (root = document) => {
  const breakdownDiv = root.querySelector(".price-breakdown");
  if (!breakdownDiv) return;

  try {
    const promoDiscount = getPromoDiscount();
    const totals = await calculateCartTotal(promoDiscount);

    let html = `
      <div style="display: flex; justify-content: space-between; padding: 4px 0; font-size: 11px; color: #666;">
        <span>Subtotal</span>
        <span>$${totals.subtotal.toFixed(2)}</span>
      </div>
    `;

    if (promoDiscount > 0) {
      html += `
        <div style="display: flex; justify-content: space-between; padding: 4px 0; font-size: 11px; color: #2e7d32;">
          <span>Discount (${(promoDiscount * 100).toFixed(0)}%)</span>
          <span>-$${totals.discount.toFixed(2)}</span>
        </div>
      `;
    }

    html += `
      <div style="display: flex; justify-content: space-between; padding: 4px 0; font-size: 11px; color: #666;">
        <span>Delivery</span>
        <span>$${totals.delivery.toFixed(2)}</span>
      </div>
      <div style="display: flex; justify-content: space-between; padding: 4px 0; font-size: 11px; color: #666;">
        <span>Tax</span>
        <span>$${totals.tax.toFixed(2)}</span>
      </div>
      <div style="display: flex; justify-content: space-between; padding: 6px 0; margin-top: 4px; border-top: 1px solid #ddd; font-weight: 600; font-size: 12px; color: #222;">
        <span>Total</span>
        <span>$${totals.total.toFixed(2)}</span>
      </div>
    `;

    breakdownDiv.innerHTML = html;
  } catch (error) {
    console.error("Error rendering price breakdown:", error);
    breakdownDiv.innerHTML = '<p style="color: #d32f2f; font-size: 11px; margin: 0;">Error loading prices.</p>';
  }
};

/**
 * Validate delivery address form
 */
const validateAddressForm = (root = document) => {
  const address = root.querySelector("#address").value.trim();

  if (!address) {
    return { valid: false, message: "Please enter a delivery address." };
  }

  return { valid: true, message: "" };
};

/**
 * Render map preview in the placeholder
 */
const renderMapPreview = (root = document) => {
  const mapPlaceholder = root.querySelector("#map-placeholder");
  if (!mapPlaceholder) return;

  const addressInput = root.querySelector("#address");
  const useCurrent = root.querySelector("#use-current-address");
  const addressValue = addressInput ? addressInput.value.trim() : "";
  const useCurrentAddress = useCurrent ? useCurrent.checked : false;

  let mapQuery = "";
  if (addressValue) {
    mapQuery = encodeURIComponent(addressValue);
  } else if (useCurrentAddress) {
    mapQuery = DEFAULT_MAP_COORDS;
  }

  let mapSrc = "";

  if (!mapQuery) {
    mapPlaceholder.innerHTML = `
    
      <iframe width="100%" height="200px" allow="geolocation" src="https://api.maptiler.com/maps/streets-v4/?key=DJviJgYI994IPUW8SOvN#-0.2/11.5743994/104.9036486"></iframe>
    
    `;
    return;
  }

  if (mapQuery === DEFAULT_MAP_COORDS) {
    mapSrc = DEFAULT_MAP_IFRAME_URL;
  } else {
    mapSrc = `https://api.maptiler.com/maps/streets-v4/?key=DJviJgYI994IPUW8SOvN#-0.2/11.5743994/104.9036486`;
  }
  mapPlaceholder.innerHTML = `
    <iframe width="100%" height="200px" allow="geolocation" src="https://api.maptiler.com/maps/streets-v4/?key=DJviJgYI994IPUW8SOvN#-0.2/11.5743994/104.9036486"></iframe>
  `;
};

/**
 * Create and insert the confirmation page HTML structure (compact version)
 */
const createConfirmPageStructure = (root) => {
  const html = `
    <div style="height: 100%; overflow-y: auto; display: flex; justify-content: center;">
  <div style="width: 100%; max-width: 360px; display: flex; flex-direction: column; gap: 12px;">

    <!-- HEADER -->
    <div style="text-align: center; margin-bottom: 4px;">
      <h2 style="margin: 0; font-size: 20px; font-weight: 700; color: #222;">Order Confirmation</h2>
      <p style="margin: 4px 0 0; font-size: 12px; color: #777;">Review your order before placing it</p>
    </div>

    <!-- ORDER SUMMARY -->
    <div style="background: #fff; border-radius: 12px; padding: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
      <p style="margin: 0 0 8px; font-size: 12px; font-weight: 600; color: #666;">Order Summary</p>
      <div class="order-summary-list" style="font-size: 12px; color: #333;"></div>
    </div>

    <!-- DELIVERY -->
    <div style="display: flex; flex-direction: column; gap: 12px; background: #fff; border-radius: 12px; padding: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">

      <p style="margin: 0 0 8px; font-size: 12px; font-weight: 600; color: #666;">Delivery Address</p>

      <!-- MAP -->
      <div id="map-placeholder" style="width: 100%; height: 180px; background: #e9ecef; border-radius: 10px; margin-bottom: 10px; display: flex; align-items: center; justify-content: center; color: #999; font-size: 11px; border: 1px solid #ddd; overflow: hidden;">
        Map Preview
      </div>

      <!-- INPUT -->
      <input type="text" id="address" placeholder="Enter delivery address"
        style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 8px; font-size: 12px; margin-bottom: 10px; outline: none;" />

      <!-- CHECKBOX -->
      <label style="display: flex; align-items: center; gap: 8px; font-size: 12px; color: #333;">
        <input type="checkbox" id="use-current-address" />
        Use my current address
      </label>
    </div>

    <!-- PAYMENT -->
    <div style="background: #fff; border-radius: 12px; padding: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">

      <p style="margin: 0 0 10px; font-size: 12px; font-weight: 600; color: #666;">Payment Method</p>

      <label style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px; font-size: 12px;">
        <input type="radio" name="payment-method" value="qr" checked />
        QR Code
      </label>

      <label style="display: flex; align-items: center; gap: 8px; margin-bottom: 10px; font-size: 12px;">
        <input type="radio" name="payment-method" value="cash" />
        Cash
      </label>

      <div style="border-top: 1px solid #eee; padding-top: 10px;">

        <p style="margin: 0 0 8px; font-size: 12px; font-weight: 600; color: #666;">Payment Timing</p>

        <label style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px; font-size: 12px;">
          <input type="radio" name="payment-timing" value="arrival" checked />
          Pay on Arrival
        </label>

        <label style="display: flex; align-items: center; gap: 8px; font-size: 12px;">
          <input type="radio" name="payment-timing" value="now" />
          Pay Now
        </label>
      </div>

      <div id="payment-alert" style="margin-top: 10px; padding: 8px; background: #ffe5e5; border: 1px solid #ffb3b3; border-radius: 8px; color: #c62828; font-size: 11px; display: none; text-align: center;">
        ⚠ Cash payment only available for "Pay on Arrival"
      </div>
    </div>

    <!-- PRICE -->
    <div style="background: #fff; border-radius: 12px; padding: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); font-size: 12px;">
      <div class="price-breakdown"></div>
    </div>

    <!-- WARNING -->
    <div class="payment-warning" style="color: #d32f2f; font-size: 11px; text-align: center;"></div>

    <!-- BUTTONS -->
    <div style="display: flex; gap: 10px; margin-top: 4px;">

      <button id="back-to-cart"
        style="flex: 1; padding: 12px; background: #f1f1f1; border: none; border-radius: 10px; font-size: 12px; font-weight: 600; color: #333; cursor: pointer;">
        ← Back
      </button>

      <button id="place-order-btn"
        style="flex: 1; padding: 12px; background: #ff6f00; border: none; border-radius: 10px; font-size: 12px; font-weight: 700; color: #fff; cursor: pointer; box-shadow: 0 4px 10px rgba(255,111,0,0.25);">
        Place Order
      </button>

    </div>

  </div>
</div>
  `;
  
  root.innerHTML = html;
};

/**
 * Generate a simple QR code SVG (simplified - shows order ID for now)
 * Note: Replace with actual QR code image in public/images/qr-code.png
 */
const generateQRCodeSVG = (text) => {
  // Placeholder - the actual QR code is loaded from image file
  return `<img src="./public/images/qr-code.png" alt="QR Code" style="max-width: 200px; width: 100%; height: auto;" />`;
};

/**
 * Render the confirmation page
 */
export const renderConfirmPage = async (root = document) => {
  try {
    const { mount, isResponsive } = getConfirmMount(root);
    toggleFullscreenMode(isResponsive);

    if (!mount) {
      console.warn("Confirm mount not found");
      return false;
    }

    // First, create the HTML structure in the root element
    createConfirmPageStructure(mount);

    // Render order summary and price breakdown
    await renderOrderSummary(mount);
    await renderPriceBreakdown(mount);

    // Initialize map preview
    renderMapPreview(mount);

    const addressInput = mount.querySelector("#address");
    const useCurrentAddress = mount.querySelector("#use-current-address");

    if (addressInput) {
      addressInput.addEventListener("input", () => renderMapPreview(mount));
    }

    if (useCurrentAddress) {
      useCurrentAddress.addEventListener("change", () => renderMapPreview(mount));
    }

    // Add real-time payment validation alerts
    const paymentMethods = mount.querySelectorAll(".payment-method-radio");
    const paymentTimings = mount.querySelectorAll(".payment-timing-radio");
    const paymentAlert = mount.querySelector("#payment-alert");

    const updatePaymentAlert = () => {
      const method = mount.querySelector('input[name="payment-method"]:checked').value;
      const timing = mount.querySelector('input[name="payment-timing"]:checked').value;
      
      if (method === "cash" && timing === "now") {
        paymentAlert.style.display = "block";
      } else {
        paymentAlert.style.display = "none";
      }
    };

    paymentMethods.forEach(radio => {
      radio.addEventListener("change", updatePaymentAlert);
    });

    paymentTimings.forEach(radio => {
      radio.addEventListener("change", updatePaymentAlert);
    });

    // Handle "Back to Cart" button
    const backBtn = mount.querySelector("#back-to-cart");
    if (backBtn) {
      backBtn.onclick = async () => {
        console.log("Back button clicked");
        try {
          // Import and call the cart page renderer
          const { renderCartPage } = await import("./CartPage.js");
          await renderCartPage(mount);
        } catch (error) {
          console.error("Error going back to cart:", error);
        }
      };
    }

    // Handle "Place My Order" button
    const placeOrderBtn = mount.querySelector("#place-order-btn");
    if (placeOrderBtn) {
      placeOrderBtn.onclick = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        // Validate address form
        const validation = validateAddressForm(mount);
        const warningMsg = mount.querySelector(".payment-warning");

        if (!validation.valid) {
          warningMsg.textContent = validation.message;
          return;
        }

        // Check payment method conflict (cash + now)
        const method = mount.querySelector('input[name="payment-method"]:checked').value;
        const timing = mount.querySelector('input[name="payment-timing"]:checked').value;

        warningMsg.textContent = "";

        // Collect delivery data
        const address = mount.querySelector("#address").value.trim();

        // Check if user is authenticated
        const storedUser = getStoredUser();
        if (!storedUser) {
          warningMsg.textContent = "Please log in to place your order.";
          // Show login modal or redirect
          return;
        }

        try {
          placeOrderBtn.disabled = true;
          placeOrderBtn.textContent = "Processing...";

          // Get current promo discount
          const promoDiscount = getPromoDiscount();

          // Create order with checkout
          const order = await checkoutCart(promoDiscount);

          // Save delivery details to order
          const deliveryInfo = {
            address,
            paymentMethod: method,
            paymentTiming: timing,
          };
          
          // Store delivery info in localStorage for reference
          localStorage.setItem(`order_delivery_${order.order_id}`, JSON.stringify(deliveryInfo));

          placeOrderBtn.textContent = "✓ Order Placed";
          placeOrderBtn.style.backgroundColor = "#4CAF50";

          console.log(`Order ${order.order_id} placed successfully for $${order.total_price}`);

          // Check if QR payment is needed
          if (method === "qr" && timing === "now") {
            // Show QR payment modal
          const qrModal = mount.querySelector("#qr-payment-modal");
          const orderIdDisplay = mount.querySelector("#order-id-display");
          const paymentAmount = mount.querySelector("#payment-amount");
          const confirmBtn = mount.querySelector("#payment-confirmed-btn");

            if (qrModal && orderIdDisplay && confirmBtn) {
              // Update order details in modal
              orderIdDisplay.innerHTML = `<strong>Order ID:</strong> <span style="color: #222; font-family: monospace;">${order.order_id}</span>`;
              if (paymentAmount) {
                paymentAmount.innerHTML = `<strong>Amount:</strong> <span style="color: #222; font-family: monospace;">$${order.total_price.toFixed(2)}</span>`;
              }
              qrModal.style.display = "flex";

              // Handle payment confirmed
              confirmBtn.onclick = () => {
                // Clear the sidebar content but keep structure for future cart renders
                const rightSidebar = document.querySelector("#right-side-bar");
                if (rightSidebar) {
                  const orderList = rightSidebar.querySelector(".order-list");
                  const billSection = rightSidebar.querySelector(".bill-section");
                  if (orderList) orderList.innerHTML = "";
                  if (billSection) billSection.innerHTML = "";
                  rightSidebar.classList.add("is-hidden");
                }

                // Redirect to order history
                const route = "history";
                history.pushState(
                  { page: route },
                  "",
                  `?page=${encodeURIComponent(route)}`
                );
                if (typeof window.renderSidebarRoute === "function") {
                  window.renderSidebarRoute(route);
                }
              };
            }
          } else {
            // For cash payment, redirect after 2 seconds
            setTimeout(async () => {
              // Clear the sidebar content but keep structure for future cart renders
              const rightSidebar = document.querySelector("#right-side-bar");
              if (rightSidebar) {
                const orderList = rightSidebar.querySelector(".order-list");
                const billSection = rightSidebar.querySelector(".bill-section");
                if (orderList) orderList.innerHTML = "";
                if (billSection) billSection.innerHTML = "";
                rightSidebar.classList.add("is-hidden");
              }

              const route = "history";
              history.pushState(
                { page: route },
                "",
                `?page=${encodeURIComponent(route)}`
              );
              if (typeof window.renderSidebarRoute === "function") {
                window.renderSidebarRoute(route);
              }
            }, 2000);
          }
        } catch (error) {
          console.error("Checkout error:", error);
          placeOrderBtn.textContent = "✗ Failed";
          placeOrderBtn.style.backgroundColor = "#ff6b6b";
          warningMsg.textContent = `Error: ${error.message}`;

          setTimeout(() => {
            placeOrderBtn.textContent = "Place My Order";
            placeOrderBtn.style.backgroundColor = "";
            placeOrderBtn.disabled = false;
          }, 2000);
        }
      };
    }

    return true;
  } catch (error) {
    console.error("Error rendering confirm page:", error);
    return false;
  }
};

/**
 * Initialize confirmation page
 */
export const initConfirmPage = async (root = document) => {
  console.log("initConfirmPage called");

  try {
    const { isResponsive } = getConfirmMount(root);
    toggleFullscreenMode(isResponsive);

    let attempts = 0;
    const maxAttempts = 50;

    while (attempts < maxAttempts) {
      const confirmPage = root.querySelector(".confirm-page");

      if (confirmPage) {
        console.log("Confirm page elements found, rendering...");
        const success = await renderConfirmPage(root);

        if (success) {
          console.log("Confirm page initialized successfully");
          return;
        }
      }

      attempts++;
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.warn("Confirm page elements not found after retries");
  } catch (error) {
    console.error("Error initializing confirm page:", error);
  }
};
