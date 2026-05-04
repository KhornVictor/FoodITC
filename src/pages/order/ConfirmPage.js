import {
  getUserCartItems,
  calculateCartTotal,
  checkoutCart,
} from "../../services/Cart.js";
import * as CartPageModule from "./CartPage.js";

const AUTH_STORAGE_KEY = "currentUser";

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
 * Create and insert the confirmation page HTML structure (compact version)
 */
const createConfirmPageStructure = (root) => {
  const html = `
    <div style="padding: 16px; background: #fff; height: 100%; overflow-y: auto; display: flex; flex-direction: column; align-items: center;">
      <div style="width: 100%; max-width: 320px;">
        <h3 style="margin: 0 0 12px 0; font-size: 16px; font-weight: 600; color: #222; text-align: center;">Order Confirmation</h3>
        
        <!-- Order Summary -->
        <div style="margin-bottom: 16px; padding: 12px; background: #f8fafb; border-radius: 8px;">
          <p style="margin: 0 0 8px 0; font-size: 12px; font-weight: 600; color: #666;">Order Summary</p>
          <div class="order-summary-list" style="font-size: 12px;"></div>
        </div>

        <!-- Delivery Address with Map -->
        <div style="margin-bottom: 16px; padding: 12px; background: #f8fafb; border-radius: 8px;">
          <p style="margin: 0 0 8px 0; font-size: 12px; font-weight: 600; color: #666;">Delivery Address</p>
          
          <!-- Map Placeholder -->
          <div id="map-placeholder" style="width: 100%; height: 140px; background: #e8e8e8; border-radius: 6px; margin-bottom: 8px; display: flex; align-items: center; justify-content: center; color: #999; font-size: 11px; border: 1px solid #ddd;">
            📍 Map View
          </div>
          
          <!-- Address Input -->
          <input type="text" id="address" placeholder="Enter delivery address" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; font-size: 11px; box-sizing: border-box; margin-bottom: 8px;" />
          
          <!-- Use Current Address Checkbox -->
          <label style="display: flex; align-items: center; gap: 6px; cursor: pointer; font-size: 11px; color: #222;">
            <input type="checkbox" id="use-current-address" />
            <span>Use my current address</span>
          </label>
        </div>

        <!-- Payment Method -->
        <div style="margin-bottom: 16px; padding: 12px; background: #f8fafb; border-radius: 8px;">
          <p style="margin: 0 0 8px 0; font-size: 12px; font-weight: 600; color: #666;">Payment</p>
          <div style="display: flex; flex-direction: column; gap: 6px; font-size: 12px;">
            <label style="display: flex; align-items: center; gap: 6px; cursor: pointer;">
              <input type="radio" name="payment-method" value="qr" class="payment-method-radio" checked />
              <span>QR Code</span>
            </label>
            <label style="display: flex; align-items: center; gap: 6px; cursor: pointer;">
              <input type="radio" name="payment-method" value="cash" class="payment-method-radio" />
              <span>Cash</span>
            </label>
            <div style="border-top: 1px solid #ddd; margin-top: 6px; padding-top: 6px;">
              <label style="display: flex; align-items: center; gap: 6px; cursor: pointer;">
                <input type="radio" name="payment-timing" value="arrival" class="payment-timing-radio" checked />
                <span>Pay on Arrival</span>
              </label>
              <label style="display: flex; align-items: center; gap: 6px; cursor: pointer;">
                <input type="radio" name="payment-timing" value="now" class="payment-timing-radio" />
                <span>Pay Now</span>
              </label>
            </div>
          </div>
          <!-- Real-time Payment Warning -->
          <div id="payment-alert" style="margin-top: 8px; padding: 8px; background: #ffebee; border: 1px solid #ef5350; border-radius: 4px; color: #c62828; font-size: 11px; display: none; text-align: center;">
            ⚠️ Cash payment is only available for "Pay on Arrival"
          </div>
        </div>

        <!-- QR Payment Modal -->
        <div id="qr-payment-modal" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 1000; align-items: center; justify-content: center; padding: 16px;">
          <div style="background: #fff; border-radius: 12px; overflow: hidden; max-width: 350px; box-shadow: 0 4px 20px rgba(0,0,0,0.2); max-height: 90vh; overflow-y: auto;">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #ff9800 0%, #ff6f00 100%); padding: 24px; text-align: center; color: #fff;">
              <h3 style="margin: 0 0 4px 0; font-size: 18px; font-weight: 700;">NomNom</h3>
              <p style="margin: 0; font-size: 12px; opacity: 0.9;">Scan QR to Pay</p>
            </div>
            
            <!-- Content -->
            <div style="padding: 24px; text-align: center;">
              <!-- QR Code Container -->
              <div id="qr-code-container" style="background: #f5f5f5; border-radius: 8px; padding: 16px; margin-bottom: 20px; display: flex; align-items: center; justify-content: center; min-height: 220px;">
                <img src="./public/images/qr-code.png" alt="QR Code" style="max-width: 200px; width: 100%; height: auto;" />
              </div>
              
              <!-- Order Info -->
              <div style="background: #f9f9f9; border-radius: 8px; padding: 12px; margin-bottom: 16px; text-align: left;">
                <p id="order-id-display" style="margin: 0 0 8px 0; font-size: 13px; color: #666;"><strong>Order ID:</strong> <span style="color: #222; font-family: monospace;"></span></p>
                <p style="margin: 0; font-size: 13px; color: #666;"><strong>Amount:</strong> <span id="payment-amount" style="color: #222; font-family: monospace;"></span></p>
              </div>
              
              <!-- Account Info -->
              <div style="background: #fff3e0; border-radius: 8px; padding: 12px; margin-bottom: 16px; text-align: left; border-left: 4px solid #ff9800;">
                <p style="margin: 0 0 6px 0; font-size: 12px; font-weight: 600; color: #ff6f00;">Payment Info</p>
                <p style="margin: 0 0 4px 0; font-size: 11px; color: #666;"><strong>Bank:</strong> ABA Bank</p>
                <p style="margin: 0 0 4px 0; font-size: 11px; color: #666;"><strong>Account:</strong> SAMNANG HOUR</p>
              </div>
              
              <!-- Instructions -->
              <p style="margin: 0 0 20px 0; font-size: 11px; color: #999; font-style: italic;">Open your ABA mobile app and scan this QR code to complete payment</p>
              
              <!-- Button -->
              <button id="payment-confirmed-btn" type="button" style="width: 100%; padding: 12px; background: #4CAF50; color: #fff; border: none; border-radius: 6px; font-size: 13px; font-weight: 600; cursor: pointer; transition: background 0.3s;">✓ Payment Confirmed</button>
            </div>
          </div>
        </div>

        <!-- Price Breakdown -->
        <div style="margin-bottom: 16px; padding: 12px; background: #f8fafb; border-radius: 8px; font-size: 12px; width: 100%;">
          <div class="price-breakdown"></div>
        </div>

        <!-- Warning -->
        <div class="payment-warning" style="color: #d32f2f; font-size: 11px; margin-bottom: 8px; min-height: 14px; text-align: center; width: 100%;"></div>

        <!-- Buttons -->
        <div style="display: flex; gap: 8px; width: 100%;">
          <button id="back-to-cart" type="button" style="flex: 1; padding: 10px; background: #f0f0f0; border: none; border-radius: 6px; font-size: 12px; font-weight: 500; cursor: pointer; color: #222;">← Back</button>
          <button id="place-order-btn" type="button" style="flex: 1; padding: 10px; background: #222; border: none; border-radius: 6px; font-size: 12px; font-weight: 500; cursor: pointer; color: #fff;">Place Order</button>
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
    // First, create the HTML structure in the root element
    createConfirmPageStructure(root);

    // Render order summary and price breakdown
    await renderOrderSummary(root);
    await renderPriceBreakdown(root);

    // Add real-time payment validation alerts
    const paymentMethods = root.querySelectorAll(".payment-method-radio");
    const paymentTimings = root.querySelectorAll(".payment-timing-radio");
    const paymentAlert = root.querySelector("#payment-alert");

    const updatePaymentAlert = () => {
      const method = root.querySelector('input[name="payment-method"]:checked').value;
      const timing = root.querySelector('input[name="payment-timing"]:checked').value;
      
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
    const backBtn = root.querySelector("#back-to-cart");
    if (backBtn) {
      backBtn.onclick = async () => {
        console.log("Back button clicked");
        try {
          // Import and call the cart page renderer
          const { renderCartPage } = await import("./CartPage.js");
          // Ensure we're rendering to the actual right sidebar
          const rightSidebar = document.querySelector("#right-side-bar");
          if (rightSidebar) {
            await renderCartPage(rightSidebar);
          }
        } catch (error) {
          console.error("Error going back to cart:", error);
        }
      };
    }

    // Handle "Place My Order" button
    const placeOrderBtn = root.querySelector("#place-order-btn");
    if (placeOrderBtn) {
      placeOrderBtn.onclick = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        // Validate address form
        const validation = validateAddressForm(root);
        const warningMsg = root.querySelector(".payment-warning");

        if (!validation.valid) {
          warningMsg.textContent = validation.message;
          return;
        }

        // Check payment method conflict (cash + now)
        const method = root.querySelector('input[name="payment-method"]:checked').value;
        const timing = root.querySelector('input[name="payment-timing"]:checked').value;

        warningMsg.textContent = "";

        // Collect delivery data
        const address = root.querySelector("#address").value.trim();

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
            const qrModal = root.querySelector("#qr-payment-modal");
            const orderIdDisplay = root.querySelector("#order-id-display");
            const paymentAmount = root.querySelector("#payment-amount");
            const confirmBtn = root.querySelector("#payment-confirmed-btn");

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
