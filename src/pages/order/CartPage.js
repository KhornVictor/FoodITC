import {
  getUserCartItems,
  calculateCartTotal,
  updateCartItemQuantity,
  removeFromCart,
  getOrCreateUserCart,
  validatePromoCode,
  checkoutCart,
} from "../../services/Cart.js";

const AUTH_STORAGE_KEY = "currentUser";

// Store current promo discount (0-1)
let currentPromoDiscount = 0;

/**
 * Get the currently logged-in user or create a guest user
 */
const getCurrentUser = () => {
  const storedUser =
    sessionStorage.getItem(AUTH_STORAGE_KEY) ||
    localStorage.getItem(AUTH_STORAGE_KEY);

  if (storedUser) {
    try {
      return JSON.parse(storedUser);
    } catch (error) {
      console.error("Unable to parse stored user:", error);
    }
  }

  // Guest user for testing
  return {
    user_id: 999,
    name: "Guest",
    email: "guest@nomnom.local",
  };
};

/**
 * Create a cart item element with event listeners
 */
const createCartItemElement = (cartItem, onUpdate) => {
  const article = document.createElement("article");
  article.className = "cart-item";
  article.dataset.cartItemId = cartItem.cart_item_id;

  const itemPrice = (cartItem.price * cartItem.quantity).toFixed(2);

  article.innerHTML = `
    <img
      src="${cartItem.image_url || 'https://via.placeholder.com/150'}"
      alt="${cartItem.name}"
      loading="lazy"
    />
    <div class="cart-item-body">
      <div style="display: flex; align-items: flex-start; justify-content: space-between;">
        <h4 style="margin: 0;">${cartItem.name}</h4>
        <button type="button" class="customize-cart-btn" title="Customize or add remark" style="border: none; background: none; padding: 0; margin: 0; cursor: pointer; font-size: 17px; color: #444;">
          <i class="fa-solid fa-pen-to-square"></i>
        </button>
      </div>
      <p class="cart-item-note">${cartItem.description || "No notes"}</p>
      <div class="cart-item-footer" style="display: flex; align-items: center; justify-content: space-between; margin-top: 10px;">
        <div class="qty-chip" style="display: flex; align-items: center; gap: 8px; border-radius: 20px; background: #f5f5f5; padding: 2px 10px;">
          <button type="button" class="qty-decrease" aria-label="Decrease ${cartItem.name} quantity" style="border: none; background: none; font-size: 16px;">-</button>
          <span class="qty-value">${cartItem.quantity}</span>
          <button type="button" class="qty-increase" aria-label="Increase ${cartItem.name} quantity" style="border: none; background: none; font-size: 16px;">+</button>
        </div>
        <strong style="font-size: 15px;">$${itemPrice}</strong>
      </div>
    </div>
  `;
  // Add event handler for customize button
  const customizeBtn = article.querySelector(".customize-cart-btn");
  if (customizeBtn) {
    customizeBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      // Placeholder: navigate to customization page (to be implemented)
      alert("Customization page coming soon!");
    });
  }

  // Handle quantity decrease
  const decreaseBtn = article.querySelector(".qty-decrease");
  decreaseBtn.addEventListener("click", async (e) => {
    e.preventDefault();

    if (cartItem.quantity <= 1) {
      // Remove item if quantity is 1
      try {
        await removeFromCart(cartItem.cart_item_id);
        article.remove();
        await onUpdate();
      } catch (error) {
        console.error("Error removing item:", error);
      }
    } else {
      // Decrease quantity
      try {
        await updateCartItemQuantity(cartItem.cart_item_id, cartItem.quantity - 1);
        cartItem.quantity -= 1;
        article.querySelector(".qty-value").textContent = cartItem.quantity;
        article.querySelector(".cart-item-footer strong").textContent = `$${(cartItem.price * cartItem.quantity).toFixed(2)}`;
        await onUpdate();
      } catch (error) {
        console.error("Error updating quantity:", error);
      }
    }
  });

  // Handle quantity increase
  const increaseBtn = article.querySelector(".qty-increase");
  increaseBtn.addEventListener("click", async (e) => {
    e.preventDefault();

    try {
      await updateCartItemQuantity(cartItem.cart_item_id, cartItem.quantity + 1);
      cartItem.quantity += 1;
      article.querySelector(".qty-value").textContent = cartItem.quantity;
      article.querySelector(".cart-item-footer strong").textContent = `$${(cartItem.price * cartItem.quantity).toFixed(2)}`;
      await onUpdate();
    } catch (error) {
      console.error("Error updating quantity:", error);
    }
  });

  return article;
};

/**
 * Render cart items and update totals
 */
export const renderCartPage = async (root = document) => {
  try {
    const orderList = root.querySelector(".order-list");
    const billSection = root.querySelector(".bill-section");

    if (!orderList || !billSection) {
      console.warn("Cart container elements not found - selectors may be incorrect");
      console.log("orderList found:", !!orderList, "billSection found:", !!billSection);
      return false;
    }

    const updateCart = async () => {
      await renderCartPage(root);
    };

    const user = getCurrentUser();

    // Fetch cart items
    const cartItems = await getUserCartItems();

    // Rebuild entire order list
    const fragment = document.createDocumentFragment();

    // Add title
    const titleContainer = document.createElement("div");
    titleContainer.className = "title-container";
    titleContainer.innerHTML = `
      <i class="fa-solid fa-cart-shopping" aria-hidden="true"></i>
      <h3 class="table-title">My Cart</h3>
    `;
    fragment.appendChild(titleContainer);

    // Add subtitle
    const subtitle = document.createElement("p");
    subtitle.className = "cart-subtitle";
    subtitle.textContent = `${cartItems.length} item${cartItems.length !== 1 ? "s" : ""} ${cartItems.length > 0 ? "ready for checkout" : "in cart"}`;
    fragment.appendChild(subtitle);

    // Add cart items or empty message
    if (cartItems.length === 0) {
      const emptyMessage = document.createElement("p");
      emptyMessage.className = "component-error";
      emptyMessage.textContent = "Your cart is empty. Add items from the menu!";
      fragment.appendChild(emptyMessage);
    } else {
      cartItems.forEach((item) => {
        fragment.appendChild(createCartItemElement(item, updateCart));
      });
    }

    // Add promo row
    const promoRow = document.createElement("div");
    promoRow.className = "promo-row";
    promoRow.innerHTML = `
      <input type="text" placeholder="Promo code" aria-label="Promo code" />
      <button type="button">Apply</button>
    `;
    fragment.appendChild(promoRow);

    // Add message container for promo feedback
    const promoMessage = document.createElement("p");
    promoMessage.style.cssText = "margin: 5px 0; font-size: 12px; min-height: 16px; color: #666;";
    fragment.appendChild(promoMessage);

    // Wire up promo code apply button
    const applyBtn = promoRow.querySelector("button");
    const promoInput = promoRow.querySelector("input");

    applyBtn.addEventListener("click", async () => {
      const code = promoInput.value;
      const result = validatePromoCode(code);

      if (result.valid) {
        currentPromoDiscount = result.discount;
        promoMessage.textContent = result.message;
        promoMessage.style.color = "green";
        promoInput.style.borderColor = "green";
        await renderCartPage();
      } else {
        promoMessage.textContent = result.message;
        promoMessage.style.color = "red";
        promoInput.style.borderColor = "red";
        currentPromoDiscount = 0;
      }
    });

    // Allow Enter key to apply promo
    promoInput.addEventListener("keypress", async (e) => {
      if (e.key === "Enter") {
        applyBtn.click();
      }
    });

    // Replace order list content
    orderList.innerHTML = "";
    orderList.appendChild(fragment);

    // Update bill section
    if (cartItems.length === 0) {
      billSection.innerHTML = "";
    } else {
      const totals = await calculateCartTotal(currentPromoDiscount);

      // Simple, compact radio button payment options UI
      // Payment options as bill rows
      let paymentHTML = '';
      // (No pill selection logic needed for radio buttons)

      let billHTML = `
        <p class="bill-row"><span>Subtotal</span><span>$${totals.subtotal.toFixed(2)}</span></p>
      `;

      // Show discount line if applicable
      if (currentPromoDiscount > 0) {
        billHTML += `<p class="bill-row"><span>Discount (${(currentPromoDiscount * 100).toFixed(0)}%)</span><span>-$${totals.discount.toFixed(2)}</span></p>`;
      }

      billHTML += `
        <p class="bill-row"><span>Delivery</span><span>$${totals.delivery.toFixed(2)}</span></p>
        <p class="bill-row"><span>Tax</span><span>$${totals.tax.toFixed(2)}</span></p>
        <p class="bill-row total"><span>Total</span><span>$${totals.total.toFixed(2)}</span></p>
        <button class="place-order-btn" type="button">Place Order</button>
      `;

      // Insert payment options as rows in the bill section
      let paymentRows = `
        <style>
          .bill-radio-row label {
            display: flex;
            align-items: center;
            gap: 6px;
            cursor: pointer;
            font-size: 14px;
            color: #222;
          }
          .bill-radio-row input[type='radio'] {
            accent-color: #222;
            width: 16px;
            height: 16px;
            margin: 0 2px 0 0;
            vertical-align: middle;
          }
        </style>
        <p class="bill-row bill-radio-row" style="display: flex; align-items: center; justify-content: space-between; font-size: 14px;">
          <span style="color: #444;">Method</span>
          <span style="display: flex; gap: 22px; align-items: center;">
            <label><input type="radio" name="payment-method" value="cash" checked>Cash</label>
            <label><input type="radio" name="payment-method" value="qr">QR Code</label>
          </span>
        </p>
        <p class="bill-row bill-radio-row" style="display: flex; align-items: center; justify-content: space-between; font-size: 14px;">
          <span style="color: #444;">Pay</span>
          <span style="display: flex; gap: 22px; align-items: center;">
            <label><input type="radio" name="payment-timing" value="now" checked>Now</label>
            <label><input type="radio" name="payment-timing" value="arrival">On Arrival</label>
          </span>
        </p>
      `;
      billSection.innerHTML = paymentRows + billHTML;

      // Add warning message container
      let warningMsg = billSection.querySelector('.payment-warning');
      if (!warningMsg) {
        warningMsg = document.createElement('div');
        warningMsg.className = 'payment-warning';
        warningMsg.style.cssText = 'color: #d32f2f; font-size: 13px; margin: 6px 0 0 0; min-height: 18px;';
        billSection.insertBefore(warningMsg, billSection.querySelector('.bill-row'));
      } else {
        warningMsg.textContent = '';
      }

      const placeOrderBtn = billSection.querySelector(".place-order-btn");
      if (placeOrderBtn) {
        placeOrderBtn.addEventListener("click", async () => {
          // Read selected payment method and timing
          const method = billSection.querySelector('input[name="payment-method"]:checked').value;
          const timing = billSection.querySelector('input[name="payment-timing"]:checked').value;

          // Block if Cash + Now
          if (method === 'cash' && timing === 'now') {
            warningMsg.textContent = 'Online payment with cash is not supported. Please select QR Code for Pay Now, or use Cash for Pay on Arrival.';
            return;
          } else {
            warningMsg.textContent = '';
          }

          try {
            placeOrderBtn.disabled = true;
            placeOrderBtn.textContent = "Processing...";

            const order = await checkoutCart(currentPromoDiscount);
            
            placeOrderBtn.textContent = "✓ Order Placed";
            placeOrderBtn.style.backgroundColor = "#4CAF50";

            // Reset promo after checkout
            currentPromoDiscount = 0;
            const promoInput = orderList.querySelector(".promo-row input");
            if (promoInput) {
              promoInput.value = "";
              promoInput.style.borderColor = "";
            }

            console.log(`Order ${order.order_id} placed successfully for $${order.total_price}`);
            
            // Refresh cart after 2 seconds
            setTimeout(async () => {
              await renderCartPage();
              placeOrderBtn.textContent = "Place Order";
              placeOrderBtn.style.backgroundColor = "";
              placeOrderBtn.disabled = false;
            }, 2000);
          } catch (error) {
            console.error("Checkout error:", error);
            placeOrderBtn.textContent = "✗ Failed";
            placeOrderBtn.style.backgroundColor = "#ff6b6b";
            
            setTimeout(() => {
              placeOrderBtn.textContent = "Place Order";
              placeOrderBtn.style.backgroundColor = "";
              placeOrderBtn.disabled = false;
            }, 2000);
          }
        });
      }
    }
    
    return true;
  } catch (error) {
    console.error("Error rendering cart:", error);
    const orderList = root.querySelector(".order-list");
    if (orderList) {
      orderList.innerHTML = `
        <div class="title-container">
          <i class="fa-solid fa-cart-shopping" aria-hidden="true"></i>
          <h3 class="table-title">My Cart</h3>
        </div>
        <p class="component-error">Error: ${error.message}</p>
      `;
    }
    const billSection = root.querySelector(".bill-section");
    if (billSection) {
      billSection.innerHTML = "";
    }
    return false;
  }
};

/**
 * Initialize cart page - call this when the page loads
 */
export const initCartPage = async (root = document) => {
  console.log("initCartPage called");
  
  try {
    // Wait for cart elements to be present
    let attempts = 0;
    const maxAttempts = 50; // 5 seconds max (50 * 100ms)
    
    while (attempts < maxAttempts) {
      const orderList = root.querySelector(".order-list");
      const billSection = root.querySelector(".bill-section");
      
      if (orderList && billSection) {
        console.log("Cart elements found, rendering...");
        const success = await renderCartPage(root);
        
        if (success) {
          // Listen for cart updates (when items are added from food page)
          const handleCartUpdate = async () => {
            console.log("Cart update event received");
            try {
              await renderCartPage(root);
            } catch (error) {
              console.error("Error updating cart on event:", error);
            }
          };

          // Add listener
          document.addEventListener("cartUpdated", handleCartUpdate);
          
          console.log("Cart page initialized successfully");
          return;
        }
      }
      
      attempts++;
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.warn("Cart elements not found after retries");
  } catch (error) {
    console.error("Error initializing cart page:", error);
  }
};
